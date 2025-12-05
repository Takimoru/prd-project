import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("supervisor"),
      v.literal("student"),
      v.literal("pending")
    ),
    studentId: v.optional(v.string()),
    nidn: v.optional(v.string()), // NIDN for supervisors
    googleId: v.string(),
    picture: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_google_id", ["googleId"]),

  programs: defineTable({
    title: v.string(),
    startDate: v.string(), // ISO date string
    endDate: v.string(), // ISO date string
    description: v.string(),
    archived: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_archived", ["archived"]),

  teams: defineTable({
    programId: v.id("programs"),
    leaderId: v.id("users"),
    memberIds: v.array(v.id("users")),
    supervisorId: v.optional(v.id("users")),
    name: v.optional(v.string()),
    progress: v.optional(v.number()), // 0-100
    documentation: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          type: v.string(),
          uploadedAt: v.string(),
        })
      )
    ),
  })
    .index("by_program", ["programId"])
    .index("by_leader", ["leaderId"])
    .index("by_supervisor", ["supervisorId"]),

  attendance: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    timestamp: v.string(), // ISO datetime string
    status: v.optional(
      v.union(
        v.literal("present"),
        v.literal("permission"),
        v.literal("alpha")
      )
    ),
    excuse: v.optional(v.string()),
    gps: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    photoUrl: v.optional(v.string()),
  })
    .index("by_team_date", ["teamId", "date"])
    .index("by_user_date", ["userId", "date"]),

  weeklyTasks: defineTable({
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    assignedTo: v.id("users"),
    completed: v.boolean(),
    week: v.string(), // Format: "YYYY-WW" (e.g., "2024-01")
    createdAt: v.string(), // ISO datetime string
  })
    .index("by_team_week", ["teamId", "week"])
    .index("by_assigned", ["assignedTo"]),

  weeklyReports: defineTable({
    teamId: v.id("teams"),
    week: v.string(), // Format: "YYYY-WW"
    taskIds: v.array(v.id("weeklyTasks")),
    progressPercentage: v.number(), // 0-100
    photos: v.array(v.string()), // Array of photo URLs
    description: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("approved"),
      v.literal("revision_requested")
    ),
    supervisorComments: v.array(
      v.object({
        comment: v.string(),
        commentedBy: v.id("users"),
        commentedAt: v.string(), // ISO datetime string
      })
    ),
    submittedAt: v.optional(v.string()), // ISO datetime string
  })
    .index("by_team_week", ["teamId", "week"])
    .index("by_status", ["status"]),

  registrations: defineTable({
    programId: v.id("programs"),
    userId: v.optional(v.id("users")),
    fullName: v.optional(v.string()),
    studentId: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    paymentProofStorageId: v.optional(v.id("_storage")),
    paymentProofUrl: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    submittedAt: v.string(), // ISO datetime string
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.string()), // ISO datetime string
    reviewNotes: v.optional(v.string()),
  })
    .index("by_program", ["programId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  // Work Programs
  work_programs: defineTable({
    teamId: v.id("teams"),
    title: v.string(),
    description: v.string(),
    startDate: v.string(), // ISO date string
    endDate: v.string(), // ISO date string
    assignedMembers: v.array(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.string(), // ISO datetime string
  })
    .index("by_team", ["teamId"]),

  work_program_progress: defineTable({
    workProgramId: v.id("work_programs"),
    memberId: v.id("users"),
    percentage: v.number(), // 0-100
    notes: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())), // Array of URLs
    updatedAt: v.string(), // ISO datetime string
  })
    .index("by_work_program", ["workProgramId"])
    .index("by_member", ["memberId"])
    .index("by_work_program_member", ["workProgramId", "memberId"]),

  // Tasks (Enhanced)
  tasks: defineTable({
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    assignedMembers: v.array(v.id("users")),
    startTime: v.string(), // ISO datetime string
    endTime: v.string(), // ISO datetime string
    week: v.optional(v.string()), // For backward compatibility
    createdBy: v.id("users"),
    createdAt: v.string(), // ISO datetime string
    workProgramId: v.optional(v.id("work_programs")), // Nullable
    completed: v.boolean(), // Keep for backward compatibility or quick status
    completionFiles: v.optional(v.array(v.string())), // URLs of files uploaded when completing task
    completedAt: v.optional(v.string()), // ISO datetime string when task was completed
    completedBy: v.optional(v.id("users")), // User who marked task as complete
  })
    .index("by_team", ["teamId"])
    .index("by_work_program", ["workProgramId"]),

  task_updates: defineTable({
    taskId: v.id("tasks"),
    memberId: v.id("users"),
    notes: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())), // Array of URLs
    updatedAt: v.string(), // ISO datetime string
    progress: v.optional(v.number()), // If linked to WP
  })
    .index("by_task", ["taskId"])
    .index("by_member", ["memberId"]),

  activities: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"), // Actor
    action: v.union(
      v.literal("created_task"),
      v.literal("updated_task"),
      v.literal("completed_task"),
      v.literal("created_program"),
      v.literal("uploaded_file")
    ),
    targetId: v.string(), // ID of the task/program/file
    targetTitle: v.string(), // Snapshot of title for easier display
    details: v.optional(v.string()),
    timestamp: v.string(), // ISO datetime string
  })
    .index("by_team", ["teamId"])
    .index("by_team_timestamp", ["teamId", "timestamp"]),

  weekly_attendance_approvals: defineTable({
    teamId: v.id("teams"),
    weekStartDate: v.string(), // ISO date string of Monday
    supervisorId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    approvedAt: v.optional(v.string()), // ISO datetime string
    notes: v.optional(v.string()),
  })
    .index("by_team_week", ["teamId", "weekStartDate"])
    .index("by_supervisor_status", ["supervisorId", "status"]),
});

