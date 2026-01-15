import { ApolloProvider } from "@apollo/client";
import { client as apolloClient } from "./lib/apollo";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { TeamWorkspace } from "./pages/TeamWorkspace";
import { NotFound } from "./pages/NotFound";
import { RegistrationPage } from "./pages/RegistrationPage";
// Student Pages
import { ProjectsPage } from "./pages/student/ProjectsPage";
import { TasksPage } from "./pages/student/TasksPage";
import { CalendarPage } from "./pages/student/CalendarPage";
import { FilesPage } from "./pages/student/FilesPage";
import { TeamPage } from "./pages/student/TeamPage";
import { WorkProgramsPage } from "./pages/student/WorkProgramsPage";
import { WorkProgramForm } from "./pages/student/components/work-programs/WorkProgramForm";
import { WorkProgramDetail } from "./pages/student/components/work-programs/WorkProgramDetail";
import { LogsheetPage } from "./pages/student/LogsheetPage";
// Admin Pages
import { StudentApprovals } from "./pages/admin/StudentApprovals";
import { CreateProgram } from "./pages/admin/CreateProgram";
import { TeamManagement } from "./pages/admin/TeamManagement";
import { SupervisorManagement } from "./pages/admin/SupervisorManagement";
import { AttendanceReviews } from "./pages/admin/AttendanceReviews";
import { FinalReports } from "./pages/admin/FinalReports";
import { LogsheetReviewPage } from "./pages/admin/LogsheetReviewPage";
import { AdminRedirect } from "./components/AdminRedirect";
// Supervisor Pages
import { SupervisorDashboard as NewSupervisorDashboard } from "./pages/supervisor/SupervisorDashboard";
import { SupervisorTeamList } from "./pages/supervisor/SupervisorTeamList";
import { SupervisorTasksPage } from "./pages/supervisor/SupervisorTasksPage";
import { SupervisorPendingReviews } from "./pages/supervisor/SupervisorPendingReviews";
import { SupervisorAllReports } from "./pages/supervisor/SupervisorAllReports";
import { WeeklySummaryReview } from "./pages/supervisor/WeeklySummaryReview";
import { SpectatorDashboard } from "./pages/supervisor/SpectatorDashboard";
import { WeeklyAttendanceApproval } from "./pages/supervisor/WeeklyAttendanceApproval";
import { SupervisorWorkProgramsPage } from "./pages/supervisor/SupervisorWorkProgramsPage";
import { SupervisorWorkProgramDetail } from "./pages/supervisor/SupervisorWorkProgramDetail";
import { useParams } from "react-router-dom";

// Wrapper to extract params for SpectatorDashboard
function SpectatorDashboardWrapper() {
  const { teamId } = useParams();
  if (!teamId) return null;
  return <SpectatorDashboard teamId={teamId} />;
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Debug: Log the client ID to verify it's loaded
if (typeof window !== 'undefined' && !googleClientId) {
  console.error("❌ VITE_GOOGLE_CLIENT_ID is not set!");
  console.log("Current env value:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  console.log("Please ensure packages/client/.env.local exists with VITE_GOOGLE_CLIENT_ID");
}

function App() {
  // Only render GoogleOAuthProvider if client ID is available
  if (!googleClientId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Configuration Error</h1>
        <p>VITE_GOOGLE_CLIENT_ID is not configured.</p>
        <p>Please create <code>packages/client/.env.local</code> with your Google Client ID.</p>
        <p>Then restart the dev server.</p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ApolloProvider client={apolloClient}>
        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <BrowserRouter>
              <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              
              {/* Supervisor Routes - Separate from Layout */}
              <Route path="/supervisor" element={<ProtectedRoute><NewSupervisorDashboard /></ProtectedRoute>} />
              <Route path="/supervisor/teams" element={<ProtectedRoute><SupervisorTeamList /></ProtectedRoute>} />
              <Route path="/supervisor/tasks" element={<ProtectedRoute><SupervisorTasksPage /></ProtectedRoute>} />
               <Route path="/supervisor/pending" element={<ProtectedRoute><SupervisorPendingReviews /></ProtectedRoute>} />
              <Route path="/supervisor/reports" element={<ProtectedRoute><SupervisorAllReports /></ProtectedRoute>} />
              <Route path="/supervisor/work-programs" element={<ProtectedRoute><SupervisorWorkProgramsPage /></ProtectedRoute>} />
              <Route path="/supervisor/work-programs/:programId" element={<ProtectedRoute><SupervisorWorkProgramDetail /></ProtectedRoute>} />
              <Route path="/supervisor/spectator/:teamId" element={<ProtectedRoute><SpectatorDashboardWrapper /></ProtectedRoute>} />
              <Route path="/supervisor/attendance-approval" element={<ProtectedRoute><WeeklyAttendanceApproval /></ProtectedRoute>} />
              <Route path="/supervisor/review/:teamId/:week" element={<ProtectedRoute><WeeklySummaryReview /></ProtectedRoute>} />
              
              {/* Student Dashboard Routes - Separate from Layout (has own sidebar) */}
              <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
              <Route path="/dashboard/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
              <Route path="/dashboard/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/dashboard/files" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
              <Route path="/dashboard/team" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
              <Route path="/dashboard/work-programs" element={<ProtectedRoute><WorkProgramsPage /></ProtectedRoute>} />
              <Route path="/dashboard/logsheet" element={<ProtectedRoute><LogsheetPage /></ProtectedRoute>} />
              
              {/* Admin Routes - Use Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminRedirect />} />
                <Route path="team/:teamId" element={<TeamWorkspace />} />
                {/* Work Program Routes */}
                <Route path="team/:teamId/programs/new" element={<WorkProgramForm />} />
                <Route path="team/:teamId/programs/:programId" element={<WorkProgramDetail />} />
                <Route path="team/:teamId/programs/:programId/edit" element={<WorkProgramForm />} />
                {/* Admin Routes */}
                <Route path="admin/approvals" element={<StudentApprovals />} />
                <Route path="admin/programs/create" element={<CreateProgram />} />
                <Route path="admin/teams" element={<TeamManagement />} />
                <Route path="admin/supervisors" element={<SupervisorManagement />} />
                <Route path="admin/attendance" element={<AttendanceReviews />} />
                <Route path="admin/reports" element={<FinalReports />} />
                <Route path="admin/logsheets" element={<LogsheetReviewPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="top-right" />
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </ApolloProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
