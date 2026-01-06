import { useQuery } from "@apollo/client";
import { GET_DASHBOARD_DATA } from "../../../graphql/dashboard";
import { useAuth } from "../../../contexts/AuthContext";

// Helper to map id to _id for compatibility
const mapId = (item: any): any => {
  if (!item) return item;
  if (Array.isArray(item)) return item.map(mapId);
  if (typeof item === 'object') {
     return { ...item, _id: item.id };
  }
  return item;
};

export function useStudentData() {
  const { user: authUser } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const { data, loading, error } = useQuery(GET_DASHBOARD_DATA, {
    variables: {
      includeArchived: false,
      startDate: today,
      endDate: today
    },
    skip: !authUser
  });

  if (error) {
    console.error("Dashboard query error:", error);
  }

  const user = mapId(authUser); // Ensure user has _id
  const programs = mapId(data?.programs);
  const userRegistrations = mapId(data?.me?.registrations);
  const myTeams = mapId(data?.myTeams);
  const todaysAttendance = mapId(data?.me?.attendance);

  const mappedTeams = myTeams?.map((t: any) => ({
    ...t,
    programId: t.program?.id,
    leaderId: t.leader?.id,
  }));
  
  const mappedRegistrations = userRegistrations?.map((r: any) => ({
    ...r,
    programId: r.program?.id
  }));

  const mappedAttendance = todaysAttendance?.map((a: any) => ({
    ...a,
    teamId: a.team?.id
  }));

  return {
    user,
    programs: programs as any[],
    userRegistrations: mappedRegistrations as any[],
    myTeams: mappedTeams as any[],
    todaysAttendance: mappedAttendance as any[],
    isLoading: loading,
  };
}
