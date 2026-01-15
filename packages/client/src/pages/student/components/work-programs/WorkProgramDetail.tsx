import { useQuery, useMutation } from "@apollo/client";
import { GET_WORK_PROGRAM, GET_WORK_PROGRAM_PROGRESS, DELETE_WORK_PROGRAM } from "@/graphql/student";
import { GET_TEAM_TASKS } from "@/graphql/dashboard";
import { GET_TEAM_DETAILS } from "@/graphql/dashboard";
import { useParams, useNavigate } from "react-router-dom";

import { AdminHeader } from "../../../admin/components/AdminHeader";
import { Button } from "../../../../components/ui/button";
import { Progress } from "../../../../components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Skeleton } from "../../../../components/ui/skeleton";
import { 
  ArrowLeft, 
  Edit, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  FileText, 
  Circle, 
  CheckCircle2,
  Clock,
  Users,
  Download,
  List,
  CalendarDays,
  MessageSquare
} from "lucide-react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { useAuth } from "../../../../contexts/AuthContext";
import { useState } from "react";
import { WorkProgramChat } from "./WorkProgramChat";


export function WorkProgramDetail() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [removeWorkProgram] = useMutation(DELETE_WORK_PROGRAM);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"timeline" | "calendar" | "chat">("timeline");
  
  const { data: programData, loading: programLoading } = useQuery(GET_WORK_PROGRAM, {
    variables: { id: programId! },
    skip: !programId,
  });

  const { data: progressData, loading: progressLoading } = useQuery(GET_WORK_PROGRAM_PROGRESS, {
    variables: { workProgramId: programId! },
    skip: !programId,
  });

  const program = programData?.workProgram;
  const teamId = program?.team?.id || program?.teamId;
  
  const { data: teamData, loading: teamLoading } = useQuery(GET_TEAM_DETAILS, {
    variables: { teamId: teamId! },
    skip: !teamId,
  });

  const { data: tasksData, loading: tasksLoading } = useQuery(GET_TEAM_TASKS, {
    variables: { teamId: teamId! },
    skip: !teamId,
  });

  const team = teamData?.team;
  const tasks = tasksData?.tasks || [];
  const progress = progressData?.workProgramProgress || [];

  // Filter tasks for this work program
  const linkedTasks = tasks.filter((t: any) => t.workProgramId === programId) || [];

  // Calculate task-based progress
  const completedTasksCount = linkedTasks.filter((t: any) => t.completed).length;
  const totalTasksCount = linkedTasks.length;
  const taskBasedProgress = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  // Loading state
  const isLoading = programLoading || tasksLoading || teamLoading || progressLoading;
  
  if (isLoading || !program) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Overview Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-6">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Tasks Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg border">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Member Progress Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLeader = user?.id === team?.leaderId || user?._id === team?.leaderId;

  const handleDelete = async () => {
    if (!program || !user || !confirm("Are you sure you want to delete this work program?")) return;
    
    try {
      await removeWorkProgram({ 
        variables: {
          id: program.id,
        },
      });
      navigate(-1);
    } catch (error: any) {
      console.error("Failed to delete program:", error);
      alert(error.message || "Failed to delete program");
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title={program.title}
        description="Work Program Details"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {isLeader && (
              <>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
                <Button onClick={() => navigate(`/team/${teamId}/programs/${program.id}/edit`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Program
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground whitespace-pre-wrap">
              {program.description}
            </div>
            <div className="flex gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                <span>
                  {format(new Date(program.startDate), "MMM d, yyyy")} -{" "}
                  {format(new Date(program.endDate), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <span>
                  {completedTasksCount} of {totalTasksCount} tasks completed
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">{taskBasedProgress}%</span>
              </div>
              <Progress value={taskBasedProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Tasks View */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "timeline" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("timeline")}
                >
                  <List className="w-4 h-4 mr-2" />
                  Timeline
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === "chat" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("chat")}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discussion
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "timeline" ? (
              <TimelineView tasks={linkedTasks} />
            ) : viewMode === "calendar" ? (
              <CalendarView 
                tasks={linkedTasks} 
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            ) : (
              <WorkProgramChat workProgramId={programId!} />
            )}
          </CardContent>
        </Card>

        {/* Member Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Member Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progress?.map((p: any) => (
                <div key={p._id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.user?.name || "Unknown Member"}</span>
                    <span className="text-muted-foreground">{p.percentage}%</span>
                  </div>
                  <Progress value={p.percentage} className="h-2" />
                  {p.notes && (
                    <p className="text-xs text-muted-foreground italic">"{p.notes}"</p>
                  )}
                </div>
              ))}
              {progress?.length === 0 && (
                <p className="text-muted-foreground text-sm">No progress updates yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Timeline View Component - Specifically showing completed tasks timeline (as per request)
function TimelineView({ tasks }: { tasks: any[] }) {
  const completedTasks = tasks.filter(t => t.completed);

  if (completedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground border border-dashed rounded-lg">
        <div className="text-center">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No completed tasks in this program yet</p>
        </div>
      </div>
    );
  }

  // Sort tasks by completion time
  const sortedTasks = [...completedTasks].sort((a, b) => 
    new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 text-sm font-medium text-green-600">
        <CheckCircle2 className="w-4 h-4" />
        Timeline of Completed Tasks
      </div>
      {sortedTasks.map((task: any, index: number) => (
        <TaskCard key={task.id} task={task} showConnector={index < sortedTasks.length - 1} />
      ))}
    </div>
  );
}

// Calendar View Component
function CalendarView({ 
  tasks, 
  currentMonth, 
  onMonthChange 
}: { 
  tasks: any[]; 
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get starting day of week (0 = Sunday)
  const startDay = getDay(monthStart);
  
  // Create empty cells for days before month starts
  const emptyCells = Array(startDay).fill(null);
  
  // Group tasks by date
  const tasksByDate = new Map<string, any[]>();
  tasks.forEach(task => {
    const taskDate = format(parseISO(task.startTime), "yyyy-MM-dd");
    if (!tasksByDate.has(taskDate)) {
      tasksByDate.set(taskDate, []);
    }
    tasksByDate.get(taskDate)!.push(task);
  });

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
            {day}
          </div>
        ))}
        
        {/* Empty cells before month starts */}
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="min-h-24 border border-dashed rounded-lg bg-muted/20" />
        ))}
        
        {/* Days of month */}
        {daysInMonth.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate.get(dateKey) || [];
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={dateKey}
              className={`min-h-24 border rounded-lg p-2 ${
                isToday ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className={`text-xs p-1 rounded truncate ${
                      task.completed 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}
                    title={task.title}
                  >
                    {task.completed ? "✓ " : "○ "}{task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, showConnector }: { task: any; showConnector: boolean }) {
  const [showFiles, setShowFiles] = useState(false);

  const startTime = parseISO(task.startTime);
  const endTime = parseISO(task.endTime);

  return (
    <div className="relative">
      <div className={`flex gap-4 p-4 rounded-lg border ${
        task.completed ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-card"
      }`}>
        {/* Timeline indicator */}
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            task.completed 
              ? "bg-green-500 text-white" 
              : "bg-muted text-muted-foreground"
          }`}>
            {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
          </div>
          {showConnector && (
            <div className="w-0.5 h-full min-h-8 bg-border mt-2" />
          )}
        </div>

        {/* Task content */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div>
            <h4 className={`font-semibold ${task.completed ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                {format(startTime, "MMM d, h:mm a")} - {format(endTime, "h:mm a")}
              </span>
            </div>
            {task.assignedMembers && task.assignedMembers.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{task.assignedMembers.length} member{task.assignedMembers.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {/* Completion info */}
          {task.completed && task.completedAt && (
            <div className="text-sm text-green-600 dark:text-green-400">
              Completed on {format(parseISO(task.completedAt), "MMM d, yyyy 'at' h:mm a")}
            </div>
          )}

          {/* Completion files */}
          {task.completionFiles && task.completionFiles.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFiles(!showFiles)}
              >
                <FileText className="w-4 h-4 mr-2" />
                {task.completionFiles.length} Proof File{task.completionFiles.length > 1 ? "s" : ""}
              </Button>
              
              {showFiles && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {task.completionFiles.map((fileUrl: string, index: number) => (
                    <ProofFileCard key={index} fileUrl={fileUrl} index={index} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Proof File Card Component
function ProofFileCard({ fileUrl, index }: { fileUrl: string; index: number }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
  
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {isImage ? (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img 
            src={fileUrl} 
            alt={`Proof ${index + 1}`}
            className="w-full h-32 object-cover"
          />
        </a>
      ) : (
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center h-32 bg-muted hover:bg-muted/80 transition-colors"
        >
          <FileText className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-xs text-muted-foreground">File {index + 1}</span>
        </a>
      )}
      <div className="p-2 bg-muted/50">
        <a
          href={fileUrl}
          download
          className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
        >
          <Download className="w-3 h-3" />
          Download
        </a>
      </div>
    </div>
  );
}
