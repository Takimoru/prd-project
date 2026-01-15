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
    isLoading,
    teamsCount: myTeams?.length,
  });

  // Collect all unique team members and supervisors
  const allMembers = new Map();
  
  if (myTeams) {
    myTeams.forEach(team => {
      console.log("Processing team:", team);
      
      // Add supervisor
      if (team.supervisor) {
        const supervisorId = team.supervisor.id || team.supervisor._id;
        if (supervisorId) {
          allMembers.set(supervisorId, {
            ...team.supervisor,
            id: supervisorId,
            role: "supervisor",
            teams: allMembers.has(supervisorId)
              ? [...allMembers.get(supervisorId).teams, team.name || team.program?.title]
              : [team.name || team.program?.title]
          });
        }
      }

      // Add team leader
      if (team.leader) {
        const leaderId = team.leader.id || team.leader._id;
        if (leaderId) {
          allMembers.set(leaderId, {
            ...team.leader,
            id: leaderId,
            role: team.leader.role || "student",
            teams: allMembers.has(leaderId)
              ? [...allMembers.get(leaderId).teams, team.name || team.program?.title]
              : [team.name || team.program?.title]
          });
        }
      }

      // Add team members
      if (team.members) {
        team.members.filter(Boolean).forEach((member: any) => {
          if (member) {
            const memberId = member.id || member._id;
            if (memberId) {
              const existing = allMembers.get(memberId);
              allMembers.set(memberId, {
                ...member,
                id: memberId,
                role: member.role || "student",
                teams: existing
                  ? [...existing.teams, team.name || team.program?.title]
                  : [team.name || team.program?.title]
              });
            }
          }
        });
      }
    });
  }

  // Ensure user is in the list
  if (user) {
    const userId = user.id || user._id;
    if (userId && !allMembers.has(userId)) {
      allMembers.set(userId, {
        ...user,
        id: userId,
        role: user.role || "student",
        teams: []
      });
    }
  }

  console.log("All members collected:", Array.from(allMembers.values()));

  const teamMembersArray = Array.from(allMembers.values());
  const supervisors = teamMembersArray.filter(m => 
    m.role?.toLowerCase() === "supervisor"
  );
  const students = teamMembersArray.filter(m => 
    m.role?.toLowerCase() !== "supervisor"
  );

  console.log("Filtered members:", { 
    total: teamMembersArray.length,
    supervisors: supervisors.length, 
    students: students.length,
    allRoles: teamMembersArray.map(m => m.role)
  });

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
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Tim</h1>
            <p className="text-muted-foreground mt-1">Terhubung dengan anggota tim dan dosen pembimbing Anda</p>
            {myTeams && myTeams.length > 0 && (
              <p className="text-xs text-blue-500 mt-2">
                Ditemukan {myTeams.length} tim dengan total {teamMembersArray.length} anggota.
              </p>
            )}
            {(!myTeams || myTeams.length === 0) && !isLoading && (
              <p className="text-xs text-orange-500 mt-2">
                Tidak ada tim ditemukan untuk akun Anda.
              </p>
            )}
          </div>

          {/* Supervisors Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Dosen Pembimbing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supervisors.map((supervisor) => (
                <div
                  key={supervisor.id}
                  className="p-4 rounded-xl border border-blue-100 bg-white shadow-sm hover:shadow-md transition-all group"
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
            <h2 className="text-xl font-semibold text-foreground mb-4">Anggota Tim</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-xl border border-sky-100 bg-white shadow-sm hover:shadow-md transition-all group"
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
              <h3 className="text-lg font-semibold text-foreground mb-2">Belum ada anggota tim</h3>
              <p className="text-muted-foreground">Bergabung dengan tim untuk melihat rekan Anda di sini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
