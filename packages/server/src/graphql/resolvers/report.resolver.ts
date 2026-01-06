import { Resolver, Query, Mutation, Arg, ID, Ctx, Int } from 'type-graphql';
import { WeeklyReport } from '../../entities/WeeklyReport';
import { Comment } from '../../entities/Comment';
import { User } from '../../entities/User';
import { Context } from '../context';
import { AppDataSource } from '../../data-source';

@Resolver(() => WeeklyReport)
export class ReportResolver {
  @Query(() => WeeklyReport, { nullable: true })
  async weeklyReport(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('week') week: string,
    @Ctx() ctx?: Context
  ): Promise<WeeklyReport | null> {
    const reportRepo = AppDataSource.getRepository(WeeklyReport);
    return await reportRepo.findOne({
      where: { teamId, week },
      relations: ['team', 'comments', 'comments.author'],
    });
  }

  @Query(() => [WeeklyReport])
  async weeklyReports(
    @Arg('teamId', () => ID) teamId: string,
    @Ctx() ctx?: Context
  ): Promise<WeeklyReport[]> {
    const reportRepo = AppDataSource.getRepository(WeeklyReport);
    return await reportRepo.find({
      where: { teamId },
      relations: ['team', 'comments', 'comments.author'],
      order: { week: 'DESC' },
    });
  }

  @Query(() => [WeeklyReport])
  async reportsByStatus(
    @Arg('status') status: string,
    @Ctx() ctx?: Context
  ): Promise<WeeklyReport[]> {
    const reportRepo = AppDataSource.getRepository(WeeklyReport);
    return await reportRepo.find({
      where: { status },
      relations: ['team', 'comments', 'comments.author'],
    });
  }

  @Mutation(() => WeeklyReport)
  async submitWeeklyReport(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('week') week: string,
    @Arg('description') description: string,
    @Arg('progress', () => Int) progress: number,
    @Arg('taskIds', () => [String], { nullable: true }) taskIds?: string[],
    @Arg('photos', () => [String], { nullable: true }) photos?: string[],
    @Arg('status', { nullable: true }) status?: string,
    @Ctx() ctx?: Context
  ): Promise<WeeklyReport> {
    if (!ctx || (!ctx.userId && !ctx.userEmail)) {
      throw new Error('Authentication required');
    }

    const reportRepo = AppDataSource.getRepository(WeeklyReport);

    // Match Convex behavior: create or update
    const existing = await reportRepo.findOne({
      where: { teamId, week },
    });

    if (existing) {
      // Update existing report (match Convex createOrUpdateWeeklyReport)
      existing.description = description;
      existing.progressPercentage = progress;
      if (taskIds !== undefined) existing.taskIds = taskIds;
      if (photos !== undefined) existing.photos = photos;
      if (status) {
        existing.status = status;
        if (status === 'submitted') {
          existing.submittedAt = new Date();
        }
      } else {
        // If status not provided, only update if it's being submitted
        if (existing.status !== 'submitted') {
          existing.status = 'submitted';
          existing.submittedAt = new Date();
        }
      }
      await reportRepo.save(existing);

      return await reportRepo.findOne({
        where: { id: existing.id },
        relations: ['team', 'comments', 'comments.author'],
      }) as WeeklyReport;
    }

    // Create new report
    const report = reportRepo.create({
      teamId,
      week,
      description,
      progressPercentage: progress,
      taskIds: taskIds || [],
      photos: photos || [],
      status: status || 'submitted',
      submittedAt: status === 'submitted' ? new Date() : undefined,
    });

    const saved = await reportRepo.save(report);

    const result = await reportRepo.findOne({
      where: { id: saved.id },
      relations: ['team', 'comments', 'comments.author'],
    }) as WeeklyReport;

    // Publish subscription event
    await ctx.pubSub.publish('REPORT_SUBMITTED', {
      teamId,
      report: result,
    });

    return result;
  }

  @Mutation(() => Comment)
  async addSupervisorComment(
    @Arg('reportId', () => ID) reportId: string,
    @Arg('content') content: string,
    @Ctx() ctx: Context
  ): Promise<Comment> {
    if (!ctx.userId && !ctx.userEmail) {
      throw new Error('Authentication required');
    }

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

    const report = await reportRepo.findOne({ where: { id: reportId } });

    if (!report) {
      throw new Error('Report not found');
    }

    const comment = commentRepo.create({
      content,
      authorId: user.id,
      weeklyReportId: reportId,
    });

    const saved = await commentRepo.save(comment);

    // Update report status to revision_requested
    report.status = 'revision_requested';
    await reportRepo.save(report);

    const fullComment = await commentRepo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    }) as Comment;

    const updatedReport = await reportRepo.findOne({
      where: { id: reportId },
      relations: ['team', 'comments', 'comments.author'],
    }) as WeeklyReport;

    // Publish subscription event
    await ctx.pubSub.publish('REPORT_UPDATED', {
      teamId: report.teamId,
      report: updatedReport,
    });

    return fullComment;
  }

  @Mutation(() => WeeklyReport)
  async approveReport(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<WeeklyReport> {
    const reportRepo = AppDataSource.getRepository(WeeklyReport);

    const report = await reportRepo.findOne({ where: { id } });
    if (!report) {
      throw new Error('Report not found');
    }

    report.status = 'approved';
    await reportRepo.save(report);

    return await reportRepo.findOne({
      where: { id },
      relations: ['team', 'comments', 'comments.author'],
    }) as WeeklyReport;
  }
}
