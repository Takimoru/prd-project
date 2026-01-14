import { Resolver, Query, Mutation, Arg, ID, Ctx, FieldResolver, Root, InputType, Field, Int } from 'type-graphql';
import { WorkProgram } from '../../entities/WorkProgram';
import { WorkProgramProgress } from '../../entities/WorkProgramProgress';
import { Team } from '../../entities/Team';
import { User } from '../../entities/User';
import { Task } from '../../entities/Task';
import { Context } from '../context';
import { requireAuth, requireSupervisorRole, requireLeaderRole, requireAdminRole } from '../../lib/auth-helpers';
import { AppDataSource } from '../../data-source';
import { In } from 'typeorm';
import * as PostHog from '../../lib/posthog';
import { debugLog } from '../../lib/debug-logger';

/**
 * WorkProgram Resolver - Team Leader flows
 * Per PRD Section C: Team Leader (setup work program)
 */

@InputType()
class CreateWorkProgramInput {
  @Field()
  teamId: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  startDate: string;

  @Field()
  endDate: string;

  @Field(() => [ID])
  assignedMemberIds: string[];
}

@InputType()
class UpdateWorkProgramInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  startDate?: string;

  @Field({ nullable: true })
  endDate?: string;

  @Field(() => [ID], { nullable: true })
  assignedMemberIds?: string[];
}

@Resolver(() => WorkProgram)
export class WorkProgramResolver {
  @FieldResolver(() => Team)
  async team(@Root() wp: WorkProgram): Promise<Team> {
    const teamRepo = AppDataSource.getRepository(Team);
    if (wp.team) return wp.team;
    return await teamRepo.findOneOrFail({ where: { id: wp.teamId } });
  }

  @FieldResolver(() => User)
  async createdBy(@Root() wp: WorkProgram): Promise<User> {
    const userRepo = AppDataSource.getRepository(User);
    if (wp.createdBy) return wp.createdBy;
    return await userRepo.findOneOrFail({ where: { id: wp.createdById } });
  }

  @FieldResolver(() => [User])
  async assignedMembers(@Root() wp: WorkProgram): Promise<User[]> {
    const wpRepo = AppDataSource.getRepository(WorkProgram);
    if (wp.assignedMembers) return wp.assignedMembers;
    const wpWithMembers = await wpRepo.findOneOrFail({
      where: { id: wp.id },
      relations: ['assignedMembers'],
    });
    return wpWithMembers.assignedMembers || [];
  }

  @FieldResolver(() => [Task])
  async tasks(@Root() wp: WorkProgram): Promise<Task[]> {
    const taskRepo = AppDataSource.getRepository(Task);
    if (wp.tasks) return wp.tasks;
    return await taskRepo.find({ where: { workProgramId: wp.id }, order: { createdAt: 'DESC' } });
  }

  @FieldResolver(() => [WorkProgramProgress])
  async progressRecords(@Root() wp: WorkProgram): Promise<WorkProgramProgress[]> {
    const progressRepo = AppDataSource.getRepository(WorkProgramProgress);
    if (wp.progressRecords) return wp.progressRecords;
    return await progressRepo.find({ where: { workProgramId: wp.id } });
  }

  @Query(() => [WorkProgram])
  async workPrograms(
    @Arg('teamId', () => ID) teamId: string,
    @Ctx() ctx: Context
  ): Promise<WorkProgram[]> {
    requireAuth(ctx);
    
    const wpRepo = AppDataSource.getRepository(WorkProgram);
    return await wpRepo.find({
      where: { teamId },
      // Relations removed to prevent circularity
      order: { createdAt: 'DESC' },
    });
  }

  @Query(() => [WorkProgram])
  async mySupervisedWorkPrograms(@Ctx() ctx: Context): Promise<WorkProgram[]> {
    requireAuth(ctx);
    debugLog(`[WorkProgramResolver] mySupervisedWorkPrograms called for ${ctx.userEmail}`);
    
    const userRepo = AppDataSource.getRepository(User);
    const wpRepo = AppDataSource.getRepository(WorkProgram);

    // Get user from context
    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      debugLog(`[WorkProgramResolver] User not found for email ${ctx.userEmail}`);
      throw new Error('User not found');
    }

    debugLog(`[WorkProgramResolver] Found user ${user.id} (${user.role})`);

    // Use standard find with relations and filter in memory - safer than complex joins
    // Relations removed to prevent circularity
    const allWps = await wpRepo.find({
      order: { createdAt: 'DESC' }
    });

    debugLog(`[WorkProgramResolver] Fetched ${allWps.length} total WPs from DB`);

    if (user.role === 'admin') {
      debugLog(`[WorkProgramResolver] User is admin, returning all ${allWps.length} WPs`);
      return allWps;
    }

    const filtered = allWps.filter(wp => {
      const team = wp.team;
      if (!team) return false;
      if (team.supervisorId === user.id) return true;
      if (team.leaderId === user.id) return true;
      if (team.members && team.members.some(m => m.id === user.id)) return true;
      return false;
    });

    debugLog(`[WorkProgramResolver] Returning ${filtered.length} WPs after filtering for supervisor/leader/member`);
    return filtered;
  }

  @Query(() => WorkProgram, { nullable: true })
  async workProgram(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<WorkProgram | null> {
    requireAuth(ctx);
    
    const wpRepo = AppDataSource.getRepository(WorkProgram);
    return await wpRepo.findOne({
      where: { id },
      // Relations removed to prevent circularity, handled by FieldResolvers
    });
  }

  @Mutation(() => WorkProgram)
  async createWorkProgram(
    @Arg('input') input: CreateWorkProgramInput,
    @Ctx() ctx: Context
  ): Promise<WorkProgram> {
    requireAuth(ctx);
    
    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);
    const wpRepo = AppDataSource.getRepository(WorkProgram);

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
      throw new Error('Only team leader can create work programs');
    }

    // Get assigned members
    const assignedMembers = await userRepo.find({
      where: { id: In(input.assignedMemberIds) },
    });

    const workProgram = wpRepo.create({
      teamId: input.teamId,
      title: input.title,
      description: input.description,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      createdById: user.id,
      assignedMembers: assignedMembers,
    });

    const saved = await wpRepo.save(workProgram);

    // Track analytics: work_program_created (per PRD Section C.5)
    PostHog.trackWorkProgramCreated(user.id, saved.id, input.teamId, input.title);

    return await wpRepo.findOne({
      where: { id: saved.id },
      relations: ['team', 'createdBy', 'assignedMembers'],
    }) as WorkProgram;
  }

  @Mutation(() => WorkProgram)
  async updateWorkProgram(
    @Arg('id', () => ID) id: string,
    @Arg('input') input: UpdateWorkProgramInput,
    @Ctx() ctx: Context
  ): Promise<WorkProgram> {
    requireAuth(ctx);
    
    const userRepo = AppDataSource.getRepository(User);
    const wpRepo = AppDataSource.getRepository(WorkProgram);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    const workProgram = await wpRepo.findOne({
      where: { id },
      relations: ['team', 'assignedMembers'],
    });

    if (!workProgram) {
      throw new Error('Work program not found');
    }

    // Verify user is leader of this team
    if (workProgram.team.leaderId !== user.id && user.role !== 'admin') {
      throw new Error('Only team leader can update work programs');
    }

    if (input.title !== undefined) workProgram.title = input.title;
    if (input.description !== undefined) workProgram.description = input.description;
    if (input.startDate) workProgram.startDate = new Date(input.startDate);
    if (input.endDate) workProgram.endDate = new Date(input.endDate);

    if (input.assignedMemberIds) {
      workProgram.assignedMembers = await userRepo.find({
        where: { id: In(input.assignedMemberIds) },
      });
    }

    await wpRepo.save(workProgram);

    return await wpRepo.findOne({
      where: { id },
      relations: ['team', 'createdBy', 'assignedMembers', 'progressRecords', 'progressRecords.member'],
    }) as WorkProgram;
  }

  @Mutation(() => Boolean)
  async deleteWorkProgram(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    requireAuth(ctx);
    
    const userRepo = AppDataSource.getRepository(User);
    const wpRepo = AppDataSource.getRepository(WorkProgram);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    const workProgram = await wpRepo.findOne({
      where: { id },
      relations: ['team'],
    });

    if (!workProgram) {
      throw new Error('Work program not found');
    }

    // Verify user is leader of this team or admin
    if (workProgram.team.leaderId !== user.id && user.role !== 'admin') {
      throw new Error('Only team leader can delete work programs');
    }

    await wpRepo.remove(workProgram);
    return true;
  }

  @Query(() => [WorkProgramProgress])
  async workProgramProgress(
    @Arg('workProgramId', () => ID) workProgramId: string,
    @Ctx() ctx: Context
  ): Promise<WorkProgramProgress[]> {
    requireAuth(ctx);

    const progressRepo = AppDataSource.getRepository(WorkProgramProgress);
    
    // Match Convex behavior: get all progress entries, enrich with user
    const progress = await progressRepo.find({
      where: { workProgramId },
      relations: ['member', 'workProgram'],
      order: { updatedAt: 'DESC' },
    });

    return progress;
  }

  @Mutation(() => WorkProgramProgress)
  async updateWorkProgramProgress(
    @Arg('workProgramId', () => ID) workProgramId: string,
    @Arg('percentage', () => Int) percentage: number,
    @Ctx() ctx: Context,
    @Arg('notes', { nullable: true }) notes?: string,
    @Arg('attachments', () => [String], { nullable: true }) attachments?: string[],
  ): Promise<WorkProgramProgress> {
    requireAuth(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const wpRepo = AppDataSource.getRepository(WorkProgram);
    const progressRepo = AppDataSource.getRepository(WorkProgramProgress);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    // Verify work program exists and user is assigned member
    const workProgram = await wpRepo.findOne({
      where: { id: workProgramId },
      relations: ['assignedMembers'],
    });

    if (!workProgram) {
      throw new Error('Work program not found');
    }

    const isAssigned = workProgram.assignedMembers.some(m => m.id === user.id);
    if (!isAssigned && user.role !== 'admin') {
      throw new Error('Only assigned members can update progress');
    }

    // Check if progress entry exists (match Convex behavior)
    const existing = await progressRepo.findOne({
      where: {
        workProgramId,
        memberId: user.id,
      },
    });

    if (existing) {
      // Update existing
      existing.percentage = percentage;
      existing.notes = notes;
      // Note: attachments not in entity yet, would need to add or store as JSON
      await progressRepo.save(existing);
      
      return await progressRepo.findOne({
        where: { id: existing.id },
        relations: ['member', 'workProgram'],
      }) as WorkProgramProgress;
    } else {
      // Create new
      const progress = progressRepo.create({
        workProgramId,
        memberId: user.id,
        percentage,
        notes,
      });
      
      const saved = await progressRepo.save(progress);
      
      return await progressRepo.findOne({
        where: { id: saved.id },
        relations: ['member', 'workProgram'],
      }) as WorkProgramProgress;
    }
  }
}


