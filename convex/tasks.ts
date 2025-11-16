import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get tasks for a team in a specific week
export const getTasksByTeamWeek = query({
  args: {
    teamId: v.id("teams"),
    week: v.string(), // Format: "YYYY-WW"
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("weeklyTasks")
      .withIndex("by_team_week", (q) =>
        q.eq("teamId", args.teamId).eq("week", args.week)
      )
      .collect();

    // Enrich with assigned user data
    return Promise.all(
      tasks.map(async (task) => {
        const assignedUser = await ctx.db.get(task.assignedTo);
        return {
          ...task,
          assignedUser,
        };
      })
    );
  },
});

// Get tasks assigned to a user
export const getTasksByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("weeklyTasks")
      .withIndex("by_assigned", (q) => q.eq("assignedTo", args.userId))
      .collect();

    return tasks;
  },
});

// Create task (Team Leader only)
export const createTask = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    assignedTo: v.id("users"),
    week: v.string(), // Format: "YYYY-WW"
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("weeklyTasks", {
      teamId: args.teamId,
      title: args.title,
      description: args.description,
      assignedTo: args.assignedTo,
      completed: false,
      week: args.week,
      createdAt: new Date().toISOString(),
    });
    return taskId;
  },
});

// Update task
export const updateTask = mutation({
  args: {
    taskId: v.id("weeklyTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    await ctx.db.patch(taskId, updates);
  },
});

// Mark task as completed
export const completeTask = mutation({
  args: {
    taskId: v.id("weeklyTasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      completed: true,
    });
  },
});

// Delete task
export const deleteTask = mutation({
  args: {
    taskId: v.id("weeklyTasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});

