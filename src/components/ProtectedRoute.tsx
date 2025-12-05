import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "pending") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-md text-center bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Registration Under Review
          </h2>
          <p className="text-gray-600 mt-3">
            Your registration has been received and is awaiting admin verification.
            You&apos;ll gain access automatically once your payment and data are approved.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Need help? Contact the admin team with your student ID and registered email.
          </p>
        </div>
      </div>
    );
  }

  // Redirect admins away from student dashboard
  const userEmail = user?.email?.toLowerCase() || "";
  const isHardcodedAdmin = [
    "nicolastzakis@students.unviersitasmulia.ac.id",
    "nicolastzakis@students.universitasmulia.ac.id",
  ].includes(userEmail);
  const effectiveRole = isHardcodedAdmin ? "admin" : user?.role;

  if (effectiveRole === "admin" && location.pathname === "/dashboard") {
    return <Navigate to="/admin/approvals" replace />;
  }

  // Redirect supervisors away from student dashboard
  if (effectiveRole === "supervisor" && location.pathname === "/dashboard") {
     return <Navigate to="/supervisor" replace />;
  }

  // Redirect students away from admin/supervisor routes
  if (effectiveRole === "student" && (location.pathname.startsWith("/admin") || location.pathname.startsWith("/supervisor"))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

