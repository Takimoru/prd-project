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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";

export function WeeklyAttendanceApproval() {
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
    return `${year}-${String(weekNo).padStart(2, "0")}`;
  });
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

  const approveMutation = useMutation(api.attendance.approveWeeklyAttendance);

  const handleApproval = async (status: "approved" | "rejected") => {
    if (!selectedTeamId || !user) return;

    try {
      await approveMutation({
        teamId: selectedTeamId as any,
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
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance Approval</h1>
          <p className="text-muted-foreground">
            Review and approve accumulated team attendance.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
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

            {/* Week Selector (Simplified for now, could be better) */}
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">
                Week (YYYY-WW)
              </label>
              <div className="flex items-center border rounded-md px-3 py-2">
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

      {selectedTeamId && weeklyData ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Week Summary: {weeklyData.startDate} to {weeklyData.endDate}
              </CardTitle>
              {weeklyData.approval ? (
                <Badge
                  className={
                    weeklyData.approval.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : weeklyData.approval.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }>
                  {weeklyData.approval.status.toUpperCase()}
                </Badge>
              ) : (
                <Badge variant="outline">PENDING REVIEW</Badge>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Present Days</TableHead>
                    <TableHead>Last Check-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyData.totals.map((student) => (
                    <TableRow key={student.userId}>
                      <TableCell className="font-medium">
                        {student.userName}
                      </TableCell>
                      <TableCell>{student.presentCount} / 5</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {student.lastCheckIn
                          ? new Date(student.lastCheckIn).toLocaleString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {weeklyData.totals.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground py-8">
                        No presence recorded this week.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Approval Action Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supervisor Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Notes / Feedback (Optional)
                  </label>
                  <Textarea
                    placeholder="Add notes about this week's attendance..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    onClick={() => handleApproval("approved")}
                    disabled={weeklyData.approval?.status === "approved"}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Week
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleApproval("rejected")}
                    disabled={weeklyData.approval?.status === "rejected"}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Week
                  </Button>
                </div>
                {weeklyData.approval?.approvedAt && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Last updated:{" "}
                    {new Date(weeklyData.approval.approvedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
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
