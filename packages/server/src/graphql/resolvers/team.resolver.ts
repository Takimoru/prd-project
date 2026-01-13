import { Resolver, Query, Mutation, Arg, ID, Ctx, Int } from "type-graphql";
import { GraphQLError } from "graphql";
import { Team } from "../../entities/Team";
import { User } from "../../entities/User";
import {
  CreateTeamInput,
  UpdateTeamInput,
  AddMemberInput,
} from "../inputs/TeamInputs";
import { Context } from "../context";
import { checkIsAdmin, requireAdminRole } from "../../lib/auth-helpers";
import { AppDataSource } from "../../data-source";
import { In } from "typeorm";
import * as PostHog from "../../lib/posthog";
import { debugLog } from "../../lib/debug-logger";

@Resolver(() => Team)
export class TeamResolver {
  @Query(() => [Team])
  async teams(
    @Arg("programId", () => ID, { nullable: true }) programId?: string,
    @Ctx() ctx?: Context
  ): Promise<Team[]> {
    const teamRepo = AppDataSource.getRepository(Team);

    if (programId) {
      return await teamRepo.find({
        where: { programId },
        relations: ["leader", "supervisor", "members", "program"],
      });
    }

    return await teamRepo.find({
      relations: ["leader", "supervisor", "members", "program"],
    });
  }

  @Query(() => Team, { nullable: true })
  async team(
    @Arg("id", () => ID) id: string,
    @Ctx() ctx?: Context
  ): Promise<Team | null> {
    const teamRepo = AppDataSource.getRepository(Team);
    return await teamRepo.findOne({
      where: { id },
      relations: ["leader", "supervisor", "members", "program"],
    });
  }

  @Query(() => [Team])
  async myTeams(@Ctx() ctx: Context): Promise<Team[]> {
    debugLog(`[TeamResolver] myTeams called for user ${ctx.userEmail} (ID: ${ctx.userId})`);
    if (!ctx.userId && !ctx.userEmail) {
      debugLog("[TeamResolver] myTeams: No authentication info in context");
      return [];
    }

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) {
      debugLog(`[TeamResolver] myTeams: User not found for email: ${ctx.userEmail}`);
      return [];
    }

    debugLog(`[TeamResolver] myTeams: Found user ${user.id}`);

    try {
      // Get all teams and filter in memory - safer than complex joins while debugging
      const allTeams = await teamRepo.find({
        relations: ["leader", "supervisor", "members", "program"],
      });
      debugLog(`[TeamResolver] myTeams: Fetched ${allTeams.length} total teams from DB`);

      const myTeams = allTeams.filter(team => {
        // Is leader?
        if (team.leaderId === user.id) return true;
        
        // Is supervisor?
        if (team.supervisorId === user.id) return true;
        
        // Is member?
        if (team.members && team.members.some(m => m && m.id === user.id)) return true;
        
        return false;
      });

      debugLog(`[TeamResolver] myTeams: Found ${myTeams.length} matches for user ${user.id}`);
      return myTeams;
    } catch (error: any) {
      debugLog(`[TeamResolver] myTeams CRITICAL ERROR: ${error.message}`);
      throw new Error(`Failed to fetch my teams: ${error.message}`);
    }
  }

  @Mutation(() => Team)
  async createTeam(
    @Arg("input") input: CreateTeamInput,
    @Ctx() ctx: Context
  ): Promise<Team> {
    if (!ctx.userId && !ctx.userEmail) {
      throw new Error("Authentication required");
    }

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user || !checkIsAdmin(user)) {
      throw new Error("Only admins can create teams");
    }

    // Per requirement: A team must have at least 7 members
    if (!input.memberIds || input.memberIds.length < 7) {
      throw new Error("A team must have at least 7 members");
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
    await ctx.pubSub.publish("TEAM_UPDATED", {
      teamId: saved.id,
      team: saved,
    });

    // Track analytics: team_created
    PostHog.trackTeamCreated(user.id, saved.id, input.programId);

    return (await teamRepo.findOne({
      where: { id: saved.id },
      relations: ["leader", "supervisor", "members", "program"],
    })) as Team;
  }

  @Mutation(() => Team)
  async updateTeam(
    @Arg("id", () => ID) id: string,
    @Arg("input") input: UpdateTeamInput,
    @Ctx() ctx: Context
  ): Promise<Team> {
    if (!ctx.userId && !ctx.userEmail) {
      throw new Error("Authentication required");
    }

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user || !checkIsAdmin(user)) {
      throw new Error("Only admins can update teams");
    }

    const team = await teamRepo.findOne({
      where: { id },
      relations: ["members"],
    });
    if (!team) {
      throw new Error("Team not found");
    }

    if (input.name !== undefined) team.name = input.name;
    if (input.leaderId !== undefined) team.leaderId = input.leaderId;
    if (input.supervisorId !== undefined)
      team.supervisorId = input.supervisorId;
    if (input.progress !== undefined) team.progress = input.progress;
    if (input.memberIds !== undefined) {
      team.members = await userRepo.find({
        where: { id: In(input.memberIds) },
      });
    }

    await teamRepo.save(team);

    const updated = (await teamRepo.findOne({
      where: { id },
      relations: ["leader", "supervisor", "members", "program"],
    })) as Team;

    // Publish subscription event
    await ctx.pubSub.publish("TEAM_UPDATED", {
      teamId: updated.id,
      team: updated,
    });

    // Track analytics: team_updated
    PostHog.trackTeamUpdated(user.id, updated.id, "Team details updated");

    return updated;
  }

  @Mutation(() => Team)
  async addMember(
    @Arg("input") input: AddMemberInput,
    @Ctx() ctx: Context
  ): Promise<Team> {
    const teamRepo = AppDataSource.getRepository(Team);
    const userRepo = AppDataSource.getRepository(User);

    const team = await teamRepo.findOne({
      where: { id: input.teamId },
      relations: ["members"],
    });

    if (!team) {
      throw new Error("Team not found");
    }

    // Check if member already exists
    if (team.members.some((m) => m.id === input.userId)) {
      return (await teamRepo.findOne({
        where: { id: input.teamId },
        relations: ["leader", "supervisor", "members", "program"],
      })) as Team;
    }

    const newMember = await userRepo.findOne({ where: { id: input.userId } });
    if (newMember) {
      team.members.push(newMember);
      await teamRepo.save(team);
    }

    return (await teamRepo.findOne({
      where: { id: input.teamId },
      relations: ["leader", "supervisor", "members", "program"],
    })) as Team;
  }

  @Mutation(() => Team)
  async removeMember(
    @Arg("teamId", () => ID) teamId: string,
    @Arg("userId", () => ID) userId: string,
    @Ctx() ctx: Context
  ): Promise<Team> {
    const teamRepo = AppDataSource.getRepository(Team);

    const team = await teamRepo.findOne({
      where: { id: teamId },
      relations: ["members"],
    });

    if (!team) {
      throw new Error("Team not found");
    }

    team.members = team.members.filter((m) => m.id !== userId);
    await teamRepo.save(team);

    return (await teamRepo.findOne({
      where: { id: teamId },
      relations: ["leader", "supervisor", "members", "program"],
    })) as Team;
  }

  @Mutation(() => Team)
  async updateTeamProgress(
    @Arg("teamId", () => ID) teamId: string,
    @Arg("progress", () => Int) progress: number,
    @Ctx() ctx: Context
  ): Promise<Team> {
    if (progress < 0 || progress > 100) {
      throw new Error("Progress must be between 0 and 100");
    }

    const teamRepo = AppDataSource.getRepository(Team);

    const team = await teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new Error("Team not found");
    }

    team.progress = progress;
    await teamRepo.save(team);

    return (await teamRepo.findOne({
      where: { id: teamId },
      relations: ["leader", "supervisor", "members", "program"],
    })) as Team;
  }

  @Mutation(() => Team)
  async assignSupervisor(
    @Arg("teamId", () => ID) teamId: string,
    @Arg("supervisorId", () => ID) supervisorId: string,
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
      throw new Error("Only admins can assign supervisors");
    }

    // Verify supervisor exists and has supervisor role
    const supervisor = await userRepo.findOne({ where: { id: supervisorId } });
    if (!supervisor) {
      throw new Error("Supervisor not found");
    }

    if (supervisor.role !== "supervisor" && supervisor.role !== "admin") {
      throw new Error("User must be a supervisor to be assigned");
    }

    const team = await teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new Error("Team not found");
    }

    team.supervisorId = supervisorId;
    await teamRepo.save(team);

    // Track analytics: admin_assign_supervisor
    PostHog.trackTeamUpdated(
      admin.id,
      teamId,
      `Supervisor assigned: ${supervisor.name}`
    );

    return (await teamRepo.findOne({
      where: { id: teamId },
      relations: ["leader", "supervisor", "members", "program"],
    })) as Team;
  }

  @Mutation(() => Team)
  async deleteTeam(
    @Arg("id", () => ID) id: string,
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
      throw new Error("Only admins can delete teams");
    }

    const team = await teamRepo.findOne({
      where: { id },
      relations: [
        "leader",
        "supervisor",
        "members",
        "program",
        "tasks",
        "attendance",
        "weeklyReports",
      ],
    });
    if (!team) {
      throw new Error("Team not found");
    }

    try {
      console.log(
        `[TeamResolver] Attempting to delete team: ${team.name} (${team.id})`
      );
      // Check for related data that might block deletion
      if (
        team.tasks?.length > 0 ||
        team.attendance?.length > 0 ||
        team.weeklyReports?.length > 0
      ) {
        console.log(
          `[TeamResolver] Team has related data: Tasks: ${team.tasks?.length}, Attendance: ${team.attendance?.length}, Reports: ${team.weeklyReports?.length}`
        );
      }

      // Store team data before deletion for return value
      const teamToReturn = {
        id: team.id,
        name: team.name,
        programId: team.programId,
        leaderId: team.leaderId,
        supervisorId: team.supervisorId,
        progress: team.progress,
        leader: team.leader,
        supervisor: team.supervisor,
        members: team.members,
        program: team.program,
      };

      await teamRepo.remove(team);
      console.log(
        `[TeamResolver] Successfully deleted team: ${teamToReturn.id}`
      );

      // Return the team data before deletion (as a plain object to avoid GraphQL serialization issues)
      return teamToReturn as Team;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[TeamResolver] Error deleting team:", error);
      throw new GraphQLError(
        `Failed to delete team: ${msg}`,
        undefined, // nodes
        undefined, // source
        undefined, // positions
        undefined, // path
        undefined, // originalError
        { code: "INTERNAL_SERVER_ERROR" } // extensions
      );
    }
  }
}
