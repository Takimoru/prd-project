# Student Role Migration: Convex Behavior Documentation

**Status:** Planning / Execution-ready  
**Owner:** Nico  
**Date:** 2024

---

## Purpose

This document reverse-engineers **all Convex behavior** for the Student role before implementing GraphQL equivalents. Per PRD Section 6, this is **mandatory** before writing any Express code.

---

## 1. Convex Schema → Database Mapping

### 1.1 Tables Overview

| Convex Table | Prisma Model | Notes |
|-------------|--------------|-------|
| `users` | `User` | ✅ Mapped |
| `programs` | `Program` | ✅ Mapped |
| `teams` | `Team` | ✅ Mapped |
| `attendance` | `Attendance` | ✅ Mapped |
| `tasks` | `Task` | ✅ Mapped |
| `task_updates` | `TaskUpdate` | ✅ Mapped |
| `weeklyReports` | `WeeklyReport` | ✅ Mapped |
| `work_programs` | `WorkProgram` | ✅ Mapped |
| `work_program_progress` | `WorkProgramProgress` | ✅ Mapped |
| `activities` | `Activity` | ✅ Mapped |
| `weekly_attendance_approvals` | `WeeklyAttendanceApproval` | ✅ Mapped |
| `registrations` | `Registration` | ✅ Mapped |

### 1.2 Schema Differences & Decisions Needed

#### ❓ **Decision 1: GPS Coordinates Format**

**Convex:**
```typescript
gps: v.optional(
  v.object({
    latitude: v.number(),
    longitude: v.number(),
  })
)
```

**Prisma:**
```prisma
lat Float?
long Float?
```

**Status:** ✅ Already mapped correctly (separate fields)

---

#### ❓ **Decision 2: Weekly Reports - Task Linkage**

**Convex:**
```typescript
taskIds: v.array(v.id("weeklyTasks"))
```

**Prisma:**
- No direct relation in schema
- Comment says: "Relation to tasks? Convex had taskIds array"

**Question:** How should we link WeeklyReport to Tasks?
- Option A: Many-to-Many join table (`WeeklyReportTask`)
- Option B: Store as JSON array in WeeklyReport
- Option C: Link from Task side (Task has `reportId`?)

**Recommendation:** Option A (join table) for proper relational integrity, but for MVP we can use Option B (JSON) to match Convex behavior exactly.

**Decision Needed:** ⚠️

---

#### ❓ **Decision 3: Task Completion Files**

**Convex:**
```typescript
completionFiles: v.optional(v.array(v.string())) // URLs
```

**Prisma:**
```prisma
completionFiles TaskFile[] @relation(...)
```

**Status:** ✅ Mapped correctly (separate table)

---

#### ❓ **Decision 4: Weekly Report Photos**

**Convex:**
```typescript
photos: v.array(v.string()) // Array of photo URLs
```

**Prisma:**
- Not in schema currently

**Question:** Should we:
- Option A: Add `photos Json?` field to WeeklyReport
- Option B: Create `WeeklyReportPhoto` table
- Option C: Store in `TaskFile` with relation

**Recommendation:** Option A (JSON) to match Convex exactly for MVP.

**Decision Needed:** ⚠️

---

#### ❓ **Decision 5: Team Documentation**

**Convex:**
```typescript
documentation: v.optional(
  v.array(
    v.object({
      name: v.string(),
      url: v.string(),
      type: v.string(),
      uploadedAt: v.string(),
    })
  )
)
```

**Prisma:**
```prisma
documentation Json?
```

**Status:** ✅ Mapped correctly (JSON field)

---

## 2. Convex Functions Inventory (Student Role)

### 2.1 Attendance Functions

#### ✅ `checkIn` (mutation)
**File:** `convex/attendance.ts:135`

**Auth:** Student (must be team member)

**Input:**
```typescript
{
  teamId: Id<"teams">,
  userId: Id<"users">,
  date: string, // YYYY-MM-DD
  status: "present" | "permission" | "alpha",
  excuse?: string,
  gps?: { latitude: number, longitude: number },
  photoUrl?: string
}
```

**Output:** `Id<"attendance">`

**Behavior:**
1. Checks if attendance already exists for user+date
2. If exists: **updates** existing record
3. If not: creates new record
4. Returns attendance ID

**Side Effects:**
- Creates/updates attendance record
- Updates timestamp to current time

**GraphQL Equivalent:** ✅ `checkIn` mutation exists
- **Location:** `packages/server/src/graphql/resolvers/attendance.resolver.ts`
- **Status:** ✅ Implemented

---

#### ✅ `getAttendanceByUser` (query)
**File:** `convex/attendance.ts:21`

**Auth:** Student (can only query own attendance)

**Input:**
```typescript
{
  userId: Id<"users">,
  startDate?: string, // YYYY-MM-DD
  endDate?: string    // YYYY-MM-DD
}
```

**Output:** `Array<Attendance>`

**Behavior:**
1. Queries attendance by user ID
2. If date range provided: filters by date
3. Returns all matching records

**GraphQL Equivalent:** ❌ **MISSING**
- **Needed:** Query `myAttendance(startDate: String, endDate: String): [Attendance!]!`
- **Note:** Frontend uses `me.attendance(startDate, endDate)` - need to check if this exists in User resolver

**Status:** ⚠️ **NEEDS IMPLEMENTATION**

---

#### ✅ `getAttendanceByTeamDate` (query)
**File:** `convex/attendance.ts:5`

**Auth:** Any authenticated user (team member/supervisor)

**Input:**
```typescript
{
  teamId: Id<"teams">,
  date: string // YYYY-MM-DD
}
```

**Output:** `Array<Attendance>`

**GraphQL Equivalent:** ✅ `attendanceByTeam` query exists
- **Location:** `packages/server/src/graphql/resolvers/attendance.resolver.ts:76`
- **Status:** ✅ Implemented

---

#### ✅ `getWeeklyAttendanceSummary` (query)
**File:** `convex/attendance.ts:45`

**Auth:** Any authenticated user

**Input:**
```typescript
{
  teamId: Id<"teams">,
  week: string // Format: "YYYY-WW"
}
```

**Output:**
```typescript
{
  teamId: string,
  week: string,
  startDate: string,
  endDate: string,
  dates: string[],
  students: Array<{
    userId: string,
    userName: string,
    email: string,
    presentCount: number,
    lastCheckIn?: string,
    approvalStatus: string,
    dailyRecords: Array<{
      date: string,
      status?: string,
      excuse?: string,
      timestamp?: string
    }>
  }>
}
```

**GraphQL Equivalent:** ✅ `weeklyAttendanceSummary` query exists
- **Location:** `packages/server/src/graphql/resolvers/attendance.resolver.ts:88`
- **Status:** ✅ Implemented

---

### 2.2 Task Functions

#### ✅ `tasks.getByTeam` (query)
**File:** `convex/tasks.ts:229`

**Auth:** Any authenticated user

**Input:**
```typescript
{
  teamId: Id<"teams">,
  week?: string // Optional filter
}
```

**Output:** `Array<Task & { workProgram?: WorkProgram }>`

**Behavior:**
1. Queries tasks by team
2. Optionally filters by week
3. Enriches with workProgram if linked

**GraphQL Equivalent:** ✅ `tasks(teamId: ID!): [Task!]!` exists
- **Location:** `packages/server/src/graphql/resolvers/task.resolver.ts:18`
- **Status:** ✅ Implemented

---

#### ✅ `tasks.getByUser` (query)
**File:** `convex/tasks.ts:257`

**Auth:** Student (can query own tasks)

**Input:**
```typescript
{
  userId: Id<"users">
}
```

**Output:** `Array<Task & { workProgram?: WorkProgram }>`

**Behavior:**
1. Gets all teams where user is member/leader/supervisor
2. Returns tasks assigned to user OR tasks from user's teams
3. Enriches with workProgram

**GraphQL Equivalent:** ✅ `tasksByUser` query exists
- **Location:** `packages/server/src/graphql/resolvers/task.resolver.ts:43`
- **Status:** ✅ Implemented

---

#### ✅ `tasks.getById` (query)
**File:** `convex/tasks.ts:339`

**Auth:** Any authenticated user

**Input:**
```typescript
{
  id: Id<"tasks">
}
```

**Output:** `Task & { workProgram?: WorkProgram } | null`

**GraphQL Equivalent:** ✅ `task(id: ID!): Task` exists
- **Location:** `packages/server/src/graphql/resolvers/task.resolver.ts:31`
- **Status:** ✅ Implemented

---

#### ✅ `tasks.getUpdates` (query)
**File:** `convex/tasks.ts:295`

**Auth:** Any authenticated user

**Input:**
```typescript
{
  taskId: Id<"tasks">
}
```

**Output:** `Array<TaskUpdate & { user: User }>`

**GraphQL Equivalent:** ✅ `taskUpdates(taskId: ID!): [TaskUpdate!]!` exists
- **Location:** `packages/server/src/schema.ts:185`
- **Status:** ✅ Implemented (need to verify resolver)

---

#### ✅ `tasks.addUpdate` (mutation)
**File:** `convex/tasks.ts:167`

**Auth:** Student (must be assigned to task or team member)

**Input:**
```typescript
{
  taskId: Id<"tasks">,
  memberId: Id<"users">,
  notes?: string,
  attachments?: string[], // URLs
  progress?: number // 0-100, if linked to WP
}
```

**Output:** `Id<"task_updates">`

**Behavior:**
1. Creates task update record
2. Logs activity
3. If progress provided AND task linked to WP: updates WP progress

**GraphQL Equivalent:** ✅ `addTaskUpdate` mutation exists
- **Location:** `packages/server/src/graphql/resolvers/task.resolver.ts:310`
- **Status:** ✅ Implemented
- **Note:** Missing `attachments` parameter - need to verify

---

#### ✅ `tasks.update` (mutation)
**File:** `convex/tasks.ts:47`

**Auth:** Student (must be assigned or team member)

**Input:**
```typescript
{
  id: Id<"tasks">,
  userId: Id<"users">,
  title?: string,
  description?: string,
  assignedMembers?: Id<"users">[],
  startTime?: string,
  endTime?: string,
  workProgramId?: Id<"work_programs">,
  completed?: boolean,
  completionFiles?: string[] // Required when marking complete
}
```

**Output:** `void`

**Behavior:**
1. If marking complete:
   - Requires `completionFiles` (at least 1)
   - Sets `completedAt`, `completedBy`
   - Logs completion activity
   - Updates WP progress if linked
2. Otherwise: updates fields, logs activity

**GraphQL Equivalent:** ✅ `updateTask` mutation exists
- **Location:** `packages/server/src/graphql/resolvers/task.resolver.ts:162`
- **Status:** ✅ Implemented

---

### 2.3 Work Program Functions

#### ✅ `workPrograms.getByTeam` (query)
**File:** `convex/workPrograms.ts:113`

**Auth:** Any authenticated user

**Input:**
```typescript
{
  teamId: Id<"teams">
}
```

**Output:** `Array<WorkProgram>`

**GraphQL Equivalent:** ✅ `workPrograms(teamId: ID!): [WorkProgram!]!` exists
- **Location:** `packages/server/src/graphql/resolvers/workProgram.resolver.ts:59`
- **Status:** ✅ Implemented

---

#### ✅ `workPrograms.getById` (query)
**File:** `convex/workPrograms.ts:126`

**Auth:** Any authenticated user

**Input:**
```typescript
{
  id: Id<"work_programs">
}
```

**Output:** `WorkProgram | null`

**GraphQL Equivalent:** ✅ `workProgram(id: ID!): WorkProgram` exists
- **Location:** `packages/server/src/graphql/resolvers/workProgram.resolver.ts:74`
- **Status:** ✅ Implemented

---

#### ✅ `workPrograms.getProgress` (query)
**File:** `convex/workPrograms.ts:174`

**Auth:** Any authenticated user

**Input:**
```typescript
{
  workProgramId: Id<"work_programs">
}
```

**Output:**
```typescript
Array<{
  ...WorkProgramProgress,
  user: User
}>
```

**GraphQL Equivalent:** ❌ **MISSING**
- **Needed:** Query `workProgramProgress(workProgramId: ID!): [WorkProgramProgress!]!`
- **Note:** Frontend uses `api.workPrograms.getProgress`

**Status:** ⚠️ **NEEDS IMPLEMENTATION**

---

#### ✅ `workPrograms.updateProgress` (mutation)
**File:** `convex/workPrograms.ts:136`

**Auth:** Student (must be assigned member)

**Input:**
```typescript
{
  workProgramId: Id<"work_programs">,
  memberId: Id<"users">,
  percentage: number, // 0-100
  notes?: string,
  attachments?: string[] // URLs
}
```

**Output:** `void`

**Behavior:**
1. Creates or updates progress entry
2. Updates `updatedAt` timestamp

**GraphQL Equivalent:** ❌ **MISSING**
- **Needed:** Mutation `updateWorkProgramProgress(workProgramId: ID!, percentage: Int!, notes: String, attachments: [String!]): WorkProgramProgress!`

**Status:** ⚠️ **NEEDS IMPLEMENTATION**

---

### 2.4 Activities / Timeline Functions

#### ✅ `activities.get` (query)
**File:** `convex/activities.ts:4`

**Auth:** Any authenticated user

**Input:**
```typescript
{
  teamId?: Id<"teams">
}
```

**Output:**
```typescript
Array<{
  ...Activity,
  userName: string,
  userPicture?: string
}>
```

**Behavior:**
1. Queries activities by team
2. Orders by timestamp DESC
3. Takes latest 10
4. Enriches with user name/picture

**GraphQL Equivalent:** ❌ **MISSING**
- **Needed:** Query `activities(teamId: ID!): [Activity!]!`
- **Note:** Frontend uses `api.activities.get` for timeline

**Status:** ⚠️ **NEEDS IMPLEMENTATION**

---

### 2.5 Weekly Report Functions

#### ✅ `reports.getWeeklyReport` (query)
**File:** `convex/reports.ts:5`

**Auth:** Any authenticated user

**Input:**
```typescript
{
  teamId: Id<"teams">,
  week: string // "YYYY-WW"
}
```

**Output:**
```typescript
{
  ...WeeklyReport,
  tasks: Task[],
  supervisorComments: Array<{
    ...Comment,
    commentedByUser: User
  }>
} | null
```

**GraphQL Equivalent:** ✅ `weeklyReport(teamId: ID!, week: String!): WeeklyReport` exists
- **Location:** `packages/server/src/graphql/resolvers/report.resolver.ts` (need to verify)
- **Status:** ✅ Implemented (need to verify)

---

#### ✅ `reports.getReportsByTeam` (query)
**File:** `convex/reports.ts:45`

**Auth:** Any authenticated user

**Input:**
```typescript
{
  teamId: Id<"teams">
}
```

**Output:** `Array<WeeklyReport>`

**GraphQL Equivalent:** ✅ `weeklyReports(teamId: ID!): [WeeklyReport!]!` exists
- **Location:** `packages/server/src/schema.ts:188`
- **Status:** ✅ Implemented (need to verify resolver)

---

#### ✅ `reports.createOrUpdateWeeklyReport` (mutation)
**File:** `convex/reports.ts:76`

**Auth:** Student (team member)

**Input:**
```typescript
{
  teamId: Id<"teams">,
  week: string,
  taskIds: Id<"weeklyTasks">[], // Note: Convex uses weeklyTasks, but we use tasks
  progressPercentage: number,
  photos: string[],
  description?: string,
  status?: "draft" | "submitted" | "approved" | "revision_requested"
}
```

**Output:** `Id<"weeklyReports">`

**Behavior:**
1. If report exists for team+week: updates
2. Otherwise: creates new
3. If status is "submitted": sets `submittedAt`

**GraphQL Equivalent:** ❌ **MISSING** (or partial)
- **Needed:** Mutation `createOrUpdateWeeklyReport(...)`
- **Note:** `submitWeeklyReport` exists but may not support create/update

**Status:** ⚠️ **NEEDS VERIFICATION**

---

#### ✅ `reports.submitWeeklyReport` (mutation)
**File:** `convex/reports.ts:136`

**Auth:** Student (team member)

**Input:**
```typescript
{
  reportId: Id<"weeklyReports">
}
```

**Output:** `void`

**Behavior:**
1. Updates status to "submitted"
2. Sets `submittedAt` timestamp

**GraphQL Equivalent:** ✅ `submitWeeklyReport` mutation exists
- **Location:** `packages/server/src/schema.ts:219`
- **Status:** ✅ Implemented (need to verify)

---

### 2.6 Final Report / Laporan Akhir

**PRD Requirement:** "Upload Laporan Akhir"

**Convex:** ❌ **NOT FOUND** in Convex functions

**Question:** Where is final report stored?
- Option A: In `Team.documentation` array
- Option B: Separate table (not in Convex schema)
- Option C: As a special WeeklyReport with status "final"

**Frontend Usage:** Need to check how frontend handles final report upload

**Status:** ⚠️ **NEEDS CLARIFICATION**

---

## 3. Frontend Dependency Map

### 3.1 Student Dashboard

**File:** `packages/client/src/pages/StudentDashboard.tsx`

**Convex Functions Used:**
- `api.programs.getAllPrograms` → GraphQL: `programs`
- `api.registrations.getUserRegistrations` → GraphQL: `me.registrations`
- `api.teams.getTeamsByLeader` / `getTeamsByMember` → GraphQL: `myTeams`
- `api.attendance.getAttendanceByUser` → GraphQL: `me.attendance` (need to verify)

**Status:** ⚠️ **NEEDS FRONTEND MIGRATION**

---

### 3.2 Attendance Pages

**Files:**
- `packages/client/src/pages/student/components/teams/MyTeams.tsx`
- `packages/client/src/pages/student/components/dashboard/DashboardOverview.tsx`

**Convex Functions Used:**
- `api.attendance.checkIn` → GraphQL: ✅ `checkIn` mutation
- `api.attendance.getAttendanceByUser` → GraphQL: ❌ Missing

**Status:** ⚠️ **PARTIAL**

---

### 3.3 Tasks Pages

**Files:**
- `packages/client/src/pages/student/TasksPage.tsx`
- `packages/client/src/pages/student/components/tasks/TaskDetailModal.tsx`

**Convex Functions Used:**
- `api.tasks.getByTeam` → GraphQL: ✅ `tasks(teamId)`
- `api.tasks.getByUser` → GraphQL: ✅ `tasksByUser`
- `api.tasks.getById` → GraphQL: ✅ `task(id)`
- `api.tasks.getUpdates` → GraphQL: ✅ `taskUpdates(taskId)`
- `api.tasks.addUpdate` → GraphQL: ✅ `addTaskUpdate`
- `api.tasks.update` → GraphQL: ✅ `updateTask`

**Status:** ✅ **COMPLETE**

---

### 3.4 Work Programs Pages

**Files:**
- `packages/client/src/pages/student/components/work-programs/WorkProgramList.tsx`
- `packages/client/src/pages/student/components/work-programs/WorkProgramDetail.tsx`

**Convex Functions Used:**
- `api.workPrograms.getByTeam` → GraphQL: ✅ `workPrograms(teamId)`
- `api.workPrograms.getById` → GraphQL: ✅ `workProgram(id)`
- `api.workPrograms.getProgress` → GraphQL: ❌ Missing
- `api.workPrograms.updateProgress` → GraphQL: ❌ Missing
- `api.tasks.getByTeam` → GraphQL: ✅ `tasks(teamId)`

**Status:** ⚠️ **PARTIAL** (missing progress queries)

---

### 3.5 Files Page

**File:** `packages/client/src/pages/student/FilesPage.tsx`

**Convex Functions Used:**
- `api.tasks.getByTeam` → GraphQL: ✅ `tasks(teamId)`
- Reads `task.completionFiles` → GraphQL: ✅ `task.completionFiles`

**Status:** ✅ **COMPLETE**

---

### 3.6 Timeline / Activities

**File:** `packages/client/src/pages/student/components/dashboard/RecentActivity.tsx`

**Convex Functions Used:**
- `api.activities.get` → GraphQL: ❌ Missing

**Status:** ⚠️ **NEEDS IMPLEMENTATION**

---

## 4. Missing GraphQL Implementations

### 4.1 High Priority (Blocks Student Workflow)

1. ❌ **`myAttendance` query** (or `me.attendance` field)
   - Used in: Dashboard, Attendance pages
   - Impact: Students can't view their own attendance history

2. ❌ **`activities` query**
   - Used in: Timeline/Recent Activity component
   - Impact: Timeline doesn't work

3. ❌ **`workProgramProgress` query**
   - Used in: Work Program detail page
   - Impact: Can't view progress for work programs

4. ❌ **`updateWorkProgramProgress` mutation**
   - Used in: Work Program detail page
   - Impact: Can't update progress

---

### 4.2 Medium Priority (Feature Gaps)

5. ⚠️ **`createOrUpdateWeeklyReport` mutation**
   - Need to verify if `submitWeeklyReport` supports create/update
   - Impact: May not be able to create draft reports

6. ⚠️ **WeeklyReport photos field**
   - Schema decision needed
   - Impact: Photos may not be stored

7. ⚠️ **Final Report upload**
   - Clarification needed on storage location
   - Impact: Final report feature incomplete

---

## 5. Schema Decisions Required

### Decision 1: WeeklyReport Task Linkage ⚠️
**Question:** How to link WeeklyReport to Tasks?
- **Recommendation:** Use JSON array for MVP (match Convex), migrate to join table later

### Decision 2: WeeklyReport Photos ⚠️
**Question:** How to store photos?
- **Recommendation:** Add `photos Json?` field to WeeklyReport

### Decision 3: Final Report Storage ⚠️
**Question:** Where are final reports stored?
- **Recommendation:** Use `Team.documentation` array with type="final_report"

---

## 6. Next Steps

1. ✅ **Documentation Complete** (this file)
2. ⏳ **Get user decisions** on schema ambiguities
3. ⏳ **Implement missing queries:**
   - `myAttendance` / `me.attendance`
   - `activities(teamId)`
   - `workProgramProgress(workProgramId)`
4. ⏳ **Implement missing mutations:**
   - `updateWorkProgramProgress`
5. ⏳ **Verify existing resolvers** match Convex behavior exactly
6. ⏳ **Update GraphQL schema** with missing types
7. ⏳ **Test parity** between Convex and GraphQL responses

---

## 7. Testing Checklist

For each function, verify:
- [ ] Input validation matches Convex
- [ ] Output shape matches Convex exactly
- [ ] Auth checks match Convex
- [ ] Side effects match Convex (activity logging, etc.)
- [ ] Error messages match Convex
- [ ] Edge cases handled (duplicate check-ins, etc.)

---

**End of Documentation**

