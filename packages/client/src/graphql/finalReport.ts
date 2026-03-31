import { gql } from "@apollo/client";

// Query: Get my team's final reports
export const GET_MY_TEAM_FINAL_REPORTS = gql`
  query GetMyTeamFinalReports($teamId: ID!) {
    myTeamFinalReports(teamId: $teamId) {
      id
      title
      description
      fileUrl
      fileName
      status
      reviewNotes
      createdAt
      updatedAt
      uploadedBy {
        id
        name
        email
      }
      reviewedBy {
        id
        name
      }
      reviewedAt
    }
  }
`;

// Query: Get all final reports (Admin)
export const GET_ALL_FINAL_REPORTS = gql`
  query GetAllFinalReports {
    allFinalReports {
      id
      title
      description
      fileUrl
      fileName
      status
      reviewNotes
      createdAt
      updatedAt
      team {
        id
        name
        program {
          id
          title
        }
      }
      uploadedBy {
        id
        name
        email
      }
      reviewedBy {
        id
        name
      }
      reviewedAt
    }
  }
`;

// Query: Get final reports by team (Admin)
export const GET_FINAL_REPORTS_BY_TEAM = gql`
  query GetFinalReportsByTeam($teamId: ID!) {
    finalReportsByTeam(teamId: $teamId) {
      id
      title
      description
      fileUrl
      fileName
      status
      reviewNotes
      createdAt
      updatedAt
      uploadedBy {
        id
        name
        email
      }
      reviewedBy {
        id
        name
      }
      reviewedAt
    }
  }
`;

// Mutation: Upload final report (Student)
export const UPLOAD_FINAL_REPORT = gql`
  mutation UploadFinalReport($input: UploadFinalReportInput!) {
    uploadFinalReport(input: $input) {
      id
      title
      fileUrl
      fileName
      status
      createdAt
    }
  }
`;

// Mutation: Review final report (Admin)
export const REVIEW_FINAL_REPORT = gql`
  mutation ReviewFinalReport($input: ReviewFinalReportInput!) {
    reviewFinalReport(input: $input) {
      id
      status
      reviewNotes
      reviewedAt
      reviewedBy {
        id
        name
      }
    }
  }
`;
