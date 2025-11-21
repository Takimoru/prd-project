import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";
import { Plus, Edit, Trash2, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Id } from "../../../convex/_generated/dataModel";

export function SupervisorManagement() {
  const { user } = useAuth();
  const [showSupervisorForm, setShowSupervisorForm] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Id<"users"> | null>(null);
  const [supervisorForm, setSupervisorForm] = useState({
    name: "",
    email: "",
    nidn: "",
  });

  const allUsers = useQuery(api.users.getAllUsers, {});
  const createSupervisor = useMutation(api.users.createSupervisor);
  const updateSupervisor = useMutation(api.users.updateSupervisor);
  const deleteSupervisor = useMutation(api.users.deleteSupervisor);

  const supervisorOptions = allUsers?.filter((u) => u.role === "supervisor") ?? [];

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
          <h1 className="text-3xl font-bold text-gray-900">Supervisor Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage supervisors for team assignments
          </p>
        </div>
        <button
          onClick={() => {
            setShowSupervisorForm(true);
            setEditingSupervisor(null);
            setSupervisorForm({ name: "", email: "", nidn: "" });
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supervisor</span>
        </button>
      </div>

      {/* Supervisor Form */}
      {showSupervisorForm && (
        <div className="bg-white rounded-lg shadow p-6">
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
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {editingSupervisor
                ? "Update Supervisor"
                : "Create Supervisor"}
            </button>
            <button
              onClick={handleCancelSupervisorForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Supervisors List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Supervisors</h2>
        </div>
        <div className="p-6">
          {supervisorOptions && supervisorOptions.length > 0 ? (
            <div className="space-y-3">
              {supervisorOptions.map((supervisor) => (
                <div
                  key={supervisor._id}
                  className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50"
                >
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
                      title="Edit supervisor"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupervisor(supervisor._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete supervisor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No supervisors created yet. Click "Add Supervisor" to create one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

