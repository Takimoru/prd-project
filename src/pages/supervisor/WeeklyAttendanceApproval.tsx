import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, Calendar, Users, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

export function WeeklyAttendanceApproval() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    // Simplified week calculation
    const d = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    return `${year}-W${String(weekNo).padStart(2, "0")}`;
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const teams = useQuery(
    api.teams.getTeamsForUser,
    user ? { userId: user._id } : "skip"
  );

  // Filter teams where user is strictly a supervisor for this view (optional, but cleaner)
  const supervisedTeams =
    teams?.filter((team) => team.supervisorId === user?._id) || [];

  // Actually use all visible teams for now as requirement wasn't strict on "only supervised" vs "assigned"
  // but let's default to supervisedTeams if available, else all.
  const displayTeams = supervisedTeams.length > 0 ? supervisedTeams : teams;

  // Auto-select if only one team
  useMemo(() => {
    if (displayTeams?.length === 1 && !selectedTeamId) {
      setSelectedTeamId(displayTeams[0]._id);
    }
  }, [displayTeams, selectedTeamId]);

  const weeklyData = useQuery(
    api.attendance.getWeeklyAttendanceSummary,
    selectedTeamId && selectedWeek
      ? { teamId: selectedTeamId as any, week: selectedWeek }
      : "skip"
  );
  
  const selectedStudent = weeklyData?.students?.find(s => s.userId === selectedStudentId);

  const approveMutation = useMutation(api.attendance.approveWeeklyAttendance);

  const handleApproval = async (studentId: string, status: "approved" | "rejected") => {
    if (!selectedTeamId || !user) return;

    try {
      await approveMutation({
        teamId: selectedTeamId as any,
        studentId: studentId as any,
        supervisorId: user._id,
        week: selectedWeek,
        status,
        notes,
      });
      toast.success(`Attendance ${status} successfully`);
      setNotes(""); // Clear notes on success
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  if (!user || !teams) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Attendance Approval</h1>
          <p className="text-muted-foreground">
            Review and approve accumulated team attendance.
          </p>
        </div>
      </div>

      {/* Team & Week Selection */}
      <Card className="border-l-4 border-l-blue-600">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Hide Team Selector if only 1 team (or make read-only) */}
            {displayTeams && displayTeams.length > 1 && (
              <div className="w-full md:w-64">
                <label className="text-sm font-medium mb-1 block">
                  Select Team
                </label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayTeams?.map((team) => (
                      <SelectItem key={team._id} value={team._id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">
                Week (YYYY-WW)
              </label>
              <div className="flex items-center border rounded-md px-3 py-2 bg-background">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <input
                  type="week"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-sm w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {selectedTeamId && weeklyData ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Student List */}
          <div className="md:col-span-4 lg:col-span-3 space-y-4">
            <h3 className="font-semibold text-lg">Students</h3>
            <div className="space-y-2">
              {weeklyData.students?.map((student) => (
                <button
                  key={student.userId}
                  onClick={() => setSelectedStudentId(student.userId)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group
                    ${selectedStudentId === student.userId 
                      ? "bg-blue-50 border-blue-200 ring-1 ring-blue-300 shadow-sm" 
                      : "bg-card hover:bg-accent border-border"}`}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{student.userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.presentCount} days present</p>
                  </div>
                  {student.approvalStatus === "approved" && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                  {student.approvalStatus === "rejected" && <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                  {student.approvalStatus === "pending" && <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Detail View */}
          <div className="md:col-span-8 lg:col-span-9">
            {selectedStudent ? (
              <div className="space-y-6">
                 {/* Student Header */}
                <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                   <div>
                      <h2 className="text-xl font-bold">{selectedStudent.userName}</h2>
                      <p className="text-muted-foreground text-sm">{selectedStudent.email}</p>
                   </div>
                   <Badge
                      className={
                        selectedStudent.approvalStatus === "approved"
                          ? "bg-green-100 text-green-800 text-sm px-3 py-1"
                          : selectedStudent.approvalStatus === "rejected"
                            ? "bg-red-100 text-red-800 text-sm px-3 py-1"
                            : "bg-yellow-100 text-yellow-800 text-sm px-3 py-1"
                      }>
                      {selectedStudent.approvalStatus.toUpperCase()}
                    </Badge>
                </div>

                {/* Attendance Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Weekly Attendance Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                       {selectedStudent.dailyRecords.map((day) => {
                          const date = new Date(day.date);
                          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                          const dayNum = date.getDate();
                          
                          let statusColor = "bg-gray-50 border-gray-200 text-gray-400";
                          let statusIcon = null;
                          let statusText = "Absent";

                          if (day.status === "present") {
                             statusColor = "bg-green-50 border-green-200 text-green-700";
                             statusIcon = <CheckCircle2 className="w-5 h-5 mb-1" />;
                             statusText = "Present";
                          } else if (day.status === "permission") {
                             statusColor = "bg-yellow-50 border-yellow-200 text-yellow-700";
                             statusText = "Permission";
                          } else if (day.status === "alpha") {
                             statusColor = "bg-red-50 border-red-200 text-red-700";
                             statusText = "Alpha";
                          }

                          return (
                            <div key={day.date} className={`flex flex-col items-center justify-center p-3 rounded-lg border ${statusColor} text-center`}>
                               <span className="text-xs font-semibold mb-1">{dayName} {dayNum}</span>
                               {statusIcon}
                               <span className="text-xs font-medium">{statusText}</span>
                               {day.timestamp && <span className="text-[10px] mt-1 opacity-75">{new Date(day.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                            </div>
                          );
                       })}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6 space-y-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Notes / Feedback</label>
                        <Textarea 
                          placeholder="Add feedback for the student..." 
                          value={notes} 
                          onChange={e => setNotes(e.target.value)} 
                          className="h-24"
                        />
                     </div>
                     <div className="flex gap-4">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 h-10 text-base"
                          onClick={() => handleApproval(selectedStudent.userId, "approved")}
                          disabled={selectedStudent.approvalStatus === "approved"}
                        >
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Approve Attendance
                        </Button>
                        <Button 
                          className="flex-1"
                          variant="destructive"
                          onClick={() => handleApproval(selectedStudent.userId, "rejected")}
                          disabled={selectedStudent.approvalStatus === "rejected"}
                        >
                           <XCircle className="w-5 h-5 mr-2" />
                           Reject
                        </Button>
                     </div>
                  </CardContent>
                </Card>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-accent/20">
                <Users className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Select a Student</h3>
                <p className="max-w-xs">Values in the sidebar to view their detailed attendance for this week and take action.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        selectedTeamId && (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading attendance data...
          </div>
        )
      )}
    </div>
  );
}
