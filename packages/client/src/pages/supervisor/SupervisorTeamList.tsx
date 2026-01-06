import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { SupervisorLayout } from "./components/SupervisorLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, MapPin } from "lucide-react";

export function SupervisorTeamList() {
  const { user } = useAuth();

  const teams = useQuery(
    api.teams.getTeamsWithMembersBySupervisor,
    user?._id ? { supervisorId: user._id } : "skip"
  );

  // Collect all unique team members and supervisors
  const allMembers = new Map();
  
  if (teams) {
    teams.forEach(team => {
      // Add supervisor (could be current user or other supervisors)
      if (team.supervisor) {
        allMembers.set(team.supervisor._id, {
          ...team.supervisor,
          role: "supervisor",
          teams: allMembers.has(team.supervisor._id) 
            ? [...allMembers.get(team.supervisor._id).teams, team.name]
            : [team.name]
        });
      }

      // Add team leader
      if (team.leader) {
        allMembers.set(team.leader._id, {
          ...team.leader,
          role: team.leader.role || "student",
          teams: allMembers.has(team.leader._id)
            ? [...allMembers.get(team.leader._id).teams, team.name]
            : [team.name]
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
                ? [...allMembers.get(member._id).teams, team.name]
                : [team.name]
            });
          }
        });
      }
    });
  }

  const teamMembersArray = Array.from(allMembers.values());
  const supervisors = teamMembersArray.filter(m => m.role === "supervisor");
  const students = teamMembersArray.filter(m => m.role === "student" || m.role === "pending");

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      supervisor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      student: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      admin: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return variants[role] || variants.student;
  };

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">My Teams</h1>
          <p className="text-muted-foreground mt-1">Connect with your team members and supervisors</p>
        </div>

        {/* Supervisors Section */}
        {supervisors.length > 0 && (
          <div>
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
        )}

        {/* Students Section */}
        {students.length > 0 && (
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
        )}

        {teamMembersArray.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-lg font-semibold text-foreground mb-2">No team members yet</h3>
            <p className="text-muted-foreground">You will see your team members here once teams are assigned</p>
          </div>
        )}
      </div>
    </SupervisorLayout>
  );
}
