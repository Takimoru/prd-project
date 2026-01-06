import { Resolver, Query, Mutation, Arg, ID, Ctx, Int } from 'type-graphql';
import { Team } from '../../entities/Team';
import { User } from '../../entities/User';
import { CreateTeamInput, UpdateTeamInput, AddMemberInput } from '../inputs/TeamInputs';
import { Context } from '../context';
import { checkIsAdmin, requireAdminRole } from '../../lib/auth-helpers';
import { AppDataSource } from '../../data-source';
import { In } from 'typeorm';
import * as PostHog from '../../lib/posthog';

@Resolver(() => Team)
export class TeamResolver {
  @Query(() => [Team])
  async teams(
    @Arg('programId', () => ID, { nullable: true }) programId?: string,
    @Ctx() ctx?: Context
  ): Promise<Team[]> {
    const teamRepo = AppDataSource.getRepository(Team);
    
    if (programId) {
      return await teamRepo.find({
        where: { programId },
        relations: ['leader', 'supervisor', 'members', 'program'],
      });
    }
    
    return await teamRepo.find({
      relations: ['leader', 'supervisor', 'members', 'program'],
    });
  }

  @Query(() => Team, { nullable: true })
  async team(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx?: Context
  ): Promise<Team | null> {
    const teamRepo = AppDataSource.getRepository(Team);
    return await teamRepo.findOne({
      where: { id },
      relations: ['leader', 'supervisor', 'members', 'program'],
    });
  }

  @Query(() => [Team])
  async myTeams(@Ctx() ctx: Context): Promise<Team[]> {
    if (!ctx.userId && !ctx.userEmail) {
      return [];
    }

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) return [];

    // Get teams where user is leader
    const teamsAsLeader = await teamRepo.find({
      where: { leaderId: user.id },
      relations: ['leader', 'supervisor', 'members', 'program'],
    });

    // Get teams where user is supervisor
    const teamsAsSupervisor = await teamRepo.find({
      where: { supervisorId: user.id },
      relations: ['leader', 'supervisor', 'members', 'program'],
    });

    // Get teams where user is member using query builder
    const teamsAsMember = await teamRepo
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.leader', 'leader')
      .leftJoinAndSelect('team.supervisor', 'supervisor')
      .leftJoinAndSelect('team.members', 'members')
      .leftJoinAndSelect('team.program', 'program')
      .innerJoin('team.members', 'member', 'member.id = :userId', { userId: user.id })
      .getMany();

    // Combine and deduplicate
    const allTeams = [...teamsAsLeader, ...teamsAsSupervisor, ...teamsAsMember];
    const uniqueTeams = Array.from(
      new Map(allTeams.map((team) => [team.id, team])).values()
    );

    return uniqueTeams;
  }

  @Mutation(() => Team)
  async createTeam(
    @Arg('input') input: CreateTeamInput,
    @Ctx() ctx: Context
  ): Promise<Team> {
    if (!ctx.userId && !ctx.userEmail) {
      throw new Error('Authentication required');
    }

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user || !checkIsAdmin(user)) {
      throw new Error('Only admins can create teams');
    }

    // Get members
    const members = await userRepo.find({
      where: { id: In(input.memberIds || []) },
    });

    const team = teamRepo.create({
      programId: input.programId,
      leaderId: input.leaderId,
      supervisorId: input.supervisorId,
      name: input.name,
      progress: 0,
      members: members,
    });

    const saved = await teamRepo.save(team);

    // Publish subscription event
    await ctx.pubSub.publish('TEAM_UPDATED', {
      teamId: saved.id,
      team: saved,
    });

    // Track analytics: team_created
    PostHog.trackTeamCreated(user.id, saved.id, input.programId);

    return await teamRepo.findOne({
      where: { id: saved.id },
      relations: ['leader', 'supervisor', 'members', 'program'],
    }) as Team;
  }

  @Mutation(() => Team)
  async updateTeam(
    @Arg('id', () => ID) id: string,
    @Arg('input') input: UpdateTeamInput,
    @Ctx() ctx: Context
  ): Promise<Team> {
    if (!ctx.userId && !ctx.userEmail) {
      throw new Error('Authentication required');
    }

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user || !checkIsAdmin(user)) {
      throw new Error('Only admins can update teams');
    }

    const team = await teamRepo.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!team) {
      throw new Error('Team not found');
    }

    if (input.name !== undefined) team.name = input.name;
    if (input.leaderId !== undefined) team.leaderId = input.leaderId;
    if (input.supervisorId !== undefined) team.supervisorId = input.supervisorId;
    if (input.progress !== undefined) team.progress = input.progress;
    if (input.memberIds !== undefined) {
      team.members = await userRepo.find({
        where: { id: In(input.memberIds) },
      });
    }

    await teamRepo.save(team);

    const updated = await teamRepo.findOne({
      where: { id },
      relations: ['leader', 'supervisor', 'members', 'program'],
    }) as Team;

    // Publish subscription event
    await ctx.pubSub.publish('TEAM_UPDATED', {
      teamId: updated.id,
      team: updated,
    });

    // Track analytics: team_updated
    PostHog.trackTeamUpdated(user.id, updated.id, 'Team details updated');

    return updated;
  }

  @Mutation(() => Team)
  async addMember(
    @Arg('input') input: AddMemberInput,
    @Ctx() ctx: Context
  ): Promise<Team> {
    const teamRepo = AppDataSource.getRepository(Team);
    const userRepo = AppDataSource.getRepository(User);

    const team = await teamRepo.findOne({
      where: { id: input.teamId },
      relations: ['members'],
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Check if member already exists
    if (team.members.some((m) => m.id === input.userId)) {
      return await teamRepo.findOne({
        where: { id: input.teamId },
        relations: ['leader', 'supervisor', 'members', 'program'],
      }) as Team;
    }

    const newMember = await userRepo.findOne({ where: { id: input.userId } });
    if (newMember) {
      team.members.push(newMember);
      await teamRepo.save(team);
    }

    return await teamRepo.findOne({
      where: { id: input.teamId },
      relations: ['leader', 'supervisor', 'members', 'program'],
    }) as Team;
  }

  @Mutation(() => Team)
  async removeMember(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('userId', () => ID) userId: string,
    @Ctx() ctx: Context
  ): Promise<Team> {
    const teamRepo = AppDataSource.getRepository(Team);

    const team = await teamRepo.findOne({
      where: { id: teamId },
      relations: ['members'],
    });

    if (!team) {
      throw new Error('Team not found');
    }

    team.members = team.members.filter((m) => m.id !== userId);
    await teamRepo.save(team);

    return await teamRepo.findOne({
      where: { id: teamId },
      relations: ['leader', 'supervisor', 'members', 'program'],
    }) as Team;
  }

  @Mutation(() => Team)
  async updateTeamProgress(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('progress', () => Int) progress: number,
    @Ctx() ctx: Context
  ): Promise<Team> {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    const teamRepo = AppDataSource.getRepository(Team);

    const team = await teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new Error('Team not found');
    }

    team.progress = progress;
    await teamRepo.save(team);

    return await teamRepo.findOne({
      where: { id: teamId },
      relations: ['leader', 'supervisor', 'members', 'program'],
    }) as Team;
  }

  @Mutation(() => Team)
  async assignSupervisor(
    @Arg('teamId', () => ID) teamId: string,
    @Arg('supervisorId', () => ID) supervisorId: string,
    @Ctx() ctx: Context
  ): Promise<Team> {
    requireAdminRole(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);

    const admin = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!admin || !checkIsAdmin(admin)) {
      throw new Error('Only admins can assign supervisors');
    }

    // Verify supervisor exists and has supervisor role
    const supervisor = await userRepo.findOne({ where: { id: supervisorId } });
    if (!supervisor) {
      throw new Error('Supervisor not found');
    }

    if (supervisor.role !== 'supervisor' && supervisor.role !== 'admin') {
      throw new Error('User must be a supervisor to be assigned');
    }

    const team = await teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new Error('Team not found');
    }

    team.supervisorId = supervisorId;
    await teamRepo.save(team);

    // Track analytics: admin_assign_supervisor
    PostHog.trackTeamUpdated(admin.id, teamId, `Supervisor assigned: ${supervisor.name}`);

    return await teamRepo.findOne({
      where: { id: teamId },
      relations: ['leader', 'supervisor', 'members', 'program'],
    }) as Team;
  }

  @Mutation(() => Team)
  async deleteTeam(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<Team> {
    requireAdminRole(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user || !checkIsAdmin(user)) {
      throw new Error('Only admins can delete teams');
    }

    const team = await teamRepo.findOne({
      where: { id },
      relations: ['leader', 'supervisor', 'members', 'program'],
    });
    if (!team) {
      throw new Error('Team not found');
    }

    await teamRepo.remove(team);
    return team;
  }
}
