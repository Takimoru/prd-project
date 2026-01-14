import { useQuery } from "@apollo/client";
import { GET_SUPERVISOR_DASHBOARD_DATA } from "@/graphql/supervisor";
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
import { FileText, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RecentActivity } from "../student/components/dashboard/RecentActivity";

export function SupervisorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(GET_SUPERVISOR_DASHBOARD_DATA, {
    skip: !user?.id,
  });

  if (error) {
    return (
      <SupervisorLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-red-800 font-bold text-lg mb-2">Dashboard Error</h2>
            <p className="text-red-600 mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry Refresh
            </Button>
          </div>
        </div>
      </SupervisorLayout>
    );
  }

  const pendingReports = data?.weeklyReviewQueue;
  const workPrograms = data?.mySupervisedWorkPrograms;
  const pendingAttendance = data?.pendingAttendanceQueue;

  // Combine pending items
  const allPendingItems = [
    ...(pendingReports?.map((r: any) => ({ 
      ...r, 
      type: 'report' as const,
      displayName: r.team?.name,
      displaySub: `Leader: ${r.leader?.name}`,
      weekValue: r.week
    })) || []),
    ...(pendingAttendance?.map((a: any) => {
        const date = new Date(a.weekStartDate);
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
        const w = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        const weekStr = `${date.getFullYear()}-W${String(w).padStart(2, "0")}`;
        
        return { 
          ...a, 
          type: 'attendance' as const,
          displayName: a.student?.name,
          displaySub: `Team: ${a.team?.name}`,
          weekValue: weekStr,
          originalWeek: a.weekStartDate
        };
    }) || [])
  ]
  .sort((a, b) => b.weekValue.localeCompare(a.weekValue));

  if (loading) {
    return (
      <SupervisorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
        </div>
      </SupervisorLayout>
    );
  }

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

        {/* Work Programs Section */}
        <div>
           <h2 className="text-xl font-semibold mb-4 text-foreground">Running Work Programs</h2>
           {workPrograms && workPrograms.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {workPrograms.map((wp: any) => (
                 <Card key={wp.id} className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                       <div className="flex justify-between items-start">
                          <div>
                             <CardTitle className="text-lg">{wp.title}</CardTitle>
                             <CardDescription className="mt-1">{wp.team?.name}</CardDescription>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">{wp.progress}%</Badge>
                       </div>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-2">
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                                style={{ width: `${wp.progress}%` }} 
                             />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                             <span>Start: {new Date(wp.startDate).toLocaleDateString()}</span>
                             <span>End: {new Date(wp.endDate).toLocaleDateString()}</span>
                          </div>
                       </div>
                    </CardContent>
                 </Card>
               ))}
             </div>
           ) : (
             <div className="p-8 text-center border rounded-lg bg-accent/20 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No running work programs.</p>
             </div>
           )}
        </div>

        {/* Recent Activity Feed - MOVED TO MIDDLE */}
        <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground">Recent Activity</h2>
            <RecentActivity />
        </div>

        {/* Pending Reviews Section - MOVED TO BOTTOM */}
        <Card className="border-orange-200">
          <CardHeader className="bg-orange-50/30">
            <CardTitle className="text-orange-900">Pending Approvals</CardTitle>
            <CardDescription>Weekly reports and attendance waiting for review</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {allPendingItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allPendingItems.map((item: any, index: number) => (
                  <div
                    key={`${item.type}-${item.id || item.studentId}-${index}`}
                    className="flex items-center justify-between p-4 border border-orange-100 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                        if (item.type === 'report') {
                            navigate(`/supervisor/review/${item.teamId}/${item.weekValue}`);
                        } else {
                            // Link to attendance approval with query params
                            navigate(`/supervisor/attendance-approval?teamId=${item.teamId}&week=${item.originalWeek}`);
                        }
                    }}
                  >
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                            item.type === 'report' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                            {item.type === 'report' ? <FileText className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>}
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground">
                                {item.displayName}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium text-orange-700">
                                   Week {item.weekValue.split("-W")[1]}
                                </span>
                                <span>•</span>
                                <span>
                                    {item.displaySub}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                         <Badge variant="outline" className={`border ${
                             item.type === 'report' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-purple-600 border-purple-200 bg-purple-50'
                         }`}>
                             {item.type === 'report' ? 'Report' : 'Attendance'}
                         </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">All Caught Up!</h3>
                <p>No pending items to review.</p>
              </div>
            )}
            
            {/* Quick Link to Attendance Approval */}
            <div className="mt-6 pt-6 border-t flex justify-center">
                <Button variant="outline" onClick={() => navigate("/supervisor/attendance-approval")}>
                    Go to Attendance Approvals
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SupervisorLayout>
  );
}
