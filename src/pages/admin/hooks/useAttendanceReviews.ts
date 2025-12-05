import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { format } from "date-fns";
import { AttendanceSummary, TeamMember } from "../types/attendance";

function getCurrentWeek(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
}

export function useAttendanceReviews() {
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
  ) as AttendanceSummary | undefined;

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

  const getTeamMembers = (team: any): TeamMember[] => {
    if (!team) return [];
    const members: TeamMember[] = [];
    if (team.leader) members.push(team.leader);
    if (team.members) members.push(...team.members.filter((m: any) => m));
    return members;
  };

  const formatWeekRange = (summary: AttendanceSummary | undefined): string => {
    if (!summary || !summary.students || summary.students.length === 0 || summary.students[0].dailyRecords.length === 0) return "";
    const first = summary.students[0].dailyRecords[0].date;
    const last = summary.students[0].dailyRecords[summary.students[0].dailyRecords.length - 1].date;
    return `${format(new Date(first), "MMM dd")} - ${format(new Date(last), "MMM dd, yyyy")}`;
  };

  const formatDate = (dateStr: string): string => {
    return format(new Date(dateStr), "MMM dd");
  };

  const handleExportAttendance = () => {
    if (!attendanceSummary || !selectedTeam || !attendanceSummary.students.length) {
      return;
    }

    const team = teamsForProgram?.find((t) => t._id === selectedTeam);
    if (!team) return;

    const programTitle = programs?.find(p => p._id === selectedProgram)?.title || "Unknown";
    const dates = attendanceSummary.students[0].dailyRecords.map(d => d.date);

    let csvContent = `Weekly Attendance Summary - ${formatWeekRange(attendanceSummary)}\n`;
    csvContent += `Team: ${team.name || `Team ${team._id.slice(-6)}`}\n`;
    csvContent += `Program: ${programTitle}\n\n`;

    csvContent += "Student,";
    dates.forEach((date) => {
      csvContent += `${formatDate(date)},`;
    });
    csvContent += "Total,Status\n";

    attendanceSummary.students.forEach((student) => {
      csvContent += `${student.userName},`;
      
      // If approved, show data. If not, show pending/masked
      const isApproved = student.approvalStatus === "approved";

      student.dailyRecords.forEach((day) => {
        let statusText = "Absent";
        if (isApproved) {
            if (day.status === "present") statusText = "Present";
            else if (day.status === "permission") statusText = "Permission";
            else if (day.status === "alpha") statusText = "Alpha";
        } else {
            statusText = "Pending Approval";
        }
        csvContent += `${statusText},`;
      });
      
      csvContent += `${isApproved ? student.presentCount : "-"},${student.approvalStatus.toUpperCase()}\n`;
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

  return {
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
    getTeamMembers,
    formatWeekRange,
    formatDate,
  };
}
