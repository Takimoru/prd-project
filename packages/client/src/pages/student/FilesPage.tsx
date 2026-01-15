import { useMemo } from "react";
import { useStudentData } from "./hooks/useStudentData";
import { DashboardSidebar } from "./components/dashboard/DashboardSidebar";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { useQuery } from "@apollo/client";
import { GET_MY_TASKS } from "../../graphql/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { FileText, Download, Folder, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export function FilesPage() {
  const { user, isLoading } = useStudentData();

  // Fetch all tasks from user's teams
  const { data: tasksData, loading: tasksLoading } = useQuery(GET_MY_TASKS, {
    skip: !user,
  });

  // Collect all tasks with completion files from user's teams
  const filesByProgram = useMemo(() => {
    const files: Record<string, {
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

    // Flatten tasks from all teams
    const allTasks = tasksData?.myTeams?.flatMap((team: any) => team.tasks || []) || [];
    
    allTasks.forEach((task: any) => {
      if (task.completionFiles && task.completionFiles.length > 0) {
        // Use program from team since task.workProgram might not be populated or relevant here
        const program = task.team?.program;
        const programId = program?.id || 'independent';
        const programName = program?.title || 'Independent Tasks';
        
        if (!files[programId]) {
          files[programId] = {
            programName,
            programId,
            files: []
          };
        }
        
        task.completionFiles.forEach((file: any) => {
          const fileUrl = typeof file === 'string' ? file : file.url;
          files[programId].files.push({
            file: fileUrl,
            taskTitle: task.title,
            taskId: task.id,
            completedAt: task.completedAt,
            completedBy: task.completedBy?.name,
          });
        });
      }
    });

    return files;
  }, [tasksData]);

  const hasFiles = Object.keys(filesByProgram).length > 0;

  if (!user && (isLoading || tasksLoading)) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="animate-spin w-8 h-8 text-primary" />
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar user={user} />

      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <DashboardHeader 
            title="File" 
            description="Kelola file penyelesaian tugas Anda" 
          />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Pustaka</h1>
          </div>

          {!hasFiles ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Belum ada file</h3>
                  <p className="text-muted-foreground">
                    File yang diunggah saat menyelesaikan tugas akan muncul di sini, dikelompokkan berdasarkan program kerja
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
                          {data.files.length} file
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {data.files.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {data.files.map((item: any, idx) => (
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
                              Dari tugas: <span className="font-medium">{item.taskTitle}</span>
                            </p>
                            {item.completedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Diunggah {format(new Date(item.completedAt), "d MMM yyyy, HH:mm")}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const filename = item.file.split('/').pop();
                                const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/upload/download?file=${filename}&name=${filename}`;
                                
                                toast.loading("Mengunduh file...", { id: "download-toast" });
                                
                                const response = await fetch(downloadUrl);
                                
                                if (!response.ok) {
                                  if (response.status === 404) {
                                    throw new Error("File tidak ditemukan di server");
                                  }
                                  throw new Error("Gagal mengunduh file");
                                }

                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', filename || "download");
                                document.body.appendChild(link);
                                link.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(link);
                                
                                toast.success("File berhasil diunduh!", { id: "download-toast" });
                              } catch (error: any) {
                                console.error('Download failed:', error);
                                toast.error(error.message || "Gagal mengunduh file", { id: "download-toast" });
                              }
                            }}
                            className="p-2 hover:bg-accent rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Download file"
                          >
                            <Download className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                          </button>
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
