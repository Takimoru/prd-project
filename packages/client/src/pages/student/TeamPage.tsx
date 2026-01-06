import { useStudentData } from "./hooks/useStudentData";
import { DashboardSidebar } from "./components/dashboard/DashboardSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Mail, MapPin } from "lucide-react";

export function TeamPage() {
  const { user, myTeams, isLoading } = useStudentData();

  // Debug logging
  console.log("TeamPage Debug:", {
    user,
    myTeams,
    teamsCount: myTeams?.length,
    firstTeam: myTeams?.[0],
  });

  // Collect all unique team members and supervisors
  const allMembers = new Map();
  
  if (myTeams) {
    myTeams.forEach(team => {
      console.log("Processing team:", team);
      
      // Add supervisor
      if (team.supervisor) {
        allMembers.set(team.supervisor._id, {
          ...team.supervisor,
          role: "supervisor",
          teams: allMembers.has(team.supervisor._id) 
            ? [...allMembers.get(team.supervisor._id).teams, team.name || team.program?.title]
            : [team.name || team.program?.title]
        });
      }

      // Add team leader
      if (team.leader) {
        allMembers.set(team.leader._id, {
          ...team.leader,
          role: team.leader.role || "student",
          teams: allMembers.has(team.leader._id)
            ? [...allMembers.get(team.leader._id).teams, team.name || team.program?.title]
            : [team.name || team.program?.title]
        });
      }

      // Add team members
      if (team.members) {
        team.members.filter(Boolean).forEach(member => {
          if (member) {
            allMembers.set(member._id, {
              ...member,
              role: member.role || "student",
              teams: allMembers.has(member._id)
                ? [...allMembers.get(member._id).teams, team.name || team.program?.title]
                : [team.name || team.program?.title]
            });
          }
        });
      }
    });
  }

  // Add current user if not already in the list
  if (user && !allMembers.has(user._id)) {
    const userTeams = myTeams?.map(t => t.name || t.program?.title || "Team") || [];
    allMembers.set(user._id, {
      ...user,
      role: user.role,
      teams: userTeams
    });
  }

  console.log("All members collected:", Array.from(allMembers.values()));

  const teamMembersArray = Array.from(allMembers.values());
  const supervisors = teamMembersArray.filter(m => m.role === "supervisor");
  const students = teamMembersArray.filter(m => m.role === "student" || m.role === "pending");

  console.log("Filtered:", { supervisors, students });

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      supervisor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      student: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      admin: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return variants[role] || variants.student;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar user={user} />

      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Team</h1>
            <p className="text-muted-foreground mt-1">Connect with your team members and supervisors</p>
          </div>

          {/* Supervisors Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Supervisors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supervisors.map((supervisor) => (
                <div
                  key={supervisor._id}
                  className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 border border-border">
                      <AvatarImage src={supervisor.picture} />
                      <AvatarFallback>{supervisor.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{supervisor.name}</h3>
                      <Badge variant="outline" className={`${getRoleBadge(supervisor.role)} mt-1`}>
                        {supervisor.role}
                      </Badge>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{supervisor.email}</span>
                        </div>
                        {supervisor.nidn && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>NIDN: {supervisor.nidn}</span>
                          </div>
                        )}
                        {supervisor.teams && supervisor.teams.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Teams:</p>
                            <div className="flex flex-wrap gap-1">
                              {supervisor.teams.map((team: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {team}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Students Section */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Team Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((member) => (
                <div
                  key={member._id}
                  className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 border border-border">
                      <AvatarImage src={member.picture} />
                      <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
                      <Badge variant="outline" className={`${getRoleBadge(member.role)} mt-1`}>
                        {member.role}
                      </Badge>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        {member.studentId && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>ID: {member.studentId}</span>
                          </div>
                        )}
                        {member.teams && member.teams.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Teams:</p>
                            <div className="flex flex-wrap gap-1">
                              {member.teams.map((team: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {team}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {teamMembersArray.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold text-foreground mb-2">No team members yet</h3>
              <p className="text-muted-foreground">Join a team to see your colleagues here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
