import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { CheckCircle2, Clock, CheckCircle } from "lucide-react";
// import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "@apollo/client";
import { CHECK_IN_MUTATION } from "../../../../graphql/dashboard";
import { toast } from "react-hot-toast";
import { RecentActivity } from "./RecentActivity";
import { AttendanceDialog } from "../attendance/AttendanceDialog";

interface DashboardOverviewProps {
  userId: string; // Id<"users">;
  teams: any[];
  todaysAttendance: any[];
  isReadOnly?: boolean;
}

export function DashboardOverview({ userId, teams, todaysAttendance, isReadOnly = false }: DashboardOverviewProps) {
  const [checkIn] = useMutation(CHECK_IN_MUTATION);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null); // Id<"teams"> replace
  const today = new Date().toISOString().split("T")[0];

  const handleCheckInClick = (teamId: string) => { // Id<"teams">
    if (isReadOnly) return;
    setSelectedTeamId(teamId);
  };

  const handleSubmitAttendance = async (status: "present" | "permission", excuse?: string) => {
    if (!selectedTeamId) return;

    try {
      await checkIn({
        variables: {
          input: {
            teamId: selectedTeamId,
            date: today,
            status,
            excuse,
          },
        },
        refetchQueries: ['GetDashboardData'] // Refetch dashboard to update attendance status
      });
      toast.success(status === "present" ? "Attendance submitted!" : "Permission submitted");
      setSelectedTeamId(null);
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast.error(error.message || "Failed to submit attendance.");
      throw error;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Top Row: Progress and Attendance */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Work Programs Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                </div>
                Work Programs Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(!teams || teams.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No work programs yet
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    View work programs in the Projects page
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-500" />
                </div>
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teams?.map((team: any) => {
                  const teamId = team.id || team._id;
                  const hasCheckedIn = todaysAttendance?.some(
                    (record: any) => record.teamId === teamId && record.date === today
                  );
                  
                  // In Spectator mode, show "Not yet" instead of button if not checked in
                  return (
                    <div key={teamId} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {hasCheckedIn ? "Checked in today" : "Not checked in"}
                        </p>
                      </div>
                      {hasCheckedIn ? (
                        <div className="flex items-center gap-1.5 text-green-500">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Checked in</span>
                        </div>
                      ) : (
                        isReadOnly ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                             <Clock className="w-4 h-4" />
                             <span className="text-xs font-medium">Pending</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCheckInClick(teamId)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Check In
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
                {(!teams || teams.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No teams yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed - showing activity for the first team for now */}
        <RecentActivity teamId={teams?.[0]?.id || teams?.[0]?._id} />
      </div>

      {!isReadOnly && (
        <AttendanceDialog 
          isOpen={!!selectedTeamId}
          onClose={() => setSelectedTeamId(null)}
          onSubmit={handleSubmitAttendance}
        />
      )}
    </>
  );
}
