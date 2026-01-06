import { X, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { WeeklyReport } from "../../types/report";
import { Id } from "@/convex/_generated/dataModel";

interface ReportDetailModalProps {
  report: WeeklyReport;
  teamName: string;
  onClose: () => void;
  onApprove: (reportId: Id<"weeklyReports">) => void;
  onRequestRevision: (reportId: Id<"weeklyReports">, comment: string) => void;
}

export function ReportDetailModal({
  report,
  teamName,
  onClose,
  onApprove,
  onRequestRevision,
}: ReportDetailModalProps) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Weekly Report - Week {report.week}
            </h2>
            <p className="text-sm text-gray-500">{teamName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
            {getStatusBadge(report.status)}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Progress</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full"
                style={{ width: `${report.progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {report.progressPercentage}% complete
            </p>
          </div>

          {report.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {report.description}
              </p>
            </div>
          )}

          {report.photos && report.photos.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {report.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`Report photo ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {report.tasks && report.tasks.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Tasks</h3>
              <div className="space-y-2">
                {report.tasks.map(
                  (task) =>
                    task && (
                      <div
                        key={task._id}
                        className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                      >
                        {task.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400" />
                        )}
                        <span
                          className={
                            task.completed ? "line-through text-gray-500" : ""
                          }
                        >
                          {task.title}
                        </span>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {report.supervisorComments &&
            report.supervisorComments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Supervisor Comments
                </h3>
                <div className="space-y-2">
                  {report.supervisorComments.map((comment, idx) => (
                    <div key={idx} className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-700">{comment.comment}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {comment.commentedByUser?.name || "Unknown"} -{" "}
                        {format(
                          new Date(comment.commentedAt),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {report.status === "submitted" && (
            <div className="flex space-x-2 pt-4 border-t">
              <button
                onClick={() => onApprove(report._id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve Report
              </button>
              <button
                onClick={() => {
                  const comment = prompt("Enter revision comment:");
                  if (comment) {
                    onRequestRevision(report._id, comment);
                  }
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Request Revision
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
