import { useStudentData } from "./hooks/useStudentData";
import { DashboardSidebar } from "./components/dashboard/DashboardSidebar";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { FileText, Download, Folder } from "lucide-react";
import { format } from "date-fns";

export function FilesPage() {
  const { user, myTeams, isLoading } = useStudentData();

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  // Collect all tasks with completion files from user's teams
  const filesByProgram: Record<string, {
    programName: string;
    programId: string;
    files: Array<{
      file: string;
      taskTitle: string;
      taskId: string;
      completedAt?: string;
      completedBy?: string;
    }>;
  }> = {};

  // Fetch tasks for each team
  myTeams?.forEach(team => {
    const tasks = useQuery(api.tasks.getByTeam, { teamId: team._id });
    
    tasks?.forEach(task => {
      if (task.completionFiles && task.completionFiles.length > 0) {
        const programId = task.workProgramId || 'independent';
        const programName = task.workProgram?.title || 'Independent Tasks';
        
        if (!filesByProgram[programId]) {
          filesByProgram[programId] = {
            programName,
            programId,
            files: []
          };
        }
        
        task.completionFiles.forEach((file: string) => {
          filesByProgram[programId].files.push({
            file,
            taskTitle: task.title,
            taskId: task._id,
            completedAt: task.completedAt,
            completedBy: task.completedBy,
          });
        });
      }
    });
  });

  const hasFiles = Object.keys(filesByProgram).length > 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar user={user} />

      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <DashboardHeader />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Files</h1>
            <p className="text-muted-foreground mt-1">Task completion files organized by work program</p>
          </div>

          {!hasFiles ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No files yet</h3>
                  <p className="text-muted-foreground">
                    Files uploaded when completing tasks will appear here, organized by work program
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(filesByProgram).map(([programId, data]) => (
                <Card key={programId}>
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Folder className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{data.programName}</h3>
                        <p className="text-sm text-muted-foreground font-normal">
                          {data.files.length} file{data.files.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {data.files.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {data.files.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-foreground">
                              {item.file.split('/').pop()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              From task: <span className="font-medium">{item.taskTitle}</span>
                            </p>
                            {item.completedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Uploaded {format(new Date(item.completedAt), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            )}
                          </div>
                          <a
                            href={item.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-accent rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Download file"
                          >
                            <Download className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
