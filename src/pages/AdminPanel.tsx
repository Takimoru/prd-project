import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { Plus, Archive, Download, Users, FileText, Shield, X } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export function AdminPanel() {
  const { user } = useAuth();
  
  // State declarations must come before hooks that use them
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [showManageTeams, setShowManageTeams] = useState(false);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [newTeamForm, setNewTeamForm] = useState({
    name: "",
    leaderId: "",
    memberIds: [] as string[],
    supervisorId: "",
  });
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // Hooks - must be called in the same order every render
  const programs = useQuery(api.programs.getAllPrograms, {
    includeArchived: false,
  });
  const createProgram = useMutation(api.programs.createProgram);
  const archiveProgram = useMutation(api.programs.archiveProgram);
  // Get teams and registrations for selected program
  const teamsForProgram = useQuery(
    api.teams.getTeamsByProgram,
    selectedProgram ? { programId: selectedProgram as any } : "skip"
  );
  const registrationsForProgram = useQuery(
    api.registrations.getRegistrationsByProgram,
    selectedProgram ? { programId: selectedProgram as any } : "skip"
  );
  const createTeam = useMutation(api.teams.createTeam);
  const approveRegistration = useMutation(api.registrations.approveRegistration);
  const rejectRegistration = useMutation(api.registrations.rejectRegistration);
  const allUsers = useQuery(api.users.getAllUsers);

  // Check if user is admin (using effective role) - after all hooks
  const userEmail = user?.email?.toLowerCase() || "";
  const isHardcodedAdmin = [
    "nicolastzakis@students.unviersitasmulia.ac.id",
    "nicolastzakis@students.universitasmulia.ac.id",
  ].includes(userEmail);
  const effectiveRole = isHardcodedAdmin ? "admin" : user?.role;
  
  // Redirect if not admin - after all hooks
  if (effectiveRole !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const handleCreateProgram = async () => {
    if (!user) {
      toast.error("You must be logged in to create a program");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a program title");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter a program description");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      await createProgram({
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        createdBy: user._id,
      });
      toast.success("Program created successfully!");
      setFormData({ title: "", description: "", startDate: "", endDate: "" });
      setShowCreateForm(false);
    } catch (error: any) {
      console.error("Failed to create program:", error);
      toast.error(error.message || "Failed to create program. Please try again.");
    }
  };

  const handleArchive = async (programId: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }
    
    if (confirm("Are you sure you want to archive this program?")) {
      try {
        await archiveProgram({ 
          programId: programId as any,
          adminId: user._id,
        });
        toast.success("Program archived successfully");
      } catch (error: any) {
        console.error("Failed to archive program:", error);
        toast.error(error.message || "Failed to archive program");
      }
    }
  };

  const handleExport = (programId: string) => {
    // Get program data
    const program = programs?.find(p => p._id === programId);
    if (!program) {
      toast.error("Program not found");
      return;
    }

    // Temporarily set selected program to fetch data
    const previousSelected = selectedProgram;
    setSelectedProgram(programId);
    
    // Wait for queries to load, then export
    setTimeout(() => {
      // Fetch teams and registrations for this specific program
      // Note: We need to query them separately since we're setting selectedProgram
      const teams = teamsForProgram || [];
      const registrations = registrationsForProgram || [];

      // Create CSV content
      let csvContent = "Program Export\n";
      csvContent += `Title,${program.title}\n`;
      csvContent += `Description,"${program.description.replace(/"/g, '""')}"\n`;
      csvContent += `Start Date,${program.startDate}\n`;
      csvContent += `End Date,${program.endDate}\n\n`;
      
      csvContent += "Registrations\n";
      csvContent += "Student Name,Email,Status,Submitted At\n";
      if (registrations.length > 0) {
        registrations.forEach(reg => {
          const name = reg.user?.name || "Unknown";
          const email = reg.user?.email || "";
          const status = reg.status;
          const submittedAt = reg.submittedAt ? format(new Date(reg.submittedAt), "yyyy-MM-dd") : "";
          csvContent += `"${name.replace(/"/g, '""')}","${email}",${status},"${submittedAt}"\n`;
        });
      } else {
        csvContent += "No registrations\n";
      }
      
      csvContent += "\nTeams\n";
      csvContent += "Team Name,Leader,Members Count,Supervisor\n";
      if (teams.length > 0) {
        teams.forEach(team => {
          const teamName = team.name || `Team ${team._id.slice(-6)}`;
          const leaderName = team.leader?.name || "Unknown";
          const memberCount = team.members?.length || 0;
          const supervisorName = team.supervisor?.name || "Not assigned";
          csvContent += `"${teamName.replace(/"/g, '""')}","${leaderName.replace(/"/g, '""')}",${memberCount},"${supervisorName.replace(/"/g, '""')}"\n`;
        });
      } else {
        csvContent += "No teams\n";
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${program.title.replace(/\s+/g, "_")}_export_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Export downloaded successfully!");
      setSelectedProgram(previousSelected);
    }, 1000);
  };

  const handleManageTeams = (programId: string) => {
    setSelectedProgram(programId);
    setShowManageTeams(true);
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

    try {
      await createTeam({
        programId: selectedProgram as any,
        leaderId: newTeamForm.leaderId as any,
        memberIds: newTeamForm.memberIds.map(id => id as any),
        supervisorId: newTeamForm.supervisorId ? (newTeamForm.supervisorId as any) : undefined,
        name: newTeamForm.name || undefined,
        adminId: user._id,
      });
      toast.success("Team created successfully!");
      setNewTeamForm({ name: "", leaderId: "", memberIds: [], supervisorId: "" });
      setShowManageTeams(false);
    } catch (error: any) {
      console.error("Failed to create team:", error);
      toast.error(error.message || "Failed to create team");
    }
  };

  const handleViewRegistrations = (programId: string) => {
    setSelectedProgram(programId);
    setShowRegistrations(true);
  };

  const handleApproveRegistration = async (registrationId: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    try {
      await approveRegistration({
        registrationId: registrationId as any,
        adminId: user._id,
      });
      toast.success("Registration approved!");
    } catch (error: any) {
      console.error("Failed to approve:", error);
      toast.error(error.message || "Failed to approve registration");
    }
  };

  const handleRejectRegistration = async (registrationId: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (confirm("Are you sure you want to reject this registration?")) {
      try {
        await rejectRegistration({
          registrationId: registrationId as any,
          adminId: user._id,
        });
        toast.success("Registration rejected");
      } catch (error: any) {
        console.error("Failed to reject:", error);
        toast.error(error.message || "Failed to reject registration");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage programs and teams</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Program</span>
        </button>
      </div>

      {/* Create Program Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create New Program
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Program title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Program description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
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
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
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
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Programs List */}
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
                          Start: {format(new Date(program.startDate), "MMM dd, yyyy")}
                        </span>
                        <span>
                          End: {format(new Date(program.endDate), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleManageTeams(program._id)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="Manage Teams"
                      >
                        <Users className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleViewRegistrations(program._id)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="View Registrations"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleExport(program._id)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="Export"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleArchive(program._id)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="Archive"
                      >
                        <Archive className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No programs created yet.
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
                  setNewTeamForm({ name: "", leaderId: "", memberIds: [], supervisorId: "" });
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Existing Teams */}
            {teamsForProgram && teamsForProgram.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Existing Teams</h3>
                <div className="space-y-2">
                  {teamsForProgram.map((team) => (
                    <div key={team._id} className="border rounded-lg p-3">
                      <p className="font-medium">{team.name || `Team ${team._id.slice(-6)}`}</p>
                      <p className="text-sm text-gray-600">Leader: {team.leader?.name || "Unknown"}</p>
                      <p className="text-sm text-gray-600">
                        Members: {team.members?.length || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Team */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Create New Team</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newTeamForm.name}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, name: e.target.value })}
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
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                    placeholder="Search by name, email, or student ID"
                  />
                  {userSearchTerm && allUsers && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {allUsers
                        .filter(
                          (u) =>
                            u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            u.studentId?.toLowerCase().includes(userSearchTerm.toLowerCase())
                        )
                        .slice(0, 5)
                        .map((foundUser) => (
                          <button
                            key={foundUser._id}
                            type="button"
                            onClick={() => {
                              setNewTeamForm({ ...newTeamForm, leaderId: foundUser._id });
                              setUserSearchTerm(foundUser.name);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <p className="font-medium">{foundUser.name}</p>
                            <p className="text-xs text-gray-500">{foundUser.email}</p>
                            {foundUser.studentId && (
                              <p className="text-xs text-gray-400">ID: {foundUser.studentId}</p>
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                  {newTeamForm.leaderId && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {allUsers?.find(u => u._id === newTeamForm.leaderId)?.name}
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateTeam}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Create Team
                  </button>
                  <button
                    onClick={() => {
                      setShowManageTeams(false);
                      setSelectedProgram(null);
                      setNewTeamForm({ name: "", leaderId: "", memberIds: [], supervisorId: "" });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
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
              <h2 className="text-2xl font-bold text-gray-900">Program Registrations</h2>
              <button
                onClick={() => {
                  setShowRegistrations(false);
                  setSelectedProgram(null);
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {registrationsForProgram && registrationsForProgram.length > 0 ? (
                registrationsForProgram.map((registration) => (
                  <div
                    key={registration._id}
                    className="border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {registration.user?.name || "Unknown"}
                      </h3>
                      <p className="text-sm text-gray-600">{registration.user?.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted: {format(new Date(registration.submittedAt), "MMM dd, yyyy")}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                          registration.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : registration.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {registration.status}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {registration.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveRegistration(registration._id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRegistration(registration._id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No registrations yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

