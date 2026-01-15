import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
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

export function DashboardOverview({ teams, todaysAttendance, isReadOnly = false }: DashboardOverviewProps) {
  const [checkIn] = useMutation(CHECK_IN_MUTATION);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null); // Id<"teams"> replace
  const today = new Date().toISOString().split("T")[0];

  const handleCheckInClick = (teamId: string) => { // Id<"teams">
    if (isReadOnly) return;
    setSelectedTeamId(teamId);
  };

  const handleSubmitAttendance = async (status: "present" | "permission", excuse?: string, proofUrl?: string) => {
    if (!selectedTeamId) return;

    try {
      await checkIn({
        variables: {
          input: {
            teamId: selectedTeamId,
            date: today,
            status,
            excuse,
            proofUrl,
          },
        },
        refetchQueries: ['GetDashboardData'] // Refetch dashboard to update attendance status
      });
      toast.success(status === "present" ? "Absensi berhasil dikirim!" : "Izin berhasil dikirim");
      setSelectedTeamId(null);
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast.error(error.message || "Gagal mengirim absensi.");
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
                Progres Program Kerja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(!teams || teams.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada program kerja
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Lihat program kerja di halaman Program Kerja
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
                Absensi
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
                          {hasCheckedIn ? "Sudah check-in hari ini" : "Belum check-in"}
                        </p>
                      </div>
                      {hasCheckedIn ? (
                        <div className="flex items-center gap-1.5 text-green-500">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Sudah check-in</span>
                        </div>
                      ) : (
                        isReadOnly ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                             <Clock className="w-4 h-4" />
                             <span className="text-xs font-medium">Tertunda</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCheckInClick(teamId)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Isi Absensi
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
                {(!teams || teams.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada tim
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed - showing activity for the first team for now */}
        <RecentActivity />
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
