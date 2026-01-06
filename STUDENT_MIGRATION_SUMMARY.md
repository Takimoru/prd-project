# Student Role Migration: Summary

**Date:** 2024  
**Status:** Documentation Complete - Awaiting Decisions

---

## 📊 What Was Done

### ✅ Phase 1: Convex Behavior Documentation

Created comprehensive documentation (`STUDENT_MIGRATION_DOCUMENTATION.md`) that:

1. **Mapped all Convex tables** → Prisma models
2. **Inventoried all Student functions** in Convex:
   - Attendance (4 functions)
   - Tasks (6 functions)
   - Work Programs (5 functions)
   - Activities (1 function)
   - Weekly Reports (4 functions)
3. **Mapped each function** to GraphQL equivalent
4. **Identified gaps** between Convex and GraphQL
5. **Documented frontend dependencies**

---

## 🔍 Key Findings

### ✅ Already Implemented (80%)

Most Student functions are already in GraphQL:
- ✅ Attendance check-in
- ✅ Task queries and mutations
- ✅ Work Program queries (basic)
- ✅ Weekly Report queries

### ❌ Missing (20%)

**Critical Missing:**
1. `activities` query (timeline)
2. `workProgramProgress` query
3. `updateWorkProgramProgress` mutation
4. `User.attendance` field resolver

**Schema Decisions Needed:**
1. WeeklyReport task linkage
2. WeeklyReport photos storage
3. Final report storage location

---

## 📋 Next Steps

### Step 1: Review Decisions Document

**File:** `STUDENT_MIGRATION_DECISIONS_NEEDED.md`

**Action Required:** Make 4 decisions:
1. WeeklyReport.taskIds → JSON or join table?
2. WeeklyReport.photos → JSON or separate table?
3. Final Report → Team.documentation or separate table?
4. User.attendance → Field resolver (confirm)

**Recommendation:** Use JSON fields to match Convex exactly for MVP.

---

### Step 2: Implement Missing Resolvers

Once decisions are made, implement:

1. **Activities Resolver**
   - Query: `activities(teamId: ID!): [Activity!]!`
   - File: `packages/server/src/graphql/resolvers/activity.resolver.ts` (new)

2. **Work Program Progress Resolver** (extend existing)
   - Query: `workProgramProgress(workProgramId: ID!): [WorkProgramProgress!]!`
   - Mutation: `updateWorkProgramProgress(...)`
   - File: `packages/server/src/graphql/resolvers/workProgram.resolver.ts`

3. **User Field Resolver** (extend existing)
   - Field: `User.attendance(startDate, endDate)`
   - File: `packages/server/src/graphql/resolvers/user.resolver.ts`

---

### Step 3: Update Schema

Add missing types to GraphQL schema:
- Activity type (if not exists)
- WorkProgramProgress type (if not exists)
- Update WeeklyReport type (add taskIds, photos if JSON chosen)

---

### Step 4: Test Parity

For each implemented resolver:
- [ ] Input validation matches Convex
- [ ] Output shape matches Convex exactly
- [ ] Auth checks match Convex
- [ ] Side effects match (activity logging, etc.)

---

## 📁 Files Created

1. **STUDENT_MIGRATION_DOCUMENTATION.md**
   - Complete Convex behavior documentation
   - Function-by-function mapping
   - Frontend dependency map

2. **STUDENT_MIGRATION_DECISIONS_NEEDED.md**
   - 4 critical decisions needed
   - Options with pros/cons
   - Recommendations

3. **STUDENT_MIGRATION_SUMMARY.md** (this file)
   - Quick overview
   - Next steps

---

## 🎯 Success Criteria

Migration is complete when:
- ✅ All Student functions have GraphQL equivalents
- ✅ Response shapes match Convex exactly
- ✅ Frontend works without changes (or minimal changes)
- ✅ All tests pass
- ✅ No Convex dependency for Student role

---

## ⚠️ Important Notes

1. **Don't skip documentation** - This is mandatory per PRD
2. **Match Convex behavior exactly** - Don't "improve" during migration
3. **Test parity first** - Only refactor after parity is proven
4. **Student role only** - Don't touch Admin/Supervisor yet

---

**Ready for your decisions on the 4 critical items. Once decided, implementation can begin.**

