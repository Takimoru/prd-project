import { gql } from "@apollo/client";

export const GET_SUPERVISOR_DASHBOARD_DATA = gql`
  query GetSupervisorDashboardData {
    myTeams {
      id
      name
      progress
    }
    weeklyReviewQueue {
      id
      week
      status
      submittedAt
      teamId
      team {
        id
        name
      }
      leader {
        id
        name
      }
    }
    mySupervisedWorkPrograms {
      id
      title
      teamId
      team {
        id
        name
      }
      progress
      startDate
      endDate
    }
    pendingAttendanceQueue {
      id
      weekStartDate
      status
      teamId
      team {
        id
        name
      }
      student {
        id
        name
      }
    }
  }
`;

export const GET_SUPERVISED_TEAMS = gql`
  query GetSupervisedTeams {
    myTeams {
      id
      name
      progress
      supervisor {
        id
        name
        email
        role
        picture
        nidn
      }
      leader {
        id
        name
        email
        role
        picture
      }
      members {
        id
        name
        email
        role
        picture
        studentId
      }
    }
  }
`;

export const GET_SUPERVISOR_TASKS = gql`
  query GetSupervisorTasks {
    myTeams {
      id
      name
    }
    tasksByUser {
      id
      title
      description
      completed
      completedAt
      endTime
      teamId
      assignedMembers {
        id
        name
      }
    }
  }
`;

export const GET_WEEKLY_ATTENDANCE_SUMMARY = gql`
  query GetWeeklyAttendanceSummary($teamId: ID!, $week: String!) {
    weeklyAttendanceSummary(teamId: $teamId, week: $week) {
      teamId
      week
      startDate
      endDate
      dates
      students {
        userId
        userName
        email
        presentCount
        lastCheckIn
        approvalStatus
        dailyRecords {
          date
          status
          excuse
          timestamp
        }
      }
    }
  }
`;

export const APPROVE_WEEKLY_ATTENDANCE = gql`
  mutation ApproveWeeklyAttendance(
    $teamId: ID!
    $studentId: ID!
    $supervisorId: ID!
    $week: String!
    $status: String!
    $notes: String
  ) {
    approveWeeklyAttendance(
      teamId: $teamId
      studentId: $studentId
      supervisorId: $supervisorId
      week: $week
      status: $status
      notes: $notes
    ) {
      id
      status
      notes
      approvedAt
    }
  }
`;

export const GET_PENDING_REVIEWS = gql`
  query GetPendingReviews {
    weeklyReviewQueue {
      id
      week
      status
      submittedAt
      teamId
      team {
        id
        name
      }
      leader {
        id
        name
      }
    }
  }
`;

export const GET_ALL_REPORTS = gql`
  query GetAllReports {
    myTeamWeeklyReports {
      id
      week
      status
      submittedAt
      teamId
      team {
        id
        name
      }
      leader {
        id
        name
      }
    }
  }
`;

export const GET_TEAM_DETAILS = gql`
  query GetTeamDetails($id: ID!) {
    team(id: $id) {
      id
      name
      leader {
        id
        name
      }
      members {
        id
        name
      }
    }
  }
`;

export const GET_TEAM_REPORTS = gql`
  query GetTeamReports($teamId: ID!) {
    weeklyReports(teamId: $teamId) {
      id
      week
      status
      progressPercentage
      submittedAt
    }
  }
`;

export const GET_WEEK_REPORT = gql`
  query GetWeekReport($teamId: ID!, $week: String!) {
    weeklyReportByWeek(teamId: $teamId, week: $week) {
      id
      week
      status
      description
      progressPercentage
      submittedAt
      photos
      team {
        id
        name
      }
      memberProgress {
        user {
          id
          name
        }
        completedTasks
        totalTasks
      }
      comments {
        id
        content
        createdAt
        author {
          id
          name
        }
      }
    }
  }
`;

export const APPROVE_WEEKLY_REPORT = gql`
  mutation ApproveWeeklyReportSupervisor($id: ID!, $comment: String) {
    approveWeeklyReport(id: $id, comment: $comment) {
      id
      status
    }
  }
`;

export const REJECT_WEEKLY_REPORT = gql`
  mutation RejectWeeklyReportSupervisor($input: AddFeedbackInput!) {
    rejectWeeklyReport(input: $input) {
      id
      status
    }
  }
`;

export const ADD_WEEKLY_REPORT_FEEDBACK = gql`
  mutation AddWeeklyReportFeedbackSupervisor($input: AddFeedbackInput!) {
    addWeeklyReportFeedback(input: $input) {
      id
      content
    }
  }
`;
