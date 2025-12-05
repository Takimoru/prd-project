import { ConvexProvider, ConvexReactClient } from "convex/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

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
// Admin Pages
import { StudentApprovals } from "./pages/admin/StudentApprovals";
import { TeamManagement } from "./pages/admin/TeamManagement";
import { SupervisorManagement } from "./pages/admin/SupervisorManagement";
import { AttendanceReviews } from "./pages/admin/AttendanceReviews";
import { FinalReports } from "./pages/admin/FinalReports";
import { AdminRedirect } from "./components/AdminRedirect";
// Supervisor Pages
import { SupervisorDashboard as NewSupervisorDashboard } from "./pages/supervisor/SupervisorDashboard";
import { SupervisorTeamList } from "./pages/supervisor/SupervisorTeamList";
import { SupervisorTeamDetails } from "./pages/supervisor/SupervisorTeamDetails";
import { WeeklySummaryReview } from "./pages/supervisor/WeeklySummaryReview";

const convexUrl = import.meta.env.VITE_CONVEX_URL || "";

if (!convexUrl) {
  console.warn(
    "VITE_CONVEX_URL is not set. Please set it in your .env file."
  );
}

const convex = new ConvexReactClient(convexUrl);

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ConvexProvider client={convex}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              
              {/* Supervisor Routes - Separate from Layout */}
              <Route path="/supervisor" element={<ProtectedRoute><NewSupervisorDashboard /></ProtectedRoute>} />
              <Route path="/supervisor/teams" element={<ProtectedRoute><SupervisorTeamList /></ProtectedRoute>} />
              <Route path="/supervisor/teams/:teamId" element={<ProtectedRoute><SupervisorTeamDetails /></ProtectedRoute>} />
              <Route path="/supervisor/review/:teamId/:week" element={<ProtectedRoute><WeeklySummaryReview /></ProtectedRoute>} />
              
              {/* Student Dashboard Routes - Separate from Layout (has own sidebar) */}
              <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
              <Route path="/dashboard/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
              <Route path="/dashboard/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/dashboard/files" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
              <Route path="/dashboard/team" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
              <Route path="/dashboard/work-programs" element={<ProtectedRoute><WorkProgramsPage /></ProtectedRoute>} />
              
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
                <Route path="admin/teams" element={<TeamManagement />} />
                <Route path="admin/supervisors" element={<SupervisorManagement />} />
                <Route path="admin/attendance" element={<AttendanceReviews />} />
                <Route path="admin/reports" element={<FinalReports />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="top-right" />
          </BrowserRouter>
        </AuthProvider>
      </ConvexProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
