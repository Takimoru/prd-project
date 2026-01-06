import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ProgramDetails } from "../components/ProgramDetails";
import { PendingRegistrationNotice } from "./student/components/shared/PendingRegistrationNotice";
import { CreateProgramModal } from "./student/components/work-programs/CreateProgramModal";
import { useStudentData } from "./student/hooks/useStudentData";
import { DashboardSidebar } from "./student/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "./student/components/dashboard/DashboardHeader";
import { DashboardOverview } from "./student/components/dashboard/DashboardOverview";

export function StudentDashboard() {
  const [searchParams] = useSearchParams();
  const selectedProgramId = searchParams.get("program");
  const [showProgramForm, setShowProgramForm] = useState(false);

  const {
    user,
    programs,
    userRegistrations,
    myTeams,
    todaysAttendance,
    isLoading
  } = useStudentData();

  const isPendingStudent = user?.role === "pending";

  const selectedProgram = useMemo(() => {
    return programs?.find((p: any) => (p.id || p._id) === selectedProgramId);
  }, [programs, selectedProgramId]);

  const selectedProgramRegistration = useMemo(() => {
    return userRegistrations?.find((r: any) => r.programId === selectedProgramId);
  }, [userRegistrations, selectedProgramId]);

  const selectedTeam = useMemo(() => {
    return myTeams?.find((t: any) => t.programId === selectedProgramId);
  }, [myTeams, selectedProgramId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (selectedProgramId && selectedProgram) {
    return (
      <ProgramDetails 
        program={selectedProgram} 
        registration={selectedProgramRegistration}
        team={selectedTeam}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar 
        user={user} 
      />

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          {isPendingStudent && <PendingRegistrationNotice />}

          <DashboardHeader />

          {user && (
            <DashboardOverview 
              userId={user.id || user._id}
              teams={myTeams || []} 
              todaysAttendance={todaysAttendance || []}
            />
          )}
        </div>
      </div>

      {/* Create Program Modal */}
      {showProgramForm && user && (
        <CreateProgramModal 
          onClose={() => setShowProgramForm(false)} 
        />
      )}
    </div>
  );
}

