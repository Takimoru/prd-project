import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Calendar, 
  Files, 
  FileText,
  Users, 
  Menu,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "../../../../components/ui/sheet";
import { Button } from "../../../../components/ui/button";
import { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { ThemeToggle } from "../../../../components/ThemeToggle";

interface DashboardSidebarProps {
  user: {
    _id?: string; // Optional for compatibility
    id?: string;
    name: string;
    email: string;
    role: string;
    picture?: string;
  } | undefined | null;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: FolderKanban, label: "Program Kerja", path: "/dashboard/projects" },
    { icon: CheckSquare, label: "Tugas", path: "/dashboard/tasks" },
    { icon: Calendar, label: "Kalender", path: "/dashboard/calendar" },
    { icon: Files, label: "Berkas", path: "/dashboard/files" },
    { icon: FileText, label: "Logbook Mingguan", path: "/dashboard/logsheet" },
    { icon: Users, label: "Tim", path: "/dashboard/team" },
  ];

  const SidebarContent = () => (
    <>
      {/* Workspace Branding */}
      <div className="p-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">W</span>
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Simonpro</h2>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <div className="px-3 space-y-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            onClick={() => setIsOpen(false)}
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

      {/* User Card */}
      <div className="p-4 border-t border-border bg-card/50 mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-lg mb-2">
          <Avatar className="w-8 h-8 border border-border">
            <AvatarImage src={user?.picture} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 flex flex-col">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:border-destructive/50"
          onClick={() => {
            setIsOpen(false);
            logout();
          }}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--sidebar-background))] border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">W</span>
            </div>
            <h2 className="font-semibold text-foreground">Simonpro</h2>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-[hsl(var(--sidebar-background))]">
              <div className="flex flex-col h-full">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 h-screen bg-[hsl(var(--sidebar-background))] border-r border-border flex-col fixed left-0 top-0 z-50">
        <SidebarContent />
      </div>
    </>
  );
}
