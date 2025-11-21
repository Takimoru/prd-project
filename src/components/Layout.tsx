import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  UserCheck,
  CheckCircle,
  Calendar,
  FileCheck,
} from "lucide-react";

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Debug: Log user role
  console.log("Layout - Current user:", user);
  console.log("Layout - User role:", user?.role);
  console.log("Layout - Is admin?", user?.role === "admin");
  console.log("Layout - User email:", user?.email);

  // Force admin check - if email matches admin list, show admin link
  const userEmail = user?.email?.toLowerCase() || "";
  const isHardcodedAdmin = [
    "nicolastzakis@students.unviersitasmulia.ac.id",
    "nicolastzakis@students.universitasmulia.ac.id",
  ].includes(userEmail);

  const effectiveRole = isHardcodedAdmin ? "admin" : user?.role;
  console.log("Layout - Effective role:", effectiveRole);

  const navItems =
    effectiveRole === "admin"
      ? [
          {
            path: "/admin/approvals",
            label: "Student Approvals",
            icon: CheckCircle,
          },
          { path: "/admin/teams", label: "Team Management", icon: Users },
          {
            path: "/admin/supervisors",
            label: "Supervisor Management",
            icon: UserCheck,
          },
          {
            path: "/admin/attendance",
            label: "Attendance Reviews",
            icon: Calendar,
          },
          {
            path: "/admin/reports",
            label: "Final Reports",
            icon: FileCheck,
          },
        ]
      : effectiveRole === "supervisor"
      ? [{ path: "/supervisor", label: "Supervisor", icon: FileText }]
      : [{ path: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center ">
              <h1 className="text-xl font-bold text-gray-900">
                Field Study System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">{user?.name}</span>
                <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded">
                  {effectiveRole || "loading..."}
                </span>
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === "development" && (
                  <button
                    onClick={() => {
                      console.log("Current user:", user);
                      window.location.reload();
                    }}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                    title="Refresh (Debug)">
                    🔄
                  </button>
                )}
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-700 hover:text-gray-200 rounded"
                title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}>
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
