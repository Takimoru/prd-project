import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@apollo/client";
import { GET_MY_TEAMS } from "../graphql/dashboard";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  UserCheck,
  CheckCircle,
  Calendar,
  FileCheck,
  ChevronRight,
  ChevronDown,
  LayoutTemplate,
  Menu,
} from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isProgramsOpen, setIsProgramsOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: teamsData } = useQuery(GET_MY_TEAMS, {
    skip: !user,
  });

  const myTeams = teamsData?.myTeams || [];

  const myPrograms = useMemo(() => {
    if (!myTeams) return [];
    const uniquePrograms = new Map<string, any>();
    myTeams.forEach((team: any) => {
      if (team.program) {
        uniquePrograms.set(team.program.id, team.program);
      }
    });
    return Array.from(uniquePrograms.values());
  }, [myTeams]);

  const isActive = (path: string) => {
    if (path.includes("?")) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path && location.search === "";
  };

  // Force admin check - if email matches admin list, show admin link
  const userEmail = user?.email?.toLowerCase() || "";
  const isHardcodedAdmin = [
    "nicolastzakis@students.universitasmulia.ac.id",
  ].includes(userEmail);

  const effectiveRole = isHardcodedAdmin ? "admin" : user?.role;

  const navItems =
    effectiveRole === "admin"
      ? [
          {
            path: "/admin/approvals",
            label: "Persetujuan Mahasiswa",
            icon: CheckCircle,
          },
          {
            path: "/admin/programs/create",
            label: "Buat Periode KKN",
            icon: LayoutTemplate,
          },
          { path: "/admin/teams", label: "Manajemen Tim", icon: Users },
          {
            path: "/admin/supervisors",
            label: "Manajemen Dosen Pembimbing",
            icon: UserCheck,
          },
          {
            path: "/admin/attendance",
            label: "Tinjauan Absensi",
            icon: Calendar,
          },
          {
            path: "/admin/reports",
            label: "Laporan Akhir",
            icon: FileCheck,
          },
          {
            path: "/admin/logsheets",
            label: "Tinjauan Logbook",
            icon: FileText,
          },
        ]
      : effectiveRole === "supervisor"
      ? [
          { path: "/supervisor", label: "Supervisor", icon: LayoutDashboard },
          { path: "/admin/logsheets", label: "Tinjauan Logbook", icon: FileText },
        ]
      : [
          { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          {
            path: "/dashboard/work-programs",
            label: "Program Kerja",
            icon: FileText,
          },
          {
            path: "/dashboard/logsheet",
            label: "Logbook Mingguan",
            icon: FileText,
          },
        ];

  // Navigation content component (reused in both desktop sidebar and mobile drawer)
  const NavigationContent = () => (
    <nav className="flex flex-col space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.path}
            variant={isActive(item.path) ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              isActive(item.path) && "bg-secondary"
            )}
            asChild
            onClick={() => setIsMobileMenuOpen(false)}>
            <Link to={item.path}>
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}

      {/* Work Programs List - Collapsible */}
      {effectiveRole !== "admin" && effectiveRole !== "supervisor" && (
        <div className="space-y-1 pt-2">
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setIsProgramsOpen(!isProgramsOpen)}>
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Work Programs
            </div>
            {isProgramsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {isProgramsOpen && (
            <div className="space-y-1">
              {myPrograms.map((program) => {
                const programPath = `/dashboard?program=${program.id}`;
                return (
                  <Button
                    key={program.id}
                    variant={isActive(programPath) ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start pl-9",
                      isActive(programPath) && "bg-secondary"
                    )}
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}>
                    <Link to={programPath}>
                      <LayoutTemplate className="mr-2 h-4 w-4" />
                      <span className="truncate">{program.title}</span>
                    </Link>
                  </Button>
                );
              })}
              {myPrograms.length === 0 && (
                <div className="px-4 py-2 text-sm text-muted-foreground italic pl-9">
                  No active programs
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header - Only visible on mobile */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 max-w-full">
          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <ScrollArea className="h-full py-6 pl-4 pr-6">
                <div className="mb-4 px-3">
                  <h2 className="text-lg font-semibold">Menu</h2>
                </div>
                <NavigationContent />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Logo/Title */}
          <div className="flex-1">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-bold text-sm sm:text-base">
                Field Study System
              </span>
            </Link>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-2 ml-auto">
            {user && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.picture || undefined}
                    alt={user.name || "User"}
                  />
                  <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Header - Only visible on desktop */}
      <header className="hidden lg:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 max-w-full">
          {/* Logo/Title */}
          <div className="flex-1 md:flex-initial">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-bold text-sm sm:text-base">
                Field Study System
              </span>
            </Link>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-2 ml-auto">
            {user && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.picture || undefined}
                    alt={user.name || "User"}
                  />
                  <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium leading-none">
                    {user.name}
                  </span>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {effectiveRole || "loading..."}
                  </Badge>
                </div>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar - Only visible on desktop */}
        <aside className="hidden lg:block fixed top-14 z-30 h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r">
          <ScrollArea className="h-full py-6 pl-4 pr-6">
            <NavigationContent />
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
