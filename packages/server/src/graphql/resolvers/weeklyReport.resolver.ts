import { Resolver, Query, Mutation, Arg, ID, Ctx, InputType, Field, Int, FieldResolver, Root } from 'type-graphql';
import { WeeklyReport } from '../../entities/WeeklyReport';
import { Comment } from '../../entities/Comment';
import { User } from '../../entities/User';
import { Team } from '../../entities/Team';
import { Context } from '../context';
import { requireAuth, requireSupervisorRole, requireLeaderRole, requireAdminRole } from '../../lib/auth-helpers';
import { AppDataSource } from '../../data-source';
import * as PostHog from '../../lib/posthog';
import { In } from 'typeorm';
import { Task } from '../../entities/Task';
import { MemberProgress } from '../../entities/WeeklyReport';
import { debugLog } from '../../lib/debug-logger';

/**
 * WeeklyReport Resolver - Supervisor & Leader flows
 * Per PRD Section B: Supervisor Migration PRD
 * Per PRD Section C: Team Leader (submit weekly summary)
 */

@InputType()
class SubmitWeeklySummaryInput {
  @Field()
  teamId: string;

  @Field()
  week: string; // YYYY-WW format

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  progressPercentage: number;
}

@InputType()
class AddFeedbackInput {
  @Field(() => ID)
  reportId: string;

  @Field()
  comment: string;
}

@Resolver(() => WeeklyReport)
export class WeeklyReportResolver {
  @FieldResolver(() => User, { nullable: true })
  async leader(@Root() report: WeeklyReport): Promise<User | null> {
    const teamRepo = AppDataSource.getRepository(Team);
    const userRepo = AppDataSource.getRepository(User);
    
    // If team is already loaded, get leaderId
    let leaderId: string | undefined = report.team?.leaderId;
    
    if (!leaderId) {
      // Fetch team if not loaded
      const team = await teamRepo.findOne({ where: { id: report.teamId } });
      leaderId = team?.leaderId;
    }
    
    if (!leaderId) return null;
    
    return await userRepo.findOne({ where: { id: leaderId } });
  }

  @Query(() => [WeeklyReport])
  async weeklyReports(
    @Arg('teamId', () => ID) teamId: string,
    @Ctx() ctx: Context
  ): Promise<WeeklyReport[]> {
    requireAuth(ctx);
    
    const reportRepo = AppDataSource.getRepository(WeeklyReport);
    return await reportRepo.find({
      where: { teamId },
      relations: ['team'],
      order: { week: 'DESC' },
    });
  }

  @Query(() => [WeeklyReport])
  async myTeamWeeklyReports(@Ctx() ctx: Context): Promise<WeeklyReport[]> {
    requireAuth(ctx);
    debugLog(`[WeeklyReportResolver] myTeamWeeklyReports for ${ctx.userEmail}`);
    
    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);
    const reportRepo = AppDataSource.getRepository(WeeklyReport);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    // Get teams where user is supervisor
    const supervisedTeams = await teamRepo.find({
      where: { supervisorId: user.id },
    });

    if (supervisedTeams.length === 0) {
      return [];
    }

    const teamIds = supervisedTeams.map(t => t.id);
    
    // Get all reports for supervised teams
    const reports = await reportRepo.find({
      where: { teamId: In(teamIds) },
      relations: ['team'],
      order: { week: 'DESC' },
    });

    debugLog(`[WeeklyReportResolver] myTeamWeeklyReports: Found ${reports.length} reports`);
    return reports;
  }

  @Query(() => [WeeklyReport])
  async weeklyReviewQueue(@Ctx() ctx: Context): Promise<WeeklyReport[]> {
    requireAuth(ctx);
    requireSupervisorRole(ctx);
    debugLog(`[WeeklyReportResolver] weeklyReviewQueue for ${ctx.userEmail}`);
    
    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);
    const reportRepo = AppDataSource.getRepository(WeeklyReport);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      debugLog(`[WeeklyReportResolver] User not found for email ${ctx.userEmail}`);
      throw new Error('User not found');
    }

    // Get teams where user is supervisor
    const supervisedTeams = await teamRepo.find({
      where: { supervisorId: user.id },
    });

    if (supervisedTeams.length === 0) {
      debugLog(`[WeeklyReportResolver] No supervised teams for user ${user.id}`);
      return [];
    }

    const teamIds = supervisedTeams.map(t => t.id);
    debugLog(`[WeeklyReportResolver] Supervised team IDs: ${teamIds.join(', ')}`);
    
    // Get submitted reports waiting for review
    // Simplification: Join only team. Leader is handled by FieldResolver if needed.
    const reports = await reportRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.team', 'team')
      .where('report.teamId IN (:...teamIds)', { teamIds })
      .andWhere('report.status = :status', { status: 'submitted' })
      .orderBy('report.submittedAt', 'ASC')
      .getMany();

    debugLog(`[WeeklyReportResolver] Found ${reports.length} pending reports`);
    return reports;
  }

  @Query(() => WeeklyReport, { nullable: true })
  async weeklyReport(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<WeeklyReport | null> {
    requireAuth(ctx);
    
    const reportRepo = AppDataSource.getRepository(WeeklyReport);
    const report = await reportRepo.findOne({
      where: { id },
      relations: ['team', 'team.members', 'comments', 'comments.author'],
    });

    if (report) {
       report.memberProgress = await this.calculateMemberProgress(report);
    }
    return report;
  }

  @Query(() => WeeklyReport, { nullable: true })
  async weeklyReportByWeek(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('week') week: string,
    @Ctx() ctx: Context
  ): Promise<WeeklyReport | null> {
    requireAuth(ctx);
    
    const reportRepo = AppDataSource.getRepository(WeeklyReport);
    const report = await reportRepo.findOne({
      where: { teamId, week },
      relations: ['team', 'team.members', 'comments', 'comments.author'],
    });

    if (report) {
       report.memberProgress = await this.calculateMemberProgress(report);
    }
    return report;
  }

  @Query(() => [WeeklyReport])
  async reportsByStatus(
    @Arg('status') status: string,
    @Ctx() ctx: Context
  ): Promise<WeeklyReport[]> {
    // Admin-only: Get reports filtered by status
    requireAdminRole(ctx);
    
    const reportRepo = AppDataSource.getRepository(WeeklyReport);
    return await reportRepo.find({
      where: { status },
      relations: ['team', 'comments', 'comments.author'],
      order: { submittedAt: 'DESC' },
    });
  }

  @Mutation(() => WeeklyReport)
  async submitWeeklySummary(
    @Arg('input') input: SubmitWeeklySummaryInput,
    @Ctx() ctx: Context
  ): Promise<WeeklyReport> {
    requireAuth(ctx);
    
    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);
    const reportRepo = AppDataSource.getRepository(WeeklyReport);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    // Verify user is leader of this team
    const team = await teamRepo.findOne({ where: { id: input.teamId } });
    if (!team) {
      throw new Error('Team not found');
    }

    if (team.leaderId !== user.id && user.role !== 'admin') {
      throw new Error('Only team leader can submit weekly summaries');
    }

    // Check if report already exists for this week
    const existingReport = await reportRepo.findOne({
      where: { teamId: input.teamId, week: input.week },
    });

    let report: WeeklyReport;

    if (existingReport) {
      // Update existing report
      existingReport.description = input.description;
      existingReport.progressPercentage = input.progressPercentage;
      existingReport.status = 'submitted';
      existingReport.submittedAt = new Date();
      report = await reportRepo.save(existingReport);
    } else {
      // Create new report
      report = reportRepo.create({
        teamId: input.teamId,
        week: input.week,
        description: input.description,
        progressPercentage: input.progressPercentage,
        status: 'submitted',
        submittedAt: new Date(),
      });
      report = await reportRepo.save(report);
    }

    // Track analytics: weekly_summary_submitted (per PRD Section C.5)
    PostHog.trackWeeklySummarySubmitted(user.id, report.id, input.teamId, input.week);

    return await reportRepo.findOne({
      where: { id: report.id },
      relations: ['team', 'comments'],
    }) as WeeklyReport;
  }

  @Mutation(() => WeeklyReport)
  async approveWeeklyReport(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context,
    @Arg('comment', { nullable: true }) comment?: string
  ): Promise<WeeklyReport> {
    requireAuth(ctx);
    requireSupervisorRole(ctx);
    
    const userRepo = AppDataSource.getRepository(User);
    const reportRepo = AppDataSource.getRepository(WeeklyReport);
    const commentRepo = AppDataSource.getRepository(Comment);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    const report = await reportRepo.findOne({
      where: { id },
      relations: ['team'],
    });

    if (!report) {
      throw new Error('Weekly report not found');
    }

    // Verify user is supervisor of this team
    if (report.team.supervisorId !== user.id && user.role !== 'admin') {
      throw new Error('Only the team supervisor can approve reports');
    }

    report.status = 'approved';
    await reportRepo.save(report);

    // Add optional comment
    if (comment) {
      const newComment = commentRepo.create({
        weeklyReportId: report.id,
        authorId: user.id,
        content: comment,
      });
      await commentRepo.save(newComment);
    }

    // Track analytics: report_approved (per PRD Section B.5)
    PostHog.trackReportApproved(user.id, report.id, report.teamId);

    return await reportRepo.findOne({
      where: { id },
      relations: ['team', 'comments', 'comments.author'],
    }) as WeeklyReport;
  }

  @Mutation(() => WeeklyReport)
  async rejectWeeklyReport(
    @Arg('input') input: AddFeedbackInput,
    @Ctx() ctx: Context
  ): Promise<WeeklyReport> {
    requireAuth(ctx);
    requireSupervisorRole(ctx);
    
    const userRepo = AppDataSource.getRepository(User);
    const reportRepo = AppDataSource.getRepository(WeeklyReport);
    const commentRepo = AppDataSource.getRepository(Comment);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    const report = await reportRepo.findOne({
      where: { id: input.reportId },
      relations: ['team'],
    });

    if (!report) {
      throw new Error('Weekly report not found');
    }

    // Verify user is supervisor of this team
    if (report.team.supervisorId !== user.id && user.role !== 'admin') {
      throw new Error('Only the team supervisor can reject reports');
    }

    // Update report status
    report.status = 'revision_requested';
    await reportRepo.save(report);

    // Add feedback comment
    const comment = commentRepo.create({
      weeklyReportId: report.id,
      authorId: user.id,
      content: input.comment,
    });
    await commentRepo.save(comment);

    // Track analytics: report_rejected (per PRD Section B.5)
    PostHog.trackReportRejected(user.id, report.id, report.teamId, input.comment);

    return await reportRepo.findOne({
      where: { id: report.id },
      relations: ['team', 'comments', 'comments.author'],
    }) as WeeklyReport;
  }

  @Mutation(() => Comment)
  async addWeeklyReportFeedback(
    @Arg('input') input: AddFeedbackInput,
    @Ctx() ctx: Context
  ): Promise<Comment> {
    requireAuth(ctx);
    requireSupervisorRole(ctx);
    
    const userRepo = AppDataSource.getRepository(User);
    const reportRepo = AppDataSource.getRepository(WeeklyReport);
    const commentRepo = AppDataSource.getRepository(Comment);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    const report = await reportRepo.findOne({
      where: { id: input.reportId },
      relations: ['team'],
    });

    if (!report) {
      throw new Error('Weekly report not found');
    }

    // Verify user is supervisor of this team
    if (report.team.supervisorId !== user.id && user.role !== 'admin') {
      throw new Error('Only the team supervisor can add feedback');
    }

    const comment = commentRepo.create({
      weeklyReportId: report.id,
      authorId: user.id,
      content: input.comment,
    });
    const saved = await commentRepo.save(comment);

    // Track analytics: weekly_report_reviewed (per PRD Section B.5)
    PostHog.trackWeeklyReportReviewed(user.id, report.id, report.teamId, report.status);

    return await commentRepo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    }) as Comment;
  }

  private async calculateMemberProgress(report: WeeklyReport): Promise<MemberProgress[]> {
    if (!report.taskIds || report.taskIds.length === 0) return [];

    const taskRepo = AppDataSource.getRepository(Task);
    const tasks = await taskRepo.find({
      where: { id: In(report.taskIds) },
      relations: ['assignedMembers'],
    });

    const team = report.team;
    if (!team || !team.members) return [];

    return team.members.map(member => {
      const assignedTasks = tasks.filter(t => t.assignedMembers.some(m => m.id === member.id));
      const completedTasks = assignedTasks.filter(t => t.completed).length;
      return {
        user: member,
        completedTasks,
        totalTasks: assignedTasks.length,
      };
    });
  }
}
