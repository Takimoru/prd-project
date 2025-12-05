import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import toast from "react-hot-toast";
import { useMemo, useState } from "react";
import { Id, Doc } from "../../../../../convex/_generated/dataModel";
import { AttendanceDialog } from "../attendance/AttendanceDialog";

interface MyTeamsProps {
  myTeams: (Doc<"teams"> & { 
    program?: Doc<"programs"> | null; 
    supervisor?: Doc<"users"> | null; 
    members?: (Doc<"users"> | null)[];
  })[] | undefined | null;
  userId: Id<"users">;
  todaysAttendance: Doc<"attendance">[] | undefined | null;
}

export function MyTeams({ myTeams, userId, todaysAttendance }: MyTeamsProps) {
  const checkIn = useMutation(api.attendance.checkIn);
  const today = new Date().toISOString().split("T")[0];
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null);

  const hasCheckedIn = useMemo(() => {
    if (!todaysAttendance) return () => false;
    return (teamId: string) =>
      todaysAttendance.some(
        (record) => record.teamId === (teamId as any) && record.date === today
      );
  }, [todaysAttendance, today]);

  const handleCheckInClick = (teamId: Id<"teams">) => {
    setSelectedTeamId(teamId);
  };

  const handleSubmitAttendance = async (status: "present" | "permission", excuse?: string) => {
    if (!selectedTeamId) return;

    try {
      await checkIn({
        teamId: selectedTeamId,
        userId: userId,
        date: today,
        status,
        excuse,
      });
      toast.success(status === "present" ? "Attendance submitted!" : "Permission submitted");
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast.error(error.message || "Failed to submit attendance.");
      throw error; // Re-throw to let the dialog handle state if needed
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
          {myTeams.map((team) => (
            <div
              key={team._id}
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
                {hasCheckedIn(team._id as any) ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Checked in today
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheckInClick(team._id)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    Check In
                  </button>
                )}
                <Link
                  to={`/team/${team._id}`}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Open team workspace →
                </Link>
              </div>
            </div>
          ))}
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
