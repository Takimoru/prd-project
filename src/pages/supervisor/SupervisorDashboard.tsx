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
import { FileText, CheckCircle2 } from "lucide-react";
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

  // Get active work programs
  const workPrograms = useQuery(
    api.workPrograms.getWorkProgramsBySupervisor,
    user?._id ? { supervisorId: user._id } : "skip"
  );
  
  // Get pending attendance approvals
  const pendingAttendance = useQuery(
    api.attendance.getPendingAttendanceForSupervisor,
    user?._id ? { supervisorId: user._id } : "skip"
  );

  // Calculate current week
  const today = new Date();
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const currentWeek = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;

  // Combine pending items
  const allPendingItems = [
    ...(pendingReports?.map(r => ({ ...r, type: 'report' as const })) || []),
    ...(pendingAttendance?.map(a => ({ ...a, type: 'attendance' as const })) || [])
  ]
  .filter(item => item.week === currentWeek) // Filter for only current week
  .sort((a, b) => {
     // Sort by week descending, then submission date
     if (a.week !== b.week) return b.week.localeCompare(a.week);
     return 0;
  });

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

        {/* Work Programs Section (Replaces Stats Cards) */}
        <div>
           <h2 className="text-xl font-semibold mb-4 text-foreground">Running Work Programs</h2>
           {workPrograms && workPrograms.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {workPrograms.map((wp) => (
                 <Card key={wp._id} className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                       <div className="flex justify-between items-start">
                          <div>
                             <CardTitle className="text-lg">{wp.title}</CardTitle>
                             <CardDescription className="mt-1">{wp.teamName}</CardDescription>
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

        {/* Pending Reviews Section */}
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
                    key={`${item.type}-${item._id || item.studentId}-${index}`}
                    className="flex items-center justify-between p-4 border border-orange-100 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                        if (item.type === 'report') {
                            navigate(`/supervisor/review/${item.teamId}/${item.week}`);
                        } else {
                            // Link to attendance approval with query params
                            navigate(`/supervisor/attendance-approval?teamId=${item.teamId}&week=${item.week}`);
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
                                {item.type === 'report' ? item.team?.name : item.studentName}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium text-orange-700">
                                   Week {item.week.split("-W")[1]}
                                </span>
                                <span>•</span>
                                <span>
                                  {item.type === 'report' ? `Leader: ${item.leader?.name}` : `Team: ${item.teamName}`}
                                </span>
                            </div>
                        </div>
                    </div>
                {/* Right side Badge removed or minimized if needed. Keeping it for item type clarity but removing the redundant week label from here. */}
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

        {/* Recent Activity Feed */}
        <div className="pb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Activity Log</h2>
            <RecentActivity teamId={teams?.[0]?._id} />
        </div>
      </div>
    </SupervisorLayout>
  );
}
