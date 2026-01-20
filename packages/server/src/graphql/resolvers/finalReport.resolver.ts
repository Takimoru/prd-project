import { Resolver, Query, Mutation, Arg, ID, Ctx, FieldResolver, Root, InputType, Field } from 'type-graphql';
import { FinalReport, FinalReportStatus } from '../../entities/FinalReport';
import { Team } from '../../entities/Team';
import { User } from '../../entities/User';
import { Context } from '../context';
import { AppDataSource } from '../../data-source';
import { requireAuth, requireAdminRole } from '../../lib/auth-helpers';

@InputType()
class UploadFinalReportInput {
  @Field()
  teamId: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  fileUrl: string;

  @Field()
  fileName: string;
}

@InputType()
class ReviewFinalReportInput {
  @Field(() => ID)
  reportId: string;

  @Field(() => FinalReportStatus)
  status: FinalReportStatus;

  @Field({ nullable: true })
  reviewNotes?: string;
}

@Resolver(() => FinalReport)
export class FinalReportResolver {
  // Student: Upload final report
  @Mutation(() => FinalReport)
  async uploadFinalReport(
    @Arg('input') input: UploadFinalReportInput,
    @Ctx() ctx: Context
  ): Promise<FinalReport> {
    requireAuth(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);
    const reportRepo = AppDataSource.getRepository(FinalReport);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : await userRepo.findOne({ where: { id: ctx.userId } });

    if (!user) throw new Error('User not found');

    // Check if user is member of the team
    const team = await teamRepo.findOne({
      where: { id: input.teamId },
      relations: ['members'],
    });

    if (!team) throw new Error('Team not found');

    const isMember = team.members?.some((m) => m.id === user.id);
    const isLeader = team.leaderId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isMember && !isLeader && !isAdmin) {
      throw new Error('Anda tidak memiliki akses untuk mengunggah laporan untuk tim ini');
    }

    // Create the final report
    const report = reportRepo.create({
      teamId: input.teamId,
      title: input.title,
      description: input.description,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      uploadedById: user.id,
      status: FinalReportStatus.PENDING,
    });

    return await reportRepo.save(report);
  }

  // Student: Get my team's final reports
  @Query(() => [FinalReport])
  async myTeamFinalReports(
    @Arg('teamId', () => ID) teamId: string,
    @Ctx() ctx: Context
  ): Promise<FinalReport[]> {
    requireAuth(ctx);

    const reportRepo = AppDataSource.getRepository(FinalReport);
    return await reportRepo.find({
      where: { teamId },
      relations: ['uploadedBy', 'reviewedBy', 'team'],
      order: { createdAt: 'DESC' },
    });
  }

  // Admin: Get all final reports
  @Query(() => [FinalReport])
  async allFinalReports(@Ctx() ctx: Context): Promise<FinalReport[]> {
    requireAdminRole(ctx);

    const reportRepo = AppDataSource.getRepository(FinalReport);
    return await reportRepo.find({
      relations: ['uploadedBy', 'reviewedBy', 'team', 'team.program'],
      order: { createdAt: 'DESC' },
    });
  }

  // Admin: Get final reports by team
  @Query(() => [FinalReport])
  async finalReportsByTeam(
    @Arg('teamId', () => ID) teamId: string,
    @Ctx() ctx: Context
  ): Promise<FinalReport[]> {
    requireAdminRole(ctx);

    const reportRepo = AppDataSource.getRepository(FinalReport);
    return await reportRepo.find({
      where: { teamId },
      relations: ['uploadedBy', 'reviewedBy', 'team'],
      order: { createdAt: 'DESC' },
    });
  }

  // Admin: Review final report (approve/request revision)
  @Mutation(() => FinalReport)
  async reviewFinalReport(
    @Arg('input') input: ReviewFinalReportInput,
    @Ctx() ctx: Context
  ): Promise<FinalReport> {
    requireAdminRole(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const reportRepo = AppDataSource.getRepository(FinalReport);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : await userRepo.findOne({ where: { id: ctx.userId } });

    if (!user) throw new Error('User not found');

    const report = await reportRepo.findOne({
      where: { id: input.reportId },
    });

    if (!report) throw new Error('Laporan tidak ditemukan');

    report.status = input.status;
    report.reviewNotes = input.reviewNotes;
    report.reviewedById = user.id;
    report.reviewedAt = new Date();

    return await reportRepo.save(report);
  }

  // Field Resolvers
  @FieldResolver(() => Team)
  async team(@Root() report: FinalReport): Promise<Team | null> {
    const teamRepo = AppDataSource.getRepository(Team);
    return await teamRepo.findOne({
      where: { id: report.teamId },
      relations: ['program'],
    });
  }

  @FieldResolver(() => User)
  async uploadedBy(@Root() report: FinalReport): Promise<User | null> {
    const userRepo = AppDataSource.getRepository(User);
    return await userRepo.findOne({
      where: { id: report.uploadedById },
    });
  }

  @FieldResolver(() => User, { nullable: true })
  async reviewedBy(@Root() report: FinalReport): Promise<User | null> {
    if (!report.reviewedById) return null;
    const userRepo = AppDataSource.getRepository(User);
    return await userRepo.findOne({
      where: { id: report.reviewedById },
    });
  }
}
