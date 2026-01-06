import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useState, useMemo } from "react";
import {
  Users,
  FileText,
  X,
  AlertTriangle,
  CalendarDays,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Id } from "@/convex/_generated/dataModel";

export function AdminPanel() {
  const { user } = useAuth();

  // State declarations must come before hooks that use them
  const [selectedProgram, setSelectedProgram] = useState<Id<"programs"> | null>(
    null
  );
  const [showManageTeams, setShowManageTeams] = useState(false);
  const [showRegistrations, setShowRegistrations] = useState(false);
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
  const [showSupervisorManagement, setShowSupervisorManagement] =
    useState(false);
  const [showSupervisorForm, setShowSupervisorForm] = useState(false);
  const [editingSupervisor, setEditingSupervisor] =
    useState<Id<"users"> | null>(null);
  const [supervisorForm, setSupervisorForm] = useState({
    name: "",
    email: "",
    nidn: "",
  });

  // Hooks - must be called in the same order every render
  const programs = useQuery(api.programs.getAllPrograms, {
    includeArchived: false,
  });
  // Get teams and registrations for selected program
  const teamsForProgram = useQuery(
    api.teams.getTeamsByProgram,
    selectedProgram ? { programId: selectedProgram } : "skip"
  );
  const registrationsForProgram = useQuery(
    api.registrations.getRegistrationsByProgram,
    selectedProgram ? { programId: selectedProgram } : "skip"
  );
  const pendingRegistrations = useQuery(
    api.registrations.getPendingRegistrations,
    {}
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
  const approveRegistration = useMutation(
    api.registrations.approveRegistration
  );
  const rejectRegistration = useMutation(api.registrations.rejectRegistration);
  const allUsers = useQuery(api.users.getAllUsers, {});
  const createSupervisor = useMutation(api.users.createSupervisor);
  const updateSupervisor = useMutation(api.users.updateSupervisor);
  const deleteSupervisor = useMutation(api.users.deleteSupervisor);

  // Check if user is admin (using effective role) - after all hooks
  const userEmail = user?.email?.toLowerCase() || "";
  const isHardcodedAdmin = [
    // "nicolastzakis@students.unviersitasmulia.ac.id", // Typo: unviersitas
    "nicolastzakis@students.universitasmulia.ac.id",
  ].includes(userEmail);
  const effectiveRole = isHardcodedAdmin ? "admin" : user?.role;

  // Redirect if not admin - after all hooks
  if (effectiveRole !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  const handleManageTeams = (programId: Id<"programs">) => {
    setSelectedProgram(programId);
    setShowManageTeams(true);
  };

  const handleShowAttendanceSummary = (teamId: Id<"teams">) => {
    setSummaryTeamId(teamId);
    setSummaryWeek(getCurrentWeek());
    setShowAttendanceSummary(true);
  };

  const handleSummaryWeekChange = (direction: "prev" | "next") => {
    setSummaryWeek((prev) => shiftWeek(prev, direction === "prev" ? -1 : 1));
  };

  const handleExportSummary = () => {
    if (!attendanceSummary || !summaryTeamId) {
      toast.error("Summary not available");
      return;
    }


    const rows: string[] = [];
    rows.push(
      [
        "Student",
        ...attendanceSummary.dates,
        "Total Present",
      ].join(",")
    );

    attendanceSummary.students.forEach((student: any) => {
      const row = [
        student.userName || "Unknown",
        ...attendanceSummary.dates.map((date: string) => {
          const record = student.dailyRecords.find((r: any) => r.date === date);
          return record?.status === "present" ? "✔" : "";
        }),
        student.presentCount || 0,
      ];
      rows.push(row.join(","));
    });

    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_${summaryTeamId}_${summaryWeek}.csv`;
    link.click();
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

  const handleViewRegistrations = (programId: Id<"programs">) => {
    setSelectedProgram(programId);
    setShowRegistrations(true);
  };

  const handleApproveRegistration = async (
    registrationId: Id<"registrations">
  ) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    try {
      await approveRegistration({
        registrationId: registrationId,
        adminId: user._id,
      });
      toast.success("Registration approved!");
    } catch (error: any) {
      console.error("Failed to approve:", error);
      toast.error(error.message || "Failed to approve registration");
    }
  };

  const handleRejectRegistration = async (
    registrationId: Id<"registrations">
  ) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (confirm("Are you sure you want to reject this registration?")) {
      try {
        await rejectRegistration({
          registrationId: registrationId,
          adminId: user._id,
        });
        toast.success("Registration rejected");
      } catch (error: any) {
        console.error("Failed to reject:", error);
        toast.error(error.message || "Failed to reject registration");
      }
    }
  };

  const studentOptions = useMemo(
    () => allUsers?.filter((u) => u.role === "student") ?? [],
    [allUsers]
  );

  const supervisorOptions = useMemo(
    () => allUsers?.filter((u) => u.role === "supervisor") ?? [],
    [allUsers]
  );

  const filteredLeaders = useMemo(() => {
    if (!leaderSearchTerm) return studentOptions.slice(0, 5);
    const lowercasedTerm = leaderSearchTerm.toLowerCase();
    return studentOptions
      .filter(
        (u) =>
          u.name.toLowerCase().includes(lowercasedTerm) ||
          u.email.toLowerCase().includes(lowercasedTerm) ||
          u.studentId?.toLowerCase().includes(lowercasedTerm)
      )
      .slice(0, 5);
  }, [leaderSearchTerm, studentOptions]);

  const filteredMembers = useMemo(() => {
    const excludeIds = new Set<Id<"users">>([
      ...(newTeamForm.memberIds || []),
      ...(newTeamForm.leaderId ? [newTeamForm.leaderId] : []),
    ]);
    const source = studentOptions.filter((u) => !excludeIds.has(u._id));
    if (!memberSearchTerm) {
      return source.slice(0, 5);
    }
    const lowercasedTerm = memberSearchTerm.toLowerCase();
    return source
      .filter(
        (u) =>
          u.name.toLowerCase().includes(lowercasedTerm) ||
          u.email.toLowerCase().includes(lowercasedTerm) ||
          u.studentId?.toLowerCase().includes(lowercasedTerm)
      )
      .slice(0, 5);
  }, [
    memberSearchTerm,
    studentOptions,
    newTeamForm.memberIds,
    newTeamForm.leaderId,
  ]);

  const pendingByProgram = useMemo(() => {
    const map = new Map<string, number>();
    pendingRegistrations?.forEach((reg) => {
      const key = reg.programId as unknown as string;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [pendingRegistrations]);

  // Supervisor management handlers
  const handleCreateSupervisor = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (
      !supervisorForm.name.trim() ||
      !supervisorForm.email.trim() ||
      !supervisorForm.nidn.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createSupervisor({
        name: supervisorForm.name.trim(),
        email: supervisorForm.email.trim(),
        nidn: supervisorForm.nidn.trim(),
        adminId: user._id,
      });
      toast.success("Supervisor created successfully!");
      setSupervisorForm({ name: "", email: "", nidn: "" });
      setShowSupervisorForm(false);
    } catch (error: any) {
      console.error("Failed to create supervisor:", error);
      toast.error(error.message || "Failed to create supervisor");
    }
  };

  const handleUpdateSupervisor = async () => {
    if (!user || !editingSupervisor) {
      toast.error("Missing required information");
      return;
    }

    if (
      !supervisorForm.name.trim() ||
      !supervisorForm.email.trim() ||
      !supervisorForm.nidn.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await updateSupervisor({
        supervisorId: editingSupervisor,
        name: supervisorForm.name.trim(),
        email: supervisorForm.email.trim(),
        nidn: supervisorForm.nidn.trim(),
        adminId: user._id,
      });
      toast.success("Supervisor updated successfully!");
      setSupervisorForm({ name: "", email: "", nidn: "" });
      setEditingSupervisor(null);
      setShowSupervisorForm(false);
    } catch (error: any) {
      console.error("Failed to update supervisor:", error);
      toast.error(error.message || "Failed to update supervisor");
    }
  };

  const handleDeleteSupervisor = async (supervisorId: Id<"users">) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (confirm("Are you sure you want to delete this supervisor?")) {
      try {
        await deleteSupervisor({
          supervisorId: supervisorId,
          adminId: user._id,
        });
        toast.success("Supervisor deleted successfully!");
      } catch (error: any) {
        console.error("Failed to delete supervisor:", error);
        toast.error(error.message || "Failed to delete supervisor");
      }
    }
  };

  const handleEditSupervisor = (supervisor: any) => {
    setEditingSupervisor(supervisor._id);
    setSupervisorForm({
      name: supervisor.name,
      email: supervisor.email,
      nidn: supervisor.nidn || "",
    });
    setShowSupervisorForm(true);
  };

  const handleCancelSupervisorForm = () => {
    setSupervisorForm({ name: "", email: "", nidn: "" });
    setEditingSupervisor(null);
    setShowSupervisorForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">
            Approve student registrations and organize teams
          </p>
        </div>
        <button
          onClick={() => setShowSupervisorManagement(!showSupervisorManagement)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2">
          <UserCheck className="w-5 h-5" />
          <span>Manage Supervisors</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Student Registrations
            </h2>
            <p className="text-sm text-gray-500">
              Review documents and grant access based on submission email.
            </p>
          </div>
          <span className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span>{pendingRegistrations?.length || 0} pending</span>
          </span>
        </div>
        <div className="p-6 space-y-3">
          {pendingRegistrations && pendingRegistrations.length > 0 ? (
            pendingRegistrations.map((registration) => (
              <div
                key={registration._id}
                className="border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {registration.fullName || "Unspecified"}
                  </h3>
                  <p className="text-sm text-gray-600">{registration.email}</p>
                  <p className="text-sm text-gray-600">
                    Student ID: {registration.studentId || "—"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Phone: {registration.phone || "—"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Program: {registration.program?.title || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted:{" "}
                    {format(new Date(registration.submittedAt), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {registration.paymentProofUrl && (
                    <a
                      href={registration.paymentProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 border border-primary-200 text-primary-700 rounded text-sm hover:bg-primary-50">
                      View Payment Proof
                    </a>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleApproveRegistration(registration._id)
                      }
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectRegistration(registration._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              No pending registrations 🎉
            </p>
          )}
        </div>
      </div>

      {/* Supervisor Management Section */}
      {showSupervisorManagement && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Supervisor Management
              </h2>
              <p className="text-sm text-gray-500">
                Create and manage supervisors for team assignments
              </p>
            </div>
            <button
              onClick={() => {
                setShowSupervisorForm(true);
                setEditingSupervisor(null);
                setSupervisorForm({ name: "", email: "", nidn: "" });
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Supervisor</span>
            </button>
          </div>

          {/* Supervisor Form */}
          {showSupervisorForm && (
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingSupervisor
                  ? "Edit Supervisor"
                  : "Create New Supervisor"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={supervisorForm.name}
                    onChange={(e) =>
                      setSupervisorForm({
                        ...supervisorForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Supervisor name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email * (for login)
                  </label>
                  <input
                    type="email"
                    value={supervisorForm.email}
                    onChange={(e) =>
                      setSupervisorForm({
                        ...supervisorForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="supervisor@university.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIDN *
                  </label>
                  <input
                    type="text"
                    value={supervisorForm.nidn}
                    onChange={(e) =>
                      setSupervisorForm({
                        ...supervisorForm,
                        nidn: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="NIDN number"
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={
                    editingSupervisor
                      ? handleUpdateSupervisor
                      : handleCreateSupervisor
                  }
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  {editingSupervisor
                    ? "Update Supervisor"
                    : "Create Supervisor"}
                </button>
                <button
                  onClick={handleCancelSupervisorForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Supervisors List */}
          <div className="p-6">
            {supervisorOptions && supervisorOptions.length > 0 ? (
              <div className="space-y-3">
                {supervisorOptions.map((supervisor) => (
                  <div
                    key={supervisor._id}
                    className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {supervisor.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {supervisor.email}
                      </p>
                      {supervisor.nidn && (
                        <p className="text-sm text-gray-500">
                          NIDN: {supervisor.nidn}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSupervisor(supervisor)}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                        title="Edit supervisor">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupervisor(supervisor._id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete supervisor">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No supervisors created yet. Click "Add Supervisor" to create
                one.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Programs & Team Management
          </h2>
          <p className="text-sm text-gray-500">
            Group approved students into teams and monitor registration status.
          </p>
        </div>
        <div className="p-6">
          {programs && programs.length > 0 ? (
            <div className="space-y-4">
              {programs.map((program) => {
                const pendingCount =
                  pendingByProgram.get(program._id as unknown as string) || 0;
                return (
                  <div
                    key={program._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {program.title}
                          </h3>
                          {pendingCount > 0 && (
                            <span className="inline-flex items-center text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                              {pendingCount} pending
                            </span>
                          )}
                        </div>
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleManageTeams(program._id)}
                          className="px-3 py-2 border rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>Manage Teams</span>
                        </button>
                        <button
                          onClick={() => handleViewRegistrations(program._id)}
                          className="px-3 py-2 border rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>View Registrations</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                      <p className="font-medium">
                        {team.name || `Team ${team._id.slice(-6)}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Leader: {team.leader?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Members: {team.members?.length || 0}
                      </p>
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={() => handleShowAttendanceSummary(team._id)}
                          className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-800">
                          <CalendarDays className="w-4 h-4" />
                          <span>Attendance</span>
                        </button>
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
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {filteredMembers.map((member) => (
                      <button
                        key={member._id}
                        type="button"
                        onClick={() => handleAddMember(member._id)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                        {member.studentId && (
                          <p className="text-xs text-gray-400">
                            ID: {member.studentId}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
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

      {/* View Registrations Modal */}
      {showRegistrations && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Program Registrations
              </h2>
              <button
                onClick={() => {
                  setShowRegistrations(false);
                  setSelectedProgram(null);
                }}
                className="p-2 bg-black hover:bg-opacity-50 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {registrationsForProgram && registrationsForProgram.length > 0 ? (
                registrationsForProgram.map((registration) => (
                  <div
                    key={registration._id}
                    className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {registration.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {registration.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        Student ID: {registration.studentId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Phone: {registration.phone}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted:{" "}
                        {format(
                          new Date(registration.submittedAt),
                          "MMM dd, yyyy"
                        )}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                          registration.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : registration.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {registration.status}
                      </span>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {registration.paymentProofUrl && (
                        <a
                          href={registration.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 border border-primary-200 text-primary-700 rounded text-sm hover:bg-primary-50">
                          View Payment Proof
                        </a>
                      )}
                      {registration.status === "pending" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleApproveRegistration(registration._id)
                            }
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleRejectRegistration(registration._id)
                            }
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No registrations yet
                </p>
              )}
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
                      {attendanceSummary.dates.map((date: string) => (
                        <th
                          key={date}
                          className="py-2 px-2 font-medium text-center">
                          {formatDate(date)}
                        </th>
                      ))}
                      <th className="py-2 px-2 font-medium text-center">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceSummary.students.map((student: any) => (
                      <tr key={student.userId}>
                        <td className="py-2 pr-4 font-medium text-gray-900">
                          {student.userName}
                        </td>
                        {attendanceSummary.dates.map((date: string) => {
                          const record = student.dailyRecords.find(
                            (r: any) => r.date === date
                          );
                          const present = record?.status === "present";
                          return (
                            <td
                              key={`${student.userId}-${date}`}
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
                          {student.presentCount}
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
    ((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 +
      d.getDay() +
      1) /
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


