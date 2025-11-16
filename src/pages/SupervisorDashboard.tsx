import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { FileText, MessageSquare, CheckCircle, XCircle } from "lucide-react";

export function SupervisorDashboard() {
  const { user } = useAuth();
  const teams = useQuery(
    api.teams.getTeamsBySupervisor,
    user ? { supervisorId: user._id } : "skip"
  );
  const submittedReports = useQuery(api.reports.getReportsByStatus, {
    status: "submitted",
  });

  const addComment = useMutation(api.reports.addSupervisorComment);
  const approveReport = useMutation(api.reports.approveReport);

  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const handleAddComment = async (reportId: string) => {
    if (!comment.trim() || !user) return;

    try {
      await addComment({
        reportId: reportId as any,
        comment: comment.trim(),
        supervisorId: user._id,
      });
      setComment("");
      setSelectedReport(null);
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleApprove = async (reportId: string) => {
    try {
      await approveReport({ reportId: reportId as any });
    } catch (error) {
      console.error("Failed to approve report:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Supervisor Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Review and provide feedback</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned Teams</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {teams?.length || 0}
              </p>
            </div>
            <FileText className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {submittedReports?.length || 0}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Review Queue */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Review Queue</h2>
        </div>
        <div className="p-6">
          {submittedReports && submittedReports.length > 0 ? (
            <div className="space-y-4">
              {submittedReports.map((report) => (
                <div
                  key={report._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Week {report.week}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Progress: {report.progressPercentage}%
                      </p>
                      {report.description && (
                        <p className="text-sm text-gray-700 mt-2">
                          {report.description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedReport(report._id)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => handleApprove(report._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>

                  {selectedReport === report._id && (
                    <div className="mt-4 pt-4 border-t">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add your comment or revision request..."
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                      />
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleAddComment(report._id)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          Add Comment
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReport(null);
                            setComment("");
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {report.supervisorComments.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Previous Comments:
                      </h4>
                      <div className="space-y-2">
                        {report.supervisorComments.map((c, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 rounded p-2 text-sm text-gray-700"
                          >
                            {c.comment}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No reports pending review.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

