import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get attendance for a team on a specific date
export const getAttendanceByTeamDate = query({
  args: {
    teamId: v.id("teams"),
    date: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_team_date", (q) =>
        q.eq("teamId", args.teamId).eq("date", args.date)
      )
      .collect();
  },
});

// Get attendance for a user
export const getAttendanceByUser = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("attendance")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId));

    const records = await query.collect();

    if (args.startDate && args.endDate) {
      return records.filter(
        (record) => record.date >= args.startDate! && record.date <= args.endDate!
      );
    }

    return records;
  },
});

// Get weekly attendance summary for a team
export const getWeeklyAttendanceSummary = query({
  args: {
    teamId: v.id("teams"),
    week: v.string(), // Format: "YYYY-WW"
  },
  handler: async (ctx, args) => {
    // Calculate date range for the week
    const [year, weekNum] = args.week.split("-W").map(Number);
    const startDate = getWeekStartDate(year, weekNum);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const allAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_team_date", (q) => q.eq("teamId", args.teamId))
      .collect();

    return allAttendance.filter(
      (record) => record.date >= startDateStr && record.date <= endDateStr
    );
  },
});

// Check in (daily attendance)
export const checkIn = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    gps: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already checked in today
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Update existing check-in
      await ctx.db.patch(existing._id, {
        timestamp: new Date().toISOString(),
        gps: args.gps,
        photoUrl: args.photoUrl,
      });
      return existing._id;
    }

    // Create new check-in
    const attendanceId = await ctx.db.insert("attendance", {
      teamId: args.teamId,
      userId: args.userId,
      date: args.date,
      timestamp: new Date().toISOString(),
      gps: args.gps,
      photoUrl: args.photoUrl,
    });

    return attendanceId;
  },
});

// Helper function to get week start date
function getWeekStartDate(year: number, week: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart;
}

