import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  CalendarCheck, 
  FileText,
  Shield,
  LogOut
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Separator } from "../../../components/ui/separator";
import { useAuth } from "../../../contexts/AuthContext";
import { ThemeToggle } from "../../../components/ThemeToggle";

export function AdminSidebar() {
  const { user, logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Teams", path: "/admin/teams" },
    { icon: Shield, label: "Supervisors", path: "/admin/supervisors" },
    { icon: UserCheck, label: "Approvals", path: "/admin/approvals" },
    { icon: CalendarCheck, label: "Attendance", path: "/admin/attendance" },
    { icon: FileText, label: "Final Reports", path: "/admin/reports" },
  ];

  return (
    <div className="w-64 h-screen bg-[hsl(var(--sidebar-background))] border-r border-border flex flex-col fixed left-0 top-0 z-50">
      {/* Workspace Branding */}
      <div className="p-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">A</span>
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Management</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <div className="px-3 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="px-6 py-4 mt-auto">
        <Separator className="bg-border/50" />
      </div>

      {/* User Card */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
          <Avatar className="w-8 h-8 border border-border">
            <AvatarImage src={user?.picture} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
