import { useQuery, useMutation } from "convex/react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Calendar, Users, CheckCircle, Plus, X } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export function StudentDashboard() {
  const { user } = useAuth();
  const programs = useQuery(api.programs.getAllPrograms, {
    includeArchived: false,
  });
  const userRegistrations = user
    ? useQuery(api.registrations.getUserRegistrations, {
        userId: user._id,
      })
    : null;
  const myTeams = user
    ? useQuery(api.teams.getTeamsForUser, { userId: user._id })
    : null;
  const today = new Date().toISOString().split("T")[0];
  const todaysAttendance = user
    ? useQuery(api.attendance.getAttendanceByUser, {
        userId: user._id,
        startDate: today,
        endDate: today,
      })
    : null;
  const createProgram = useMutation(api.programs.createProgram);
  const checkIn = useMutation(api.attendance.checkIn);

  const [showProgramForm, setShowProgramForm] = useState(false);
  const [programForm, setProgramForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const isPendingStudent = user?.role === "pending";
  const isApprovedStudent = user?.role === "student";

  const handleCreateProgram = async () => {
    if (!user) {
      toast.error("You must be logged in to create a work program");
      return;
    }

    if (!programForm.title.trim()) {
      toast.error("Please enter a program title");
      return;
    }

    if (!programForm.description.trim()) {
      toast.error("Please enter a program description");
      return;
    }

    if (!programForm.startDate || !programForm.endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(programForm.startDate) > new Date(programForm.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      await createProgram({
        title: programForm.title.trim(),
        description: programForm.description.trim(),
        startDate: programForm.startDate,
        endDate: programForm.endDate,
        createdBy: user._id,
      });
      toast.success("Work program created!");
      setProgramForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
      });
      setShowProgramForm(false);
    } catch (error: any) {
      console.error("Failed to create program:", error);
      toast.error(error.message || "Failed to create program");
    }
  };

  const hasCheckedIn = useMemo(() => {
    if (!todaysAttendance) return () => false;
    return (teamId: string) =>
      todaysAttendance.some(
        (record) => record.teamId === (teamId as any) && record.date === today
      );
  }, [todaysAttendance, today]);

  const handleQuickCheckIn = async (teamId: string) => {
    if (!user) {
      toast.error("You must be logged in to check in");
      return;
    }
    try {
      await checkIn({
        teamId: teamId as any,
        userId: user._id,
        date: today,
      });
      toast.success("Attendance submitted!");
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast.error(error.message || "Failed to check in.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}!</p>
        </div>
        {isApprovedStudent && (
          <button
            onClick={() => setShowProgramForm(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            <span>Create Work Program</span>
          </button>
        )}
      </div>

      {isPendingStudent && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
          <h2 className="font-semibold text-yellow-900">
            Registration Pending Verification
          </h2>
          <p className="mt-1">
            Your documents are under review by the admin team. Please make sure
            you have completed the program registration and submitted proof of
            payment. You will automatically gain full access once your data is
            verified and your role is upgraded to{" "}
            <span className="font-medium">student</span>.
          </p>
        </div>
      )}

      {showProgramForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Create Work Program
            </h2>
            <button
              onClick={() => setShowProgramForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={programForm.title}
                onChange={(e) =>
                  setProgramForm({ ...programForm, title: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Work program title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={programForm.description}
                onChange={(e) =>
                  setProgramForm({
                    ...programForm,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Program description"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={programForm.startDate}
                  onChange={(e) =>
                    setProgramForm({
                      ...programForm,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={programForm.endDate}
                  onChange={(e) =>
                    setProgramForm({
                      ...programForm,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCreateProgram}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Create Program
              </button>
              <button
                onClick={() => setShowProgramForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Date</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {format(new Date(), "MMM dd, yyyy")}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Programs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {programs?.length || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Registrations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {userRegistrations?.filter((r) => r.status === "approved")
                  .length || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Attendance & Teams */}
      {myTeams && myTeams.length > 0 && (
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
                    Members: {team.members?.filter(Boolean).length + 1 || 1}
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
                      onClick={() => handleQuickCheckIn(team._id as any)}
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
      )}

      {/* Available Programs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Available Programs
          </h2>
        </div>
        <div className="p-6">
          {programs && programs.length > 0 ? (
            <div className="space-y-4">
              {programs.map((program) => {
                const registration = userRegistrations?.find(
                  (r) => r.programId === program._id
                );
                return (
                  <div
                    key={program._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {program.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {program.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span>
                            Start:{" "}
                            {format(
                              new Date(program.startDate),
                              "MMM dd, yyyy"
                            )}
                          </span>
                          <span>
                            End:{" "}
                            {format(new Date(program.endDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {registration ? (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              registration.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : registration.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {registration.status}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Registration required via the public form.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No programs available at the moment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
