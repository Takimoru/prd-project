import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { CheckCircle, Circle, Plus, Camera, MapPin } from "lucide-react";
import toast from "react-hot-toast";

export function TeamWorkspace() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const team = useQuery(
    api.teams.getTeamById,
    teamId ? { teamId: teamId as any } : "skip"
  );
  const currentWeek = getCurrentWeek();
  const tasks = useQuery(
    api.tasks.getTasksByTeamWeek,
    teamId
      ? {
          teamId: teamId as any,
          week: currentWeek,
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

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showCheckIn, setShowCheckIn] = useState(false);

  const hasCheckedInToday =
    attendance?.some((a) => a.userId === user?._id) || false;

  const handleCheckIn = async () => {
    if (!teamId) {
      toast.error("No team selected");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to check in");
      return;
    }

    if (!team) {
      toast.error("Team not found. Please wait for team data to load.");
      return;
    }

    // Check if user is a member of this team
    const isMember = team.leaderId === user._id || team.memberIds.some(id => id === user._id);
    if (!isMember) {
      toast.error("You are not a member of this team");
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      await checkIn({
        teamId: teamId as any,
        userId: user._id,
        date: today,
      });
      setShowCheckIn(false);
      toast.success("Check-in successful!");
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast.error(error.message || "Failed to check in. Please try again.");
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
        week: currentWeek,
      });
      setNewTaskTitle("");
      toast.success("Task created successfully!");
    } catch (error: any) {
      console.error("Failed to create task:", error);
      toast.error(error.message || "Failed to create task. Please try again.");
    }
  };

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isLeader = team.leaderId === user?._id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {team.name || "Team Workspace"}
        </h1>
        <p className="text-gray-600 mt-2">Week {currentWeek}</p>
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
            onClick={() => setShowCheckIn(!showCheckIn)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Check In
          </button>
        )}

        {showCheckIn && !hasCheckedInToday && (
          <div className="mt-4 space-y-4">
            <div className="flex space-x-2">
              <button
                onClick={handleCheckIn}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Submit Check-in
              </button>
              <button
                onClick={() => setShowCheckIn(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

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

