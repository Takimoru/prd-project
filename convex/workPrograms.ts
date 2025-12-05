import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new work program
export const create = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    description: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    assignedMembers: v.array(v.id("users")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify team leadership using the provided createdBy ID
    // This relies on the frontend passing the correct ID, which matches the app's current security model
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if the user is the leader of the team
    if (team.leaderId !== args.createdBy) {
       // Double check if the user is actually the leader (in case args.createdBy is just a member)
       // But args.createdBy IS the user trying to create it.
       throw new Error("Only the team leader can create work programs");
    }

    const workProgramId = await ctx.db.insert("work_programs", {
      teamId: args.teamId,
      title: args.title,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      assignedMembers: args.assignedMembers,
      createdBy: args.createdBy,
      createdAt: new Date().toISOString(),
    });

    // Log activity
    await ctx.db.insert("activities", {
      teamId: args.teamId,
      userId: args.createdBy,
      action: "created_program",
      targetId: workProgramId,
      targetTitle: args.title,
      timestamp: new Date().toISOString(),
    });

    return workProgramId;
  },
});

// Update a work program
export const update = mutation({
  args: {
    id: v.id("work_programs"),
    userId: v.id("users"), // Add userId for permission check
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    assignedMembers: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args;

    const workProgram = await ctx.db.get(id);
    if (!workProgram) {
      throw new Error("Work program not found");
    }

    const team = await ctx.db.get(workProgram.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    if (team.leaderId !== userId) {
      throw new Error("Only the team leader can update work programs");
    }

    await ctx.db.patch(id, updates);
  },
});

// Delete a work program
export const remove = mutation({
  args: {
    id: v.id("work_programs"),
    userId: v.id("users"), // Add userId for permission check
  },
  handler: async (ctx, args) => {
    const workProgram = await ctx.db.get(args.id);
    if (!workProgram) {
      throw new Error("Work program not found");
    }

    const team = await ctx.db.get(workProgram.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    if (team.leaderId !== args.userId) {
      throw new Error("Only the team leader can delete work programs");
    }

    await ctx.db.delete(args.id);
  },
});

// Get work programs by team
export const getByTeam = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("work_programs")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
  },
});

// Get work program by ID
export const getById = query({
  args: {
    id: v.id("work_programs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update progress for a work program
export const updateProgress = mutation({
  args: {
    workProgramId: v.id("work_programs"),
    memberId: v.id("users"),
    percentage: v.number(),
    notes: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if progress entry exists
    const existing = await ctx.db
      .query("work_program_progress")
      .withIndex("by_work_program_member", (q) =>
        q.eq("workProgramId", args.workProgramId).eq("memberId", args.memberId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        percentage: args.percentage,
        notes: args.notes,
        attachments: args.attachments,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await ctx.db.insert("work_program_progress", {
        workProgramId: args.workProgramId,
        memberId: args.memberId,
        percentage: args.percentage,
        notes: args.notes,
        attachments: args.attachments,
        updatedAt: new Date().toISOString(),
      });
    }
  },
});

// Get progress for a work program
export const getProgress = query({
  args: {
    workProgramId: v.id("work_programs"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("work_program_progress")
      .withIndex("by_work_program", (q) => q.eq("workProgramId", args.workProgramId))
      .collect();
    
    // Enrich with user info
    return Promise.all(
      progress.map(async (p) => {
        const user = await ctx.db.get(p.memberId);
        return { ...p, user };
      })
    );
  },
});
// Get all work programs for a supervisor with progress
export const getWorkProgramsBySupervisor = query({
  args: {
    supervisorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // 1. Get teams supervised by this user
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
      .collect();

    const teamIds = teams.map(t => t._id);

    // 2. Get work programs for these teams
    // Since we can't do "in" query easily, we fetch all wps and filter (or loop teams if few)
    // Better to loop teams since supervisor usually has few teams.
    const allPrograms = await Promise.all(
      teamIds.map(async (teamId) => {
        const programs = await ctx.db
          .query("work_programs")
          .withIndex("by_team", (q) => q.eq("teamId", teamId))
          .collect();
        return programs;
      })
    );
    const flatPrograms = allPrograms.flat();

    // 3. Calculate progress for each program
    return Promise.all(
        flatPrograms.map(async (program) => {
            const team = teams.find(t => t._id === program.teamId);
            
            // Get progress entries for this program
            const progressEntries = await ctx.db
                .query("work_program_progress")
                .withIndex("by_work_program", (q) => q.eq("workProgramId", program._id))
                .collect();
            
            // Calculate average percentage
            // If no entries, it's 0.
            // Or should it be based on assigned members? 
            // Let's stick to simple average of reported progress for now.
            let totalProgress = 0;
            if (progressEntries.length > 0) {
                totalProgress = progressEntries.reduce((sum, p) => sum + p.percentage, 0) / progressEntries.length;
            }

            return {
                ...program,
                teamName: team?.name || "Unknown Team",
                progress: Math.round(totalProgress)
            };
        })
    );
  },
});
