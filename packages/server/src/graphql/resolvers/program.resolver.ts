import { Resolver, Query, Mutation, Arg, ID, Ctx } from 'type-graphql';
import { Program } from '../../entities/Program';
import { User } from '../../entities/User';
import { CreateProgramInput, UpdateProgramInput } from '../inputs/ProgramInputs';
import { Context } from '../context';
import { checkIsAdmin, requireAdminRole } from '../../lib/auth-helpers';
import { AppDataSource } from '../../data-source';
import * as PostHog from '../../lib/posthog';

@Resolver(() => Program)
export class ProgramResolver {
  @Query(() => [Program])
  async programs(
    @Arg('includeArchived', { nullable: true, defaultValue: false }) includeArchived: boolean,
    @Ctx() ctx: Context
  ): Promise<Program[]> {
    const programRepo = AppDataSource.getRepository(Program);
    
    if (includeArchived) {
      return await programRepo.find({
        relations: ['creator'],
      });
    }
    
    return await programRepo.find({
      where: { archived: false },
      relations: ['creator'],
    });
  }

  @Query(() => Program, { nullable: true })
  async program(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<Program | null> {
    const programRepo = AppDataSource.getRepository(Program);
    return await programRepo.findOne({
      where: { id },
      relations: ['creator'],
    });
  }

  @Mutation(() => Program)
  async createProgram(
    @Arg('input') input: CreateProgramInput,
    @Ctx() ctx: Context
  ): Promise<Program> {
    if (!ctx.userId && !ctx.userEmail) {
      throw new Error('Authentication required');
    }

    const userRepo = AppDataSource.getRepository(User);
    const programRepo = AppDataSource.getRepository(Program);

    // Get current user
    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    const isAdmin = checkIsAdmin(user);
    const isStudent = user.role === 'student';

    if (!isAdmin && !isStudent) {
      throw new Error('Only students or admins can create programs');
    }

    const program = programRepo.create({
      title: input.title,
      description: input.description,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      archived: false,
      createdBy: user.id,
      creator: user,
    });

    const saved = await programRepo.save(program);
    
    // Track analytics: program_created (per PRD Section A.5)
    PostHog.trackProgramCreated(user.id, saved.id, saved.title);
    
    // Reload with relations
    return await programRepo.findOne({
      where: { id: saved.id },
      relations: ['creator'],
    }) as Program;
  }

  @Mutation(() => Program)
  async updateProgram(
    @Arg('id', () => ID) id: string,
    @Arg('input') input: UpdateProgramInput,
    @Ctx() ctx: Context
  ): Promise<Program> {
    requireAdminRole(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const programRepo = AppDataSource.getRepository(Program);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user || !checkIsAdmin(user)) {
      throw new Error('Only admins can update programs');
    }

    const program = await programRepo.findOne({ where: { id } });
    if (!program) {
      throw new Error('Program not found');
    }

    // Update fields
    if (input.title !== undefined) program.title = input.title;
    if (input.description !== undefined) program.description = input.description;
    if (input.startDate !== undefined) program.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) program.endDate = new Date(input.endDate);

    await programRepo.save(program);

    // Track analytics
    PostHog.trackProgramCreated(user.id, program.id, program.title);

    return await programRepo.findOne({
      where: { id },
      relations: ['creator'],
    }) as Program;
  }

  @Mutation(() => Program)
  async archiveProgram(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<Program> {
    requireAdminRole(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const programRepo = AppDataSource.getRepository(Program);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user || !checkIsAdmin(user)) {
      throw new Error('Only admins can archive programs');
    }

    const program = await programRepo.findOne({ where: { id } });
    if (!program) {
      throw new Error('Program not found');
    }

    program.archived = true;
    await programRepo.save(program);

    // Track analytics: program_archived (per PRD Section A.5)
    PostHog.trackProgramArchived(user.id, program.id);

    return await programRepo.findOne({
      where: { id },
      relations: ['creator'],
    }) as Program;
  }
}
