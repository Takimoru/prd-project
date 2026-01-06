import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function AdminRedirect() {
  const { user, isLoading } = useAuth();

  // Wait for user data to load
  if (isLoading || user === undefined) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Loading...</p>
    </div>;
  }

  const userEmail = user?.email?.toLowerCase() || "";
  const isHardcodedAdmin = [
    "nicolastzakis@students.unviersitasmulia.ac.id",
    "nicolastzakis@students.universitasmulia.ac.id",
  ].includes(userEmail);
  const effectiveRole = isHardcodedAdmin ? "admin" : user?.role;

  console.log("AdminRedirect - User:", user);
  console.log("AdminRedirect - Effective Role:", effectiveRole);

  if (effectiveRole === "admin") {
    return <Navigate to="/admin/approvals" replace />;
  }

  if (effectiveRole === "supervisor") {
    return <Navigate to="/supervisor" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
