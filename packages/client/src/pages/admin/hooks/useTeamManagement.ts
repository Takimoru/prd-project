import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { TeamForm, EnrichedTeam } from "../types/team";
import { useAuth } from "../../../contexts/AuthContext";
import {
  GET_PROGRAMS,
  GET_TEAMS_BY_PROGRAM,
  GET_STUDENTS_BY_PROGRAM,
  GET_USERS,
  CREATE_TEAM,
  UPDATE_TEAM,
  DELETE_TEAM,
} from "../../../graphql/admin";

export function useTeamManagement() {
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTeam, setEditingTeam] = useState<EnrichedTeam | null>(null);
  const [viewingAttendanceTeam, setViewingAttendanceTeam] =
    useState<EnrichedTeam | null>(null);
  const [formData, setFormData] = useState<TeamForm>({
    name: "",
    leaderId: "",
    memberIds: [],
    supervisorId: undefined,
  });

  // GraphQL Queries
  const { data: programsData } = useQuery(GET_PROGRAMS, {
    variables: { includeArchived: false },
    skip: false,
  });
  const programs = programsData?.programs || [];

  const { data: teamsData } = useQuery(GET_TEAMS_BY_PROGRAM, {
    variables: { programId: selectedProgram },
    skip: !selectedProgram,
  });
  const teams = teamsData?.teams || [];

  const { data: studentsData } = useQuery(GET_STUDENTS_BY_PROGRAM, {
    variables: { programId: selectedProgram },
    skip: !selectedProgram,
  });
  const students = studentsData?.studentsByProgram || [];

  const { data: supervisorsData } = useQuery(GET_USERS, {
    variables: { role: "supervisor" },
  });
  const supervisors = supervisorsData?.users || [];

  // GraphQL Mutations
  const [createTeamMutation] = useMutation(CREATE_TEAM, {
    refetchQueries: [
      {
        query: GET_TEAMS_BY_PROGRAM,
        variables: { programId: selectedProgram },
      },
    ],
  });
  const [updateTeamMutation] = useMutation(UPDATE_TEAM, {
    refetchQueries: [
      {
        query: GET_TEAMS_BY_PROGRAM,
        variables: { programId: selectedProgram },
      },
    ],
  });
  const [deleteTeamMutation] = useMutation(DELETE_TEAM, {
    refetchQueries: [
      {
        query: GET_TEAMS_BY_PROGRAM,
        variables: { programId: selectedProgram },
      },
    ],
  });

  // Filter students who are not already in a team (unless they are in the team being edited)
  const availableStudents = useMemo(() => {
    if (!students || !teams) return [];

    // Get all students currently assigned to teams in this program
    const assignedStudentIds = new Set<string>();
    teams.forEach((team: any) => {
      // Skip the current team if we're editing
      if (editingTeam && team.id === editingTeam.id) return;

      if (team.leaderId) assignedStudentIds.add(team.leaderId);
      if (team.members) {
        team.members.forEach((member: any) =>
          assignedStudentIds.add(member.id)
        );
      }
    });

    // Filter out students who are already assigned
    return students.filter(
      (student: any) => !assignedStudentIds.has(student.id)
    );
  }, [students, teams, editingTeam]);

  const resetForm = () => {
    setFormData({
      name: "",
      leaderId: "",
      memberIds: [],
      supervisorId: undefined,
    });
    setIsCreating(false);
    setEditingTeam(null);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;
    if (!user?.id) {
      toast.error("You must be logged in as admin");
      return;
    }

    try {
      if (formData.memberIds.length < 7) {
        toast.error("A team must have at least 7 members");
        return;
      }

      await createTeamMutation({
        variables: {
          input: {
            programId: selectedProgram,
            name: formData.name,
            leaderId: formData.leaderId,
            memberIds: formData.memberIds,
            supervisorId: formData.supervisorId,
          },
        },
      });
      toast.success("Team created successfully");
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create team");
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    if (!user?.id) {
      toast.error("You must be logged in as admin");
      return;
    }

    try {
      await updateTeamMutation({
        variables: {
          id: editingTeam.id,
          input: {
            name: formData.name,
            leaderId: formData.leaderId,
            memberIds: formData.memberIds,
            supervisorId: formData.supervisorId,
          },
        },
      });
      toast.success("Team updated successfully");
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to update team");
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!user?.id) {
      toast.error("You must be logged in as admin");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this team? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteTeamMutation({
        variables: { id },
      });
      toast.success("Team deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete team");
    }
  };

  const startEditing = (team: EnrichedTeam) => {
    setEditingTeam(team);
    setFormData({
      name: team.name || "",
      leaderId: team.leaderId,
      memberIds: team.members?.map((m: any) => m.id) || [],
      supervisorId: team.supervisorId,
    });
    setIsCreating(true);
  };

  return {
    selectedProgram,
    setSelectedProgram,
    isCreating,
    setIsCreating,
    editingTeam,
    viewingAttendanceTeam,
    setViewingAttendanceTeam,
    formData,
    setFormData,
    programs,
    teams,
    availableStudents,
    supervisors,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    startEditing,
    resetForm,
  };
}
