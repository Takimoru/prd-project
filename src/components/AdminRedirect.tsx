import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function AdminRedirect() {
  const { user } = useAuth();

  const userEmail = user?.email?.toLowerCase() || "";
  const isHardcodedAdmin = [
    "nicolastzakis@students.unviersitasmulia.ac.id",
    "nicolastzakis@students.universitasmulia.ac.id",
  ].includes(userEmail);
  const effectiveRole = isHardcodedAdmin ? "admin" : user?.role;

  if (effectiveRole === "admin") {
    return <Navigate to="/admin/approvals" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

