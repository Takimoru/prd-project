import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import { SupervisorLayout } from "./components/SupervisorLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RecentActivity } from "../student/components/dashboard/RecentActivity";

export function SupervisorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get teams supervised by this supervisor
  const teams = useQuery(
    api.teams.getTeamsBySupervisor,
    user?._id ? { supervisorId: user._id } : "skip"
  );

  // Get pending reports
  const pendingReports = useQuery(
    api.weeklyReports.getPendingReportsForSupervisor,
    user?._id ? { supervisorId: user._id } : "skip"
  );

  // Get all reports for statistics
  const allReports = useQuery(
    api.weeklyReports.getAllReportsForSupervisor,
    user?._id ? { supervisorId: user._id } : "skip"
  );

  const approvedCount =
    allReports?.filter((r) => r.status === "approved").length || 0;
  const revisionCount =
    allReports?.filter((r) => r.status === "revision_requested").length || 0;

  return (
    <SupervisorLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Supervisor Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your teams and review weekly submissions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-orange-100 bg-gradient-to-br from-orange-50/50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-900/70">
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-900">
                  {pendingReports?.length || 0}
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 bg-gradient-to-br from-green-50/50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-900/70">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-900">
                  {approvedCount}
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100 bg-gradient-to-br from-red-50/50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-900/70">
                Needs Revision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-900">
                  {revisionCount}
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-purple-100 bg-gradient-to-br from-purple-50/50 to-white cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate("/supervisor/attendance-approval")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-900/70">
                Attendance Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-purple-900">
                  Review & Approve
                </div>
                <CheckCircle2 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Weekly Reviews</CardTitle>
            <CardDescription>Reports waiting for your approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingReports && pendingReports.length > 0 ? (
              <div className="space-y-4">
                {pendingReports.map((report) => (
                  <div
                    key={report._id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {report.team?.name || "Unnamed Team"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Week {report.week} • Leader: {report.leader?.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted:{" "}
                        {report.submittedAt
                          ? new Date(report.submittedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200">
                        Pending
                      </Badge>
                      <Button
                        onClick={() =>
                          navigate(
                            `/supervisor/review/${report.teamId}/${report.week}`
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending reviews at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <div className="pb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Work Progress Update</h2>
            <RecentActivity teamId={teams?.[0]?._id} />
        </div>
      </div>
    </SupervisorLayout>
  );
}
