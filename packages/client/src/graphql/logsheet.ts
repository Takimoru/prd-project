import { gql } from "@apollo/client";

export const GET_WEEKLY_RECAP = gql`
  query GetWeeklyTaskRecap($teamId: ID!, $week: String!) {
    weeklyTaskRecap(teamId: $teamId, week: $week) {
      date
      taskTitle
      taskDescription
      workProgramTitle
      members
      completedAt
      notes
    }
  }
`;

export const GET_TEAM_LOGSHEETS = gql`
  query GetMyTeamLogsheets($teamId: ID!) {
    myTeamLogsheets(teamId: $teamId) {
      id
      weekNumber
      fileUrl
      createdAt
      createdBy {
        id
        name
      }
    }
  }
`;

export const GET_ALL_LOGSHEETS = gql`
  query GetAllLogsheets {
    allLogsheets {
      id
      weekNumber
      fileUrl
      createdAt
      team {
        id
        name
      }
      createdBy {
        id
        name
      }
    }
  }
`;

export const UPLOAD_LOGSHEET = gql`
  mutation UploadLogsheet($teamId: ID!, $week: String!) {
    uploadLogsheet(teamId: $teamId, week: $week) {
      id
      weekNumber
      fileUrl
      createdAt
    }
  }
`;
