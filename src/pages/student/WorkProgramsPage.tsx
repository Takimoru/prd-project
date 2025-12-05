import { useStudentData } from "./hooks/useStudentData";
import { WorkProgramList } from "./components/work-programs/WorkProgramList";
import { DashboardSidebar } from "./components/dashboard/DashboardSidebar";
import { Loader2 } from "lucide-react";

export function WorkProgramsPage() {
  const { user, myTeams } = useStudentData();

  if (!user || !myTeams) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // Prioritize the team where the user is the leader
  const primaryTeam = myTeams.find(t => t.leaderId === user._id) || myTeams[0];

  if (!primaryTeam) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar user={user} />
        <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0 px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-foreground mb-2">No Team Assigned</h2>
            <p className="text-muted-foreground">
              You need to be assigned to a team to view work programs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isLeader = primaryTeam.leaderId === user._id;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar user={user} />
      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0 px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-900 rounded text-xs font-mono overflow-auto max-h-60">
          <strong>DEBUG INFO:</strong><br/>
          Current User ID: {user._id}<br/>
          Current User Name: {user.name}<br/>
          <br/>
          <strong>Teams Found ({myTeams.length}):</strong>
          <ul className="list-disc pl-4 mt-1">
            {myTeams.map(t => (
              <li key={t._id}>
                Team: {t.name || "Unnamed"} ({t._id})<br/>
                Leader ID: {t.leaderId}<br/>
                Is Leader: {t.leaderId === user._id ? "YES" : "NO"}
              </li>
            ))}
          </ul>
          <br/>
          <strong>Selected Team:</strong><br/>
          Name: {primaryTeam.name}<br/>
          Leader ID: {primaryTeam.leaderId}<br/>
          Is Leader Variable: {isLeader ? "YES" : "NO"}
        </div>
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-900 rounded text-xs font-mono overflow-auto max-h-60">
          <strong>DEBUG INFO:</strong><br/>
          Current User ID: {user._id}<br/>
          Current User Name: {user.name}<br/>
          <br/>
          <strong>Teams Found ({myTeams.length}):</strong>
          <ul className="list-disc pl-4 mt-1">
            {myTeams.map(t => (
              <li key={t._id}>
                Team: {t.name || "Unnamed"} ({t._id})<br/>
                Leader ID: {t.leaderId}<br/>
                Is Leader: {t.leaderId === user._id ? "YES" : "NO"}
              </li>
            ))}
          </ul>
          <br/>
          <strong>Selected Team:</strong><br/>
          Name: {primaryTeam.name}<br/>
          Leader ID: {primaryTeam.leaderId}<br/>
          Is Leader Variable: {isLeader ? "YES" : "NO"}
        </div>
        <WorkProgramList teamId={primaryTeam._id} isLeader={isLeader} />
      </div>
    </div>
  );
}
