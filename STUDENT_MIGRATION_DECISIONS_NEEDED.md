# Student Migration: Decisions Needed

**Status:** ⚠️ **BLOCKING** - Need your input before proceeding

---

## 🔴 Critical Decisions (Required for Migration)

### 1. WeeklyReport Task Linkage

**Problem:**
- Convex stores: `taskIds: v.array(v.id("weeklyTasks"))`
- Prisma schema has no relation defined
- Comment in schema says: "Relation to tasks? Convex had taskIds array"

**Options:**
- **Option A:** Add `taskIds Json?` field to WeeklyReport (store as JSON array)
  - ✅ Matches Convex exactly
  - ✅ Fast to implement
  - ❌ Not relational (can't query/join)
  
- **Option B:** Create join table `WeeklyReportTask`
  - ✅ Proper relational design
  - ✅ Can query/join efficiently
  - ❌ More complex, different from Convex

- **Option C:** Link from Task side (Task has `reportId`?)
  - ❌ One task can only be in one report (limiting)

**Recommendation:** **Option A** for MVP (match Convex exactly), migrate to Option B later if needed.

**Your Decision:** ⚠️ **NEEDED**

---

### 2. WeeklyReport Photos Storage

**Problem:**
- Convex stores: `photos: v.array(v.string())` (array of URLs)
- Prisma schema has no field for photos

**Options:**
- **Option A:** Add `photos Json?` field to WeeklyReport
  - ✅ Matches Convex exactly
  - ✅ Simple
  
- **Option B:** Create `WeeklyReportPhoto` table
  - ✅ More structured
  - ❌ Different from Convex

**Recommendation:** **Option A** (JSON field)

**Your Decision:** ⚠️ **NEEDED**

---

### 3. Final Report (Laporan Akhir) Storage

**Problem:**
- PRD requires: "Upload Laporan Akhir"
- Not found in Convex functions
- Need to determine storage location

**Options:**
- **Option A:** Store in `Team.documentation` array with `type: "final_report"`
  - ✅ Uses existing structure
  - ✅ Matches Convex pattern
  
- **Option B:** Create separate `FinalReport` table
  - ✅ More structured
  - ❌ Not in Convex schema

- **Option C:** Special WeeklyReport with status "final"
  - ❌ Mixes concepts

**Recommendation:** **Option A** (use Team.documentation)

**Your Decision:** ⚠️ **NEEDED**

---

### 4. User.attendance Field Resolver

**Problem:**
- Frontend uses: `me.attendance(startDate, endDate)`
- GraphQL schema defines: `attendance(startDate: String, endDate: String): [Attendance!]!` on User type
- But User resolver doesn't implement this field resolver

**Options:**
- **Option A:** Add field resolver to UserResolver
  - ✅ Matches schema
  - ✅ Matches frontend usage
  
- **Option B:** Create separate `myAttendance` query
  - ❌ Different from frontend expectation

**Recommendation:** **Option A** (add field resolver)

**Your Decision:** ⚠️ **NEEDED** (or confirm Option A is fine)

---

## 🟡 Missing Implementations (Need to Build)

### 1. Activities/Timeline Query

**Status:** ❌ **MISSING**

**Needed:**
```graphql
query {
  activities(teamId: ID!): [Activity!]!
}
```

**Convex Equivalent:** `api.activities.get`

**Impact:** Timeline/Recent Activity component won't work

**Priority:** High (blocks student workflow)

---

### 2. Work Program Progress Query

**Status:** ❌ **MISSING**

**Needed:**
```graphql
query {
  workProgramProgress(workProgramId: ID!): [WorkProgramProgress!]!
}
```

**Convex Equivalent:** `api.workPrograms.getProgress`

**Impact:** Can't view progress in Work Program detail page

**Priority:** High (blocks student workflow)

---

### 3. Update Work Program Progress Mutation

**Status:** ❌ **MISSING**

**Needed:**
```graphql
mutation {
  updateWorkProgramProgress(
    workProgramId: ID!
    percentage: Int!
    notes: String
    attachments: [String!]
  ): WorkProgramProgress!
}
```

**Convex Equivalent:** `api.workPrograms.updateProgress`

**Impact:** Can't update progress

**Priority:** High (blocks student workflow)

---

### 4. User.attendance Field Resolver

**Status:** ❌ **MISSING**

**Needed:** Field resolver on User type:
```typescript
@FieldResolver(() => [Attendance])
async attendance(
  @Root() user: User,
  @Arg('startDate', { nullable: true }) startDate?: string,
  @Arg('endDate', { nullable: true }) endDate?: string,
): Promise<Attendance[]>
```

**Convex Equivalent:** `api.attendance.getAttendanceByUser`

**Impact:** Dashboard can't show student's attendance

**Priority:** High (blocks student workflow)

---

### 5. Create/Update Weekly Report Mutation

**Status:** ⚠️ **NEEDS VERIFICATION**

**Current:** `submitWeeklyReport` exists, but may not support create/update

**Needed:** Verify if mutation supports:
- Creating new draft report
- Updating existing report
- Or need separate `createOrUpdateWeeklyReport` mutation

**Convex Equivalent:** `api.reports.createOrUpdateWeeklyReport`

**Priority:** Medium

---

## 📋 Implementation Checklist

Once decisions are made, implement in this order:

### Phase 1: Schema Updates
- [ ] Add `taskIds Json?` to WeeklyReport (if Option A chosen)
- [ ] Add `photos Json?` to WeeklyReport (if Option A chosen)
- [ ] Add Activity type to GraphQL schema (if not exists)
- [ ] Add WorkProgramProgress type to GraphQL schema (if not exists)

### Phase 2: Resolvers
- [ ] Add `activities` query resolver
- [ ] Add `workProgramProgress` query resolver
- [ ] Add `updateWorkProgramProgress` mutation resolver
- [ ] Add `User.attendance` field resolver
- [ ] Verify/implement `createOrUpdateWeeklyReport` mutation

### Phase 3: Testing
- [ ] Test each resolver matches Convex behavior
- [ ] Test frontend integration
- [ ] Verify response shapes match exactly

---

## 🎯 Quick Decision Guide

If you want to **match Convex exactly** (recommended for MVP):
- ✅ WeeklyReport.taskIds → JSON field
- ✅ WeeklyReport.photos → JSON field
- ✅ Final Report → Team.documentation array
- ✅ User.attendance → Field resolver

If you want to **improve design** (more work, but better long-term):
- ⚠️ WeeklyReport.taskIds → Join table
- ⚠️ WeeklyReport.photos → Separate table
- ⚠️ Final Report → Separate table
- ✅ User.attendance → Field resolver (same)

---

**Please review and provide decisions on the 4 critical items above.**

