// import { Id } from "@/convex/_generated/dataModel";
import { useAttendanceReviews } from "./hooks/useAttendanceReviews";
import { AttendanceControls } from "./components/attendance/AttendanceControls";
import { AttendanceTable } from "./components/attendance/AttendanceTable";
import { AdminHeader } from "./components/AdminHeader";


export function AttendanceReviews() {
  const {
    selectedProgram,
    setSelectedProgram,
    selectedTeam,
    setSelectedTeam,
    selectedWeek,
    programs,
    teamsForProgram,
    attendanceSummary,
    handleWeekChange,
    handleExportAttendance,
    
    formatWeekRange,
   
  } = useAttendanceReviews();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Attendance Reviews"
        description="Review student attendance submissions per team"
      />

      <div className="space-y-6">
        {/* Program Selection */}
        <div className="bg-card rounded-lg shadow-lg border border-border p-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Select Program
          </label>
          <select
            value={selectedProgram || ""}
            onChange={(e) => {
              setSelectedProgram(e.target.value as string | null);
              setSelectedTeam(null);
            }}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="">Select a program</option>
            {programs?.map((program: { _id: string; title: string }) => (
              <option key={program._id} value={program._id}>
                {program.title}
              </option>
            ))}
          </select>
        </div>

        {/* Team Selection */}
        {selectedProgram && (
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Team
            </label>
            <select
              value={selectedTeam || ""}
              onChange={(e) => {
                setSelectedTeam(e.target.value as string | null);
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="">Select a team</option>
              {teamsForProgram?.map((team: { _id: string; name: string; leader?: { name: string } }) => (
                <option key={team._id} value={team._id}>
                  {team.name || `Team ${team._id.slice(-6)}`} - {team.leader?.name || "Unknown"}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Attendance Summary */}
        {selectedTeam && attendanceSummary && (
          <div className="bg-card rounded-lg shadow-lg border border-border">
            <AttendanceControls
              weekRange={formatWeekRange(attendanceSummary)}
              selectedWeek={selectedWeek}
              programName={programs?.find((p: { _id: string; title: string }) => p._id === selectedProgram)?.title || "Unknown Program"}
              onWeekChange={handleWeekChange}
              onExport={handleExportAttendance}

            />
            
            <AttendanceTable
              attendanceSummary={attendanceSummary}
            />
          </div>
        )}

        {selectedTeam && !attendanceSummary && (
          <div className="bg-card rounded-lg shadow-lg border border-border p-6 text-center text-muted-foreground">
            Loading attendance data...
          </div>
        )}

        {!selectedTeam && selectedProgram && (
          <div className="bg-card rounded-lg shadow-lg border border-border p-6 text-center text-muted-foreground">
            Please select a team to view attendance
          </div>
        )}

        {!selectedProgram && (
          <div className="bg-card rounded-lg shadow-lg border border-border p-6 text-center text-muted-foreground">
            Please select a program to view attendance reviews
          </div>
        )}
      </div>
    </div>
  );
}

