import { gql } from '@apollo/client';

export const GET_DASHBOARD_DATA = gql(`
  query GetDashboardData($includeArchived: Boolean!, $startDate: String, $endDate: String) {
    programs(includeArchived: $includeArchived) {
      id
      title
      startDate
      endDate
      description
      # Add other fields needed for dashboard
    }
    me {
      id
      registrations {
        id
        status
        program {
          id
        }
        # Add other fields needed
      }
    }
    myTeams {
      id
      name
      program {
        id
      }
      leader {
        id
        name
      }
      # Need progress, etc?
      progress
      documentation {
        name
        url
        type
        uploadedAt
      }
    }
    me {
      attendance(startDate: $startDate, endDate: $endDate) {
        id
        date
        status
        team {
            id
        }
      }
    }
  }
`);


export const GET_MY_TASKS = gql(`
  query GetMyTasks {
    myTeams {
      id
      name
      tasks {
        id
        title
        description
        status
        completed
        startTime
        endTime
        createdAt
        workProgramId
        completionFiles {
          id
          url
          name
        }
        completedAt
        completedBy {
          id
          name
        }
        assignedMembers {
          id
          name
          picture
        }
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
  }
`);

export const GET_TEAM_TASKS = gql(`
  query GetTeamTasks($teamId: ID!) {
    tasks(teamId: $teamId) {
      id
      title
      description
      status
      completed
      startTime
      endTime
      createdAt
      assignedMembers {
        id
        name
        picture
      }
    }
  }
`);

export const GET_TEAM_ATTENDANCE = gql(`
  query GetTeamAttendance($teamId: ID!, $date: String!) {
    attendanceByTeam(teamId: $teamId, date: $date) {
      id
      status
      date
      user {
        id
        name
        picture
      }
    }
  }
`);

export const GET_WEEKLY_ATTENDANCE_SUMMARY = gql(`
  query GetMyTeamWeeklyAttendanceSummary($teamId: ID!, $week: String!) {
    weeklyAttendanceSummary(teamId: $teamId, week: $week) {
      week
      startDate
      endDate
      students {
        userId
        userName
        presentCount
        approvalStatus
        dailyRecords {
          date
          status
        }
      }
    }
  }
`);

export const GET_MY_TEAMS = gql(`
  query GetMyTeams {
    myTeams {
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
`);

export const CREATE_TASK_MUTATION = gql(`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      status
      completed
    }
  }
`);

export const UPDATE_TASK_MUTATION = gql(`
  mutation UpdateTask($taskId: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $taskId, input: $input) {
      id
      title
      status
      completed
    }
  }
`);

export const UPDATE_TASK_STATUS_MUTATION = gql(`
  mutation UpdateTaskStatus($taskId: ID!, $completed: Boolean!) {
    updateTask(id: $taskId, input: { completed: $completed }) {
      id
      status
      completed
    }
  }
`);

export const CHECK_IN_MUTATION = gql(`
  mutation CheckIn($input: CheckInInput!) {
    checkIn(input: $input) {
      id
      date
      status
    }
  }
`);

export const UPDATE_TEAM_PROGRESS = gql(`
  mutation UpdateTeamProgress($teamId: ID!, $progress: Int!) {
    updateTeamProgress(teamId: $teamId, progress: $progress) {
      id
      progress
    }
  }
`);

/*
export const ADD_TEAM_DOCUMENTATION = gql(`
  mutation AddTeamDocumentation($teamId: ID!, $name: String!, $url: String!, $type: String!) {
    addTeamDocumentation(teamId: $teamId, name: $name, url: $url, type: $type) {
      id
      documentation {
        name
        url
      }
    }
  }
`);
*/

export const CREATE_PROGRAM_MUTATION = gql(`
  mutation CreateProgramFromDashboard($input: CreateProgramInput!) {
    createProgram(input: $input) {
      id
      title
    }
  }
`);

export const GET_TASK_DETAILS = gql(`
  query GetTaskDetails($id: ID!) {
    task(id: $id) {
      id
      title
      description
      status
      completed
      startTime
      endTime
      createdAt
      assignedMembers {
        id
        name
        picture
      }
      completionFiles {
        id
        url
        name
      }
      completedBy {
        id
        name
      }
      completedAt
      updates {
        id
        notes
        progress
        createdAt
        user {
          id
          name
          picture
        }
      }
    }
  }
`);

export const GET_TASK_UPDATES = gql(`
  query GetTaskUpdates($taskId: ID!) {
    taskUpdates(taskId: $taskId) {
      id
      notes
      progress
      createdAt
      user {
        id
        name
        picture
      }
    }
  }
`);

export const UPDATE_TASK_WITH_FILES = gql(`
  mutation UpdateTaskWithFiles($taskId: ID!, $completed: Boolean, $completionFiles: [String!]) {
    updateTask(taskId: $taskId, completed: $completed, completionFiles: $completionFiles) {
      id
      status
      completed
      completionFiles {
        id
        url
      }
    }
  }
`);

export const ADD_TASK_UPDATE = gql(`
  mutation AddTaskUpdate($taskId: ID!, $notes: String, $progress: Int) {
    addTaskUpdate(taskId: $taskId, notes: $notes, progress: $progress) {
      id
      notes
      progress
      createdAt
      user {
        id
        name
      }
    }
  }
`);

export const GET_TEAM_DETAILS = gql(`
  query GetTeamDetailsDashboard($teamId: ID!) {
    team(id: $teamId) {
      id
      name
      leader {
        id
        name
      }
      members {
        id
        name
        picture
      }
    }
  }
`);
