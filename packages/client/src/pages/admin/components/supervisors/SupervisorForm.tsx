import { SupervisorForm as ISupervisorForm } from "../../types/supervisor";

interface SupervisorFormProps {
  formData: ISupervisorForm;
  isEditing: boolean;
  onChange: (data: ISupervisorForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function SupervisorForm({
  formData,
  isEditing,
  onChange,
  onSubmit,
  onCancel,
}: SupervisorFormProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {isEditing ? "Edit Supervisor" : "Add New Supervisor"}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => onChange({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password {isEditing && "(leave blank to keep current)"}
          </label>
          <input
            type="password"
            required={!isEditing}
            value={formData.password}
            onChange={(e) =>
              onChange({ ...formData, password: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2"
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            {isEditing ? "Update Supervisor" : "Create Supervisor"}
          </button>
        </div>
      </form>
    </div>
  );
}
