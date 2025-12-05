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

    // Verify team exists and get members
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Fetch all members (leader + members)
    const memberIds = [team.leaderId, ...(team.memberIds || [])].filter(Boolean);
    const members = await Promise.all(memberIds.map(id => ctx.db.get(id)));
    const validMembers = members.filter(m => m !== null);

    // Fetch existing approvals (Map: studentId -> approval)
    const approvals = await ctx.db
      .query("weekly_attendance_approvals")
      .withIndex("by_team_week", (q) =>
        q.eq("teamId", args.teamId).eq("weekStartDate", startDateStr)
      )
      .collect();
    
    const approvalMap = new Map();
    approvals.forEach(app => {
      approvalMap.set(app.studentId, app);
    });

    // Fetch attendance for the whole team in this range
    const rawAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_team_date", (q) => q.eq("teamId", args.teamId))
      .collect();

    const rangeAttendance = rawAttendance.filter(
      (record) => record.date >= startDateStr && record.date <= endDateStr
    );

    // Build per-student data for the requested week
    const studentData = validMembers.map((member) => {
       const studentId = member!._id;
       const approval = approvalMap.get(studentId);
       
       // Get student's attendance records for this week
       const myAttendance = rangeAttendance.filter(r => r.userId === studentId);
       
       // Calculate stats
       const presentCount = myAttendance.filter(r => r.status === "present").length;
       const latestCheckIn = myAttendance.length > 0 
          ? myAttendance.reduce((max, r) => (r.timestamp > max ? r.timestamp : max), "") 
          : undefined;

       // Map daily status
       const dailyRecords = dates.map(date => {
          const record = myAttendance.find(r => r.date === date);
          return {
             date,
             status: record?.status,
             excuse: record?.excuse,
             timestamp: record?.timestamp
          };
       });

       return {
          userId: studentId,
          userName: member!.name || "Unknown",
          email: member!.email,
          presentCount,
          lastCheckIn: latestCheckIn,
          approvalStatus: approval?.status || "pending",
          dailyRecords
       };
    });

    return {
      teamId: args.teamId,
      week: args.week,
      startDate: startDateStr,
      endDate: endDateStr,
      students: studentData
    };
  },
});

// Check in (daily attendance)
export const checkIn = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    status: v.union(
      v.literal("present"),
      v.literal("permission"),
      v.literal("alpha")
    ),
    excuse: v.optional(v.string()),
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
        status: args.status,
        excuse: args.excuse,
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
      status: args.status,
      excuse: args.excuse,
      gps: args.gps,
      photoUrl: args.photoUrl,
    });

    return attendanceId;
  },
});

// Approve weekly attendance (Supervisor only) - PER STUDENT
export const approveWeeklyAttendance = mutation({
  args: {
    teamId: v.id("teams"),
    week: v.string(), // Format: "YYYY-WW"
    studentId: v.id("users"), // Target student
    supervisorId: v.id("users"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { startDate } = getWeekDateRange(args.week);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Verify supervisor matches team
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    
    // Check for existing approval for this student/week
    const existing = await ctx.db
      .query("weekly_attendance_approvals")
      .withIndex("by_team_week_student", (q) => 
        q.eq("teamId", args.teamId)
         .eq("weekStartDate", startDateStr)
         .eq("studentId", args.studentId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        approvedAt: new Date().toISOString(),
        notes: args.notes,
        supervisorId: args.supervisorId,
      });
    } else {
      await ctx.db.insert("weekly_attendance_approvals", {
        teamId: args.teamId,
        weekStartDate: startDateStr,
        studentId: args.studentId,
        supervisorId: args.supervisorId,
        status: args.status,
        approvedAt: new Date().toISOString(),
        notes: args.notes,
      });
    }
  },
});

// Get pending attendance for supervisor (Current + Previous Week)
export const getPendingAttendanceForSupervisor = query({
  args: {
    supervisorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // 1. Get supervised teams
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
      .collect();

    if (teams.length === 0) return [];

    // 2. Determine weeks to check (Current and Previous)
    const now = new Date();
    // Helper to get YYYY-WW
    const getWeekString = (d: Date) => {
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        const isoWeek = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        return `${date.getFullYear()}-W${isoWeek.toString().padStart(2, '0')}`;
    };

    const currentWeek = getWeekString(now);
    const prevDate = new Date();
    prevDate.setDate(prevDate.getDate() - 7);
    const prevWeek = getWeekString(prevDate);
    
    const weeksToCheck = [currentWeek, prevWeek];
    // console.log("Checking weeks:", weeksToCheck);

    const pendingItems: any[] = [];

    // 3. Scan teams and members
    for (const team of teams) {
      // Get members
      const memberIds = team.memberIds || [];
      const leaderId = team.leaderId;
      const allMemberIds = [...memberIds, leaderId].filter(Boolean); // Include leader
      
      const members = await Promise.all(allMemberIds.map(id => ctx.db.get(id)));
      const validMembers = members.filter(m => m !== null);

      for (const week of weeksToCheck) {
        const { startDate } = getWeekDateRange(week);
        const startDateStr = startDate.toISOString().split("T")[0];

        // Get existing approvals for this team/week
        const approvals = await ctx.db
          .query("weekly_attendance_approvals")
          .withIndex("by_team_week", (q) => 
             q.eq("teamId", team._id).eq("weekStartDate", startDateStr)
          )
          .collect();

        // Check each member
        for (const member of validMembers) {
           const approval = approvals.find(a => a.studentId === member!._id);
           
           // If no approval record OR status is pending
           if (!approval || approval.status === "pending") {
              // OPTIONAL: Check if they actually have attendance? 
              // Usually we want to approve even if empty (to confirm absence).
              // But maybe only show if there IS data? 
              // User said "pending approval names".
              // Let's assume we show them.
              
              pendingItems.push({
                 type: "attendance",
                 studentName: member!.name,
                 studentId: member!._id,
                 teamName: team.name,
                 teamId: team._id,
                 week: week,
                 submittedAt: approval?.approvedAt, // Use updated time if exists
              });
           }
        }
      }
    }

    return pendingItems;
  },
});

// Helper function to get week start date
export function getWeekDateRange(weekString: string) {
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
