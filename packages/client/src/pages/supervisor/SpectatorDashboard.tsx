import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { DashboardOverview } from "../student/components/dashboard/DashboardOverview";

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SpectatorDashboardProps {
  teamId: string;
}

export function SpectatorDashboard({ teamId }: SpectatorDashboardProps) {
  // Fetch team details to get program info and members
  const team = useQuery(api.teams.getTeamById, { teamId: teamId as Id<"teams"> });
  const program = useQuery(
    api.programs.getProgramById,
    team ? { programId: team.programId } : "skip"
  );

  // For spectator view, we can use the team leader as the "perspective" user for some components
  // or pass specific flags to components to disable editing.
  // Using the team leader is a good approximation for "viewing what the student sees"
  const leaderId = team?.leaderId;

  // Fetch data as if we were the student leader, but primarily to populate the views
  const todaysAttendance = useQuery(api.attendance.getAttendanceByTeamDate, {
    teamId: teamId as Id<"teams">,
    date: new Date().toISOString().split("T")[0],
  });

  if (!team || !program || !leaderId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Spectator Mode: {team.name}
          </h2>
          <p className="text-muted-foreground">
            Viewing as Supervisor (Read-Only)
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-orange-600 border-orange-200 bg-orange-50">
          Read Only
        </Badge>
      </div>

      {/* Reusing DashboardOverview but we will need to ensure it gracefully handles "read only" 
          For now, passing the leaderId allows fetching, but actions might still be visible.
          Ideally, DashboardOverview should accept an `isReadOnly` prop.
      */}
      <DashboardOverview
        userId={leaderId}
        teams={[team]} // Show only this team
        todaysAttendance={todaysAttendance || []}
        isReadOnly={true} // We need to add this prop to DashboardOverview
      />
    </div>
  );
}
