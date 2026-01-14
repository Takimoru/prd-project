import { Resolver, Query, Mutation, Arg, ID, Ctx, ObjectType, Field } from 'type-graphql';
import { Logsheet } from '../../entities/Logsheet';
import { Task } from '../../entities/Task';
import { Team } from '../../entities/Team';
import { User } from '../../entities/User';
import { WorkProgram } from '../../entities/WorkProgram';
import { Context } from '../context';
import { AppDataSource } from '../../data-source';
import { requireAuth, requireLeaderRole, requireAdminRole } from '../../lib/auth-helpers';
import { In, Between } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@ObjectType()
class LogsheetRecapRow {
  @Field()
  date: string;

  @Field()
  taskTitle: string;

  @Field({ nullable: true })
  taskDescription?: string;

  @Field({ nullable: true })
  workProgramTitle?: string;

  @Field(() => [String])
  members: string[];

  @Field()
  completedAt: Date;

  @Field({ nullable: true })
  notes?: string;
}

@Resolver(() => Logsheet)
export class LogsheetResolver {
  @Query(() => [LogsheetRecapRow])
  async weeklyTaskRecap(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('week') week: string,
    @Ctx() ctx: Context
  ): Promise<LogsheetRecapRow[]> {
    requireAuth(ctx);

    const { startDate, endDate } = this.getWeekDateRange(week);

    const taskRepo = AppDataSource.getRepository(Task);
    const wpRepo = AppDataSource.getRepository(WorkProgram);

    const tasks = await taskRepo.find({
      where: {
        teamId,
        completed: true,
        completedAt: Between(startDate, endDate),
      },
      relations: ['assignedMembers', 'updates', 'updates.user'],
      order: { completedAt: 'ASC' },
    });

    // Fetch work programs to get titles
    const wpIds = tasks
      .map((t) => t.workProgramId)
      .filter((id): id is string => !!id);
    
    const wps = wpIds.length > 0 
      ? await wpRepo.find({ where: { id: In(wpIds) } })
      : [];
    const wpMap = new Map(wps.map((wp) => [wp.id, wp.title]));

    return tasks.map((task) => {
      // Get the latest notice from updates
      const latestUpdate = task.updates && task.updates.length > 0
        ? task.updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null;

      return {
        date: task.completedAt!.toISOString().split('T')[0],
        taskTitle: task.title,
        taskDescription: task.description,
        workProgramTitle: task.workProgramId ? wpMap.get(task.workProgramId) : undefined,
        members: task.assignedMembers.map((m) => m.name),
        completedAt: task.completedAt!,
        notes: latestUpdate?.notes,
      };
    });
  }

  @Mutation(() => Logsheet)
  async uploadLogsheet(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('week') week: string,
    @Ctx() ctx: Context
  ): Promise<Logsheet> {
    requireAuth(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const logsheetRepo = AppDataSource.getRepository(Logsheet);
    const teamRepo = AppDataSource.getRepository(Team);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : await userRepo.findOne({ where: { id: ctx.userId } });

    if (!user) throw new Error('User not found');

    // Check permissions: Admin or Team Leader
    const team = await teamRepo.findOne({ where: { id: teamId } });
    if (!team) throw new Error('Team not found');

    const isAdmin = user.role === 'admin';
    const isTeamLeader = team.leaderId === user.id;

    if (!isAdmin && !isTeamLeader) {
      throw new Error('Only the team leader or admin can upload logsheets');
    }

    // Generate Recap Data
    const recap = await this.weeklyTaskRecap(teamId, week, ctx);

    if (recap.length === 0) {
      throw new Error('No completed tasks found for this week.');
    }

    // Generate CSV Content
    const header = "Date,Task,Description,Work Program,Members,Completed At,Notes\n";
    const rows = recap.map(r => {
      const escaped = (val?: string) => `"${(val || '').replace(/"/g, '""')}"`;
      return [
        r.date,
        escaped(r.taskTitle),
        escaped(r.taskDescription),
        escaped(r.workProgramTitle),
        escaped(r.members.join(', ')),
        r.completedAt.toISOString(),
        escaped(r.notes)
      ].join(',');
    }).join('\n');

    const csvContent = header + rows;

    // Save File
    const uploadsDir = path.join(process.cwd(), 'uploads', 'logsheets');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `logsheet-${teamId}-${week}-${Date.now()}.csv`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, csvContent);

    const fileUrl = `/uploads/logsheets/${fileName}`;

    // Create Metadata
    const logsheet = logsheetRepo.create({
      teamId,
      weekNumber: week,
      fileUrl,
      createdById: user.id,
    });

    return await logsheetRepo.save(logsheet);
  }

  @Query(() => [Logsheet])
  async myTeamLogsheets(
    @Arg('teamId', () => ID) teamId: string,
    @Ctx() ctx: Context
  ): Promise<Logsheet[]> {
    requireAuth(ctx);
    const logsheetRepo = AppDataSource.getRepository(Logsheet);
    return await logsheetRepo.find({
      where: { teamId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  @Query(() => [Logsheet])
  async allLogsheets(@Ctx() ctx: Context): Promise<Logsheet[]> {
    requireAdminRole(ctx);
    const logsheetRepo = AppDataSource.getRepository(Logsheet);
    return await logsheetRepo.find({
      relations: ['team', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  // Helper function to get week date range (standard ISO-like)
  private getWeekDateRange(weekString: string): {
    startDate: Date;
    endDate: Date;
  } {
    // Expected format: YYYY-WW (e.g., 2026-01)
    // We'll use the same logic as AttendanceResolver but adapt to YYYY-WW if needed
    // If weekString is YYYY-WW, we might need to handle the split differently
    let year: number;
    let week: number;

    if (weekString.includes('-W')) {
        const [y, w] = weekString.split('-W');
        year = Number(y);
        week = Number(w);
    } else {
        const [y, w] = weekString.split('-');
        year = Number(y);
        week = Number(w);
    }

    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const startDate = new Date(simple);
    if (dow <= 4) {
      startDate.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      startDate.setDate(simple.getDate() + 8 - simple.getDay());
    }
    
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7); // end of week (next monday 00:00)
    endDate.setMilliseconds(-1); // end of week (sunday 23:59:59.999)

    return { startDate, endDate };
  }
}
