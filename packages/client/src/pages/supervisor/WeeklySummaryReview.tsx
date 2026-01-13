import { useQuery, useMutation } from "@apollo/client";
import { 
  GET_WEEK_REPORT, 
  APPROVE_WEEKLY_REPORT, 
  REJECT_WEEKLY_REPORT, 
  ADD_WEEKLY_REPORT_FEEDBACK 
} from "@/graphql/supervisor";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { SupervisorLayout } from "./components/SupervisorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, MessageSquare, ArrowLeft, User, CheckSquare, Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export function WeeklySummaryReview() {
  const { teamId, week } = useParams<{ teamId: string; week: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | "feedback">("feedback");

  const { data, loading, refetch } = useQuery(GET_WEEK_REPORT, {
    variables: { teamId, week },
    skip: !teamId || !week,
  });

  const report = data?.weeklyReportByWeek;

  const [approveReport] = useMutation(APPROVE_WEEKLY_REPORT);
  const [rejectReport] = useMutation(REJECT_WEEKLY_REPORT);
  const [addFeedback] = useMutation(ADD_WEEKLY_REPORT_FEEDBACK);

  const handleApprove = () => {
    setActionType("approve");
    setShowFeedbackModal(true);
  };

  const handleReject = () => {
    setActionType("reject");
    setShowFeedbackModal(true);
  };

  const handleAddFeedback = () => {
    setActionType("feedback");
    setShowFeedbackModal(true);
  };

  const handleSubmitAction = async () => {
    if (!report || !user) return;

    try {
      if (actionType === "approve") {
        await approveReport({
          variables: {
            id: report.id,
            comment: feedbackText || undefined,
          }
        });
        toast.success("Report approved successfully!");
        navigate("/supervisor");
      } else if (actionType === "reject") {
        if (!feedbackText.trim()) {
          toast.error("Please provide a reason for rejection");
          return;
        }
        await rejectReport({
          variables: {
            input: {
              reportId: report.id,
              comment: feedbackText,
            }
          }
        });
        toast.success("Revision requested");
        navigate("/supervisor");
      } else {
        if (!feedbackText.trim()) {
          toast.error("Please enter feedback");
          return;
        }
        await addFeedback({
          variables: {
            input: {
              reportId: report.id,
              comment: feedbackText,
            }
          }
        });
        toast.success("Feedback added");
        refetch();
      }
      setShowFeedbackModal(false);
      setFeedbackText("");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit");
    }
  };

  if (loading) {
    return (
      <SupervisorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SupervisorLayout>
    );
  }

  if (!report) {
    return (
      <SupervisorLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Report not found.</p>
          <Button
            variant="ghost"
            onClick={() => navigate("/supervisor")}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </SupervisorLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case "submitted":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending Review</Badge>;
      case "revision_requested":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Revision Requested</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/supervisor")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-foreground">
              Weekly Report Review
            </h1>
            <p className="text-muted-foreground mt-2">
              {report.team?.name || "Team"} • Week {week}
            </p>
          </div>
          <div>
            {getStatusBadge(report.status)}
          </div>
        </div>

        {/* Report Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>
              Submitted on {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Description</h4>
                <p className="text-foreground whitespace-pre-wrap">
                  {report.description || "No description provided"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Progress</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${report.progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{report.progressPercentage}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Member Progress</CardTitle>
            <CardDescription>
              Individual task completion for each team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.memberProgress && report.memberProgress.length > 0 ? (
              <div className="space-y-4">
                {report.memberProgress.map((mp: any) => (
                  <div
                    key={mp.user?.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{mp.user?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {mp.completedTasks} of {mp.totalTasks} tasks completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold">
                        {mp.totalTasks > 0
                          ? Math.round((mp.completedTasks / mp.totalTasks) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No member progress data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Photos/Attachments */}
        {report.photos && report.photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Photos and documentation uploaded by the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {report.photos.map((photo: string, index: number) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border border-border">
                    <img
                      src={photo}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(photo, "_blank")}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Supervisor Comments */}
        {report.comments && report.comments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Supervisor Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.comments.map((comment: any) => (
                  <div key={comment.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm text-foreground">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {comment.author?.name} • {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {report.status === "submitted" && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleAddFeedback}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Feedback
            </Button>
            <Button
              variant="outline"
              onClick={handleReject}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Request Revision
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Report
            </Button>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Report"}
              {actionType === "reject" && "Request Revision"}
              {actionType === "feedback" && "Add Feedback"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder={
                actionType === "reject"
                  ? "Please explain what needs to be revised..."
                  : "Add your comments (optional)..."
              }
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={5}
              required={actionType === "reject"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAction}>
              {actionType === "approve" && "Approve"}
              {actionType === "reject" && "Request Revision"}
              {actionType === "feedback" && "Add Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupervisorLayout>
  );
}
