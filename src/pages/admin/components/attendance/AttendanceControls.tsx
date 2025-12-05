import { Download } from "lucide-react";

interface AttendanceControlsProps {
  weekRange: string;
  selectedWeek: string;
  programName: string;
  onWeekChange: (direction: "prev" | "next") => void;
  onExport: () => void;
  approvalStatus?: "approved" | "rejected" | "pending";
}

export function AttendanceControls({
  weekRange,
  selectedWeek,
  programName,
  onWeekChange,
  onExport,
  approvalStatus
}: AttendanceControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-border space-y-4 sm:space-y-0">
      <div>
        <div className="flex items-center gap-3">
           <h3 className="text-lg font-semibold text-foreground">
             Weekly Attendance ({weekRange})
           </h3>
           {approvalStatus && (
             <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                approvalStatus === "approved" ? "bg-green-100 text-green-700 border-green-200" :
                approvalStatus === "rejected" ? "bg-red-100 text-red-700 border-red-200" :
                "bg-yellow-100 text-yellow-700 border-yellow-200"
             }`}>
               Supervisor: {approvalStatus.toUpperCase()}
             </span>
           )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {programName}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onWeekChange("prev")}
          className="p-2 border rounded-lg hover:bg-gray-50"
        >
          ←
        </button>
        <span className="text-sm font-medium text-gray-700 px-3">
          Week {selectedWeek}
        </span>
        <button
          onClick={() => onWeekChange("next")}
          className="p-2 border rounded-lg hover:bg-gray-50"
        >
          →
        </button>
        <button
          onClick={onExport}
          className="inline-flex items-center space-x-2 px-3 py-2 border rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
}
