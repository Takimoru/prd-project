import { gql } from "@apollo/client";

// ==================== QUERIES ====================

export const GET_ACTIVITIES = gql`
  query GetActivities($teamId: ID) {
    activities(teamId: $teamId) {
      id
      action
      targetId
      targetTitle
      details
      timestamp
      user {
        id
        name
        picture
      }
    }
  }
`;

export const GET_WORK_PROGRAMS = gql`
  query GetWorkPrograms($teamId: ID!) {
    workPrograms(teamId: $teamId) {
      id
      title
      description
      startDate
      endDate
      createdAt
      createdBy {
        id
        name
      }
      assignedMembers {
        id
        name
      }
      team {
        id
        name
      }
    }
  }
`;

export const GET_WORK_PROGRAM = gql`
  query GetWorkProgram($id: ID!) {
    workProgram(id: $id) {
      id
      title
      description
      startDate
      endDate
      createdAt
      createdBy {
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
      }
      tasks {
        id
        title
        description
        status
        completed
        startTime
        endTime
      }
    }
  }
`;

export const GET_WORK_PROGRAM_PROGRESS = gql`
  query GetWorkProgramProgress($workProgramId: ID!) {
    workProgramProgress(workProgramId: $workProgramId) {
      id
      percentage
      notes
      attachments
      updatedAt
      member {
        id
        name
        picture
      }
      workProgram {
        id
        title
      }
    }
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_WORK_PROGRAM = gql`
  mutation CreateWorkProgram($input: CreateWorkProgramInput!) {
    createWorkProgram(input: $input) {
      id
      title
      description
      startDate
      endDate
      team {
        id
        name
      }
      assignedMembers {
        id
        name
      }
    }
  }
`;

export const UPDATE_WORK_PROGRAM = gql`
  mutation UpdateWorkProgram($id: ID!, $input: UpdateWorkProgramInput!) {
    updateWorkProgram(id: $id, input: $input) {
      id
      title
      description
      startDate
      endDate
      assignedMembers {
        id
        name
      }
    }
  }
`;

export const DELETE_WORK_PROGRAM = gql`
  mutation DeleteWorkProgram($id: ID!) {
    deleteWorkProgram(id: $id)
  }
`;

export const UPDATE_WORK_PROGRAM_PROGRESS = gql`
  mutation UpdateWorkProgramProgress(
    $workProgramId: ID!
    $percentage: Int!
    $notes: String
    $attachments: [String!]
  ) {
    updateWorkProgramProgress(
      workProgramId: $workProgramId
      percentage: $percentage
      notes: $notes
      attachments: $attachments
    ) {
      id
      percentage
      notes
      updatedAt
      member {
        id
        name
      }
    }
  }
`;

export const GET_WORK_PROGRAM_MESSAGES = gql`
  query GetWorkProgramMessages($workProgramId: ID!) {
    workProgramMessages(workProgramId: $workProgramId) {
      id
      content
      createdAt
      sender {
        id
        name
        picture
      }
    }
  }
`;

export const SEND_WORK_PROGRAM_MESSAGE = gql`
  mutation SendWorkProgramMessage($workProgramId: ID!, $content: String!) {
    sendWorkProgramMessage(workProgramId: $workProgramId, content: $content) {
      id
      content
      createdAt
      sender {
        id
        name
      }
    }
  }
`;

export const WORK_PROGRAM_MESSAGE_ADDED = gql`
  subscription OnWorkProgramMessageAdded($workProgramId: ID!) {
    workProgramMessageAdded(workProgramId: $workProgramId) {
      id
      content
      createdAt
      sender {
        id
        name
        picture
      }
    }
  }
`;

