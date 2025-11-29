import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { ProgramDetails } from "../components/ProgramDetails";
import { PendingRegistrationNotice } from "./student/components/PendingRegistrationNotice";
import { CreateProgramModal } from "./student/components/CreateProgramModal";
import { DashboardStats } from "./student/components/DashboardStats";
import { MyTeams } from "./student/components/MyTeams";
import { useStudentData } from "./student/hooks/useStudentData";
import { Button } from "../components/ui/button";

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
  const isApprovedStudent = user?.role === "student";

  const selectedProgram = useMemo(() => {
    return programs?.find((p) => p._id === selectedProgramId);
  }, [programs, selectedProgramId]);

  const selectedProgramRegistration = useMemo(() => {
    return userRegistrations?.find((r) => r.programId === selectedProgramId);
  }, [userRegistrations, selectedProgramId]);

  const selectedTeam = useMemo(() => {
    return myTeams?.find((t) => t.programId === selectedProgramId);
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}!</p>
        </div>
        {isApprovedStudent && (
          <Button
            onClick={() => setShowProgramForm(true)}
            className="inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span>Create Work Program</span>
          </Button>
        )}
      </div>

      {isPendingStudent && <PendingRegistrationNotice />}

      {showProgramForm && user && (
        <CreateProgramModal 
          onClose={() => setShowProgramForm(false)} 
          userId={user._id}
        />
      )}

      <DashboardStats 
        programs={programs} 
        userRegistrations={userRegistrations} 
      />

      {user && (
        <MyTeams 
          myTeams={myTeams} 
          userId={user._id} 
          todaysAttendance={todaysAttendance} 
        />
      )}
    </div>
  );
}
