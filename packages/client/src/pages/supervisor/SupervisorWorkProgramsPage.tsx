import { useQuery } from "@apollo/client";
import { GET_SUPERVISOR_DASHBOARD_DATA } from "@/graphql/supervisor";
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
import { FileText, MessageSquare, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export function SupervisorWorkProgramsPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(GET_SUPERVISOR_DASHBOARD_DATA);

  if (loading) {
    return (
      <SupervisorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SupervisorLayout>
    );
  }

  const workPrograms = data?.mySupervisedWorkPrograms || [];

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Programs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and discuss work programs across your assigned teams.
          </p>
        </div>

        <div className="grid gap-6">
          {workPrograms.length > 0 ? (
            workPrograms.map((wp: any) => (
              <Card key={wp.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">{wp.title}</CardTitle>
                    <CardDescription>{wp.team?.name}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {wp.progress}% Complete
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Starts:</span>
                        {format(new Date(wp.startDate), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Ends:</span>
                        {format(new Date(wp.endDate), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/team/${wp.teamId}/programs/${wp.id}`)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/team/${wp.teamId}/programs/${wp.id}?tab=chat`)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Discussion
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-medium">No Work Programs Found</h3>
              <p className="text-muted-foreground">You are not supervising any active work programs at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </SupervisorLayout>
  );
}
