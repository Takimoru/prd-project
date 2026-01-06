import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle, MoreVertical, Users as UsersIcon } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@apollo/client";
import { CHECK_IN_MUTATION } from "@/graphql/dashboard";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { Progress } from "../../../../components/ui/progress";
import { Button } from "../../../../components/ui/button";
import { AttendanceDialog } from "../attendance/AttendanceDialog";

interface ProjectCardProps {
  team: any;
  userId: string;
  todaysAttendance: any[] | undefined | null;
  accentColor: string;
}

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  onHold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export function ProjectCard({ team, userId, todaysAttendance, accentColor }: ProjectCardProps) {
  const [checkIn] = useMutation(CHECK_IN_MUTATION);
  const today = new Date().toISOString().split("T")[0];
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const teamId = team.id || team._id;
  
  const hasCheckedIn = useMemo(() => {
    if (!todaysAttendance) return false;
    return todaysAttendance.some(
      (record: any) => (record.team?.id || record.teamId) === teamId && record.date === today
    );
  }, [todaysAttendance, teamId, today]);

  const handleCheckInClick = () => {
    setSelectedTeamId(teamId);
  };

  const handleSubmitAttendance = async (status: "present" | "permission", excuse?: string) => {
    if (!selectedTeamId) return;

    try {
      await checkIn({
        variables: {
          teamId: selectedTeamId,
          status,
          excuse,
        },
        refetchQueries: ['GetDashboardData'],
      });
      toast.success(status === "present" ? "Attendance submitted!" : "Permission submitted");
      setSelectedTeamId(null);
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast.error(error.message || "Failed to submit attendance.");
      throw error;
    }
  };

  // Mock progress calculation - you can replace this with actual logic
  const progress = Math.floor(Math.random() * 100);
  const totalTasks = Math.floor(Math.random() * 20) + 5;
  const completedTasks = Math.floor((progress / 100) * totalTasks);

  const members = team.members?.filter(Boolean) || [];
  const allMembers = members.length + 1; // +1 for the current user

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-200 group">
        {/* Colored Top Accent */}
        <div className={`h-2 ${accentColor}`} />

        <div className="p-5">
          {/* Header with Title, Status, and Menu */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Link to={`/team/${teamId}`}>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {team.name || team.program?.title || "Team Project"}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground mt-1">
                {team.program?.title || "General Project"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusColors.active}>
                Active
              </Badge>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Progress</span>
              <span className="text-xs font-bold text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Team Members and Task Count */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {members.slice(0, 3).map((member: any, idx: number) => (
                  <Avatar key={idx} className="w-7 h-7 border-2 border-card">
                    <AvatarImage src={member?.picture} />
                    <AvatarFallback className="text-xs">{member?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {allMembers > 3 && (
                  <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">+{allMembers - 3}</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                <UsersIcon className="w-3 h-3 inline mr-1" />
                {allMembers}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              {completedTasks}/{totalTasks} tasks
            </div>
          </div>

          {/* Due Date and Check-in */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="w-3 h-3" />
              <span>Due {format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "MMM dd")}</span>
            </div>

            {hasCheckedIn ? (
              <div className="flex items-center gap-1.5 text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Checked in</span>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleCheckInClick}
                className="bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))/0.9] text-white h-7 px-3 text-xs"
              >
                Check In
              </Button>
            )}
          </div>
        </div>
      </div>

      <AttendanceDialog 
        isOpen={!!selectedTeamId}
        onClose={() => setSelectedTeamId(null)}
        onSubmit={handleSubmitAttendance}
      />
    </>
  );
}
