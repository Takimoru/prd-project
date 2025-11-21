import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkIsAdmin } from "./auth";

// Get all teams for a program
export const getTeamsByProgram = query({
  args: {
    programId: v.id("programs"),
  },
  handler: async (ctx, args) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();

    // Enrich with user data
    return Promise.all(
      teams.map(async (team) => {
        const leader = await ctx.db.get(team.leaderId);
        const members = await Promise.all(
          team.memberIds.map((id) => ctx.db.get(id))
        );
        const supervisor = team.supervisorId
          ? await ctx.db.get(team.supervisorId)
          : null;

        return {
          ...team,
          leader,
          members,
          supervisor,
        };
      })
    );
  },
});

// Get team by ID
export const getTeamById = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const leader = await ctx.db.get(team.leaderId);
    const members = await Promise.all(
      team.memberIds.map((id) => ctx.db.get(id))
    );
    const supervisor = team.supervisorId
      ? await ctx.db.get(team.supervisorId)
      : null;

    return {
      ...team,
      leader,
      members,
      supervisor,
    };
  },
});

// Get teams by supervisor
export const getTeamsBySupervisor = query({
  args: {
    supervisorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teams")
      .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
      .collect();
  },
});

// Get teams by leader
export const getTeamsByLeader = query({
  args: {
    leaderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teams")
      .withIndex("by_leader", (q) => q.eq("leaderId", args.leaderId))
      .collect();
  },
});

export const getTeamsForUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const teamsByLeader = await ctx.db
      .query("teams")
      .withIndex("by_leader", (q) => q.eq("leaderId", args.userId))
      .collect();

    const allTeams = await ctx.db.query("teams").collect();
    const memberTeams = allTeams.filter((team) =>
      team.memberIds.includes(args.userId)
    );

    const combined = new Map<string, typeof allTeams[number]>();
    teamsByLeader.forEach((team) =>
      combined.set(team._id as unknown as string, team)
    );
    memberTeams.forEach((team) =>
      combined.set(team._id as unknown as string, team)
    );

    const teams = Array.from(combined.values());

    return Promise.all(
      teams.map(async (team) => {
        const leader = await ctx.db.get(team.leaderId);
        const members = await Promise.all(
          team.memberIds.map((id) => ctx.db.get(id))
        );
        const supervisor = team.supervisorId
          ? await ctx.db.get(team.supervisorId)
          : null;
        const program = await ctx.db.get(team.programId);

        return {
          ...team,
          leader,
          members,
          supervisor,
          program,
        };
      })
    );
  },
});

// Create team (Admin only)
export const createTeam = mutation({
  args: {
    programId: v.id("programs"),
    leaderId: v.id("users"),
    memberIds: v.array(v.id("users")),
    supervisorId: v.optional(v.id("users")),
    name: v.optional(v.string()),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!checkIsAdmin(admin)) {
      throw new Error("Only admins can create teams");
    }

    const { adminId, ...teamData } = args;
    const teamId = await ctx.db.insert("teams", {
      programId: teamData.programId,
      leaderId: teamData.leaderId,
      memberIds: teamData.memberIds,
      supervisorId: teamData.supervisorId,
      name: teamData.name,
    });
    return teamId;
  },
});

// Assign supervisor to team (Admin only)
export const assignSupervisor = mutation({
  args: {
    teamId: v.id("teams"),
    supervisorId: v.id("users"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!checkIsAdmin(admin)) {
      throw new Error("Only admins can assign supervisors");
    }

    await ctx.db.patch(args.teamId, {
      supervisorId: args.supervisorId,
    });
  },
});

// Add member to team
export const addMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    if (!team.memberIds.includes(args.userId)) {
      await ctx.db.patch(args.teamId, {
        memberIds: [...team.memberIds, args.userId],
      });
    }
  },
});

// Remove member from team
export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    await ctx.db.patch(args.teamId, {
      memberIds: team.memberIds.filter((id) => id !== args.userId),
    });
  },
});

