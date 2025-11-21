import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { CheckCircle, Calendar, Users, Download } from "lucide-react";
import { format } from "date-fns";
import { Id } from "../../../convex/_generated/dataModel";

function getCurrentWeek(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
}

function formatWeekRange(summary: any): string {
  if (!summary || !summary.daily || summary.daily.length === 0) return "";
  const first = summary.daily[0].date;
  const last = summary.daily[summary.daily.length - 1].date;
  return `${format(new Date(first), "MMM dd")} - ${format(new Date(last), "MMM dd, yyyy")}`;
}

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM dd");
}

function getTeamMembers(team: any): any[] {
  if (!team) return [];
  const members = [];
  if (team.leader) members.push(team.leader);
  if (team.members) members.push(...team.members.filter((m: any) => m));
  return members;
}

export function AttendanceReviews() {
  const [selectedProgram, setSelectedProgram] = useState<Id<"programs"> | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Id<"teams"> | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());

  const programs = useQuery(api.programs.getAllPrograms, {
    includeArchived: false,
  });
  const teamsForProgram = useQuery(
    api.teams.getTeamsByProgram,
    selectedProgram ? { programId: selectedProgram } : "skip"
  );
  const attendanceSummary = useQuery(
    api.attendance.getWeeklyAttendanceSummary,
    selectedTeam
      ? {
          teamId: selectedTeam,
          week: selectedWeek,
        }
      : "skip"
  );

  const handleWeekChange = (direction: "prev" | "next") => {
    const [year, weekNum] = selectedWeek.split("-W").map(Number);
    let newWeek = weekNum + (direction === "next" ? 1 : -1);
    let newYear = year;

    if (newWeek < 1) {
      newWeek = 52;
      newYear -= 1;
    } else if (newWeek > 52) {
      newWeek = 1;
      newYear += 1;
    }

    setSelectedWeek(`${newYear}-W${newWeek.toString().padStart(2, "0")}`);
  };

  const handleExportAttendance = () => {
    if (!attendanceSummary || !selectedTeam) {
      return;
    }

    const team = teamsForProgram?.find((t) => t._id === selectedTeam);
    if (!team) return;

    const members = getTeamMembers(team);
    let csvContent = `Weekly Attendance Summary - ${formatWeekRange(attendanceSummary)}\n`;
    csvContent += `Team: ${team.name || `Team ${team._id.slice(-6)}`}\n`;
    csvContent += `Program: ${team.program?.title || "Unknown"}\n\n`;

    csvContent += "Student,";
    attendanceSummary.daily.forEach((day: any) => {
      csvContent += `${formatDate(day.date)},`;
    });
    csvContent += "Total\n";

    members.forEach((member) => {
      csvContent += `${member.name},`;
      attendanceSummary.daily.forEach((day: any) => {
        const present = day.attendees.some(
          (attendee: any) =>
            attendee.userId === (member._id as unknown as string)
        );
        csvContent += `${present ? "Present" : "Absent"},`;
      });
      const total = attendanceSummary.totals.find(
        (total: any) =>
          total.userId === (member._id as unknown as string)
      )?.presentCount || 0;
      csvContent += `${total}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `attendance_${team._id.slice(-6)}_${selectedWeek}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Reviews</h1>
        <p className="text-gray-600 mt-2">
          Review student attendance submissions per team
        </p>
      </div>

      {/* Program Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Program
        </label>
        <select
          value={selectedProgram || ""}
          onChange={(e) => {
            setSelectedProgram(e.target.value as Id<"programs"> | null);
            setSelectedTeam(null);
          }}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Select a program</option>
          {programs?.map((program) => (
            <option key={program._id} value={program._id}>
              {program.title}
            </option>
          ))}
        </select>
      </div>

      {/* Team Selection */}
      {selectedProgram && (
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Team
          </label>
          <select
            value={selectedTeam || ""}
            onChange={(e) => {
              setSelectedTeam(e.target.value as Id<"teams"> | null);
            }}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select a team</option>
            {teamsForProgram?.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name || `Team ${team._id.slice(-6)}`} - {team.leader?.name || "Unknown"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Attendance Summary */}
      {selectedTeam && attendanceSummary && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Weekly Attendance ({formatWeekRange(attendanceSummary)})
              </h2>
              <p className="text-sm text-gray-500">
                {teamsForProgram?.find((t) => t._id === selectedTeam)?.program?.title || "Unknown Program"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleWeekChange("prev")}
                className="p-2 border rounded-lg hover:bg-gray-50"
              >
                ←
              </button>
              <span className="text-sm font-medium text-gray-700 px-3">
                Week {selectedWeek}
              </span>
              <button
                onClick={() => handleWeekChange("next")}
                className="p-2 border rounded-lg hover:bg-gray-50"
              >
                →
              </button>
              <button
                onClick={handleExportAttendance}
                className="inline-flex items-center space-x-2 px-3 py-2 border rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4 font-medium">Student</th>
                  {attendanceSummary.daily.map((day: any) => (
                    <th
                      key={day.date}
                      className="py-2 px-2 font-medium text-center"
                    >
                      {formatDate(day.date)}
                    </th>
                  ))}
                  <th className="py-2 px-2 font-medium text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {getTeamMembers(
                  teamsForProgram?.find((t) => t._id === selectedTeam)
                ).map((member) => (
                  <tr key={member._id}>
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      {member.name}
                    </td>
                    {attendanceSummary.daily.map((day: any) => {
                      const present = day.attendees.some(
                        (attendee: any) =>
                          attendee.userId === (member._id as unknown as string)
                      );
                      return (
                        <td
                          key={`${member._id}-${day.date}`}
                          className="py-2 px-2 text-center"
                        >
                          {present ? (
                            <CheckCircle className="w-4 h-4 text-green-600 inline" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-2 text-center font-semibold text-gray-700">
                      {attendanceSummary.totals.find(
                        (total: any) =>
                          total.userId === (member._id as unknown as string)
                      )?.presentCount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTeam && !attendanceSummary && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Loading attendance data...
        </div>
      )}

      {!selectedTeam && selectedProgram && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Please select a team to view attendance
        </div>
      )}

      {!selectedProgram && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Please select a program to view attendance reviews
        </div>
      )}
    </div>
  );
}

