import { useQuery } from "@apollo/client";
import { GET_TEAM_DETAILS, GET_TEAM_REPORTS } from "@/graphql/supervisor";
import { useParams, useNavigate } from "react-router-dom";
import { SupervisorLayout } from "./components/SupervisorLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ArrowLeft, User, FileText, Calendar, Loader2 } from "lucide-react";

export function SupervisorTeamDetails() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const { data: teamData, loading: teamLoading } = useQuery(GET_TEAM_DETAILS, {
    variables: { id: teamId },
    skip: !teamId,
  });

  const { data: reportsData, loading: reportsLoading } = useQuery(GET_TEAM_REPORTS, {
    variables: { teamId },
    skip: !teamId,
  });

  const team = teamData?.team;
  const weeklyReports = reportsData?.weeklyReports || [];

  if (teamLoading) {
    return (
      <SupervisorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SupervisorLayout>
    );
  }

  if (!team) {
    return (
      <SupervisorLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Team not found.</p>
          <Button
            variant="ghost"
            onClick={() => navigate("/supervisor/teams")}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Teams
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
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending</Badge>;
      case "revision_requested":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Revision Needed</Badge>;
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
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate("/supervisor/teams")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Teams
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            {team.name || "Team Details"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Team information and weekly submissions
          </p>
        </div>

        {/* Team Info */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Leader</h4>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{team.leader?.name || "N/A"}</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Members</h4>
                <div className="space-y-2">
                  {team.members && team.members.length > 0 ? (
                    team.members.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{member.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No members</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Submissions</CardTitle>
            <CardDescription>
              All weekly reports submitted by this team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
              </div>
            ) : weeklyReports.length > 0 ? (
              <div className="space-y-3">
                {[...weeklyReports]
                  .sort((a, b) => b.week.localeCompare(a.week))
                  .map((report: any) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-semibold">Week {report.week}</h4>
                            <p className="text-sm text-muted-foreground">
                              Progress: {report.progressPercentage}%
                            </p>
                            {report.submittedAt && (
                              <p className="text-xs text-muted-foreground">
                                Submitted: {new Date(report.submittedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(report.status)}
                        <Button
                          onClick={() => navigate(`/supervisor/review/${teamId}/${report.week}`)}
                          variant="outline"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No weekly submissions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SupervisorLayout>
  );
}
