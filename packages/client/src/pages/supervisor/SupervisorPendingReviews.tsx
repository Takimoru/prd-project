import { useQuery } from "@apollo/client";
import { GET_PENDING_REVIEWS } from "@/graphql/supervisor";
import { useAuth } from "@/contexts/AuthContext";
import { SupervisorLayout } from "./components/SupervisorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SupervisorPendingReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, loading } = useQuery(GET_PENDING_REVIEWS, {
    skip: !user?.id,
  });

  const pendingReports = data?.weeklyReviewQueue || [];

  if (loading) {
    return (
      <SupervisorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SupervisorLayout>
    );
  }

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pending Reviews</h1>
          <p className="text-muted-foreground mt-2">
            Weekly reports waiting for your review
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Weekly Reports</CardTitle>
            <CardDescription>Review and approve team submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingReports.length > 0 ? (
              <div className="space-y-4">
                {pendingReports.map((report: any) => (
                  <div
                    key={report.id}
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
      </div>
    </SupervisorLayout>
  );
}
