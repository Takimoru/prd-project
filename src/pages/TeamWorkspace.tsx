import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useMemo, useState } from "react";
import {
  CheckCircle,
  Circle,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { AttendanceDialog } from "./student/components/AttendanceDialog";

export function TeamWorkspace() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const team = useQuery(
    api.teams.getTeamById,
    teamId ? { teamId: teamId as any } : "skip"
  );
  const tasks = useQuery(
    api.tasks.getTasksByTeamWeek,
    teamId
      ? {
          teamId: teamId as any,
          week: selectedWeek,
        }
      : "skip"
  );
  const attendance = useQuery(
    api.attendance.getAttendanceByTeamDate,
    teamId
      ? {
          teamId: teamId as any,
          date: new Date().toISOString().split("T")[0],
        }
      : "skip"
  );

  const createTask = useMutation(api.tasks.createTask);
  const checkIn = useMutation(api.attendance.checkIn);
  const completeTask = useMutation(api.tasks.completeTask);
  const weeklySummary = useQuery(
    api.attendance.getWeeklyAttendanceSummary,
    teamId
      ? {
          teamId: teamId as any,
          week: selectedWeek,
        }
      : "skip"
  );

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);

  const hasCheckedInToday =
    attendance?.some((a) => a.userId === user?._id) || false;

  const handleCheckInClick = () => {
    setShowAttendanceDialog(true);
  };

  const handleSubmitAttendance = async (status: "present" | "permission", excuse?: string) => {
    if (!teamId || !user) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      await checkIn({
        teamId: teamId as any,
        userId: user._id,
        date: today,
        status,
        excuse,
      });
      toast.success(status === "present" ? "Check-in successful!" : "Permission submitted");
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast.error(error.message || "Failed to check in. Please try again.");
      throw error;
    }
  };

  const handleCreateTask = async () => {
    if (!teamId) {
      toast.error("No team selected");
      return;
    }

    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create tasks");
      return;
    }

    if (!isLeader) {
      toast.error("Only team leaders can create tasks");
      return;
    }

    try {
      await createTask({
        teamId: teamId as any,
        title: newTaskTitle.trim(),
        assignedTo: user._id,
        week: selectedWeek,
      });
      setNewTaskTitle("");
      toast.success("Task created successfully!");
    } catch (error: any) {
      console.error("Failed to create task:", error);
      toast.error(error.message || "Failed to create task. Please try again.");
    }
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    setSelectedWeek((prev) => shiftWeek(prev, direction === "prev" ? -1 : 1));
  };

  const handleExportAttendance = () => {
    if (!weeklySummary) {
      toast.error("Summary not available yet.");
      return;
    }

    const rows: string[] = [];
    rows.push(
      [
        "Student",
        ...weeklySummary.daily.map((day) => day.date),
        "Total Present",
      ].join(",")
    );

    const members = getTeamMembers(team);

    members.forEach((member) => {
      const row = [
        member.name || "Unknown",
        ...weeklySummary.daily.map((day) =>
          day.attendees.some((a) => a.userId === (member._id as unknown as string))
            ? "✔"
            : ""
        ),
        weeklySummary.totals.find(
          (total) => total.userId === (member._id as unknown as string)
        )?.presentCount || 0,
      ];
      rows.push(row.join(","));
    });

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `team_${team?._id}_attendance_${weeklySummary.week}.csv`;
    link.click();
  };

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isLeader = team.leaderId === user?._id;
  const teamMembers = useMemo(() => getTeamMembers(team), [team]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {team.name || "Team Workspace"}
        </h1>
        <p className="text-gray-600 mt-2">Week {selectedWeek}</p>
      </div>

      {/* Daily Check-in */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Daily Check-in
        </h2>
        {hasCheckedInToday ? (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>You've checked in today</span>
          </div>
        ) : (
          <button
            onClick={handleCheckInClick}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Check In
          </button>
        )}
      </div>

      <AttendanceDialog
        isOpen={showAttendanceDialog}
        onClose={() => setShowAttendanceDialog(false)}
        onSubmit={handleSubmitAttendance}
      />

      {/* Weekly Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Weekly Tasks</h2>
          {isLeader && (
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="New task title..."
                className="px-3 py-2 border rounded-lg"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCreateTask();
                  }
                }}
              />
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          )}
        </div>
        <div className="p-6">
          {tasks && tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <button
                    onClick={() => {
                      if (!task.completed) {
                        completeTask({ taskId: task._id });
                      }
                    }}
                    className="flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p
                      className={
                        task.completed
                          ? "text-gray-500 line-through"
                          : "text-gray-900"
                      }
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {task.assignedUser?.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No tasks for this week.</p>
          )}
        </div>
      </div>

      {/* Weekly Attendance Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Weekly Attendance Summary
            </h2>
            <p className="text-sm text-gray-500">
              Track who checked in each day. Use the controls to browse other weeks.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleWeekChange("prev")}
              className="p-2 border rounded-lg hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {formatWeekRange(weeklySummary)}
            </span>
            <button
              onClick={() => handleWeekChange("next")}
              className="p-2 border rounded-lg hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
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
          {weeklySummary ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4 font-medium">Student</th>
                  {weeklySummary.daily.map((day) => (
                    <th key={day.date} className="py-2 px-2 font-medium text-center">
                      {formatDate(day.date)}
                    </th>
                  ))}
                  <th className="py-2 px-2 font-medium text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member._id}>
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      {member.name}
                    </td>
                    {weeklySummary.daily.map((day) => {
                      const present = day.attendees.some(
                        (attendee) =>
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
                      {weeklySummary.totals.find(
                        (total) =>
                          total.userId === (member._id as unknown as string)
                      )?.presentCount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Loading attendance summary...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getCurrentWeek(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
}

function shiftWeek(weekString: string, delta: number): string {
  const [yearStr, weekPart] = weekString.split("-W");
  let year = Number(yearStr);
  let week = Number(weekPart) + delta;

  if (week < 1) {
    year -= 1;
    week += weeksInYear(year);
  } else if (week > weeksInYear(year)) {
    week -= weeksInYear(year);
    year += 1;
  }

  return `${year}-W${week.toString().padStart(2, "0")}`;
}

function weeksInYear(year: number): number {
  const d = new Date(year, 11, 31);
  const week = Math.ceil(
    ((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + d.getDay() + 1) /
      7
  );
  return week;
}

function formatWeekRange(summary: any) {
  if (!summary) return "Loading…";
  return `${summary.startDate} - ${summary.endDate}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getTeamMembers(team: any) {
  if (!team) return [];
  const members = [];
  if (team.leader) members.push(team.leader);
  if (team.members) {
    team.members
      .filter((member: any): member is NonNullable<typeof member> => Boolean(member))
      .forEach((member: any) => members.push(member));
  }
  return members;
}
