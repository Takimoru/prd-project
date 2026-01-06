import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@apollo/client";
import { CHECK_IN_MUTATION } from "@/graphql/dashboard";
import toast from "react-hot-toast";
import { useMemo, useState } from "react";
import { AttendanceDialog } from "../attendance/AttendanceDialog";

interface MyTeamsProps {
  myTeams: any[] | undefined | null;
  userId: string;
  todaysAttendance: any[] | undefined | null;
}

export function MyTeams({ myTeams, userId, todaysAttendance }: MyTeamsProps) {
  const [checkIn] = useMutation(CHECK_IN_MUTATION);
  const today = new Date().toISOString().split("T")[0];
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const hasCheckedIn = useMemo(() => {
    if (!todaysAttendance) return () => false;
    return (teamId: string) =>
      todaysAttendance.some(
        (record: any) => (record.team?.id || record.teamId) === teamId && record.date === today
      );
  }, [todaysAttendance, today]);

  const handleCheckInClick = (teamId: string) => {
    setSelectedTeamId(teamId);
  };

  const handleSubmitAttendance = async (status: "present" | "permission", excuse?: string) => {
    if (!selectedTeamId) return;

    try {
      await checkIn({
        variables: {
          teamId: selectedTeamId,
          status,
          excuse,
        },
        refetchQueries: ['GetDashboardData'],
      });
      toast.success(status === "present" ? "Attendance submitted!" : "Permission submitted");
      setSelectedTeamId(null);
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast.error(error.message || "Failed to submit attendance.");
      throw error;
    }
  };

  if (!myTeams || myTeams.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              My Teams & Attendance
            </h2>
            <p className="text-sm text-gray-500">
              Check in daily and open the team workspace for collaboration.
            </p>
          </div>
          <span className="text-sm text-gray-500">
            Today: {format(new Date(), "MMM dd, yyyy")}
          </span>
        </div>
        <div className="p-6 space-y-4">
          {myTeams.map((team) => {
            const teamId = team.id || team._id;
            return (
              <div
                key={teamId}
                className="border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {team.name || team.program?.title || "Team"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Program: {team.program?.title || "—"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Supervisor: {team.supervisor?.name || "Not assigned"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Members: {team.members?.filter(Boolean).length ? team.members.filter(Boolean).length + 1 : 1}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {hasCheckedIn(teamId) ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Checked in today
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckInClick(teamId)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                    >
                      Check In
                    </button>
                  )}
                  <Link
                    to={`/team/${teamId}`}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Open team workspace →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AttendanceDialog 
        isOpen={!!selectedTeamId}
        onClose={() => setSelectedTeamId(null)}
        onSubmit={handleSubmitAttendance}
      />
    </>
  );
}
