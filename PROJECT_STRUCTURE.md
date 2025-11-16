# Project Structure Overview

## Backend (Convex)

### Schema (`convex/schema.ts`)
Defines all database tables:
- `users` - User accounts with roles
- `programs` - Field study programs
- `teams` - Teams with leaders and supervisors
- `attendance` - Daily check-ins
- `weeklyTasks` - Weekly task assignments
- `weeklyReports` - Weekly progress reports
- `registrations` - Student program registrations

### Functions

#### `convex/auth.ts`
- `getCurrentUser` - Get authenticated user
- `createOrUpdateUser` - Create/update user after OAuth
- `isAllowedDomain` - Validate email domain

#### `convex/programs.ts`
- `getAllPrograms` - List all programs
- `getProgramById` - Get single program
- `createProgram` - Create new program (Admin)
- `updateProgram` - Update program (Admin)
- `archiveProgram` - Archive program (Admin)

#### `convex/teams.ts`
- `getTeamsByProgram` - Get teams for a program
- `getTeamById` - Get team details
- `getTeamsBySupervisor` - Get supervisor's teams
- `getTeamsByLeader` - Get leader's teams
- `createTeam` - Create team (Admin)
- `assignSupervisor` - Assign supervisor (Admin)
- `addMember` / `removeMember` - Manage team members

#### `convex/attendance.ts`
- `getAttendanceByTeamDate` - Get attendance for date
- `getAttendanceByUser` - Get user's attendance
- `getWeeklyAttendanceSummary` - Weekly summary
- `checkIn` - Daily check-in

#### `convex/tasks.ts`
- `getTasksByTeamWeek` - Get weekly tasks
- `getTasksByUser` - Get user's tasks
- `createTask` - Create task (Leader)
- `updateTask` - Update task
- `completeTask` - Mark task complete
- `deleteTask` - Delete task

#### `convex/reports.ts`
- `getWeeklyReport` - Get report for week
- `getReportsByTeam` - Get all team reports
- `getReportsByStatus` - Get reports by status
- `createOrUpdateWeeklyReport` - Create/update report
- `submitWeeklyReport` - Submit for review
- `addSupervisorComment` - Add comment (Supervisor)
- `approveReport` - Approve report (Supervisor)

#### `convex/registrations.ts`
- `getRegistrationsByProgram` - Get program registrations
- `getUserRegistrations` - Get user's registrations
- `registerForProgram` - Register for program
- `approveRegistration` - Approve (Admin)
- `rejectRegistration` - Reject (Admin)

## Frontend (React + TypeScript)

### Components (`src/components/`)
- `Layout.tsx` - Main layout with sidebar and header
- `ProtectedRoute.tsx` - Route protection wrapper

### Contexts (`src/contexts/`)
- `AuthContext.tsx` - Authentication context with Google OAuth

### Pages (`src/pages/`)
- `LoginPage.tsx` - Google OAuth login
- `StudentDashboard.tsx` - Student dashboard with programs
- `TeamWorkspace.tsx` - Team workspace with tasks and attendance
- `SupervisorDashboard.tsx` - Supervisor review dashboard
- `AdminPanel.tsx` - Admin program management
- `NotFound.tsx` - 404 page

### Main Files
- `App.tsx` - Main app with routing
- `main.tsx` - Entry point
- `index.css` - Global styles with Tailwind

## Configuration Files

- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `.env.example` - Environment variables template

## Key Features Implemented

✅ Google OAuth 2.0 authentication
✅ Role-based access control (Admin, Supervisor, Student)
✅ Program management
✅ Team creation and management
✅ Daily attendance check-in
✅ Weekly task assignment
✅ Weekly progress reporting
✅ Supervisor review and comments
✅ Student registration system

## Next Steps for Full Implementation

1. **Complete Registration Flow**
   - Connect registration button to mutation
   - Add registration form with student ID

2. **Team Management UI**
   - Team creation interface for admins
   - Supervisor assignment UI
   - Team member management

3. **Attendance Features**
   - GPS capture integration
   - Photo upload functionality
   - Attendance history view

4. **Weekly Reports**
   - Report creation form
   - Photo upload for reports
   - Progress calculation display

5. **Export Functionality**
   - CSV export for programs
   - Report generation

6. **Enhanced Features**
   - Notifications
   - Email reminders
   - Advanced filtering and search
   - Mobile responsiveness improvements

