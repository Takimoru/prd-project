import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { SupervisorLayout } from "./components/SupervisorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SupervisorAllReports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const allReports = useQuery(
    api.weeklyReports.getAllReportsForSupervisor,
    user?._id ? { supervisorId: user._id } : "skip"
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case "submitted":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending</Badge>;
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Reports</h1>
          <p className="text-muted-foreground mt-2">
            Complete history of team weekly reports
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Reports</CardTitle>
            <CardDescription>All submissions from your supervised teams</CardDescription>
          </CardHeader>
          <CardContent>
            {allReports && allReports.length > 0 ? (
              <div className="space-y-4">
                {allReports.map((report) => (
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
                      {getStatusBadge(report.status)}
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/supervisor/review/${report.teamId}/${report.week}`
                          )
                        }>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No reports yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SupervisorLayout>
  );
}
