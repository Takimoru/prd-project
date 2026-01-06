import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { SupervisorLayout } from "./components/SupervisorLayout";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, User } from "lucide-react";
import { format } from "date-fns";

export function SupervisorTasksPage() {
  const { user } = useAuth();

  // Get all teams for this supervisor
  const teams = useQuery(
    api.teams.getTeamsWithMembersBySupervisor,
    user?._id ? { supervisorId: user._id } : "skip"
  );

  // Get all tasks for the supervisor's teams
  const allTasks = useQuery(
    api.tasks.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const getStatusBadge = (completed: boolean) => {
    if (completed) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    }
    return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending</Badge>;
  };

  // Group tasks by team
  const tasksByTeam = teams?.map(team => ({
    team,
    tasks: allTasks?.filter(task => task.teamId === team._id) || []
  })) || [];

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">View all tasks from your supervised teams (Read-only)</p>
        </div>

        {tasksByTeam.length > 0 ? (
          <div className="space-y-8">
            {tasksByTeam.map(({ team, tasks }) => (
              <div key={team._id}>
                <h2 className="text-xl font-semibold text-foreground mb-4">{team.name}</h2>
                
                {tasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.map((task) => (
                      <div
                        key={task._id}
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
                                <span>Assigned to: {task.assignedMembers.length} member(s)</span>
                              </div>
                            )}
                            
                            {task.endTime && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Due: {format(new Date(task.endTime), "MMM dd, yyyy")}</span>
                              </div>
                            )}

                            {task.completedAt && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckSquare className="w-4 h-4" />
                                <span>Completed: {format(new Date(task.completedAt), "MMM dd, yyyy")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                    <p>No tasks for this team yet</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tasks yet</h3>
            <p className="text-muted-foreground">Tasks from your supervised teams will appear here</p>
          </div>
        )}
      </div>
    </SupervisorLayout>
  );
}
