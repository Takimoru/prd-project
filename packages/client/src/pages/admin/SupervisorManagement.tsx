import { Plus, Edit, Trash2 } from "lucide-react";
import { AdminHeader } from "./components/AdminHeader";
import { Button } from "../../components/ui/button";
import { useSupervisorManagement } from "./hooks/useSupervisorManagement";

export function SupervisorManagement() {
  const {
    isCreating,
    setIsCreating,
    editingId,
    formData,
    setFormData,
    supervisors,
    handleCreateSupervisor,
    handleUpdateSupervisor,
    handleDeleteSupervisor,
    startEditing,
    resetForm,
  } = useSupervisorManagement();

  const handleEditSupervisor = (supervisor: any) => {
    startEditing(supervisor);
  };

  const handleCancelSupervisorForm = () => {
    resetForm();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await handleUpdateSupervisor(e);
    } else {
      await handleCreateSupervisor(e);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Manajemen Dosen Pembimbing"
        description="Buat dan kelola dosen pembimbing untuk penugasan tim"
        action={
          <Button
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
            className="bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))/0.9] text-white shadow-lg shadow-orange-900/20">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pembimbing
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Supervisor Form */}
        {isCreating && (
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {editingId ? "Edit Dosen Pembimbing" : "Buat Dosen Pembimbing Baru"}
            </h3>
            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Nama *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Nama dosen pembimbing"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email * (untuk login)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="dosen@university.edu"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    NIDN *
                  </label>
                  <input
                    type="text"
                    value={formData.nidn}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nidn: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Nomor NIDN"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90">
                  {editingId ? "Perbarui" : "Buat"}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancelSupervisorForm}
                  variant="outline">
                  Batal
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Supervisors List */}
        <div className="bg-card rounded-lg shadow-lg border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              Daftar Dosen Pembimbing
            </h2>
          </div>
          <div className="p-6">
            {supervisors && supervisors.length > 0 ? (
              <div className="space-y-3">
                {supervisors.map((supervisor: any) => (
                  <div
                    key={supervisor.id}
                    className="border border-border rounded-lg p-4 flex justify-between items-center hover:bg-accent/50 transition-colors">
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
                        title="Edit dosen pembimbing">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupervisor(supervisor.id)}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Hapus dosen pembimbing">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Belum ada dosen pembimbing. Klik "Tambah Pembimbing" untuk membuat baru.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
