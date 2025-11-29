import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
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
} from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isProgramsOpen, setIsProgramsOpen] = useState(true);
  
  const myTeams = useQuery(
    api.teams.getTeamsForUser,
    user ? { userId: user._id } : "skip"
  );

  const myPrograms = useMemo(() => {
    if (!myTeams) return [];
    const uniquePrograms = new Map<string, Doc<"programs">>();
    myTeams.forEach((team) => {
      if (team.program) {
        uniquePrograms.set(team.program._id, team.program);
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
    "nicolastzakis@students.unviersitasmulia.ac.id",
    "nicolastzakis@students.universitasmulia.ac.id",
  ].includes(userEmail);

  const effectiveRole = isHardcodedAdmin ? "admin" : user?.role;

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">
                Field Study System
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Search or other header items could go here */}
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.picture} alt={user.name} />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-medium leading-none">{user.name}</span>
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
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block md:w-64">
          <ScrollArea className="h-full py-6 pl-4 pr-6">
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
                  >
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
                    onClick={() => setIsProgramsOpen(!isProgramsOpen)}
                  >
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
                        const programPath = `/dashboard?program=${program._id}`;
                        return (
                          <Button
                            key={program._id}
                            variant={isActive(programPath) ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start pl-9",
                              isActive(programPath) && "bg-secondary"
                            )}
                            asChild
                          >
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
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
