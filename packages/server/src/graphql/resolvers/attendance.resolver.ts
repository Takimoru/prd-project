import { Resolver, Query, Mutation, Arg, ID, Ctx, ObjectType, Field, Int } from 'type-graphql';
import { Attendance } from '../../entities/Attendance';
import { Team } from '../../entities/Team';
import { User } from '../../entities/User';
import { WeeklyAttendanceApproval } from '../../entities/WeeklyAttendanceApproval';
import { CheckInInput } from '../inputs/AttendanceInputs';
import { Context } from '../context';
import { AppDataSource } from '../../data-source';
import { In } from 'typeorm';
import { requireAdminRole } from '../../lib/auth-helpers';
import * as PostHog from '../../lib/posthog';

@ObjectType()
export class DailyAttendanceRecord {
  @Field()
  date: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  excuse?: string;

  @Field({ nullable: true })
  timestamp?: string;
}

@ObjectType()
export class StudentAttendanceSummary {
  @Field(() => ID)
  userId: string;

  @Field()
  userName: string;

  @Field()
  email: string;

  @Field(() => Int)
  presentCount: number;

  @Field({ nullable: true })
  lastCheckIn?: string;

  @Field()
  approvalStatus: string;

  @Field(() => [DailyAttendanceRecord])
  dailyRecords: DailyAttendanceRecord[];
}

@ObjectType()
export class WeeklyAttendanceSummary {
  @Field(() => ID)
  teamId: string;

  @Field()
  week: string;

  @Field()
  startDate: string;

  @Field()
  endDate: string;

  @Field(() => [String])
  dates: string[];

  @Field(() => [StudentAttendanceSummary])
  students: StudentAttendanceSummary[];
}

@Resolver(() => Attendance)
export class AttendanceResolver {
  @Query(() => [Attendance])
  async attendanceByTeam(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('date') date: string,
    @Ctx() ctx?: Context
  ): Promise<Attendance[]> {
    const attendanceRepo = AppDataSource.getRepository(Attendance);
    return await attendanceRepo.find({
      where: { teamId, date },
      relations: ['user', 'team'],
    });
  }

  @Query(() => WeeklyAttendanceSummary)
  async weeklyAttendanceSummary(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('week') week: string,
    @Ctx() ctx?: Context
  ): Promise<WeeklyAttendanceSummary> {
    const teamRepo = AppDataSource.getRepository(Team);
    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const approvalRepo = AppDataSource.getRepository(WeeklyAttendanceApproval);

    const { startDate, endDate, dates } = this.getWeekDateRange(week);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get team and members
    const team = await teamRepo.findOne({
      where: { id: teamId },
      relations: ['leader', 'members'],
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const memberIds = [
      team.leaderId, 
      ...(team.members || []).map((m) => m.id)
    ].filter(Boolean);

    // Get attendance approvals
    const approvals = await approvalRepo.find({
      where: { teamId, weekStartDate: startDateStr },
    });

    const approvalMap = new Map(
      approvals.map((a) => [a.studentId, a])
    );

    // Get attendance records
    const attendanceRecords = await attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.teamId = :teamId', { teamId })
      .andWhere('attendance.date >= :startDate', { startDate: startDateStr })
      .andWhere('attendance.date <= :endDate', { endDate: endDateStr })
      .getMany();

    // Build student summaries
    const students = await Promise.all(
      memberIds.map(async (memberId) => {
        const member = memberId === team.leaderId
          ? team.leader
          : team.members.find((m) => m.id === memberId);

        if (!member) return null;

        const approval = approvalMap.get(memberId);
        const studentAttendance = attendanceRecords.filter((r) => r.userId === memberId);
        const presentCount = studentAttendance.filter((r) => r.status === 'present').length;
        const latestCheckIn = studentAttendance.length > 0
          ? studentAttendance.reduce((max, r) =>
              r.timestamp > max ? r.timestamp : max,
              studentAttendance[0].timestamp
            )
          : undefined;

        const dailyRecords = dates.map((date) => {
          const record = studentAttendance.find((r) => r.date === date);
          return {
            date,
            status: record?.status,
            excuse: record?.excuse,
            timestamp: record?.timestamp?.toISOString(),
          };
        });

        return {
          userId: memberId,
          userName: member.name || 'Unknown',
          email: member.email,
          presentCount,
          lastCheckIn: latestCheckIn?.toISOString(),
          approvalStatus: approval?.status || 'pending',
          dailyRecords,
        };
      })
    );

    return {
      teamId,
      week,
      startDate: startDateStr,
      endDate: endDateStr,
      dates,
      students: students.filter((s) => s !== null) as StudentAttendanceSummary[],
    };
  }

  @Mutation(() => Attendance)
  async checkIn(
    @Arg('input') input: CheckInInput,
    @Ctx() ctx: Context
  ): Promise<Attendance> {
    if (!ctx.userId && !ctx.userEmail) {
      throw new Error('Authentication required');
    }

    const userRepo = AppDataSource.getRepository(User);
    const attendanceRepo = AppDataSource.getRepository(Attendance);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    // Check if already checked in today
    const existing = await attendanceRepo.findOne({
      where: {
        userId: user.id,
        teamId: input.teamId,
        date: input.date,
      },
    });

    if (existing) {
      // Update existing check-in
      existing.status = input.status;
      existing.excuse = input.excuse;
      existing.lat = input.lat;
      existing.long = input.long;
      existing.photoUrl = input.photoUrl;
      existing.timestamp = new Date();
      await attendanceRepo.save(existing);

      return await attendanceRepo.findOne({
        where: { id: existing.id },
        relations: ['user', 'team'],
      }) as Attendance;
    }

    // Create new check-in
    const attendance = attendanceRepo.create({
      teamId: input.teamId,
      userId: user.id,
      date: input.date,
      status: input.status,
      excuse: input.excuse,
      lat: input.lat,
      long: input.long,
      photoUrl: input.photoUrl,
    });

    const saved = await attendanceRepo.save(attendance);

    const result = await attendanceRepo.findOne({
      where: { id: saved.id },
      relations: ['user', 'team'],
    }) as Attendance;

    // Publish subscription event
    await ctx.pubSub.publish('ATTENDANCE_CHECKED_IN', {
      teamId: input.teamId,
      attendance: result,
    });

    // Track analytics: checkin (per PRD Section D.5)
    PostHog.trackCheckin(user.id, input.teamId, input.date, input.status);

    return result;
  }

  @Query(() => [Attendance])
  async approvedAttendance(
    @Arg('programId', () => ID) programId: string,
    @Ctx() ctx: Context
  ): Promise<Attendance[]> {
    // Admin-only: Get attendance that has been approved by supervisor
    requireAdminRole(ctx);

    const teamRepo = AppDataSource.getRepository(Team);
    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const approvalRepo = AppDataSource.getRepository(WeeklyAttendanceApproval);

    // Get all teams in this program
    const teams = await teamRepo.find({
      where: { programId },
    });

    if (teams.length === 0) {
      return [];
    }

    const teamIds = teams.map(t => t.id);

    // Get all approved attendance approvals
    const approvals = await approvalRepo
      .createQueryBuilder('approval')
      .where('approval.teamId IN (:...teamIds)', { teamIds })
      .andWhere('approval.status = :status', { status: 'approved' })
      .getMany();

    const approvedStudentIds = new Set(approvals.map(a => a.studentId));

    // Get attendance records for approved students
    const attendance = await attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.teamId IN (:...teamIds)', { teamIds })
      .andWhere('attendance.userId IN (:...studentIds)', { 
        studentIds: Array.from(approvedStudentIds) 
      })
      .getMany();

    return attendance;
  }

  @Query(() => [WeeklyAttendanceApproval])
  async pendingAttendanceQueue(@Ctx() ctx: Context): Promise<WeeklyAttendanceApproval[]> {
    if (!ctx.userId && !ctx.userEmail) {
      throw new Error('Authentication required');
    }

    const userRepo = AppDataSource.getRepository(User);
    const approvalRepo = AppDataSource.getRepository(WeeklyAttendanceApproval);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    // Get pending approvals where this user is the supervisor
    return await approvalRepo.find({
      where: {
        supervisorId: user.id,
        status: 'pending',
      },
      relations: ['team', 'student'],
      order: { weekStartDate: 'DESC' },
    });
  }

  @Mutation(() => WeeklyAttendanceApproval)
  async approveWeeklyAttendance(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('studentId', () => ID) studentId: string,
    @Arg('supervisorId', () => ID) supervisorId: string,
    @Arg('week', () => String) week: string,
    @Arg('status', () => String) status: string,
    @Arg('notes', { nullable: true }) notes?: string,
    @Ctx() ctx?: Context
  ): Promise<WeeklyAttendanceApproval> {
    const approvalRepo = AppDataSource.getRepository(WeeklyAttendanceApproval);
    const { startDate } = this.getWeekDateRange(week);
    const weekStartDateStr = startDate.toISOString().split('T')[0];

    let approval = await approvalRepo.findOne({
      where: {
        teamId,
        studentId,
        weekStartDate: weekStartDateStr,
      },
    });

    if (approval) {
      approval.status = status;
      approval.notes = notes;
      approval.supervisorId = supervisorId;
      approval.approvedAt = new Date();
    } else {
      approval = approvalRepo.create({
        teamId,
        studentId,
        supervisorId,
        weekStartDate: weekStartDateStr,
        status,
        notes,
        approvedAt: new Date(),
      });
    }

    const savedApproval = await approvalRepo.save(approval);
    
    return await approvalRepo.findOne({
      where: { id: savedApproval.id },
      relations: ['team', 'student', 'supervisor']
    }) as WeeklyAttendanceApproval;
  }

  // Helper function to get week date range
  private getWeekDateRange(weekString: string): {
    startDate: Date;
    endDate: Date;
    dates: string[];
  } {
    const [yearStr, weekPart] = weekString.split('-W');
    const year = Number(yearStr);
    const week = Number(weekPart);

    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const startDate = new Date(simple);
    if (dow <= 4) {
      startDate.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      startDate.setDate(simple.getDate() + 8 - simple.getDay());
    }

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      dates.push(current.toISOString().split('T')[0]);
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return { startDate, endDate, dates };
  }
}
