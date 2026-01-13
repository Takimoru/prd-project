import { useQuery } from "@apollo/client";
import { GET_TEAM, GET_PROGRAM } from "@/graphql/admin";
import { GET_TEAM_ATTENDANCE } from "@/graphql/dashboard";

import { DashboardOverview } from "../student/components/dashboard/DashboardOverview";

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SpectatorDashboardProps {
  teamId: string;
}

export function SpectatorDashboard({ teamId }: SpectatorDashboardProps) {
  // Fetch team details to get program info and members
  const { data: teamData, loading: teamLoading } = useQuery(GET_TEAM, {
    variables: { id: teamId },
    skip: !teamId,
  });

  const team = teamData?.team;

  const { data: programData, loading: programLoading } = useQuery(GET_PROGRAM, {
    variables: { id: team?.programId },
    skip: !team?.programId,
  });

  const program = programData?.program;

  // For spectator view, we can use the team leader as the "perspective" user for some components
  // Using the team leader is a good approximation for "viewing what the student sees"
  const leaderId = team?.leaderId;

  // Fetch data as if we were the student leader, but primarily to populate the views
  const { data: attendanceData, loading: attendanceLoading } = useQuery(GET_TEAM_ATTENDANCE, {
    variables: {
      teamId,
      date: new Date().toISOString().split("T")[0],
    },
    skip: !teamId,
  });

  const todaysAttendance = attendanceData?.attendanceByTeam || [];

  if (teamLoading || programLoading || attendanceLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!team || !program || !leaderId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Team data not found.</p>
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
          <p className="text-muted-foreground mt-1">
            Viewing as Supervisor (Read-Only)
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-orange-600 border-orange-200 bg-orange-50">
          Read Only
        </Badge>
      </div>

      <DashboardOverview
        userId={leaderId}
        teams={[team]}
        todaysAttendance={todaysAttendance}
        isReadOnly={true}
      />
    </div>
  );
}
