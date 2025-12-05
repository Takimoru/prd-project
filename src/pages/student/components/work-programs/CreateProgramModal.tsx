import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { Id } from "../../../../../convex/_generated/dataModel";

interface CreateProgramModalProps {
  onClose: () => void;
  userId: Id<"users">;
}

export function CreateProgramModal({ onClose, userId }: CreateProgramModalProps) {
  const createProgram = useMutation(api.programs.createProgram);
  const [programForm, setProgramForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const handleCreateProgram = async () => {
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
        createdBy: userId,
      });
      toast.success("Work program created!");
      setProgramForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
      });
      onClose();
    } catch (error: any) {
      console.error("Failed to create program:", error);
      toast.error(error.message || "Failed to create program");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Create Work Program
        </h2>
        <button
          onClick={onClose}
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
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
