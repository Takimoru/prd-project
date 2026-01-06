import { useState } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import { format } from "date-fns";
import { AttendanceSummary, TeamMember } from "../types/attendance";
import {
  GET_PROGRAMS,
  GET_TEAMS_BY_PROGRAM,
  GET_WEEKLY_ATTENDANCE_SUMMARY,
  EXPORT_ATTENDANCE_CSV,
} from "../../../graphql/admin";

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
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());

  // GraphQL Queries
  const { data: programsData } = useQuery(GET_PROGRAMS, {
    variables: { includeArchived: false },
  });
  const programs = programsData?.programs || [];

  const { data: teamsData } = useQuery(GET_TEAMS_BY_PROGRAM, {
    variables: { programId: selectedProgram },
    skip: !selectedProgram,
  });
  const teamsForProgram = teamsData?.teams || [];

  const { data: attendanceData } = useQuery(GET_WEEKLY_ATTENDANCE_SUMMARY, {
    variables: {
      teamId: selectedTeam,
      week: selectedWeek,
    },
    skip: !selectedTeam,
  });
  const attendanceSummary = attendanceData?.weeklyAttendanceSummary as
    | AttendanceSummary
    | undefined;

  const [exportAttendanceCSV] = useLazyQuery(EXPORT_ATTENDANCE_CSV);

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
    if (
      !summary ||
      !summary.students ||
      summary.students.length === 0 ||
      summary.students[0].dailyRecords.length === 0
    )
      return "";
    const first = summary.students[0].dailyRecords[0].date;
    const last =
      summary.students[0].dailyRecords[
        summary.students[0].dailyRecords.length - 1
      ].date;
    return `${format(new Date(first), "MMM dd")} - ${format(
      new Date(last),
      "MMM dd, yyyy"
    )}`;
  };

  const formatDate = (dateStr: string): string => {
    return format(new Date(dateStr), "MMM dd");
  };

  const handleExportAttendance = async () => {
    if (!selectedProgram) {
      return;
    }

    try {
      // Use GraphQL export query
      const { data } = await exportAttendanceCSV({
        variables: { programId: selectedProgram },
      });

      if (data?.exportAttendanceCSV?.url) {
        // Download the CSV file
        const fullUrl = data.exportAttendanceCSV.url.startsWith("http")
          ? data.exportAttendanceCSV.url
          : `http://localhost:4000${data.exportAttendanceCSV.url}`;
        window.open(fullUrl, "_blank");
        return;
      }
    } catch (error: any) {
      console.error("Failed to export via GraphQL, using fallback:", error);
      console.error("Failed to export attendance:", error);
      // Fallback to client-side CSV generation
      if (
        !attendanceSummary ||
        !selectedTeam ||
        !attendanceSummary.students.length
      ) {
        return;
      }

      const team = teamsForProgram?.find((t: any) => t.id === selectedTeam);
      if (!team) return;

      const programTitle =
        programs?.find((p: any) => p.id === selectedProgram)?.title ||
        "Unknown";
      const dates = attendanceSummary.students[0].dailyRecords.map(
        (d: any) => d.date
      );

      let csvContent = `Weekly Attendance Summary - ${formatWeekRange(
        attendanceSummary
      )}\n`;
      csvContent += `Team: ${team.name || `Team ${team.id.slice(-6)}`}\n`;
      csvContent += `Program: ${programTitle}\n\n`;

      csvContent += "Student,";
      dates.forEach((date) => {
        csvContent += `${formatDate(date)},`;
      });
      csvContent += "Total,Status\n";

      attendanceSummary.students.forEach((student) => {
        csvContent += `${student.userName},`;

        const isApproved = student.approvalStatus === "approved";

        student.dailyRecords.forEach((day: any) => {
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

        csvContent += `${
          isApproved ? student.presentCount : "-"
        },${student.approvalStatus.toUpperCase()}\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `attendance_${team.id.slice(-6)}_${selectedWeek}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
