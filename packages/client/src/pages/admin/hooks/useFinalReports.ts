import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import { WeeklyReport } from "../types/report";
import {
  GET_PROGRAMS,
  GET_TEAMS_BY_PROGRAM,
  GET_WEEKLY_REPORTS,
  GET_WEEKLY_REPORT,
  GET_FINAL_REPORTS,
  APPROVE_WEEKLY_REPORT,
  REJECT_WEEKLY_REPORT,
  ADD_WEEKLY_REPORT_FEEDBACK,
} from "../../../graphql/admin";

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

  const { data: reportsData } = useQuery(GET_WEEKLY_REPORTS, {
    variables: { teamId: selectedTeam },
    skip: !selectedTeam,
  });
  const reportsForTeam = reportsData?.weeklyReports as
    | WeeklyReport[]
    | undefined;

  const { data: finalReportsData } = useQuery(GET_FINAL_REPORTS, {
    variables: { teamId: selectedTeam },
    skip: !selectedTeam,
  });
  const finalReports = finalReportsData?.finalReports || [];

  // Get selected report details
  const { data: selectedReportData } = useQuery(GET_WEEKLY_REPORT, {
    variables: { id: selectedReportId },
    skip: !selectedReportId,
  });
  const selectedReport = selectedReportData?.weeklyReport as
    | WeeklyReport
    | undefined;

  // GraphQL Mutations
  const [approveReportMutation] = useMutation(APPROVE_WEEKLY_REPORT, {
    refetchQueries: [
      { query: GET_WEEKLY_REPORTS, variables: { teamId: selectedTeam } },
    ],
  });
  const [rejectReportMutation] = useMutation(REJECT_WEEKLY_REPORT, {
    refetchQueries: [
      { query: GET_WEEKLY_REPORTS, variables: { teamId: selectedTeam } },
    ],
  });
  const [addFeedbackMutation] = useMutation(ADD_WEEKLY_REPORT_FEEDBACK, {
    refetchQueries: [
      { query: GET_WEEKLY_REPORTS, variables: { teamId: selectedTeam } },
    ],
  });

  const handleApproveReport = async (reportId: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    try {
      await approveReportMutation({
        variables: { id: reportId },
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
      await rejectReportMutation({
        variables: {
          input: {
            reportId,
            comment: comment.trim(),
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
    finalReports,
    selectedReportData: selectedReport,
    handleApproveReport,
    handleRequestRevision,
  };
}
