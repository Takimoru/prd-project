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
    const { startDate, endDate, dates } = getWeekDateRange(args.week);
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const rawAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_team_date", (q) => q.eq("teamId", args.teamId))
      .collect();

    const filtered = rawAttendance.filter(
      (record) => record.date >= startDateStr && record.date <= endDateStr
    );

    const attendanceWithUsers = await Promise.all(
      filtered.map(async (record) => {
        const attendee = await ctx.db.get(record.userId);
        return {
          ...record,
          user: attendee,
        };
      })
    );

    const daily = dates.map((date) => ({
      date,
      attendees: attendanceWithUsers
        .filter((record) => record.date === date)
        .map((record) => ({
          userId: record.userId,
          userName: record.user?.name || "Unknown",
          timestamp: record.timestamp,
        })),
    }));

    const totalsMap = new Map<
      string,
      { userId: string; userName: string; presentCount: number; lastCheckIn?: string }
    >();

    attendanceWithUsers.forEach((record) => {
      const key = record.userId as unknown as string;
      if (!totalsMap.has(key)) {
        totalsMap.set(key, {
          userId: key,
          userName: record.user?.name || "Unknown",
          presentCount: 0,
          lastCheckIn: record.timestamp,
        });
      }
      const summary = totalsMap.get(key)!;
      summary.presentCount += 1;
      if (!summary.lastCheckIn || summary.lastCheckIn < record.timestamp) {
        summary.lastCheckIn = record.timestamp;
      }
    });

    return {
      teamId: args.teamId,
      week: args.week,
      startDate: startDateStr,
      endDate: endDateStr,
      daily,
      totals: Array.from(totalsMap.values()),
    };
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
function getWeekDateRange(weekString: string) {
  const [yearStr, weekPart] = weekString.split("-W");
  const year = Number(yearStr);
  const week = Number(weekPart);

  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const startDate = new Date(simple);
  if (dow <= 4) {
    startDate.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    startDate.setDate(simple.getDate() + 8 - simple.getDay());
  }

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    dates.push(current.toISOString().split("T")[0]);
  }

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return { startDate, endDate, dates };
}

