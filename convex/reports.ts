import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get weekly report for a team
export const getWeeklyReport = query({
  args: {
    teamId: v.id("teams"),
    week: v.string(), // Format: "YYYY-WW"
  },
  handler: async (ctx, args) => {
    const report = await ctx.db
      .query("weeklyReports")
      .withIndex("by_team_week", (q) =>
        q.eq("teamId", args.teamId).eq("week", args.week)
      )
      .first();

    if (!report) return null;

    // Enrich with task data
    const tasks = await Promise.all(
      report.taskIds.map((id) => ctx.db.get(id))
    );

    // Enrich comments with user data
    const enrichedComments = await Promise.all(
      report.supervisorComments.map(async (comment) => {
        const user = await ctx.db.get(comment.commentedBy);
        return {
          ...comment,
          commentedByUser: user,
        };
      })
    );

    return {
      ...report,
      tasks,
      supervisorComments: enrichedComments,
    };
  },
});

// Get all reports for a team
export const getReportsByTeam = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyReports")
      .withIndex("by_team_week", (q) => q.eq("teamId", args.teamId))
      .collect();
  },
});

// Get reports by status (for supervisor)
export const getReportsByStatus = query({
  args: {
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("approved"),
      v.literal("revision_requested")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyReports")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Create or update weekly report
export const createOrUpdateWeeklyReport = mutation({
  args: {
    teamId: v.id("teams"),
    week: v.string(),
    taskIds: v.array(v.id("weeklyTasks")),
    progressPercentage: v.number(),
    photos: v.array(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("submitted"),
        v.literal("approved"),
        v.literal("revision_requested")
      )
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weeklyReports")
      .withIndex("by_team_week", (q) =>
        q.eq("teamId", args.teamId).eq("week", args.week)
      )
      .first();

    if (existing) {
      // Update existing report
      await ctx.db.patch(existing._id, {
        taskIds: args.taskIds,
        progressPercentage: args.progressPercentage,
        photos: args.photos,
        description: args.description,
        status: args.status || existing.status,
        submittedAt:
          args.status === "submitted"
            ? new Date().toISOString()
            : existing.submittedAt,
      });
      return existing._id;
    }

    // Create new report
    const reportId = await ctx.db.insert("weeklyReports", {
      teamId: args.teamId,
      week: args.week,
      taskIds: args.taskIds,
      progressPercentage: args.progressPercentage,
      photos: args.photos,
      description: args.description,
      status: args.status || "draft",
      supervisorComments: [],
      submittedAt:
        args.status === "submitted" ? new Date().toISOString() : undefined,
    });

    return reportId;
  },
});

// Submit weekly report
export const submitWeeklyReport = mutation({
  args: {
    reportId: v.id("weeklyReports"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      status: "submitted",
      submittedAt: new Date().toISOString(),
    });
  },
});

// Add supervisor comment
export const addSupervisorComment = mutation({
  args: {
    reportId: v.id("weeklyReports"),
    comment: v.string(),
    supervisorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    await ctx.db.patch(args.reportId, {
      supervisorComments: [
        ...report.supervisorComments,
        {
          comment: args.comment,
          commentedBy: args.supervisorId,
          commentedAt: new Date().toISOString(),
        },
      ],
      status: "revision_requested",
    });
  },
});

// Approve report
export const approveReport = mutation({
  args: {
    reportId: v.id("weeklyReports"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      status: "approved",
    });
  },
});

