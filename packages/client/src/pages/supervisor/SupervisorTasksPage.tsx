import { useQuery } from "@apollo/client";
import { GET_SUPERVISOR_TASKS } from "@/graphql/supervisor";
import { useAuth } from "@/contexts/AuthContext";
import { SupervisorLayout } from "./components/SupervisorLayout";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, User } from "lucide-react";
import { format } from "date-fns";

export function SupervisorTasksPage() {
  const { user } = useAuth();

  const { data, loading } = useQuery(GET_SUPERVISOR_TASKS, {
    skip: !user?.id,
  });

  const teams = data?.myTeams;
  const allTasks = data?.tasksByUser;

  const getStatusBadge = (completed: boolean) => {
    if (completed) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Selesai</Badge>;
    }
    return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Tertunda</Badge>;
  };

  // Group tasks by team
  const tasksByTeam = teams?.map((team: any) => ({
    team,
    tasks: allTasks?.filter((task: any) => task.teamId === team.id) || []
  })) || [];

  if (loading) {
    return (
      <SupervisorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground animate-pulse">Memuat tugas...</p>
        </div>
      </SupervisorLayout>
    );
  }

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Tugas</h1>
          <p className="text-muted-foreground mt-1">Lihat semua tugas dari tim bimbingan Anda (Hanya lihat)</p>
        </div>

        {tasksByTeam.length > 0 ? (
          <div className="space-y-8">
            {tasksByTeam.map(({ team, tasks }: any) => (
              <div key={team.id}>
                <h2 className="text-xl font-semibold text-foreground mb-4">{team.name}</h2>
                
                {tasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-all"
                      >
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-foreground mb-2">{task.title}</h3>
                            <div className="flex flex-wrap gap-2">
                              {getStatusBadge(task.completed)}
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="space-y-2 text-sm">
                            {task.assignedMembers && task.assignedMembers.length > 0 && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="w-4 h-4" />
                                <span>Ditugaskan ke: {task.assignedMembers.length} anggota</span>
                              </div>
                            )}
                            
                            {task.endTime && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Tenggat: {format(new Date(task.endTime), "dd MMM yyyy")}</span>
                              </div>
                            )}

                            {task.completedAt && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckSquare className="w-4 h-4" />
                                <span>Selesai: {format(new Date(task.completedAt), "dd MMM yyyy")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                    <p>Belum ada tugas untuk tim ini</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Belum ada tugas</h3>
            <p className="text-muted-foreground">Tugas dari tim bimbingan Anda akan muncul di sini</p>
          </div>
        )}
      </div>
    </SupervisorLayout>
  );
}
