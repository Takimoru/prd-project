import { useState } from "react";
import { useStudentData } from "./hooks/useStudentData";
import { DashboardSidebar } from "./components/dashboard/DashboardSidebar";
import { CheckCircle2, Circle, CheckSquare, Loader2, FileText } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { useQuery } from "@apollo/client";
import { GET_MY_TASKS } from "../../graphql/dashboard";
import { CreateTaskModal } from "./components/tasks/CreateTaskModal";
import { TaskDetailModal } from "./components/tasks/TaskDetailModal";

export function TasksPage() {
  const { user } = useStudentData();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: tasksData, loading: tasksLoading, error: tasksError } = useQuery(GET_MY_TASKS, {
    skip: !user,
    fetchPolicy: 'cache-and-network',
  });

  // Debug logging
  if (tasksError) {
    console.error('[TasksPage] Error fetching tasks:', tasksError);
  }
  if (tasksData) {
    console.log('[TasksPage] Tasks data:', tasksData);
  }

  // Flatten tasks from teams with null safety
  // Type: myTeams: { tasks: Task[] }[]
  const myTasks = tasksData?.myTeams?.flatMap((team: any) => 
      (team.tasks || []).map((task: any) => ({
          ...task,
          team: task.team || team
      })) 
  ) || [];

  const getStatusIcon = (completed: boolean) => {
    if (completed) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    return <Circle className="w-5 h-5 text-muted-foreground" />;
  };

  const getStatusBadge = (completed: boolean) => {
    if (completed) return "bg-green-500/10 text-green-500 border-green-500/20";
    return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  const filteredTasks = myTasks?.filter((task: any) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "todo") return !task.completed;
    if (selectedFilter === "done") return task.completed;
    return true;
  }) || [];

  if (!user || tasksLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar user={user} />
        <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0 flex items-center justify-center">
            <Loader2 className="animate-spin w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar 
        user={user} 
      />

      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Tasks</h1>
              <p className="text-muted-foreground mt-1">Manage your tasks across all work programs</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Create Task
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-border">
            {[
              { key: "all", label: "All Tasks", count: myTasks?.length || 0 },
              { key: "todo", label: "To Do", count: myTasks?.filter((t: any) => !t.completed).length || 0 },
              { key: "done", label: "Done", count: myTasks?.filter((t: any) => t.completed).length || 0 },
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  selectedFilter === filter.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {filteredTasks.map((task: any) => (
              <div
                key={task.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => setSelectedTaskId(task.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {getStatusIcon(!!task.completed)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-semibold transition-colors ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground group-hover:text-primary'}`}>
                        {task.title}
                      </h3>
                      {task.team && (
                        <Badge variant="secondary" className="text-xs font-normal flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {task.team.name}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">Due: {task.endTime ? new Date(task.endTime).toLocaleDateString() : 'No due date'}</span>
                      <span className="text-xs text-muted-foreground">Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusBadge(!!task.completed)}>
                      {task.completed ? "Done" : "To Do"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-16">
              <CheckSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No tasks found</h3>
              <p className="text-muted-foreground">Try selecting a different filter or create a new task</p>
            </div>
          )}
        </div>
      </div>

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      
      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}
