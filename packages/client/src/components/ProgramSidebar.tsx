import { format } from "date-fns";
import { ChevronRight, LayoutDashboard } from "lucide-react";

interface Program {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface ProgramSidebarProps {
  programs: Program[] | undefined;
  selectedProgramId: string | null;
  onSelectProgram: (id: string | null) => void;
}

export function ProgramSidebar({
  programs,
  selectedProgramId,
  onSelectProgram,
}: ProgramSidebarProps) {
  return (
    <div className="w-64 bg-white border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-gray-900">Programs</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <button
          onClick={() => onSelectProgram(null)}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
            selectedProgramId === null
              ? "bg-primary-50 text-primary-700"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-sm font-medium">Overview</span>
        </button>
        
        <div className="pt-2 pb-1 px-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Active Programs
          </p>
        </div>

        {programs?.map((program) => (
          <button
            key={program._id}
            onClick={() => onSelectProgram(program._id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left group ${
              selectedProgramId === program._id
                ? "bg-primary-50 text-primary-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{program.title}</p>
              <p className="text-xs text-gray-500 truncate">
                {format(new Date(program.startDate), "MMM d")} -{" "}
                {format(new Date(program.endDate), "MMM d, yyyy")}
              </p>
            </div>
            {selectedProgramId === program._id && (
              <ChevronRight className="w-4 h-4 text-primary-500 flex-shrink-0" />
            )}
          </button>
        ))}

        {programs?.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-gray-500">
            No active programs
          </div>
        )}
      </div>
    </div>
  );
}
