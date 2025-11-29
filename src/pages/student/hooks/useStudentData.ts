import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../../../contexts/AuthContext";

export function useStudentData() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const programs = useQuery(api.programs.getAllPrograms, {
    includeArchived: false,
  });

  const userRegistrations = user
    ? useQuery(api.registrations.getUserRegistrations, {
        userId: user._id,
      })
    : null;

  const myTeams = user
    ? useQuery(api.teams.getTeamsForUser, { userId: user._id })
    : null;

  const todaysAttendance = user
    ? useQuery(api.attendance.getAttendanceByUser, {
        userId: user._id,
        startDate: today,
        endDate: today,
      })
    : null;

  return {
    user,
    programs,
    userRegistrations,
    myTeams,
    todaysAttendance,
    isLoading: !programs || (user && (!userRegistrations || !myTeams)),
  };
}
