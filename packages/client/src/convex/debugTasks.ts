import { query } from "./_generated/server";
import { v } from "convex/values";

// Debug query to check all tasks
export const debugAllTasks = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks.map(t => ({
      _id: t._id,
      title: t.title,
      assignedMembers: t.assignedMembers,
      createdBy: t.createdBy,
      teamId: t.teamId,
    }));
  },
});

// Debug query to check user's teams
export const debugUserTeams = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const teams = await ctx.db.query("teams").collect();
    const userTeams = teams.filter(t => 
      t.memberIds.includes(args.userId) || t.leaderId === args.userId
    );
    return userTeams.map(t => ({
      _id: t._id,
      name: t.name,
      leaderId: t.leaderId,
      memberIds: t.memberIds,
    }));
  },
});
