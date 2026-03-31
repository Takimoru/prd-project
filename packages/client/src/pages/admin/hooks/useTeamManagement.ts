import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { TeamForm, EnrichedTeam, GeneratedTeamPreview } from "../types/team";
import { useAuth } from "../../../contexts/AuthContext";
import {
  GET_PROGRAMS,
  GET_TEAMS_BY_PROGRAM,
  GET_STUDENTS_BY_PROGRAM,
  GET_USERS,
  CREATE_TEAM,
  UPDATE_TEAM,
  DELETE_TEAM,
  GENERATE_TEAMS,
  FINALIZE_TEAMS,
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

  // ------- Auto-generation state -------
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [previewData, setPreviewData] = useState<GeneratedTeamPreview | null>(null);
  const isPreviewMode = !!previewData;

  // GraphQL Queries
  const { data: programsData } = useQuery(GET_PROGRAMS, {
    variables: { includeArchived: false },
    skip: false,
  });
  const programs = programsData?.programs || [];

  const { data: teamsData, refetch: refetchTeams } = useQuery(GET_TEAMS_BY_PROGRAM, {
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
    refetchQueries: [{ query: GET_TEAMS_BY_PROGRAM, variables: { programId: selectedProgram } }],
  });
  const [updateTeamMutation] = useMutation(UPDATE_TEAM, {
    refetchQueries: [{ query: GET_TEAMS_BY_PROGRAM, variables: { programId: selectedProgram } }],
  });
  const [deleteTeamMutation] = useMutation(DELETE_TEAM, {
    refetchQueries: [{ query: GET_TEAMS_BY_PROGRAM, variables: { programId: selectedProgram } }],
  });
  const [generateTeamsMutation] = useMutation(GENERATE_TEAMS);
  const [finalizeTeamsMutation] = useMutation(FINALIZE_TEAMS, {
    refetchQueries: [{ query: GET_TEAMS_BY_PROGRAM, variables: { programId: selectedProgram } }],
  });

  // Filter students who are not already in a team (unless they are in the team being edited)
  const availableStudents = useMemo(() => {
    if (!students || !teams) return [];
    const assignedStudentIds = new Set<string>();
    teams.forEach((team: any) => {
      if (editingTeam && team.id === editingTeam.id) return;
      if (team.leaderId) assignedStudentIds.add(team.leaderId);
      if (team.members) {
        team.members.forEach((member: any) => assignedStudentIds.add(member.id));
      }
    });
    return students.filter((student: any) => !assignedStudentIds.has(student.id));
  }, [students, teams, editingTeam]);

  const resetForm = () => {
    setFormData({ name: "", leaderId: "", memberIds: [], supervisorId: undefined });
    setIsCreating(false);
    setEditingTeam(null);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;
    if (!user?.id) { toast.error("You must be logged in as admin"); return; }
    try {
      if (formData.memberIds.length < 7) { toast.error("A team must have at least 7 members"); return; }
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
      toast.success("Tim berhasil dibuat");
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat tim");
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    if (!user?.id) { toast.error("You must be logged in as admin"); return; }
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
      toast.success("Tim berhasil diperbarui");
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui tim");
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!user?.id) { toast.error("You must be logged in as admin"); return; }
    if (!window.confirm("Apakah Anda yakin ingin menghapus tim ini? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      await deleteTeamMutation({ variables: { id } });
      toast.success("Tim berhasil dihapus");
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus tim");
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

  // ------- Auto-generation handlers -------

  const handleGenerateTeams = async () => {
    if (!selectedProgram) return;
    setIsGenerating(true);
    try {
      const { data } = await generateTeamsMutation({
        variables: { input: { programId: selectedProgram } },
      });
      const preview: GeneratedTeamPreview = JSON.parse(data.generateTeams);
      setPreviewData(preview);
      toast.success(`${preview.teams.length} tim berhasil digenerate. Review dan finalisasi.`);
    } catch (error: any) {
      const msg = error.message || "Gagal generate tim";
      if (msg.includes("Jumlah Mahasiswa Belum Cukup")) {
        toast.error("Jumlah Mahasiswa Belum Cukup (perlu minimal 15 mahasiswa)");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalizeTeams = async () => {
    if (!previewData || !selectedProgram) return;
    setIsFinalizing(true);
    try {
      await finalizeTeamsMutation({
        variables: {
          input: {
            programId: selectedProgram,
            runId: previewData.runId,
            teams: previewData.teams.map((t) => ({
              name: t.name,
              memberIds: t.members.map((m) => m.id),
            })),
          },
        },
      });
      toast.success("Tim berhasil disimpan ke database!");
      setPreviewData(null);
      refetchTeams();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan tim");
    } finally {
      setIsFinalizing(false);
    }
  };

  const discardPreview = () => {
    setPreviewData(null);
  };

  const moveStudentBetweenPreviewTeams = (
    studentId: string,
    fromTempId: string | "unassigned",
    toTempId: string | "unassigned"
  ) => {
    if (!previewData) return;
    if (fromTempId === toTempId) return;
    
    let student: any = null;
    
    // Find the student
    if (fromTempId === "unassigned") {
      student = previewData.unassignedStudents.find((s) => s.id === studentId);
    } else {
      const fromTeam = previewData.teams.find((t) => t.tempId === fromTempId);
      student = fromTeam?.members.find((m) => m.id === studentId);
    }
    
    if (!student) return;

    setPreviewData({
      ...previewData,
      teams: previewData.teams.map((team) => {
        // Remove from source team if applicable
        if (team.tempId === fromTempId) {
          const updatedMembers = team.members.filter((m) => m.id !== studentId);
          return { ...team, members: updatedMembers, memberCount: updatedMembers.length };
        }
        // Add to target team if applicable
        if (team.tempId === toTempId) {
          const updatedMembers = [...team.members, student];
          return { ...team, members: updatedMembers, memberCount: updatedMembers.length };
        }
        return team;
      }),
      unassignedStudents: 
        fromTempId === "unassigned"
          ? previewData.unassignedStudents.filter((s) => s.id !== studentId)
          : toTempId === "unassigned"
          ? [...previewData.unassignedStudents, student]
          : previewData.unassignedStudents,
    });
  };

  const removeStudentFromPreviewTeam = (studentId: string, fromTempId: string) => {
    moveStudentBetweenPreviewTeams(studentId, fromTempId, "unassigned");
  };

  const renamePreviewTeam = (tempId: string, newName: string) => {
    if (!previewData) return;
    setPreviewData({
      ...previewData,
      teams: previewData.teams.map((team) =>
        team.tempId === tempId ? { ...team, name: newName } : team
      ),
    });
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
    // Auto-generation
    isGenerating,
    isFinalizing,
    isPreviewMode,
    previewData,
    handleGenerateTeams,
    handleFinalizeTeams,
    discardPreview,
    moveStudentBetweenPreviewTeams,
    removeStudentFromPreviewTeam,
    renamePreviewTeam,
  };
}

