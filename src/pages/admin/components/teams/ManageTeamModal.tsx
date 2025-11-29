import { X } from "lucide-react";
import { TeamForm } from "../../types/team";


interface ManageTeamModalProps {
  formData: TeamForm;
  isEditing: boolean;
  availableStudents: any[];
  onChange: (data: TeamForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function ManageTeamModal({
  formData,
  isEditing,
  availableStudents,
  onChange,
  onSubmit,
  onClose,
}: ManageTeamModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Team" : "Create New Team"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Team Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2"
              placeholder="e.g., Alpha Squad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Leader
            </label>
            <select
              required
              value={formData.leaderId}
              onChange={(e) =>
                onChange({ ...formData, leaderId: e.target.value })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2"
            >
              <option value="">Select a leader</option>
              {availableStudents?.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Members
            </label>
            <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
              {availableStudents?.map((student) => (
                <label
                  key={student._id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.memberIds.includes(student._id)}
                    onChange={(e) => {
                      const newMembers = e.target.checked
                        ? [...formData.memberIds, student._id]
                        : formData.memberIds.filter(
                            (id) => id !== student._id
                          );
                      onChange({ ...formData, memberIds: newMembers });
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {student.name}
                    </p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                </label>
              ))}
              {availableStudents?.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No available students found
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selected: {formData.memberIds.length} members
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              {isEditing ? "Update Team" : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
