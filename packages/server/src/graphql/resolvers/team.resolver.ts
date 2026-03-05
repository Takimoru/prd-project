import { Resolver, Query, Mutation, Arg, ID, Ctx, Int, FieldResolver, Root, ObjectType, Field } from "type-graphql";
import { GraphQLError } from "graphql";
import { Team } from "../../entities/Team";
import { User } from "../../entities/User";
import {
  CreateTeamInput,
  UpdateTeamInput,
  AddMemberInput,
  GenerateTeamsInput,
  FinalizeTeamsInput,
} from "../inputs/TeamInputs";
import { Context } from "../context";
import { checkIsAdmin, requireAdminRole } from "../../lib/auth-helpers";
import { AppDataSource } from "../../data-source";
import { In } from "typeorm";
import * as PostHog from "../../lib/posthog";
import { debugLog } from "../../lib/debug-logger";
import { Program } from "../../entities/Program";
import { Task } from "../../entities/Task";
import { WorkProgram } from "../../entities/WorkProgram";
import { WeeklyReport } from "../../entities/WeeklyReport";
import { TeamGenerationRun } from "../../entities/TeamGenerationRun";
import { Registration } from "../../entities/Registration";

@Resolver(() => Team)
export class TeamResolver {
  @FieldResolver(() => User)
  async leader(@Root() team: Team): Promise<User> {
    const userRepo = AppDataSource.getRepository(User);
    if (team.leader) return team.leader;
    return (await userRepo.findOneOrFail({ where: { id: team.leaderId } }));
  }

  @FieldResolver(() => User, { nullable: true })
  async supervisor(@Root() team: Team): Promise<User | null> {
    if (!team.supervisorId) return null;
    const userRepo = AppDataSource.getRepository(User);
    if (team.supervisor) return team.supervisor;
    return await userRepo.findOne({ where: { id: team.supervisorId } });
  }

  @FieldResolver(() => [User])
  async members(@Root() team: Team): Promise<User[]> {
    const teamRepo = AppDataSource.getRepository(Team);
    if (team.members) return team.members;
    const teamWithMembers = await teamRepo.findOneOrFail({
      where: { id: team.id },
      relations: ["members"],
    });
    return teamWithMembers.members || [];
  }

  @FieldResolver(() => Program)
  async program(@Root() team: Team): Promise<Program> {
    const programRepo = AppDataSource.getRepository(Program);
    if (team.program) return team.program;
    return await programRepo.findOneOrFail({ where: { id: team.programId } });
  }

  @FieldResolver(() => [Task])
  async tasks(@Root() team: Team): Promise<Task[]> {
    const taskRepo = AppDataSource.getRepository(Task);
    if (team.tasks) return team.tasks;
    return await taskRepo.find({ where: { teamId: team.id } });
  }

  @FieldResolver(() => [WorkProgram])
  async workPrograms(@Root() team: Team): Promise<WorkProgram[]> {
    const wpRepo = AppDataSource.getRepository(WorkProgram);
    if (team.workPrograms) return team.workPrograms;
    return await wpRepo.find({ where: { teamId: team.id } });
  }

  @FieldResolver(() => [WeeklyReport])
  async weeklyReports(@Root() team: Team): Promise<WeeklyReport[]> {
    const reportRepo = AppDataSource.getRepository(WeeklyReport);
    if (team.weeklyReports) return team.weeklyReports;
    return await reportRepo.find({ where: { teamId: team.id } });
  }
  @Query(() => [Team])
  async teams(
    @Arg("programId", () => ID, { nullable: true }) programId?: string,
    @Ctx() ctx?: Context
  ): Promise<Team[]> {
    const teamRepo = AppDataSource.getRepository(Team);

    if (programId) {
      return await teamRepo.find({
        where: { programId },
        // Relations removed to prevent circularity, handled by FieldResolvers
      });
    }

    return await teamRepo.find();
  }

  @Query(() => Team, { nullable: true })
  async team(
    @Arg("id", () => ID) id: string,
    @Ctx() ctx?: Context
  ): Promise<Team | null> {
    const teamRepo = AppDataSource.getRepository(Team);
    return await teamRepo.findOne({
      where: { id },
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
      // Relations removed to prevent circularity
      const allTeams = await teamRepo.find({
        relations: ["members"], // Keep members for filtering logic
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

  // ===== AUTO-GENERATION MUTATIONS =====

  @Mutation(() => String)
  async generateTeams(
    @Arg("input") input: GenerateTeamsInput,
    @Ctx() ctx: Context
  ): Promise<string> {
    requireAdminRole(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);
    const registrationRepo = AppDataSource.getRepository(Registration);
    const runRepo = AppDataSource.getRepository(TeamGenerationRun);

    // Get the admin user
    const adminUser = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!adminUser || !checkIsAdmin(adminUser)) {
      throw new Error("Only admins can generate teams");
    }

    // Fetch all approved registrations for this program, including user with major
    const approvedRegistrations = await registrationRepo.find({
      where: { programId: input.programId, status: "approved" },
      relations: ["user"],
    });

    if (approvedRegistrations.length === 0) {
      throw new Error("Tidak ada mahasiswa yang telah disetujui untuk periode ini");
    }

    // Find students already assigned to teams in this program
    const existingTeams = await teamRepo.find({
      where: { programId: input.programId },
      relations: ["members"],
    });

    const assignedStudentIds = new Set<string>();
    existingTeams.forEach((team) => {
      if (team.leaderId) assignedStudentIds.add(team.leaderId);
      team.members?.forEach((m) => assignedStudentIds.add(m.id));
    });

    // Build pool of unassigned students (with their major)
    const unassignedStudents = approvedRegistrations
      .filter((reg) => reg.user && !assignedStudentIds.has(reg.user.id))
      .map((reg) => ({
        id: reg.user!.id,
        name: reg.user!.name,
        email: reg.user!.email,
        major: reg.user!.major || reg.major || "Lainnya",
      }));

    const totalUnassigned = unassignedStudents.length;
    const T = Math.floor(totalUnassigned / 15);

    if (T === 0) {
      throw new Error("Jumlah Mahasiswa Belum Cukup (minimum 15 mahasiswa)");
    }

    // Group students by major
    const byMajor = new Map<string, typeof unassignedStudents>();
    for (const student of unassignedStudents) {
      const key = student.major;
      if (!byMajor.has(key)) byMajor.set(key, []);
      byMajor.get(key)!.push(student);
    }

    // Create T empty teams
    const previewTeams: Array<{
      tempId: string;
      name: string;
      members: Array<{ id: string; name: string; email: string; major: string }>;
    }> = Array.from({ length: T }, (_, i) => ({
      tempId: `preview-team-${i + 1}`,
      name: `Tim KKN ${i + 1}`,
      members: [],
    }));

    const assignedInPreview = new Set<string>();

    // Step 1: Round-robin — assign 1 student per major to each team in rotation
    const majorKeys = Array.from(byMajor.keys());
    for (const major of majorKeys) {
      const pool = byMajor.get(major)!;
      let poolIdx = 0;
      for (let teamIdx = 0; teamIdx < T; teamIdx++) {
        if (poolIdx >= pool.length) break; // major pool exhausted
        // Find next unassigned student in this major's pool
        while (poolIdx < pool.length && assignedInPreview.has(pool[poolIdx].id)) {
          poolIdx++;
        }
        if (poolIdx >= pool.length) break;
        const student = pool[poolIdx++];
        previewTeams[teamIdx].members.push(student);
        assignedInPreview.add(student.id);
      }
    }

    // Step 2: Fill remaining seats until each team has 15
    // Sort: programs with most remaining come first
    const getRemaining = () => {
      const remaining: typeof unassignedStudents = [];
      for (const [, pool] of byMajor) {
        for (const s of pool) {
          if (!assignedInPreview.has(s.id)) remaining.push(s);
        }
      }
      // Sort by major frequency (desc)
      const majorCount = new Map<string, number>();
      for (const s of remaining) {
        majorCount.set(s.major, (majorCount.get(s.major) || 0) + 1);
      }
      remaining.sort((a, b) => (majorCount.get(b.major) || 0) - (majorCount.get(a.major) || 0));
      return remaining;
    };

    for (let teamIdx = 0; teamIdx < T; teamIdx++) {
      while (previewTeams[teamIdx].members.length < 15) {
        const remaining = getRemaining();
        if (remaining.length === 0) break;
        const student = remaining[0];
        if (!assignedInPreview.has(student.id) && previewTeams[teamIdx].members.length < 15) {
          previewTeams[teamIdx].members.push(student);
          assignedInPreview.add(student.id);
        } else {
          break;
        }
      }
    }

    // Build program composition summary
    const teamSummaries = previewTeams.map((team) => {
      const composition: Record<string, number> = {};
      for (const m of team.members) {
        composition[m.major] = (composition[m.major] || 0) + 1;
      }
      return {
        tempId: team.tempId,
        name: team.name,
        memberCount: team.members.length,
        members: team.members,
        programComposition: Object.entries(composition).map(([major, count]) => ({
          major,
          count,
        })),
      };
    });

    // Store generation run for audit
    const run = runRepo.create({
      programId: input.programId,
      generatedBy: adminUser.id,
      parameters: JSON.stringify({ programId: input.programId, teamSize: 15, totalUnassigned }),
      summary: JSON.stringify({
        teamCount: T,
        totalStudents: assignedInPreview.size,
        teams: teamSummaries,
      }),
    });
    const savedRun = await runRepo.save(run);

    // Build left-over students list
    const leftOverStudents = unassignedStudents.filter(s => !assignedInPreview.has(s.id));

    // Return preview as JSON string (client parses it)
    return JSON.stringify({
      runId: savedRun.id,
      teams: teamSummaries,
      unassignedStudents: leftOverStudents,
    });
  }

  @Mutation(() => [Team])
  async finalizeTeams(
    @Arg("input") input: FinalizeTeamsInput,
    @Ctx() ctx: Context
  ): Promise<Team[]> {
    requireAdminRole(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);
    const runRepo = AppDataSource.getRepository(TeamGenerationRun);

    const adminUser = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!adminUser || !checkIsAdmin(adminUser)) {
      throw new Error("Only admins can finalize team generation");
    }

    // Verify the run exists
    const run = await runRepo.findOne({ where: { id: input.runId } });
    if (!run) {
      throw new Error("Generation run not found. Please generate teams again.");
    }

    debugLog(`[TeamResolver] Finalizing ${input.teams.length} teams for program ${input.programId}`);
    
    const createdTeams: Team[] = [];

    for (const teamItem of input.teams) {
      if (teamItem.memberIds.length === 0) continue;

      // First member becomes the leader
      const leaderId = teamItem.memberIds[0];

      const members = await userRepo.find({
        where: { id: In(teamItem.memberIds) },
      });

      const team = teamRepo.create({
        programId: input.programId,
        name: teamItem.name,
        leaderId: leaderId,
        progress: 0,
        members: members,
        autoGenerated: true,
        generationRunId: input.runId,
        generatedBy: adminUser.id,
        generatedAt: new Date(),
      });

      const saved = await teamRepo.save(team);
      createdTeams.push(saved);
    }

    // Update run summary to mark as finalized
    run.summary = JSON.stringify({
      ...JSON.parse(run.summary || "{}"),
      finalizedAt: new Date().toISOString(),
      finalizedBy: adminUser.id,
      finalTeamCount: createdTeams.length,
    });
    await runRepo.save(run);

    return createdTeams;
  }
}

