import { gql } from "@apollo/client";

// ==================== QUERIES ====================

export const GET_PROGRAMS = gql`
  query GetPrograms($includeArchived: Boolean) {
    programs(includeArchived: $includeArchived) {
      id
      title
      description
      startDate
      endDate
      archived
      createdAt
      creator {
        id
        name
        email
      }
    }
  }
`;

export const GET_PROGRAM = gql`
  query GetProgram($id: ID!) {
    program(id: $id) {
      id
      title
      description
      startDate
      endDate
      archived
      creator {
        id
        name
      }
    }
  }
`;

export const GET_TEAMS_BY_PROGRAM = gql`
  query GetTeamsByProgram($programId: ID) {
    teams(programId: $programId) {
      id
      name
      programId
      leaderId
      supervisorId
      progress
      leader {
        id
        name
        email
        studentId
      }
      supervisor {
        id
        name
        email
        nidn
      }
      members {
        id
        name
        email
        studentId
      }
      program {
        id
        title
      }
    }
  }
`;

export const GET_TEAM = gql`
  query GetTeam($id: ID!) {
    team(id: $id) {
      id
      name
      programId
      leaderId
      supervisorId
      progress
      leader {
        id
        name
        email
      }
      supervisor {
        id
        name
        email
      }
      members {
        id
        name
        email
      }
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers($role: String) {
    users(role: $role) {
      id
      name
      email
      role
      studentId
      nidn
      picture
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($searchTerm: String!) {
    searchUsers(searchTerm: $searchTerm) {
      id
      name
      email
      role
      studentId
    }
  }
`;

export const GET_STUDENTS_BY_PROGRAM = gql`
  query GetStudentsByProgram($programId: ID!) {
    studentsByProgram(programId: $programId) {
      id
      name
      email
      studentId
      role
    }
  }
`;

export const GET_PENDING_REGISTRATIONS = gql`
  query GetPendingRegistrations {
    pendingRegistrations {
      id
      status
      programId
      userId
      fullName
      studentId
      email
      phone
      paymentProofUrl
      submittedAt
      program {
        id
        title
      }
      user {
        id
        name
        email
      }
    }
  }
`;

export const GET_APPROVED_REGISTRATIONS = gql`
  query GetApprovedRegistrations {
    approvedRegistrations {
      id
      status
      programId
      userId
      fullName
      studentId
      email
      submittedAt
      program {
        id
        title
      }
      user {
        id
        name
        email
      }
    }
  }
`;

export const GET_REGISTRATIONS_BY_PROGRAM = gql`
  query GetRegistrationsByProgram($programId: ID!, $status: String) {
    registrations(programId: $programId, status: $status) {
      id
      status
      userId
      fullName
      studentId
      email
      phone
      paymentProofUrl
      submittedAt
      reviewedAt
      reviewNotes
      user {
        id
        name
        email
      }
      reviewedBy {
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

export const GET_APPROVED_ATTENDANCE = gql`
  query GetApprovedAttendance($programId: ID!) {
    approvedAttendance(programId: $programId) {
      id
      date
      status
      excuse
      timestamp
      user {
        id
        name
        email
        studentId
      }
      team {
        id
        name
      }
    }
  }
`;

export const GET_WEEKLY_REPORTS = gql`
  query GetWeeklyReports($teamId: ID!) {
    weeklyReports(teamId: $teamId) {
      id
      week
      status
      progressPercentage
      description
      submittedAt
      createdAt
      team {
        id
        name
      }
      comments {
        id
        content
        author {
          id
          name
        }
        createdAt
      }
    }
  }
`;

export const GET_WEEKLY_REPORT = gql`
  query GetWeeklyReport($id: ID!) {
    weeklyReport(id: $id) {
      id
      week
      status
      progressPercentage
      description
      submittedAt
      createdAt
      team {
        id
        name
      }
      comments {
        id
        content
        author {
          id
          name
        }
        createdAt
      }
    }
  }
`;

export const GET_REPORTS_BY_STATUS = gql`
  query GetReportsByStatus($status: String!) {
    reportsByStatus(status: $status) {
      id
      week
      status
      progressPercentage
      description
      submittedAt
      team {
        id
        name
        program {
          id
          title
        }
      }
    }
  }
`;

export const GET_FINAL_REPORTS = gql`
  query GetFinalReports($teamId: ID!) {
    finalReports(teamId: $teamId)
  }
`;

export const EXPORT_ATTENDANCE_CSV = gql`
  query ExportAttendanceCSV($programId: ID!) {
    exportAttendanceCSV(programId: $programId) {
      url
      filename
      recordCount
    }
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_PROGRAM = gql`
  mutation CreateProgram($input: CreateProgramInput!) {
    createProgram(input: $input) {
      id
      title
      description
      startDate
      endDate
      archived
    }
  }
`;

export const UPDATE_PROGRAM = gql`
  mutation UpdateProgram($id: ID!, $input: UpdateProgramInput!) {
    updateProgram(id: $id, input: $input) {
      id
      title
      description
      startDate
      endDate
    }
  }
`;

export const ARCHIVE_PROGRAM = gql`
  mutation ArchiveProgram($id: ID!) {
    archiveProgram(id: $id) {
      id
      archived
    }
  }
`;

export const CREATE_TEAM = gql`
  mutation CreateTeam($input: CreateTeamInput!) {
    createTeam(input: $input) {
      id
      name
      programId
      leaderId
      supervisorId
      leader {
        id
        name
      }
      supervisor {
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

export const UPDATE_TEAM = gql`
  mutation UpdateTeam($id: ID!, $input: UpdateTeamInput!) {
    updateTeam(id: $id, input: $input) {
      id
      name
      leaderId
      supervisorId
      progress
      members {
        id
        name
      }
    }
  }
`;

export const ASSIGN_SUPERVISOR = gql`
  mutation AssignSupervisor($teamId: ID!, $supervisorId: ID!) {
    assignSupervisor(teamId: $teamId, supervisorId: $supervisorId) {
      id
      supervisorId
      supervisor {
        id
        name
        email
      }
    }
  }
`;

export const DELETE_TEAM = gql`
  mutation DeleteTeam($id: ID!) {
    deleteTeam(id: $id) {
      id
    }
  }
`;

export const ADD_MEMBER = gql`
  mutation AddMember($input: AddMemberInput!) {
    addMember(input: $input) {
      id
      members {
        id
        name
      }
    }
  }
`;

export const REMOVE_MEMBER = gql`
  mutation RemoveMember($teamId: ID!, $userId: ID!) {
    removeMember(teamId: $teamId, userId: $userId) {
      id
      members {
        id
        name
      }
    }
  }
`;

export const APPROVE_REGISTRATION = gql`
  mutation ApproveRegistration($id: ID!) {
    approveRegistration(id: $id) {
      id
      status
      reviewedAt
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const REJECT_REGISTRATION = gql`
  mutation RejectRegistration($id: ID!, $reviewNotes: String) {
    rejectRegistration(id: $id, reviewNotes: $reviewNotes) {
      id
      status
      reviewNotes
      reviewedAt
    }
  }
`;

export const CREATE_SUPERVISOR = gql`
  mutation CreateSupervisor($input: CreateSupervisorInput!) {
    createSupervisor(input: $input) {
      id
      email
      name
      nidn
      role
    }
  }
`;

export const UPDATE_SUPERVISOR = gql`
  mutation UpdateSupervisor($id: ID!, $input: UpdateSupervisorInput!) {
    updateSupervisor(id: $id, input: $input) {
      id
      email
      name
      nidn
      role
    }
  }
`;

export const DELETE_SUPERVISOR = gql`
  mutation DeleteSupervisor($id: ID!) {
    deleteSupervisor(id: $id)
  }
`;

export const APPROVE_WEEKLY_REPORT = gql`
  mutation ApproveWeeklyReport($id: ID!) {
    approveWeeklyReport(id: $id) {
      id
      status
      team {
        id
        name
      }
    }
  }
`;

export const REJECT_WEEKLY_REPORT = gql`
  mutation RejectWeeklyReport($input: AddFeedbackInput!) {
    rejectWeeklyReport(input: $input) {
      id
      status
      comments {
        id
        content
        author {
          id
          name
        }
      }
    }
  }
`;

export const ADD_WEEKLY_REPORT_FEEDBACK = gql`
  mutation AddWeeklyReportFeedback($input: AddFeedbackInput!) {
    addWeeklyReportFeedback(input: $input) {
      id
      content
      author {
        id
        name
      }
      createdAt
    }
  }
`;
