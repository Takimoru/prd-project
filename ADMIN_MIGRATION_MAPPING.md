# Admin Migration Mapping - Convex → GraphQL

## 📋 Daftar Lengkap Fungsi Admin di Convex

### 1. Programs (convex/programs.ts)

| Convex Function | Type | GraphQL Equivalent | Status |
|----------------|------|-------------------|--------|
| `getAllPrograms` | query | `programs(includeArchived: Boolean)` | ✅ Implemented |
| `getProgramById` | query | `program(id: ID!)` | ✅ Implemented |
| `createProgram` | mutation | `createProgram(input: ProgramInput!)` | ✅ Implemented |
| `updateProgram` | mutation | `updateProgram(id: ID!, input: UpdateProgramInput!)` | ❌ **MISSING** |
| `archiveProgram` | mutation | `archiveProgram(id: ID!)` | ✅ Implemented |

### 2. Registrations (convex/registrations.ts)

| Convex Function | Type | GraphQL Equivalent | Status |
|----------------|------|-------------------|--------|
| `getPendingRegistrations` | query | `pendingRegistrations` | ✅ Implemented |
| `getApprovedRegistrations` | query | `approvedRegistrations` | ✅ Implemented |
| `getRegistrationsByProgram` | query | `registrations(programId: ID!, status: String)` | ✅ Implemented |
| `approveRegistration` | mutation | `approveRegistration(id: ID!)` | ✅ Implemented |
| `rejectRegistration` | mutation | `rejectRegistration(id: ID!, reviewNotes: String)` | ✅ Implemented |

### 3. Teams (convex/teams.ts)

| Convex Function | Type | GraphQL Equivalent | Status |
|----------------|------|-------------------|--------|
| `getTeamsByProgram` | query | `teams(programId: ID!)` | ✅ Implemented |
| `getTeamById` | query | `team(id: ID!)` | ✅ Implemented |
| `createTeam` | mutation | `createTeam(input: CreateTeamInput!)` | ✅ Implemented |
| `assignSupervisor` | mutation | `assignSupervisor(teamId: ID!, supervisorId: ID!)` | ❌ **MISSING** |
| `updateTeam` | mutation | `updateTeam(id: ID!, input: UpdateTeamInput!)` | ✅ Implemented |
| `deleteTeam` | mutation | `deleteTeam(id: ID!)` | ✅ Implemented |
| `addMember` | mutation | `addMember(input: AddMemberInput!)` | ✅ Implemented |
| `removeMember` | mutation | `removeMember(teamId: ID!, userId: ID!)` | ✅ Implemented |

### 4. Users (convex/users.ts)

| Convex Function | Type | GraphQL Equivalent | Status |
|----------------|------|-------------------|--------|
| `getAllUsers` | query | `users(role: String)` | ✅ Implemented |
| `searchUsers` | query | `searchUsers(searchTerm: String!)` | ✅ Implemented |

### 5. Attendance (convex/attendance.ts)

| Convex Function | Type | GraphQL Equivalent | Status |
|----------------|------|-------------------|--------|
| `getWeeklyAttendanceSummary` | query | `weeklyAttendanceSummary(teamId: ID!, week: String!)` | ✅ Implemented |
| `getAttendanceByTeamDate` | query | `attendanceByTeam(teamId: ID!, date: String!)` | ✅ Implemented |

**Admin-Specific Attendance:**
- `getAttendanceAfterSupervisorApproval` - ❌ **MISSING** (Admin needs to see approved attendance)

### 6. Reports (convex/reports.ts)

| Convex Function | Type | GraphQL Equivalent | Status |
|----------------|------|-------------------|--------|
| `getReportsByTeam` | query | `weeklyReports(teamId: ID!)` | ✅ Implemented |
| `getReportsByStatus` | query | - | ❌ **MISSING** (Admin needs this) |

### 7. Final Reports (PRD Requirement)

| Requirement | GraphQL Equivalent | Status |
|------------|-------------------|--------|
| View final reports | `finalReports(teamId: ID!)` | ❌ **MISSING** |
| Download final report | `downloadFinalReport(id: ID!)` | ❌ **MISSING** |

### 8. CSV Export (PRD Requirement)

| Requirement | GraphQL Equivalent | Status |
|------------|-------------------|--------|
| Export attendance CSV | `exportAttendanceCSV(programId: ID!)` | ❌ **MISSING** |

---

## 🔧 Fungsi yang Perlu Ditambahkan

### Priority 1: Core Admin Functions
1. ✅ `updateProgram` - Update program details
2. ✅ `assignSupervisor` - Assign supervisor to team
3. ✅ `getAttendanceAfterSupervisorApproval` - View approved attendance
4. ✅ `getReportsByStatus` - Filter reports by status
5. ✅ `exportAttendanceCSV` - CSV export functionality

### Priority 2: Final Reports
6. ✅ `finalReports` - View final reports
7. ✅ `downloadFinalReport` - Download final report file

---

## 📊 Validation Checklist (Per PRD Section 7)

- [x] Program created di GraphQL = muncul di dashboard
- [x] Approve registration → status berubah
- [ ] **Update program → perubahan tersimpan** (need updateProgram)
- [ ] **Assign supervisor → supervisor melihat tim** (need assignSupervisor)
- [ ] **Attendance hanya terlihat setelah supervisor approve** (need getAttendanceAfterSupervisorApproval)
- [ ] **Final report bisa diunduh admin** (need finalReports)
- [ ] **CSV export berfungsi** (need exportAttendanceCSV)

---

## 🎯 Next Steps

1. Implement missing functions (Priority 1)
2. Add final reports functionality
3. Add CSV export resolver
4. Test all Admin flows
5. Validate against Convex behavior

