import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useParams, useNavigate } from "react-router-dom";
import { AdminPageLayout } from "../../../admin/components/AdminPageLayout";
import { AdminHeader } from "../../../admin/components/AdminHeader";
import { Button } from "../../../../components/ui/button";
import { Progress } from "../../../../components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { ArrowLeft, Edit, Calendar, CheckSquare, FileText, Circle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../../../../contexts/AuthContext";

export function WorkProgramDetail() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const program = useQuery(
    api.workPrograms.getById,
    programId ? { id: programId as Id<"work_programs"> } : "skip"
  );

  const progress = useQuery(
    api.workPrograms.getProgress,
    programId ? { workProgramId: programId as Id<"work_programs"> } : "skip"
  );

  // Calculate overall progress
  const overallProgress = progress
    ? progress.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / (progress.length || 1)
    : 0;

  if (!program) {
    return <div>Loading...</div>;
  }

  const team = useQuery(api.teams.getTeam, { id: program.teamId });
  const isLeader = user?._id === team?.leaderId;

  const removeWorkProgram = useMutation(api.workPrograms.remove);

  const handleDelete = async () => {
    if (!program || !user || !confirm("Are you sure you want to delete this work program?")) return;
    
    try {
      await removeWorkProgram({ 
        id: program._id,
        userId: user._id 
      });
      navigate(-1);
    } catch (error) {
      console.error("Failed to delete program:", error);
      alert("Failed to delete program");
    }
  };

  return (
    <AdminPageLayout>
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
                <Button onClick={() => navigate(`/team/${program.teamId}/programs/${program._id}/edit`)}>
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
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>
                  {format(new Date(program.startDate), "MMM d, yyyy")} -{" "}
                  {format(new Date(program.endDate), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <span>Overall Progress: {Math.round(overallProgress)}%</span>
              </div>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>

        {/* Member Progress Grid */}
        <div className="grid md:grid-cols-2 gap-6">
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

          {/* Linked Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <LinkedTasksList workProgramId={program._id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageLayout>
  );
}

// Component to display linked tasks
function LinkedTasksList({ workProgramId }: { workProgramId: any }) {
  const tasks = useQuery(api.tasks.getByTeam, { teamId: workProgramId as any });
  
  // Filter tasks for this work program
  const linkedTasks = tasks?.filter(t => t.workProgramId === workProgramId) || [];

  if (linkedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground border border-dashed rounded-lg">
        <div className="text-center">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No tasks linked to this program yet</p>
        </div>
      </div>
    );
  }

  const completedCount = linkedTasks.filter(t => t.completed).length;
  const totalCount = linkedTasks.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {completedCount} of {totalCount} tasks completed
        </span>
        <span className="font-medium">{completionPercentage}%</span>
      </div>
      <Progress value={completionPercentage} className="h-2" />
      
      <div className="space-y-2 mt-4">
        {linkedTasks.map(task => (
          <div
            key={task._id}
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </p>
              {task.completedAt && (
                <p className="text-xs text-muted-foreground">
                  Completed {format(new Date(task.completedAt), "MMM d, yyyy")}
                </p>
              )}
            </div>
            {task.completionFiles && task.completionFiles.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {task.completionFiles.length} file{task.completionFiles.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
