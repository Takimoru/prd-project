import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new task
export const create = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    assignedMembers: v.array(v.id("users")),
    startTime: v.string(),
    endTime: v.string(),
    week: v.optional(v.string()),
    createdBy: v.id("users"),
    workProgramId: v.optional(v.id("work_programs")),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      teamId: args.teamId,
      title: args.title,
      description: args.description,
      assignedMembers: args.assignedMembers,
      startTime: args.startTime,
      endTime: args.endTime,
      week: args.week,
      createdBy: args.createdBy,
      createdAt: new Date().toISOString(),
      workProgramId: args.workProgramId,
      completed: false,
    });

    // Log activity
    await ctx.db.insert("activities", {
      teamId: args.teamId,
      userId: args.createdBy,
      action: "created_task",
      targetId: taskId,
      targetTitle: args.title,
      timestamp: new Date().toISOString(),
    });

    return taskId;
  },
});

// Update a task
export const update = mutation({
  args: {
    id: v.id("tasks"),
    userId: v.id("users"), // User performing the update
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    assignedMembers: v.optional(v.array(v.id("users"))),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    workProgramId: v.optional(v.id("work_programs")),
    completed: v.optional(v.boolean()),
    completionFiles: v.optional(v.array(v.string())), // Required when marking as complete
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args;
    
    const task = await ctx.db.get(id);
    if (!task) {
      throw new Error("Task not found");
    }

    // If marking as complete, require files and track completion metadata
    if (updates.completed === true && !task.completed) {
      if (!updates.completionFiles || updates.completionFiles.length === 0) {
        throw new Error("At least one file must be uploaded to complete the task");
      }
      
      // Add completion metadata
      await ctx.db.patch(id, {
        ...updates,
        completedAt: new Date().toISOString(),
        completedBy: userId,
      });

      // Log completion activity
      await ctx.db.insert("activities", {
        teamId: task.teamId,
        userId: userId,
        action: "completed_task",
        targetId: id,
        targetTitle: task.title,
        timestamp: new Date().toISOString(),
      });

      // Update work program progress if task is linked to one
      if (task.workProgramId) {
        await updateWorkProgramProgress(ctx, task.workProgramId);
      }
    } else {
      await ctx.db.patch(id, updates);
      
      // Log update activity (only if significant changes)
      // avoiding spam for minor things, but let's log it for now
      await ctx.db.insert("activities", {
        teamId: task.teamId,
        userId: userId,
        action: "updated_task",
        targetId: id,
        targetTitle: task.title,
        details: updates.description ? "Updated description" : "Updated task details",
        timestamp: new Date().toISOString(),
      });
    }
  },
});

// Helper function to calculate and update work program progress
async function updateWorkProgramProgress(ctx: any, workProgramId: any) {
  // Get all tasks for this work program
  const tasks = await ctx.db
    .query("tasks")
    .withIndex("by_work_program", (q: any) => q.eq("workProgramId", workProgramId))
    .collect();

  if (tasks.length === 0) return;

  // Calculate completion percentage
  const completedTasks = tasks.filter((t: any) => t.completed);
  const percentage = Math.round((completedTasks.length / tasks.length) * 100);

  // Get work program to find assigned members
  const workProgram = await ctx.db.get(workProgramId);
  if (!workProgram) return;

  // Update progress for each assigned member
  for (const memberId of workProgram.assignedMembers) {
    const existingProgress = await ctx.db
      .query("work_program_progress")
      .withIndex("by_work_program_member", (q: any) =>
        q.eq("workProgramId", workProgramId).eq("memberId", memberId)
      )
      .first();

    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, {
        percentage,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await ctx.db.insert("work_program_progress", {
        workProgramId,
        memberId,
        percentage,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

// Delete a task
export const remove = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Add a task update (notes, files, progress)
export const addUpdate = mutation({
  args: {
    taskId: v.id("tasks"),
    memberId: v.id("users"),
    notes: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    progress: v.optional(v.number()), // If linked to WP
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("task_updates", {
      taskId: args.taskId,
      memberId: args.memberId,
      notes: args.notes,
      attachments: args.attachments,
      progress: args.progress,
      updatedAt: new Date().toISOString(),
    });

    const task = await ctx.db.get(args.taskId);
    if (task) {
        await ctx.db.insert("activities", {
            teamId: task.teamId,
            userId: args.memberId,
            action: "updated_task",
            targetId: args.taskId,
            targetTitle: task.title,
            details: args.progress ? `Updated progress to ${args.progress}%` : "Added a note/file",
            timestamp: new Date().toISOString(),
        });
    }

    // If progress is provided and task is linked to WP, update WP progress
    if (args.progress !== undefined) {
      const task = await ctx.db.get(args.taskId);
      if (task && task.workProgramId) {
        // Check if WP progress entry exists
        const existingWPProgress = await ctx.db
          .query("work_program_progress")
          .withIndex("by_work_program_member", (q) =>
            q.eq("workProgramId", task.workProgramId!).eq("memberId", args.memberId)
          )
          .first();

        if (existingWPProgress) {
          await ctx.db.patch(existingWPProgress._id, {
            percentage: args.progress,
            updatedAt: new Date().toISOString(),
          });
        } else {
          await ctx.db.insert("work_program_progress", {
            workProgramId: task.workProgramId,
            memberId: args.memberId,
            percentage: args.progress,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  },
});

// Get tasks by team
export const getByTeam = query({
  args: {
    teamId: v.id("teams"),
    week: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    
    const filteredTasks = args.week 
      ? tasks.filter(t => t.week === args.week || t.startTime.startsWith(args.week!)) 
      : tasks;

    // Enrich with WP info
    return Promise.all(
      filteredTasks.map(async (task) => {
        const workProgram = task.workProgramId
          ? await ctx.db.get(task.workProgramId)
          : null;
        return { ...task, workProgram };
      })
    );
  },
});

// Get tasks by user (assigned)
export const getByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all teams where user is a member or supervisor
    const teams = await ctx.db.query("teams").collect();
    const userTeamIds = new Set(
      teams
        .filter(
          (t) =>
            t.memberIds.includes(args.userId) ||
            t.leaderId === args.userId ||
            t.supervisorId === args.userId
        )
        .map((t) => t._id)
    );

    const allTasks = await ctx.db.query("tasks").collect();
    
    // Return tasks that are directly assigned OR belong to a team the user is part of (including supervisor)
    const assignedTasks = allTasks.filter((task) =>
      task.assignedMembers.includes(args.userId) || userTeamIds.has(task.teamId)
    );

    // Enrich with WP info
    return Promise.all(
      assignedTasks.map(async (task) => {
        const workProgram = task.workProgramId
          ? await ctx.db.get(task.workProgramId)
          : null;
        return { ...task, workProgram };
      })
    );
  },
});

// Get updates for a task
export const getUpdates = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const updates = await ctx.db
      .query("task_updates")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Enrich with user info
    return Promise.all(
      updates.map(async (u) => {
        const user = await ctx.db.get(u.memberId);
        return { ...u, user };
      })
    );
  },
});

// Get all task updates (for Files Sidebar)
export const getAllUpdatesByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // This might be expensive if not indexed by user directly in updates
    // But we have by_member index on task_updates
    const updates = await ctx.db
      .query("task_updates")
      .withIndex("by_member", (q) => q.eq("memberId", args.userId))
      .collect();

    // Enrich with task info
    return Promise.all(
      updates.map(async (u) => {
        const task = await ctx.db.get(u.taskId);
        return { ...u, task };
      })
    );
  },
});

// Get task by ID
export const getById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return null;
    const workProgram = task.workProgramId
      ? await ctx.db.get(task.workProgramId)
      : null;
    return { ...task, workProgram };
  },
});
