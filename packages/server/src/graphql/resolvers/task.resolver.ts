import { Resolver, Query, Mutation, Arg, ID, Ctx, Int, FieldResolver, Root } from 'type-graphql';
import { Task } from '../../entities/Task';
import { TaskUpdate } from '../../entities/TaskUpdate';
import { TaskFile } from '../../entities/TaskFile';
import { User } from '../../entities/User';
import { Team } from '../../entities/Team';
import { Activity } from '../../entities/Activity';
import { WorkProgram } from '../../entities/WorkProgram';
import { WorkProgramProgress } from '../../entities/WorkProgramProgress';
import { CreateTaskInput, UpdateTaskInput, TaskFileInput } from '../inputs/TaskInputs';
import { Context } from '../context';
import { AppDataSource } from '../../data-source';
import { In } from 'typeorm';
import * as PostHog from '../../lib/posthog';

@Resolver(() => Task)
export class TaskResolver {
  @FieldResolver(() => User)
  async createdBy(@Root() task: Task): Promise<User> {
    const userRepo = AppDataSource.getRepository(User);
    if (task.createdBy) return task.createdBy;
    return await userRepo.findOneOrFail({ where: { id: task.createdById } });
  }

  @FieldResolver(() => [User])
  async assignedMembers(@Root() task: Task): Promise<User[]> {
    const taskRepo = AppDataSource.getRepository(Task);
    if (task.assignedMembers) return task.assignedMembers;
    const taskWithMembers = await taskRepo.findOneOrFail({
      where: { id: task.id },
      relations: ['assignedMembers'],
    });
    return taskWithMembers.assignedMembers || [];
  }

  @FieldResolver(() => User, { nullable: true })
  async completedBy(@Root() task: Task): Promise<User | null> {
    if (!task.completedById) return null;
    const userRepo = AppDataSource.getRepository(User);
    if (task.completedBy) return task.completedBy;
    return await userRepo.findOne({ where: { id: task.completedById } });
  }

  @FieldResolver(() => Team)
  async team(@Root() task: Task): Promise<Team> {
    const teamRepo = AppDataSource.getRepository(Team);
    if (task.team) return task.team;
    return await teamRepo.findOneOrFail({ where: { id: task.teamId } });
  }

  @FieldResolver(() => WorkProgram, { nullable: true })
  async workProgram(@Root() task: Task): Promise<WorkProgram | null> {
    if (!task.workProgramId) return null;
    const wpRepo = AppDataSource.getRepository(WorkProgram);
    if (task.workProgram) return task.workProgram;
    return await wpRepo.findOne({ where: { id: task.workProgramId } });
  }

  @FieldResolver(() => [TaskUpdate])
  async updates(@Root() task: Task): Promise<TaskUpdate[]> {
    const updateRepo = AppDataSource.getRepository(TaskUpdate);
    if (task.updates) return task.updates;
    return await updateRepo.find({ where: { taskId: task.id }, order: { createdAt: 'DESC' } });
  }

  @FieldResolver(() => [TaskFile])
  async completionFiles(@Root() task: Task): Promise<TaskFile[]> {
    const fileRepo = AppDataSource.getRepository(TaskFile);
    if (task.completionFiles) return task.completionFiles;
    return await fileRepo.find({ where: { taskId: task.id } });
  }
  @Query(() => [Task])
  async tasks(
    @Arg('teamId', () => ID) teamId: string,
    @Ctx() ctx?: Context
  ): Promise<Task[]> {
    const taskRepo = AppDataSource.getRepository(Task);
    return await taskRepo.find({
      where: { teamId },
      // Relations removed to prevent circularity
      order: { createdAt: 'DESC' },
    });
  }

  @Query(() => Task, { nullable: true })
  async task(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx?: Context
  ): Promise<Task | null> {
    const taskRepo = AppDataSource.getRepository(Task);
    return await taskRepo.findOne({
      where: { id },
      // Relations removed to prevent circularity
    });
  }

  @Query(() => [Task])
  async tasksByUser(@Ctx() ctx: Context): Promise<Task[]> {
    if (!ctx.userId && !ctx.userEmail) {
      return [];
    }

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);
    const taskRepo = AppDataSource.getRepository(Task);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) return [];

    // Get user teams
    const userTeams = await teamRepo
      .createQueryBuilder('team')
      .where('team.leaderId = :userId', { userId: user.id })
      .orWhere('team.supervisorId = :userId', { userId: user.id })
      .orWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('t.id')
          .from(Team, 't')
          .innerJoin('t.members', 'm', 'm.id = :userId', { userId: user.id })
          .getQuery();
        return `team.id IN ${subQuery}`;
      })
      .getMany();

    const teamIds = userTeams.map((t) => t.id);

    if (teamIds.length === 0) {
      // Just get tasks assigned to user
      return await taskRepo
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.createdBy', 'createdBy')
        .leftJoinAndSelect('task.assignedMembers', 'assignedMembers')
        .leftJoinAndSelect('task.completedBy', 'completedBy')
        .leftJoinAndSelect('task.team', 'team')
        .leftJoinAndSelect('task.updates', 'updates')
        .leftJoinAndSelect('updates.user', 'updateUser')
        .leftJoinAndSelect('task.completionFiles', 'completionFiles')
        .innerJoin('task.assignedMembers', 'am', 'am.id = :userId', { userId: user.id })
        .getMany();
    }

    return await taskRepo.find({
      where: { teamId: In(teamIds) },
      // Relations removed to prevent circularity
    });
  }

  @Mutation(() => Task)
  async createTask(
    @Arg('input') input: CreateTaskInput,
    @Ctx() ctx: Context
  ): Promise<Task> {
    if (!ctx.userId && !ctx.userEmail) {
      throw new Error('Authentication required');
    }

    const userRepo = AppDataSource.getRepository(User);
    const taskRepo = AppDataSource.getRepository(Task);
    const activityRepo = AppDataSource.getRepository(Activity);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    const assignedMembers = await userRepo.find({
      where: { id: In(input.assignedMemberIds || []) },
    });

    const task = taskRepo.create({
      teamId: input.teamId,
      title: input.title,
      description: input.description,
      createdById: user.id,
      startTime: input.startTime ? new Date(input.startTime) : undefined,
      endTime: input.endTime ? new Date(input.endTime) : undefined,
      workProgramId: input.workProgramId,
      completed: false,
      status: 'todo',
      assignedMembers: assignedMembers,
    });

    const saved = await taskRepo.save(task);

    // Log activity
    const activity = activityRepo.create({
      teamId: input.teamId,
      userId: user.id,
      action: 'created_task',
      targetId: saved.id,
      targetTitle: input.title,
    });
    await activityRepo.save(activity);

    // Publish subscription event
    await ctx.pubSub.publish('TASK_UPDATED', {
      teamId: input.teamId,
      taskId: saved.id,
      task: saved,
    });

    // Track analytics: task_created (per PRD Section C.5)
    PostHog.trackTaskCreated(user.id, saved.id, input.teamId, input.title, input.workProgramId);

    return await taskRepo.findOne({
      where: { id: saved.id },
      // Relations removed to prevent circularity
    }) as Task;
  }

  @Mutation(() => Task)
  async updateTask(
    @Arg('id', () => ID) id: string,
    @Arg('input') input: UpdateTaskInput,
    @Ctx() ctx: Context
  ): Promise<Task> {
    if (!ctx.userId && !ctx.userEmail) {
      throw new Error('Authentication required');
    }

    const userRepo = AppDataSource.getRepository(User);
    const taskRepo = AppDataSource.getRepository(Task);
    const taskFileRepo = AppDataSource.getRepository(TaskFile);
    const activityRepo = AppDataSource.getRepository(Activity);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    const existingTask = await taskRepo.findOne({
      where: { id },
      relations: ['assignedMembers'],
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    // If marking as complete, require files
    if (input.completed === true && !existingTask.completed) {
      if (!input.completionFiles || input.completionFiles.length === 0) {
        throw new Error('At least one file must be uploaded to complete the task');
      }

      // Create completion files
      for (const fileInput of input.completionFiles) {
        const file = taskFileRepo.create({
          taskId: id,
          url: fileInput.url,
          name: fileInput.name,
        });
        await taskFileRepo.save(file);
      }

      // Update task with completion metadata
      if (input.title !== undefined) existingTask.title = input.title;
      if (input.description !== undefined) existingTask.description = input.description;
      if (input.startTime) existingTask.startTime = new Date(input.startTime);
      if (input.endTime) existingTask.endTime = new Date(input.endTime);
      existingTask.completed = true;
      existingTask.status = 'completed';
      existingTask.completedAt = new Date();
      existingTask.completedById = user.id;

      if (input.assignedMemberIds) {
        existingTask.assignedMembers = await userRepo.find({
          where: { id: In(input.assignedMemberIds) },
        });
      }

      await taskRepo.save(existingTask);

      // Log completion activity
      const activity = activityRepo.create({
        teamId: existingTask.teamId,
        userId: user.id,
        action: 'completed_task',
        targetId: id,
        targetTitle: existingTask.title,
      });
      await activityRepo.save(activity);

      // Update work program progress if linked
      if (existingTask.workProgramId) {
        await this.updateWorkProgramProgress(existingTask.workProgramId);
      }

      const updated = await taskRepo.findOne({
        where: { id },
        relations: ['createdBy', 'assignedMembers', 'completedBy', 'team', 'completionFiles'],
      }) as Task;

      // Publish subscription event
      await ctx.pubSub.publish('TASK_UPDATED', {
        teamId: existingTask.teamId,
        taskId: updated.id,
        task: updated,
      });

      return updated;
    } else {
      // Regular update
      if (input.title !== undefined) existingTask.title = input.title;
      if (input.description !== undefined) existingTask.description = input.description;
      if (input.startTime) existingTask.startTime = new Date(input.startTime);
      if (input.endTime) existingTask.endTime = new Date(input.endTime);
      if (input.completed !== undefined) {
        existingTask.completed = input.completed;
        existingTask.status = input.completed ? 'completed' : existingTask.status;
      }

      if (input.assignedMemberIds) {
        existingTask.assignedMembers = await userRepo.find({
          where: { id: In(input.assignedMemberIds) },
        });
      }

      await taskRepo.save(existingTask);

      // Log update activity
      const activity = activityRepo.create({
        teamId: existingTask.teamId,
        userId: user.id,
        action: 'updated_task',
        targetId: id,
        targetTitle: existingTask.title,
        details: input.description ? 'Updated description' : 'Updated task details',
      });
      await activityRepo.save(activity);

      const updated = await taskRepo.findOne({
        where: { id },
        relations: ['createdBy', 'assignedMembers', 'completedBy', 'team'],
      }) as Task;

      // Publish subscription event
      await ctx.pubSub.publish('TASK_UPDATED', {
        teamId: existingTask.teamId,
        taskId: updated.id,
        task: updated,
      });

      return updated;
    }
  }

  @Mutation(() => TaskUpdate)
  async addTaskUpdate(
    @Arg('taskId', () => ID) taskId: string,
    @Arg('notes', { nullable: true }) notes?: string,
    @Arg('progress', () => Int, { nullable: true }) progress?: number,
    @Ctx() ctx?: Context
  ): Promise<TaskUpdate> {
    if (!ctx?.userId && !ctx?.userEmail) {
      throw new Error('Authentication required');
    }

    const userRepo = AppDataSource.getRepository(User);
    const taskRepo = AppDataSource.getRepository(Task);
    const taskUpdateRepo = AppDataSource.getRepository(TaskUpdate);
    const activityRepo = AppDataSource.getRepository(Activity);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    const task = await taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new Error('Task not found');
    }

    const update = taskUpdateRepo.create({
      taskId,
      userId: user.id,
      notes,
      progress,
    });
    const saved = await taskUpdateRepo.save(update);

    // Log activity
    const activity = activityRepo.create({
      teamId: task.teamId,
      userId: user.id,
      action: 'updated_task',
      targetId: taskId,
      targetTitle: task.title,
      details: progress ? `Updated progress to ${progress}%` : 'Added a note/file',
    });
    await activityRepo.save(activity);

    // Track analytics: task_update_submitted (per PRD Section D.5)
    PostHog.trackTaskUpdateSubmitted(user.id, taskId, task.teamId, progress);

    // Update work program progress if linked
    if (progress !== undefined && task.workProgramId) {
      await this.updateWorkProgramProgressForMember(
        task.workProgramId,
        user.id,
        progress
      );
    }

    return await taskUpdateRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    }) as TaskUpdate;
  }

  @Mutation(() => Boolean)
  async deleteTask(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx?: Context
  ): Promise<boolean> {
    const taskRepo = AppDataSource.getRepository(Task);
    const task = await taskRepo.findOne({ where: { id } });
    if (task) {
      await taskRepo.remove(task);
    }
    return true;
  }

  @Query(() => [TaskUpdate])
  async taskUpdates(
    @Arg('taskId', () => ID) taskId: string,
    @Ctx() ctx?: Context
  ): Promise<TaskUpdate[]> {
    const taskUpdateRepo = AppDataSource.getRepository(TaskUpdate);
    return await taskUpdateRepo.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Helper methods
  private async updateWorkProgramProgress(workProgramId: string) {
    const taskRepo = AppDataSource.getRepository(Task);
    const wpRepo = AppDataSource.getRepository(WorkProgram);
    const wppRepo = AppDataSource.getRepository(WorkProgramProgress);

    const tasks = await taskRepo.find({ where: { workProgramId } });

    if (tasks.length === 0) return;

    const completedTasks = tasks.filter((t) => t.completed);
    const percentage = Math.round((completedTasks.length / tasks.length) * 100);

    const workProgram = await wpRepo.findOne({
      where: { id: workProgramId },
      relations: ['assignedMembers'],
    });

    if (!workProgram) return;

    // Update main progress column
    workProgram.progress = percentage;
    await wpRepo.save(workProgram);

    for (const member of workProgram.assignedMembers) {
      let progress = await wppRepo.findOne({
        where: { workProgramId, memberId: member.id },
      });

      if (progress) {
        progress.percentage = percentage;
        progress.updatedAt = new Date();
        await wppRepo.save(progress);
      } else {
        progress = wppRepo.create({
          workProgramId,
          memberId: member.id,
          percentage,
        });
        await wppRepo.save(progress);
      }
    }
  }

  private async updateWorkProgramProgressForMember(
    workProgramId: string,
    memberId: string,
    progress: number
  ) {
    const wppRepo = AppDataSource.getRepository(WorkProgramProgress);

    let existing = await wppRepo.findOne({
      where: { workProgramId, memberId },
    });

    if (existing) {
      existing.percentage = progress;
      existing.updatedAt = new Date();
      await wppRepo.save(existing);
    } else {
      existing = wppRepo.create({
        workProgramId,
        memberId,
        percentage: progress,
      });
      await wppRepo.save(existing);
    }
  }
}
