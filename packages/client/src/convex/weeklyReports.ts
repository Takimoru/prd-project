import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get weekly reports for a specific team
export const getWeeklyReportsByTeam = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("weeklyReports")
      .withIndex("by_team_week", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Enrich with team data
    const team = await ctx.db.get(args.teamId);
    
    return reports.map(report => ({
      ...report,
      team,
    }));
  },
});

// Get weekly report for specific team and week
export const getWeeklyReportByWeek = query({
  args: {
    teamId: v.id("teams"),
    week: v.string(),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db
      .query("weeklyReports")
      .withIndex("by_team_week", (q) => 
        q.eq("teamId", args.teamId).eq("week", args.week)
      )
      .first();

    if (!report) return null;

    // Get team data
    const team = await ctx.db.get(args.teamId);
    
    // Get task details
    const tasks = await Promise.all(
      report.taskIds.map(taskId => ctx.db.get(taskId))
    );

    // Get team members for progress tracking
    const members = team ? await Promise.all(
      team.memberIds.map(async (memberId) => {
        const user = await ctx.db.get(memberId);
        const memberTasks = tasks.filter(t => t?.assignedTo === memberId);
        return {
          user,
          tasks: memberTasks,
          completedTasks: memberTasks.filter(t => t?.completed).length,
          totalTasks: memberTasks.length,
        };
      })
    ) : [];

    return {
      ...report,
      team,
      tasks: tasks.filter(Boolean),
      members,
    };
  },
});

// Get all pending reports for supervisor
export const getPendingReportsForSupervisor = query({
  args: {
    supervisorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get teams supervised by this supervisor
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
      .collect();

    const teamIds = teams.map(t => t._id);

    // Get all reports for these teams
    const allReports = await ctx.db.query("weeklyReports").collect();
    const supervisorReports = allReports.filter(
      report => teamIds.includes(report.teamId) && report.status === "submitted"
    );

    // Enrich with team data
    return Promise.all(
      supervisorReports.map(async (report) => {
        const team = await ctx.db.get(report.teamId);
        const leader = team ? await ctx.db.get(team.leaderId) : null;
        return {
          ...report,
          team,
          leader,
        };
      })
    );
  },
});

// Get all reports for supervisor (all statuses)
export const getAllReportsForSupervisor = query({
  args: {
    supervisorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get teams supervised by this supervisor
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
      .collect();

    const teamIds = teams.map(t => t._id);

    // Get all reports for these teams
    const allReports = await ctx.db.query("weeklyReports").collect();
    const supervisorReports = allReports.filter(
      report => teamIds.includes(report.teamId)
    );

    // Enrich with team data
    return Promise.all(
      supervisorReports.map(async (report) => {
        const team = await ctx.db.get(report.teamId);
        const leader = team ? await ctx.db.get(team.leaderId) : null;
        return {
          ...report,
          team,
          leader,
        };
      })
    );
  },
});

// Approve weekly report
export const approveWeeklyReport = mutation({
  args: {
    reportId: v.id("weeklyReports"),
    supervisorId: v.id("users"),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    // Verify supervisor owns this team
    const team = await ctx.db.get(report.teamId);
    if (!team || team.supervisorId !== args.supervisorId) {
      throw new Error("Unauthorized: You are not the supervisor of this team");
    }

    // Add comment if provided
    const comments = args.comment
      ? [
          ...report.supervisorComments,
          {
            comment: args.comment,
            commentedBy: args.supervisorId,
            commentedAt: new Date().toISOString(),
          },
        ]
      : report.supervisorComments;

    await ctx.db.patch(args.reportId, {
      status: "approved",
      supervisorComments: comments,
    });

    return { success: true };
  },
});

// Request revision for weekly report
export const requestRevision = mutation({
  args: {
    reportId: v.id("weeklyReports"),
    supervisorId: v.id("users"),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    // Verify supervisor owns this team
    const team = await ctx.db.get(report.teamId);
    if (!team || team.supervisorId !== args.supervisorId) {
      throw new Error("Unauthorized: You are not the supervisor of this team");
    }

    // Add comment
    const comments = [
      ...report.supervisorComments,
      {
        comment: args.comment,
        commentedBy: args.supervisorId,
        commentedAt: new Date().toISOString(),
      },
    ];

    await ctx.db.patch(args.reportId, {
      status: "revision_requested",
      supervisorComments: comments,
    });

    return { success: true };
  },
});

// Add supervisor feedback without changing status
export const addSupervisorFeedback = mutation({
  args: {
    reportId: v.id("weeklyReports"),
    supervisorId: v.id("users"),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    // Verify supervisor owns this team
    const team = await ctx.db.get(report.teamId);
    if (!team || team.supervisorId !== args.supervisorId) {
      throw new Error("Unauthorized: You are not the supervisor of this team");
    }

    // Add comment
    const comments = [
      ...report.supervisorComments,
      {
        comment: args.comment,
        commentedBy: args.supervisorId,
        commentedAt: new Date().toISOString(),
      },
    ];

    await ctx.db.patch(args.reportId, {
      supervisorComments: comments,
    });

    return { success: true };
  },
});
