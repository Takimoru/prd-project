import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";
import { FileText, CheckCircle, X, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Id } from "../../../convex/_generated/dataModel";

export function FinalReports() {
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState<Id<"programs"> | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Id<"teams"> | null>(null);
  const [selectedReport, setSelectedReport] = useState<Id<"weeklyReports"> | null>(null);

  const programs = useQuery(api.programs.getAllPrograms, {
    includeArchived: false,
  });
  const teamsForProgram = useQuery(
    api.teams.getTeamsByProgram,
    selectedProgram ? { programId: selectedProgram } : "skip"
  );
  const reportsForTeam = useQuery(
    api.reports.getReportsByTeam,
    selectedTeam ? { teamId: selectedTeam } : "skip"
  );
  const selectedReportData = useQuery(
    api.reports.getWeeklyReport,
    selectedReport
      ? {
          teamId: selectedTeam!,
          week: reportsForTeam?.find((r) => r._id === selectedReport)?.week || "",
        }
      : "skip"
  );
  const approveReport = useMutation(api.reports.approveReport);
  const addSupervisorComment = useMutation(api.reports.addSupervisorComment);

  const handleApproveReport = async (reportId: Id<"weeklyReports">) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    try {
      await approveReport({ reportId });
      toast.success("Report approved!");
      setSelectedReport(null);
    } catch (error: any) {
      console.error("Failed to approve:", error);
      toast.error(error.message || "Failed to approve report");
    }
  };

  const handleRequestRevision = async (reportId: Id<"weeklyReports">, comment: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please provide a comment");
      return;
    }

    try {
      await addSupervisorComment({
        reportId,
        comment: comment.trim(),
        supervisorId: user._id,
      });
      toast.success("Revision requested!");
      setSelectedReport(null);
    } catch (error: any) {
      console.error("Failed to request revision:", error);
      toast.error(error.message || "Failed to request revision");
    }
  };

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Final Reports</h1>
        <p className="text-gray-600 mt-2">
          Review weekly reports submitted by students per team
        </p>
      </div>

      {/* Program Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Program
        </label>
        <select
          value={selectedProgram || ""}
          onChange={(e) => {
            setSelectedProgram(e.target.value as Id<"programs"> | null);
            setSelectedTeam(null);
            setSelectedReport(null);
          }}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Select a program</option>
          {programs?.map((program) => (
            <option key={program._id} value={program._id}>
              {program.title}
            </option>
          ))}
        </select>
      </div>

      {/* Team Selection */}
      {selectedProgram && (
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Team
          </label>
          <select
            value={selectedTeam || ""}
            onChange={(e) => {
              setSelectedTeam(e.target.value as Id<"teams"> | null);
              setSelectedReport(null);
            }}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select a team</option>
            {teamsForProgram?.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name || `Team ${team._id.slice(-6)}`} - {team.leader?.name || "Unknown"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Reports List */}
      {selectedTeam && reportsForTeam && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Weekly Reports</h2>
          </div>
          <div className="p-6 space-y-3">
            {reportsForTeam.length > 0 ? (
              reportsForTeam.map((report) => (
                <div
                  key={report._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedReport(report._id)}
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
                        setSelectedReport(report._id);
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No reports submitted yet for this team
              </p>
            )}
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && selectedReportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Weekly Report - Week {selectedReportData.week}
                </h2>
                <p className="text-sm text-gray-500">
                  {teamsForProgram?.find((t) => t._id === selectedTeam)?.name || "Team"}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                {getStatusBadge(selectedReportData.status)}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full"
                    style={{ width: `${selectedReportData.progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedReportData.progressPercentage}% complete
                </p>
              </div>

              {selectedReportData.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedReportData.description}
                  </p>
                </div>
              )}

              {selectedReportData.photos && selectedReportData.photos.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedReportData.photos.map((photo, idx) => (
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

              {selectedReportData.tasks && selectedReportData.tasks.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tasks</h3>
                  <div className="space-y-2">
                    {selectedReportData.tasks.map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                      >
                        {task.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={task.completed ? "line-through text-gray-500" : ""}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReportData.supervisorComments &&
                selectedReportData.supervisorComments.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Supervisor Comments</h3>
                    <div className="space-y-2">
                      {selectedReportData.supervisorComments.map((comment: any, idx: number) => (
                        <div key={idx} className="p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-gray-700">{comment.comment}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {comment.commentedByUser?.name || "Unknown"} -{" "}
                            {format(new Date(comment.commentedAt), "MMM dd, yyyy HH:mm")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedReportData.status === "submitted" && (
                <div className="flex space-x-2 pt-4 border-t">
                  <button
                    onClick={() => handleApproveReport(selectedReport._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve Report
                  </button>
                  <button
                    onClick={() => {
                      const comment = prompt("Enter revision comment:");
                      if (comment) {
                        handleRequestRevision(selectedReport._id, comment);
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
      )}

      {!selectedTeam && selectedProgram && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Please select a team to view reports
        </div>
      )}

      {!selectedProgram && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Please select a program to view final reports
        </div>
      )}
    </div>
  );
}

