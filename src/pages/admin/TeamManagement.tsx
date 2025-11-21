import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Users,
  X,
  Plus,
  CalendarDays,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
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
  return `${format(new Date(first), "MMM dd")} - ${format(
    new Date(last),
    "MMM dd, yyyy"
  )}`;
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

export function TeamManagement() {
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState<Id<"programs"> | null>(
    null
  );
  const [showManageTeams, setShowManageTeams] = useState(false);
  const [newTeamForm, setNewTeamForm] = useState({
    name: "",
    leaderId: "" as Id<"users"> | "",
    memberIds: [] as Id<"users">[],
    supervisorId: "" as Id<"users"> | "",
  });
  const [leaderSearchTerm, setLeaderSearchTerm] = useState("");
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [showAttendanceSummary, setShowAttendanceSummary] = useState(false);
  const [summaryTeamId, setSummaryTeamId] = useState<Id<"teams"> | null>(null);
  const [summaryWeek, setSummaryWeek] = useState(getCurrentWeek());

  const programs = useQuery(api.programs.getAllPrograms, {
    includeArchived: false,
  });
  const teamsForProgram = useQuery(
    api.teams.getTeamsByProgram,
    selectedProgram ? { programId: selectedProgram } : "skip"
  );
  const attendanceSummary = useQuery(
    api.attendance.getWeeklyAttendanceSummary,
    showAttendanceSummary && summaryTeamId
      ? {
          teamId: summaryTeamId,
          week: summaryWeek,
        }
      : "skip"
  );
  const createTeam = useMutation(api.teams.createTeam);
  const allUsers = useQuery(api.users.getAllUsers, {});
  const approvedRegistrations = useQuery(
    api.registrations.getApprovedRegistrations,
    {}
  );

  // Get students - now all approved registrations create user accounts automatically
  const studentOptions = useMemo(() => {
    const students = allUsers?.filter((u) => u.role === "student") ?? [];

    // Debug: Log student count
    if (process.env.NODE_ENV === "development") {
      console.log("Total students with 'student' role:", students.length);
      console.log(
        "Total approved registrations:",
        approvedRegistrations?.length || 0
      );
      console.log(
        "Student emails:",
        students.map((s) => s.email)
      );
      console.log("All users count:", allUsers?.length || 0);
      console.log(
        "All users roles:",
        allUsers?.map((u) => ({ email: u.email, role: u.role }))
      );
    }

    return students;
  }, [allUsers, approvedRegistrations]);

  const supervisorOptions = useMemo(
    () => allUsers?.filter((u) => u.role === "supervisor") ?? [],
    [allUsers]
  );

  const filteredLeaders = useMemo(() => {
    // Exclude students already in teams for this program
    const studentsInProgramTeams = new Set<string>();
    if (teamsForProgram) {
      teamsForProgram.forEach((team) => {
        // Handle both enriched teams (with leader object) and raw teams (with leaderId)
        const leaderId = team.leaderId || (team.leader?._id as string);
        if (leaderId) {
          studentsInProgramTeams.add(leaderId as unknown as string);
        }
        if (team.memberIds && Array.isArray(team.memberIds)) {
          team.memberIds.forEach((id) => {
            studentsInProgramTeams.add(id as unknown as string);
          });
        }
        // Also check enriched members array
        if (team.members && Array.isArray(team.members)) {
          team.members.forEach((member: any) => {
            if (member?._id) {
              studentsInProgramTeams.add(member._id as unknown as string);
            }
          });
        }
      });
    }

    let source = studentOptions.filter((u) => {
      const userIdStr = u._id as unknown as string;
      return !studentsInProgramTeams.has(userIdStr);
    });

    if (!leaderSearchTerm) return source;
    const lowercasedTerm = leaderSearchTerm.toLowerCase();
    return source.filter(
      (u) =>
        u.name.toLowerCase().includes(lowercasedTerm) ||
        u.email.toLowerCase().includes(lowercasedTerm) ||
        u.studentId?.toLowerCase().includes(lowercasedTerm)
    );
  }, [leaderSearchTerm, studentOptions, teamsForProgram]);

  const filteredMembers = useMemo(() => {
    // Exclude students already selected as leader or members
    const excludeIds = new Set<Id<"users">>([
      ...(newTeamForm.memberIds || []),
      ...(newTeamForm.leaderId ? [newTeamForm.leaderId] : []),
    ]);

    // Also exclude students already in teams for this program
    const studentsInProgramTeams = new Set<string>();
    if (teamsForProgram) {
      teamsForProgram.forEach((team) => {
        // Handle both enriched teams (with leader object) and raw teams (with leaderId)
        const leaderId =
          (team.leaderId as unknown as string) ||
          (team.leader?._id as unknown as string);
        if (leaderId) {
          studentsInProgramTeams.add(leaderId);
        }
        if (team.memberIds && Array.isArray(team.memberIds)) {
          team.memberIds.forEach((id) => {
            studentsInProgramTeams.add(id as unknown as string);
          });
        }
        // Also check enriched members array
        if (team.members && Array.isArray(team.members)) {
          team.members.forEach((member: any) => {
            if (member?._id) {
              studentsInProgramTeams.add(member._id as unknown as string);
            }
          });
        }
      });

      // Debug: Log excluded students
      if (process.env.NODE_ENV === "development") {
        console.log(
          "Students already in teams for this program:",
          Array.from(studentsInProgramTeams)
        );
        console.log("Number of teams in program:", teamsForProgram.length);
      }
    }

    // Filter out excluded students - convert IDs to strings for comparison
    let source = studentOptions.filter((u) => {
      const userIdStr = u._id as unknown as string;
      const isExcluded = excludeIds.has(u._id);
      const isInTeam = studentsInProgramTeams.has(userIdStr);
      return !isExcluded && !isInTeam;
    });

    // Debug: Log available students
    if (process.env.NODE_ENV === "development") {
      console.log("Available students after filtering:", source.length);
      console.log(
        "Available student names:",
        source.map((s) => s.name)
      );
      console.log(
        "Available student emails:",
        source.map((s) => s.email)
      );
    }

    // Apply search filter if search term exists
    if (memberSearchTerm) {
      const lowercasedTerm = memberSearchTerm.toLowerCase();
      source = source.filter(
        (u) =>
          u.name.toLowerCase().includes(lowercasedTerm) ||
          u.email.toLowerCase().includes(lowercasedTerm) ||
          u.studentId?.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Return all matching students (no limit)
    return source;
  }, [
    memberSearchTerm,
    studentOptions,
    newTeamForm.memberIds,
    newTeamForm.leaderId,
    teamsForProgram,
  ]);

  const handleManageTeams = (programId: Id<"programs">) => {
    setSelectedProgram(programId);
    setShowManageTeams(true);
  };

  const handleAddMember = (memberId: Id<"users">) => {
    setNewTeamForm((prev) => {
      if (prev.memberIds.includes(memberId) || prev.leaderId === memberId) {
        return prev;
      }
      return { ...prev, memberIds: [...prev.memberIds, memberId] };
    });
  };

  const handleRemoveMember = (memberId: Id<"users">) => {
    setNewTeamForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.filter((id) => id !== memberId),
    }));
  };

  const handleCreateTeam = async () => {
    if (!selectedProgram || !user) {
      toast.error("Missing required information");
      return;
    }

    if (!newTeamForm.leaderId) {
      toast.error("Please select a team leader");
      return;
    }

    if (!newTeamForm.supervisorId) {
      toast.error("Please assign a supervisor");
      return;
    }

    const totalStudents =
      1 + (newTeamForm.memberIds ? newTeamForm.memberIds.length : 0);

    if (totalStudents < 8 || totalStudents > 10) {
      toast.error(
        "Teams must have between 8 and 10 students (including leader)."
      );
      return;
    }

    try {
      await createTeam({
        programId: selectedProgram,
        leaderId: newTeamForm.leaderId,
        memberIds: newTeamForm.memberIds,
        supervisorId: newTeamForm.supervisorId || undefined,
        name: newTeamForm.name || undefined,
        adminId: user._id,
      });
      toast.success("Team created successfully!");
      setNewTeamForm({
        name: "",
        leaderId: "",
        memberIds: [],
        supervisorId: "",
      });
      setLeaderSearchTerm("");
      setMemberSearchTerm("");
      setShowManageTeams(false);
    } catch (error: any) {
      console.error("Failed to create team:", error);
      toast.error(error.message || "Failed to create team");
    }
  };

  const handleSummaryWeekChange = (direction: "prev" | "next") => {
    const [year, weekNum] = summaryWeek.split("-W").map(Number);
    let newWeek = weekNum + (direction === "next" ? 1 : -1);
    let newYear = year;

    if (newWeek < 1) {
      newWeek = 52;
      newYear -= 1;
    } else if (newWeek > 52) {
      newWeek = 1;
      newYear += 1;
    }

    setSummaryWeek(`${newYear}-W${newWeek.toString().padStart(2, "0")}`);
  };

  const handleExportSummary = () => {
    if (!attendanceSummary) {
      toast.error("No attendance data to export");
      return;
    }

    const team = teamsForProgram?.find((t) => t._id === summaryTeamId);
    if (!team) {
      toast.error("Team not found");
      return;
    }

    const members = getTeamMembers(team);
    let csvContent = `Weekly Attendance Summary - ${formatWeekRange(
      attendanceSummary
    )}\n`;
    csvContent += `Team: ${team.name || `Team ${team._id.slice(-6)}`}\n\n`;

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
      const total =
        attendanceSummary.totals.find(
          (total: any) => total.userId === (member._id as unknown as string)
        )?.presentCount || 0;
      csvContent += `${total}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `team_${team._id.slice(-6)}_attendance_${summaryWeek}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance summary exported!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage teams for programs
          </p>
        </div>
        {programs && programs.length > 0 && (
          <button
            onClick={() => {
              // Use first program or let user select from modal
              const programToUse = programs[0];
              setSelectedProgram(programToUse._id);
              setShowManageTeams(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Team</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Programs</h2>
        </div>
        <div className="p-6">
          {programs && programs.length > 0 ? (
            <div className="space-y-4">
              {programs.map((program) => (
                <div
                  key={program._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
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
                          {format(new Date(program.startDate), "MMM dd, yyyy")}
                        </span>
                        <span>
                          End:{" "}
                          {format(new Date(program.endDate), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleManageTeams(program._id)}
                        className="px-3 py-2 border rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Manage Teams</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No programs available yet. Students can create their work programs
              from their dashboard.
            </p>
          )}
        </div>
      </div>

      {/* Manage Teams Modal */}
      {showManageTeams && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Manage Teams</h2>
              <button
                onClick={() => {
                  setShowManageTeams(false);
                  setSelectedProgram(null);
                  setNewTeamForm({
                    name: "",
                    leaderId: "",
                    memberIds: [],
                    supervisorId: "",
                  });
                  setLeaderSearchTerm("");
                  setMemberSearchTerm("");
                }}
                className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Teams */}
            {teamsForProgram && teamsForProgram.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Existing Teams
                </h3>
                <div className="space-y-2">
                  {teamsForProgram.map((team) => (
                    <div key={team._id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {team.name || `Team ${team._id.slice(-6)}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            Leader: {team.leader?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Members: {team.members?.length || 0}
                          </p>
                          <p className="text-sm text-gray-600">
                            Supervisor:{" "}
                            {team.supervisor?.name || "Not assigned"}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSummaryTeamId(team._id);
                              setShowAttendanceSummary(true);
                            }}
                            className="px-2 py-1 text-xs border rounded text-gray-600 hover:bg-gray-50"
                            title="View Attendance">
                            <CalendarDays className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Team */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Create New Team
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newTeamForm.name}
                    onChange={(e) =>
                      setNewTeamForm({ ...newTeamForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter team name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search for Team Leader
                  </label>
                  <input
                    type="text"
                    value={leaderSearchTerm}
                    onChange={(e) => setLeaderSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                    placeholder="Search by name, email, or student ID"
                  />
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {filteredLeaders.map((foundUser) => (
                      <button
                        key={foundUser._id}
                        type="button"
                        onClick={() => {
                          setNewTeamForm({
                            ...newTeamForm,
                            leaderId: foundUser._id,
                          });
                          setLeaderSearchTerm(foundUser.name);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0">
                        <p className="font-medium">{foundUser.name}</p>
                        <p className="text-xs text-gray-500">
                          {foundUser.email}
                        </p>
                        {foundUser.studentId && (
                          <p className="text-xs text-gray-400">
                            ID: {foundUser.studentId}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                  {newTeamForm.leaderId && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected leader:{" "}
                      {
                        studentOptions.find(
                          (u) => u._id === newTeamForm.leaderId
                        )?.name
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Add Team Members (need 7-9 additional students)
                  </label>
                  <input
                    type="text"
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                    placeholder="Search students to add"
                  />
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() => handleAddMember(member._id)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-gray-500">
                            {member.email}
                          </p>
                          {member.studentId && (
                            <p className="text-xs text-gray-400">
                              ID: {member.studentId}
                            </p>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                        {memberSearchTerm
                          ? "No students found matching your search"
                          : "No available students. All approved students may already be assigned to teams."}
                      </div>
                    )}
                  </div>
                  {filteredMembers.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Showing {filteredMembers.length} available student
                      {filteredMembers.length !== 1 ? "s" : ""}
                    </p>
                  )}
                  {newTeamForm.memberIds.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">
                        Selected members ({newTeamForm.memberIds.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {newTeamForm.memberIds.map((memberId) => {
                          const member = studentOptions.find(
                            (u) => u._id === memberId
                          );
                          return (
                            <span
                              key={memberId}
                              className="inline-flex items-center space-x-1 bg-primary-50 text-primary-700 px-2 py-1 rounded-full text-xs">
                              <span>{member?.name || "Unknown"}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(memberId)}
                                className="text-primary-700 hover:text-primary-900">
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Supervisor
                  </label>
                  <select
                    value={newTeamForm.supervisorId}
                    onChange={(e) =>
                      setNewTeamForm({
                        ...newTeamForm,
                        supervisorId: e.target.value as Id<"users">,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select supervisor</option>
                    {supervisorOptions.map((supervisor) => (
                      <option key={supervisor._id} value={supervisor._id}>
                        {supervisor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-gray-500">
                  Teams must include between 8 and 10 students (leader +
                  members) and exactly one supervisor.
                </p>

                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateTeam}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    Create Team
                  </button>
                  <button
                    onClick={() => {
                      setShowManageTeams(false);
                      setSelectedProgram(null);
                      setNewTeamForm({
                        name: "",
                        leaderId: "",
                        memberIds: [],
                        supervisorId: "",
                      });
                      setLeaderSearchTerm("");
                      setMemberSearchTerm("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Summary Modal */}
      {showAttendanceSummary && summaryTeamId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Weekly Attendance Summary
                </h2>
                <p className="text-sm text-gray-500">
                  Review daily attendance and export for archival.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAttendanceSummary(false);
                  setSummaryTeamId(null);
                }}
                className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSummaryWeekChange("prev")}
                  className="p-2 border rounded-lg hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {formatWeekRange(attendanceSummary)}
                </span>
                <button
                  onClick={() => handleSummaryWeekChange("next")}
                  className="p-2 border rounded-lg hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleExportSummary}
                className="inline-flex items-center space-x-2 px-3 py-2 border rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400">
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              {attendanceSummary ? (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4 font-medium">Student</th>
                      {attendanceSummary.daily.map((day: any) => (
                        <th
                          key={day.date}
                          className="py-2 px-2 font-medium text-center">
                          {formatDate(day.date)}
                        </th>
                      ))}
                      <th className="py-2 px-2 font-medium text-center">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTeamMembers(
                      teamsForProgram?.find(
                        (team) => team._id === summaryTeamId
                      )
                    ).map((member) => (
                      <tr key={member._id}>
                        <td className="py-2 pr-4 font-medium text-gray-900">
                          {member.name}
                        </td>
                        {attendanceSummary.daily.map((day: any) => {
                          const present = day.attendees.some(
                            (attendee: any) =>
                              attendee.userId ===
                              (member._id as unknown as string)
                          );
                          return (
                            <td
                              key={`${member._id}-${day.date}`}
                              className="py-2 px-2 text-center">
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
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Loading summary...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
