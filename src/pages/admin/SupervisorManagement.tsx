import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Id } from "../../../convex/_generated/dataModel";
import { AdminHeader } from "./components/AdminHeader";

import { Button } from "../../components/ui/button";

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
      <AdminHeader
        title="Supervisor Management"
        description="Create and manage supervisors for team assignments"
        action={
          <Button
            onClick={() => {
              setShowSupervisorForm(true);
              setEditingSupervisor(null);
              setSupervisorForm({ name: "", email: "", nidn: "" });
            }}
            className="bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))/0.9] text-white shadow-lg shadow-orange-900/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supervisor
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Supervisor Form */}
        {showSupervisorForm && (
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {editingSupervisor
                ? "Edit Supervisor"
                : "Create New Supervisor"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
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
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Supervisor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
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
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="supervisor@university.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
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
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="NIDN number"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button
                onClick={
                  editingSupervisor
                    ? handleUpdateSupervisor
                    : handleCreateSupervisor
                }
                className="bg-primary hover:bg-primary/90"
              >
                {editingSupervisor
                  ? "Update Supervisor"
                  : "Create Supervisor"}
              </Button>
              <Button
                onClick={handleCancelSupervisorForm}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Supervisors List */}
        <div className="bg-card rounded-lg shadow-lg border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Supervisors</h2>
          </div>
          <div className="p-6">
            {supervisorOptions && supervisorOptions.length > 0 ? (
              <div className="space-y-3">
                {supervisorOptions.map((supervisor) => (
                  <div
                    key={supervisor._id}
                    className="border border-border rounded-lg p-4 flex justify-between items-center hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {supervisor.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {supervisor.email}
                      </p>
                      {supervisor.nidn && (
                        <p className="text-sm text-muted-foreground">
                          NIDN: {supervisor.nidn}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSupervisor(supervisor)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                        title="Edit supervisor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupervisor(supervisor._id)}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete supervisor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No supervisors created yet. Click "Add Supervisor" to create one.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

