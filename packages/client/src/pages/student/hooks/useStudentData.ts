import { useQuery } from "@apollo/client";
import { GET_DASHBOARD_DATA } from "../../../graphql/dashboard";
import { useAuth } from "../../../contexts/AuthContext";

// Helper to map id to _id for compatibility
const mapId = (item: any): any => {
  if (!item) return item;
  if (Array.isArray(item)) return item.map(mapId);
  if (typeof item === 'object') {
    const mapped: any = { ...item };
    if (item.id) mapped._id = item.id;
    // Also handle Case where ._id exists but .id doesn't (backward compatibility)
    if (item._id && !item.id) mapped.id = item._id;
    
    // Recursively map all properties
    Object.keys(mapped).forEach(key => {
      // Avoid recursion on circular refs if any, though unlikely here
      if (key !== '__typename') {
        mapped[key] = mapId(mapped[key]);
      }
    });
    return mapped;
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

  // Debug logging
  console.log('[useStudentData] Raw data from query:', {
    myTeamsRaw: data?.myTeams,
    myTeamsMapped: myTeams,
    teamsCount: myTeams?.length,
    firstTeamMembers: myTeams?.[0]?.members,
    firstTeamSupervisor: myTeams?.[0]?.supervisor,
  });

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
    teamId: a.team?.id || a.team?._id
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
