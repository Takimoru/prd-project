import { useStudentData } from "./hooks/useStudentData";
import { DashboardSidebar } from "./components/dashboard/DashboardSidebar";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { WorkProgramList } from "./components/work-programs/WorkProgramList";

export function ProjectsPage() {
  const { user, myTeams, isLoading } = useStudentData();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar 
        user={user} 
      />

      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <DashboardHeader />
          
          {myTeams?.map(team => (
            <div key={team._id} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Tim: {team.name}</h2>
              <WorkProgramList 
                teamId={team._id} 
                isLeader={team.leaderId === user?._id} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
