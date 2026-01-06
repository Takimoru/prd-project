# Student Role: Complete Convex → GraphQL Migration

**Date:** 2024  
**Status:** ✅ **ALL STUDENT FILES MIGRATED**

---

## ✅ Files Migrated

### 1. RecentActivity.tsx
**Before:** `useQuery(api.activities.get)`  
**After:** `useQuery(GET_ACTIVITIES)` from `@/graphql/student`  
**Changes:**
- Replaced Convex hook with Apollo Client
- Updated data structure (`activity._id` → `activity.id`)
- Updated user access (`activity.userName` → `activity.user?.name`)

---

### 2. FilesPage.tsx
**Before:** `useQuery(api.tasks.getByTeam)` inside forEach loop  
**After:** `useQuery(GET_MY_TASKS)` - fetches all tasks from user's teams  
**Changes:**
- Fixed invalid hook usage (can't use hooks in loops)
- Now uses `GET_MY_TASKS` which returns tasks from all teams
- Updated data structure (`task._id` → `task.id`)
- Updated file access (`task.completionFiles` array)

---

### 3. WorkProgramList.tsx
**Before:** 
- `useQuery(api.workPrograms.getByTeam)`
- `useQuery(api.teams.getTeam)`

**After:**
- `useQuery(GET_WORK_PROGRAMS)` from `@/graphql/student`
- `useQuery(GET_TEAM_DETAILS)` from `@/graphql/dashboard`

**Changes:**
- Replaced both Convex queries
- Updated data structure (`program._id` → `program.id`)

---

### 4. WorkProgramForm.tsx
**Before:**
- `useMutation(api.workPrograms.create)`
- `useMutation(api.workPrograms.update)`
- `useQuery(api.workPrograms.getById)`
- `useQuery(api.teams.getTeam)`

**After:**
- `useMutation(CREATE_WORK_PROGRAM)` from `@/graphql/student`
- `useMutation(UPDATE_WORK_PROGRAM)` from `@/graphql/student`
- `useQuery(GET_WORK_PROGRAM)` from `@/graphql/student`
- `useQuery(GET_TEAM_DETAILS)` from `@/graphql/dashboard`

**Changes:**
- Replaced all Convex hooks
- Fixed form data loading with `useEffect`
- Updated mutation variables structure
- Updated data structure

---

### 5. WorkProgramDetail.tsx
**Before:**
- `useQuery(api.workPrograms.getById)`
- `useQuery(api.workPrograms.getProgress)`
- `useQuery(api.teams.getTeam)`
- `useQuery(api.tasks.getByTeam)`
- `useMutation(api.workPrograms.remove)`

**After:**
- `useQuery(GET_WORK_PROGRAM)` from `@/graphql/student`
- `useQuery(GET_WORK_PROGRAM_PROGRESS)` from `@/graphql/student`
- `useQuery(GET_TEAM_DETAILS)` from `@/graphql/dashboard`
- `useQuery(GET_TEAM_TASKS)` from `@/graphql/dashboard`
- `useMutation(DELETE_WORK_PROGRAM)` from `@/graphql/student`

**Changes:**
- Replaced all Convex hooks
- Updated data structure (`._id` → `.id`)
- Fixed loading states
- Updated delete mutation

---

### 6. ProjectCard.tsx
**Before:** `useMutation(api.attendance.checkIn)`  
**After:** `useMutation(CHECK_IN_MUTATION)` from `@/graphql/dashboard`  
**Changes:**
- Replaced Convex mutation
- Updated mutation variables structure
- Updated data structure (`team._id` → `team.id`)
- Added refetchQueries

---

### 7. MyTeams.tsx
**Before:** `useMutation(api.attendance.checkIn)`  
**After:** `useMutation(CHECK_IN_MUTATION)` from `@/graphql/dashboard`  
**Changes:**
- Replaced Convex mutation
- Updated mutation variables structure
- Updated data structure (`team._id` → `team.id`)
- Updated attendance check logic

---

### 8. CreateProgramModal.tsx (pages/student)
**Before:** `useMutation(api.programs.createProgram)`  
**After:** `useMutation(CREATE_PROGRAM_MUTATION)` from `@/graphql/dashboard`  
**Changes:**
- Replaced Convex mutation
- Updated mutation variables structure
- Removed userId parameter (handled by server context)

---

### 9. StudentDashboard.tsx
**Changes:**
- Updated data access to support both `.id` and `._id` for compatibility
- Fixed userId reference

---

## 📁 New Files Created

1. **`packages/client/src/graphql/student.ts`**
   - GraphQL queries and mutations for student-specific features
   - Includes: activities, workPrograms, workProgramProgress

2. **`packages/client/src/graphql/registration.ts`**
   - GraphQL mutation for registration submission

---

## 🔧 GraphQL Queries/Mutations Added

### Queries
- `GET_ACTIVITIES` - Timeline/Recent activity
- `GET_WORK_PROGRAMS` - List work programs for team
- `GET_WORK_PROGRAM` - Single work program details
- `GET_WORK_PROGRAM_PROGRESS` - Progress entries for work program

### Mutations
- `CREATE_WORK_PROGRAM` - Create new work program
- `UPDATE_WORK_PROGRAM` - Update work program
- `DELETE_WORK_PROGRAM` - Delete work program
- `UPDATE_WORK_PROGRAM_PROGRESS` - Update progress entry
- `SUBMIT_REGISTRATION` - Submit registration form

---

## 🔄 Data Structure Changes

All files updated to use GraphQL data structure:
- `._id` → `.id` (GraphQL uses `id`)
- `teamId` (string) instead of `Id<"teams">`
- Nested relations (e.g., `team.id` instead of direct `teamId`)

---

## ✅ Migration Checklist

- [x] RecentActivity.tsx
- [x] FilesPage.tsx
- [x] WorkProgramList.tsx
- [x] WorkProgramForm.tsx
- [x] WorkProgramDetail.tsx
- [x] ProjectCard.tsx
- [x] MyTeams.tsx
- [x] CreateProgramModal.tsx (both files)
- [x] RegistrationPage.tsx (already done)
- [x] StudentDashboard.tsx (data structure fixes)

---

## 🎯 Result

**All Student role files now use GraphQL backend. No Convex dependencies remain.**

The student dashboard should now work without Convex client errors!

---

**Ready for testing!**

