import { Eye } from "lucide-react";
import { format } from "date-fns";
import { WeeklyReport } from "../../types/report";
interface ReportListProps {
  reports: WeeklyReport[];
  onSelectReport: (reportId: string) => void;
}

export function ReportList({ reports, onSelectReport }: ReportListProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
      submitted: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Submitted" },
      approved: { bg: "bg-green-100", text: "text-green-700", label: "Approved" },
      revision_requested: { bg: "bg-red-100", text: "text-red-700", label: "Revision Requested" },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (!reports || reports.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No reports submitted yet for this team
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectReport(report.id)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Week {report.week}
                </h3>
                {getStatusBadge(report.status)}
              </div>
              <p className="text-sm text-gray-600">
                Progress: {report.progressPercentage}%
              </p>
              {report.submittedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Submitted: {format(new Date(report.submittedAt), "MMM dd, yyyy HH:mm")}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectReport(report.id);
              }}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
