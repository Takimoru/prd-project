import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "../../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import {
  GET_PROGRAMS,
  GET_TEAMS_BY_PROGRAM,
} from "../../../graphql/admin";
import {
  GET_FINAL_REPORTS_BY_TEAM,
  REVIEW_FINAL_REPORT,
} from "../../../graphql/finalReport";

export function useFinalReports() {
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // GraphQL Queries
  const { data: programsData } = useQuery(GET_PROGRAMS, {
    variables: { includeArchived: false },
  });
  const programs = programsData?.programs || [];

  const { data: teamsData } = useQuery(GET_TEAMS_BY_PROGRAM, {
    variables: { programId: selectedProgram },
    skip: !selectedProgram,
  });
  const teamsForProgram = teamsData?.teams || [];

  const { data: reportsData } = useQuery(GET_FINAL_REPORTS_BY_TEAM, {
    variables: { teamId: selectedTeam },
    skip: !selectedTeam,
  });
  const reportsForTeam = reportsData?.finalReportsByTeam || [];

  const selectedReport = reportsForTeam.find((r: any) => r.id === selectedReportId);

  // GraphQL Mutations
  const [reviewReportMutation] = useMutation(REVIEW_FINAL_REPORT, {
    refetchQueries: [
      { query: GET_FINAL_REPORTS_BY_TEAM, variables: { teamId: selectedTeam } },
    ],
  });

  const handleApproveReport = async (reportId: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    try {
      await reviewReportMutation({
        variables: {
          input: {
            reportId,
            status: "approved",
          },
        },
      });
      toast.success("Report approved!");
      setSelectedReportId(null);
    } catch (error: any) {
      console.error("Failed to approve:", error);
      toast.error(error.message || "Failed to approve report");
    }
  };

  const handleRequestRevision = async (reportId: string, comment: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please provide a comment");
      return;
    }

    try {
      await reviewReportMutation({
        variables: {
          input: {
            reportId,
            status: "revision_requested",
            reviewNotes: comment.trim(),
          },
        },
      });
      toast.success("Revision requested!");
      setSelectedReportId(null);
    } catch (error: any) {
      console.error("Failed to request revision:", error);
      toast.error(error.message || "Failed to request revision");
    }
  };

  return {
    selectedProgram,
    setSelectedProgram,
    selectedTeam,
    setSelectedTeam,
    selectedReportId,
    setSelectedReportId,
    programs,
    teamsForProgram,
    reportsForTeam,
    selectedReportData: selectedReport,
    handleApproveReport,
    handleRequestRevision,
  };
}
