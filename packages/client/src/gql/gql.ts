/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query Me {\n    me {\n      id\n      email\n      name\n      role\n      studentId\n      picture\n    }\n  }\n": typeof types.MeDocument,
    "\n  mutation SyncUser($email: String!, $name: String!, $googleId: String!, $picture: String) {\n    syncUser(email: $email, name: $name, googleId: $googleId, picture: $picture) {\n      id\n      email\n      name\n      role\n    }\n  }\n": typeof types.SyncUserDocument,
    "\n  query GetDashboardData($includeArchived: Boolean!, $startDate: String, $endDate: String) {\n    programs(includeArchived: $includeArchived) {\n      id\n      title\n      startDate\n      endDate\n      description\n      # Add other fields needed for dashboard\n    }\n    me {\n      id\n      registrations {\n        id\n        status\n        program {\n          id\n        }\n        # Add other fields needed\n      }\n    }\n    myTeams {\n      id\n      name\n      program {\n        id\n      }\n      leader {\n        id\n        name\n      }\n      # Need progress, etc?\n      progress\n      documentation {\n        name\n        url\n        type\n        uploadedAt\n      }\n    }\n    me {\n      attendance(startDate: $startDate, endDate: $endDate) {\n        id\n        date\n        status\n        team {\n            id\n        }\n      }\n    }\n  }\n": typeof types.GetDashboardDataDocument,
    "\n  query GetMyTasks {\n    myTeams {\n      id\n      name\n      tasks {\n        id\n        title\n        description\n        status\n        completed\n        startTime\n        endTime\n        createdAt\n        assignedMembers {\n          id\n          name\n          picture\n        }\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetMyTasksDocument,
    "\n  query GetTeamTasks($teamId: ID!) {\n    tasks(teamId: $teamId) {\n      id\n      title\n      description\n      status\n      completed\n      startTime\n      endTime\n      createdAt\n      assignedMembers {\n        id\n        name\n        picture\n      }\n    }\n  }\n": typeof types.GetTeamTasksDocument,
    "\n  query GetTeamAttendance($teamId: ID!, $date: String!) {\n    attendanceByTeam(teamId: $teamId, date: $date) {\n      id\n      status\n      date\n      user {\n        id\n        name\n        picture\n      }\n    }\n  }\n": typeof types.GetTeamAttendanceDocument,
    "\n  query GetWeeklyAttendanceSummary($teamId: ID!, $week: String!) {\n    weeklyAttendanceSummary(teamId: $teamId, week: $week) {\n      week\n      startDate\n      endDate\n      students {\n        userId\n        userName\n        presentCount\n        approvalStatus\n        dailyRecords {\n          date\n          status\n        }\n      }\n    }\n  }\n": typeof types.GetWeeklyAttendanceSummaryDocument,
    "\n  query GetMyTeams {\n    myTeams {\n      id\n      name\n      leader {\n        id\n        name\n      }\n      members {\n        id\n        name\n      }\n    }\n  }\n": typeof types.GetMyTeamsDocument,
    "\n  mutation CreateTask($teamId: ID!, $title: String!, $description: String, $assignedMemberIds: [ID!], $startTime: String, $endTime: String) {\n    createTask(teamId: $teamId, title: $title, description: $description, assignedMemberIds: $assignedMemberIds, startTime: $startTime, endTime: $endTime) {\n      id\n      title\n      status\n      completed\n    }\n  }\n": typeof types.CreateTaskDocument,
    "\n  mutation UpdateTask($taskId: ID!, $title: String, $description: String, $completed: Boolean, $assignedMemberIds: [ID!], $startTime: String, $endTime: String) {\n    updateTask(taskId: $taskId, title: $title, description: $description, completed: $completed, assignedMemberIds: $assignedMemberIds, startTime: $startTime, endTime: $endTime) {\n      id\n      title\n      status\n      completed\n    }\n  }\n": typeof types.UpdateTaskDocument,
    "\n  mutation UpdateTaskStatus($taskId: ID!, $completed: Boolean!) {\n    updateTaskStatus(taskId: $taskId, completed: $completed) {\n      id\n      status\n      completed\n    }\n  }\n": typeof types.UpdateTaskStatusDocument,
    "\n  mutation CheckIn($teamId: ID!, $status: String!, $excuse: String, $lat: Float, $long: Float) {\n    checkIn(teamId: $teamId, status: $status, excuse: $excuse, lat: $lat, long: $long) {\n      id\n      date\n      status\n    }\n  }\n": typeof types.CheckInDocument,
    "\n  mutation UpdateTeamProgress($teamId: ID!, $progress: Int!) {\n    updateTeamProgress(teamId: $teamId, progress: $progress) {\n      id\n      progress\n    }\n  }\n": typeof types.UpdateTeamProgressDocument,
    "\n  mutation AddTeamDocumentation($teamId: ID!, $name: String!, $url: String!, $type: String!) {\n    addTeamDocumentation(teamId: $teamId, name: $name, url: $url, type: $type) {\n      id\n      documentation {\n        name\n        url\n      }\n    }\n  }\n": typeof types.AddTeamDocumentationDocument,
    "\n  mutation CreateProgram($title: String!, $description: String!, $startDate: String!, $endDate: String!) {\n    createProgram(title: $title, description: $description, startDate: $startDate, endDate: $endDate) {\n      id\n      title\n    }\n  }\n": typeof types.CreateProgramDocument,
    "\n  query GetTaskDetails($id: ID!) {\n    task(id: $id) {\n      id\n      title\n      description\n      status\n      completed\n      startTime\n      endTime\n      createdAt\n      assignedMembers {\n        id\n        name\n        picture\n      }\n      completionFiles {\n        id\n        url\n        name\n      }\n      completedBy {\n        id\n        name\n      }\n      completedAt\n      updates {\n        id\n        notes\n        progress\n        createdAt\n        user {\n          id\n          name\n          picture\n        }\n      }\n    }\n  }\n": typeof types.GetTaskDetailsDocument,
    "\n  query GetTaskUpdates($taskId: ID!) {\n    taskUpdates(taskId: $taskId) {\n      id\n      notes\n      progress\n      createdAt\n      user {\n        id\n        name\n        picture\n      }\n    }\n  }\n": typeof types.GetTaskUpdatesDocument,
    "\n  mutation UpdateTaskWithFiles($taskId: ID!, $completed: Boolean, $completionFiles: [String!]) {\n    updateTask(taskId: $taskId, completed: $completed, completionFiles: $completionFiles) {\n      id\n      status\n      completed\n      completionFiles {\n        id\n        url\n      }\n    }\n  }\n": typeof types.UpdateTaskWithFilesDocument,
    "\n  mutation AddTaskUpdate($taskId: ID!, $notes: String, $progress: Int) {\n    addTaskUpdate(taskId: $taskId, notes: $notes, progress: $progress) {\n      id\n      notes\n      progress\n      createdAt\n      user {\n        id\n        name\n      }\n    }\n  }\n": typeof types.AddTaskUpdateDocument,
    "\n  query GetTeamDetails($teamId: ID!) {\n    team(id: $teamId) {\n      id\n      name\n      leader {\n        id\n        name\n      }\n      members {\n        id\n        name\n        picture\n      }\n    }\n  }\n": typeof types.GetTeamDetailsDocument,
};
const documents: Documents = {
    "\n  query Me {\n    me {\n      id\n      email\n      name\n      role\n      studentId\n      picture\n    }\n  }\n": types.MeDocument,
    "\n  mutation SyncUser($email: String!, $name: String!, $googleId: String!, $picture: String) {\n    syncUser(email: $email, name: $name, googleId: $googleId, picture: $picture) {\n      id\n      email\n      name\n      role\n    }\n  }\n": types.SyncUserDocument,
    "\n  query GetDashboardData($includeArchived: Boolean!, $startDate: String, $endDate: String) {\n    programs(includeArchived: $includeArchived) {\n      id\n      title\n      startDate\n      endDate\n      description\n      # Add other fields needed for dashboard\n    }\n    me {\n      id\n      registrations {\n        id\n        status\n        program {\n          id\n        }\n        # Add other fields needed\n      }\n    }\n    myTeams {\n      id\n      name\n      program {\n        id\n      }\n      leader {\n        id\n        name\n      }\n      # Need progress, etc?\n      progress\n      documentation {\n        name\n        url\n        type\n        uploadedAt\n      }\n    }\n    me {\n      attendance(startDate: $startDate, endDate: $endDate) {\n        id\n        date\n        status\n        team {\n            id\n        }\n      }\n    }\n  }\n": types.GetDashboardDataDocument,
    "\n  query GetMyTasks {\n    myTeams {\n      id\n      name\n      tasks {\n        id\n        title\n        description\n        status\n        completed\n        startTime\n        endTime\n        createdAt\n        assignedMembers {\n          id\n          name\n          picture\n        }\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.GetMyTasksDocument,
    "\n  query GetTeamTasks($teamId: ID!) {\n    tasks(teamId: $teamId) {\n      id\n      title\n      description\n      status\n      completed\n      startTime\n      endTime\n      createdAt\n      assignedMembers {\n        id\n        name\n        picture\n      }\n    }\n  }\n": types.GetTeamTasksDocument,
    "\n  query GetTeamAttendance($teamId: ID!, $date: String!) {\n    attendanceByTeam(teamId: $teamId, date: $date) {\n      id\n      status\n      date\n      user {\n        id\n        name\n        picture\n      }\n    }\n  }\n": types.GetTeamAttendanceDocument,
    "\n  query GetWeeklyAttendanceSummary($teamId: ID!, $week: String!) {\n    weeklyAttendanceSummary(teamId: $teamId, week: $week) {\n      week\n      startDate\n      endDate\n      students {\n        userId\n        userName\n        presentCount\n        approvalStatus\n        dailyRecords {\n          date\n          status\n        }\n      }\n    }\n  }\n": types.GetWeeklyAttendanceSummaryDocument,
    "\n  query GetMyTeams {\n    myTeams {\n      id\n      name\n      leader {\n        id\n        name\n      }\n      members {\n        id\n        name\n      }\n    }\n  }\n": types.GetMyTeamsDocument,
    "\n  mutation CreateTask($teamId: ID!, $title: String!, $description: String, $assignedMemberIds: [ID!], $startTime: String, $endTime: String) {\n    createTask(teamId: $teamId, title: $title, description: $description, assignedMemberIds: $assignedMemberIds, startTime: $startTime, endTime: $endTime) {\n      id\n      title\n      status\n      completed\n    }\n  }\n": types.CreateTaskDocument,
    "\n  mutation UpdateTask($taskId: ID!, $title: String, $description: String, $completed: Boolean, $assignedMemberIds: [ID!], $startTime: String, $endTime: String) {\n    updateTask(taskId: $taskId, title: $title, description: $description, completed: $completed, assignedMemberIds: $assignedMemberIds, startTime: $startTime, endTime: $endTime) {\n      id\n      title\n      status\n      completed\n    }\n  }\n": types.UpdateTaskDocument,
    "\n  mutation UpdateTaskStatus($taskId: ID!, $completed: Boolean!) {\n    updateTaskStatus(taskId: $taskId, completed: $completed) {\n      id\n      status\n      completed\n    }\n  }\n": types.UpdateTaskStatusDocument,
    "\n  mutation CheckIn($teamId: ID!, $status: String!, $excuse: String, $lat: Float, $long: Float) {\n    checkIn(teamId: $teamId, status: $status, excuse: $excuse, lat: $lat, long: $long) {\n      id\n      date\n      status\n    }\n  }\n": types.CheckInDocument,
    "\n  mutation UpdateTeamProgress($teamId: ID!, $progress: Int!) {\n    updateTeamProgress(teamId: $teamId, progress: $progress) {\n      id\n      progress\n    }\n  }\n": types.UpdateTeamProgressDocument,
    "\n  mutation AddTeamDocumentation($teamId: ID!, $name: String!, $url: String!, $type: String!) {\n    addTeamDocumentation(teamId: $teamId, name: $name, url: $url, type: $type) {\n      id\n      documentation {\n        name\n        url\n      }\n    }\n  }\n": types.AddTeamDocumentationDocument,
    "\n  mutation CreateProgram($title: String!, $description: String!, $startDate: String!, $endDate: String!) {\n    createProgram(title: $title, description: $description, startDate: $startDate, endDate: $endDate) {\n      id\n      title\n    }\n  }\n": types.CreateProgramDocument,
    "\n  query GetTaskDetails($id: ID!) {\n    task(id: $id) {\n      id\n      title\n      description\n      status\n      completed\n      startTime\n      endTime\n      createdAt\n      assignedMembers {\n        id\n        name\n        picture\n      }\n      completionFiles {\n        id\n        url\n        name\n      }\n      completedBy {\n        id\n        name\n      }\n      completedAt\n      updates {\n        id\n        notes\n        progress\n        createdAt\n        user {\n          id\n          name\n          picture\n        }\n      }\n    }\n  }\n": types.GetTaskDetailsDocument,
    "\n  query GetTaskUpdates($taskId: ID!) {\n    taskUpdates(taskId: $taskId) {\n      id\n      notes\n      progress\n      createdAt\n      user {\n        id\n        name\n        picture\n      }\n    }\n  }\n": types.GetTaskUpdatesDocument,
    "\n  mutation UpdateTaskWithFiles($taskId: ID!, $completed: Boolean, $completionFiles: [String!]) {\n    updateTask(taskId: $taskId, completed: $completed, completionFiles: $completionFiles) {\n      id\n      status\n      completed\n      completionFiles {\n        id\n        url\n      }\n    }\n  }\n": types.UpdateTaskWithFilesDocument,
    "\n  mutation AddTaskUpdate($taskId: ID!, $notes: String, $progress: Int) {\n    addTaskUpdate(taskId: $taskId, notes: $notes, progress: $progress) {\n      id\n      notes\n      progress\n      createdAt\n      user {\n        id\n        name\n      }\n    }\n  }\n": types.AddTaskUpdateDocument,
    "\n  query GetTeamDetails($teamId: ID!) {\n    team(id: $teamId) {\n      id\n      name\n      leader {\n        id\n        name\n      }\n      members {\n        id\n        name\n        picture\n      }\n    }\n  }\n": types.GetTeamDetailsDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Me {\n    me {\n      id\n      email\n      name\n      role\n      studentId\n      picture\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      email\n      name\n      role\n      studentId\n      picture\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SyncUser($email: String!, $name: String!, $googleId: String!, $picture: String) {\n    syncUser(email: $email, name: $name, googleId: $googleId, picture: $picture) {\n      id\n      email\n      name\n      role\n    }\n  }\n"): (typeof documents)["\n  mutation SyncUser($email: String!, $name: String!, $googleId: String!, $picture: String) {\n    syncUser(email: $email, name: $name, googleId: $googleId, picture: $picture) {\n      id\n      email\n      name\n      role\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetDashboardData($includeArchived: Boolean!, $startDate: String, $endDate: String) {\n    programs(includeArchived: $includeArchived) {\n      id\n      title\n      startDate\n      endDate\n      description\n      # Add other fields needed for dashboard\n    }\n    me {\n      id\n      registrations {\n        id\n        status\n        program {\n          id\n        }\n        # Add other fields needed\n      }\n    }\n    myTeams {\n      id\n      name\n      program {\n        id\n      }\n      leader {\n        id\n        name\n      }\n      # Need progress, etc?\n      progress\n      documentation {\n        name\n        url\n        type\n        uploadedAt\n      }\n    }\n    me {\n      attendance(startDate: $startDate, endDate: $endDate) {\n        id\n        date\n        status\n        team {\n            id\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetDashboardData($includeArchived: Boolean!, $startDate: String, $endDate: String) {\n    programs(includeArchived: $includeArchived) {\n      id\n      title\n      startDate\n      endDate\n      description\n      # Add other fields needed for dashboard\n    }\n    me {\n      id\n      registrations {\n        id\n        status\n        program {\n          id\n        }\n        # Add other fields needed\n      }\n    }\n    myTeams {\n      id\n      name\n      program {\n        id\n      }\n      leader {\n        id\n        name\n      }\n      # Need progress, etc?\n      progress\n      documentation {\n        name\n        url\n        type\n        uploadedAt\n      }\n    }\n    me {\n      attendance(startDate: $startDate, endDate: $endDate) {\n        id\n        date\n        status\n        team {\n            id\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetMyTasks {\n    myTeams {\n      id\n      name\n      tasks {\n        id\n        title\n        description\n        status\n        completed\n        startTime\n        endTime\n        createdAt\n        assignedMembers {\n          id\n          name\n          picture\n        }\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetMyTasks {\n    myTeams {\n      id\n      name\n      tasks {\n        id\n        title\n        description\n        status\n        completed\n        startTime\n        endTime\n        createdAt\n        assignedMembers {\n          id\n          name\n          picture\n        }\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetTeamTasks($teamId: ID!) {\n    tasks(teamId: $teamId) {\n      id\n      title\n      description\n      status\n      completed\n      startTime\n      endTime\n      createdAt\n      assignedMembers {\n        id\n        name\n        picture\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTeamTasks($teamId: ID!) {\n    tasks(teamId: $teamId) {\n      id\n      title\n      description\n      status\n      completed\n      startTime\n      endTime\n      createdAt\n      assignedMembers {\n        id\n        name\n        picture\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetTeamAttendance($teamId: ID!, $date: String!) {\n    attendanceByTeam(teamId: $teamId, date: $date) {\n      id\n      status\n      date\n      user {\n        id\n        name\n        picture\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTeamAttendance($teamId: ID!, $date: String!) {\n    attendanceByTeam(teamId: $teamId, date: $date) {\n      id\n      status\n      date\n      user {\n        id\n        name\n        picture\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetWeeklyAttendanceSummary($teamId: ID!, $week: String!) {\n    weeklyAttendanceSummary(teamId: $teamId, week: $week) {\n      week\n      startDate\n      endDate\n      students {\n        userId\n        userName\n        presentCount\n        approvalStatus\n        dailyRecords {\n          date\n          status\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetWeeklyAttendanceSummary($teamId: ID!, $week: String!) {\n    weeklyAttendanceSummary(teamId: $teamId, week: $week) {\n      week\n      startDate\n      endDate\n      students {\n        userId\n        userName\n        presentCount\n        approvalStatus\n        dailyRecords {\n          date\n          status\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetMyTeams {\n    myTeams {\n      id\n      name\n      leader {\n        id\n        name\n      }\n      members {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetMyTeams {\n    myTeams {\n      id\n      name\n      leader {\n        id\n        name\n      }\n      members {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateTask($teamId: ID!, $title: String!, $description: String, $assignedMemberIds: [ID!], $startTime: String, $endTime: String) {\n    createTask(teamId: $teamId, title: $title, description: $description, assignedMemberIds: $assignedMemberIds, startTime: $startTime, endTime: $endTime) {\n      id\n      title\n      status\n      completed\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTask($teamId: ID!, $title: String!, $description: String, $assignedMemberIds: [ID!], $startTime: String, $endTime: String) {\n    createTask(teamId: $teamId, title: $title, description: $description, assignedMemberIds: $assignedMemberIds, startTime: $startTime, endTime: $endTime) {\n      id\n      title\n      status\n      completed\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateTask($taskId: ID!, $title: String, $description: String, $completed: Boolean, $assignedMemberIds: [ID!], $startTime: String, $endTime: String) {\n    updateTask(taskId: $taskId, title: $title, description: $description, completed: $completed, assignedMemberIds: $assignedMemberIds, startTime: $startTime, endTime: $endTime) {\n      id\n      title\n      status\n      completed\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTask($taskId: ID!, $title: String, $description: String, $completed: Boolean, $assignedMemberIds: [ID!], $startTime: String, $endTime: String) {\n    updateTask(taskId: $taskId, title: $title, description: $description, completed: $completed, assignedMemberIds: $assignedMemberIds, startTime: $startTime, endTime: $endTime) {\n      id\n      title\n      status\n      completed\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateTaskStatus($taskId: ID!, $completed: Boolean!) {\n    updateTaskStatus(taskId: $taskId, completed: $completed) {\n      id\n      status\n      completed\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTaskStatus($taskId: ID!, $completed: Boolean!) {\n    updateTaskStatus(taskId: $taskId, completed: $completed) {\n      id\n      status\n      completed\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CheckIn($teamId: ID!, $status: String!, $excuse: String, $lat: Float, $long: Float) {\n    checkIn(teamId: $teamId, status: $status, excuse: $excuse, lat: $lat, long: $long) {\n      id\n      date\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation CheckIn($teamId: ID!, $status: String!, $excuse: String, $lat: Float, $long: Float) {\n    checkIn(teamId: $teamId, status: $status, excuse: $excuse, lat: $lat, long: $long) {\n      id\n      date\n      status\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateTeamProgress($teamId: ID!, $progress: Int!) {\n    updateTeamProgress(teamId: $teamId, progress: $progress) {\n      id\n      progress\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTeamProgress($teamId: ID!, $progress: Int!) {\n    updateTeamProgress(teamId: $teamId, progress: $progress) {\n      id\n      progress\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation AddTeamDocumentation($teamId: ID!, $name: String!, $url: String!, $type: String!) {\n    addTeamDocumentation(teamId: $teamId, name: $name, url: $url, type: $type) {\n      id\n      documentation {\n        name\n        url\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddTeamDocumentation($teamId: ID!, $name: String!, $url: String!, $type: String!) {\n    addTeamDocumentation(teamId: $teamId, name: $name, url: $url, type: $type) {\n      id\n      documentation {\n        name\n        url\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateProgram($title: String!, $description: String!, $startDate: String!, $endDate: String!) {\n    createProgram(title: $title, description: $description, startDate: $startDate, endDate: $endDate) {\n      id\n      title\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProgram($title: String!, $description: String!, $startDate: String!, $endDate: String!) {\n    createProgram(title: $title, description: $description, startDate: $startDate, endDate: $endDate) {\n      id\n      title\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetTaskDetails($id: ID!) {\n    task(id: $id) {\n      id\n      title\n      description\n      status\n      completed\n      startTime\n      endTime\n      createdAt\n      assignedMembers {\n        id\n        name\n        picture\n      }\n      completionFiles {\n        id\n        url\n        name\n      }\n      completedBy {\n        id\n        name\n      }\n      completedAt\n      updates {\n        id\n        notes\n        progress\n        createdAt\n        user {\n          id\n          name\n          picture\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTaskDetails($id: ID!) {\n    task(id: $id) {\n      id\n      title\n      description\n      status\n      completed\n      startTime\n      endTime\n      createdAt\n      assignedMembers {\n        id\n        name\n        picture\n      }\n      completionFiles {\n        id\n        url\n        name\n      }\n      completedBy {\n        id\n        name\n      }\n      completedAt\n      updates {\n        id\n        notes\n        progress\n        createdAt\n        user {\n          id\n          name\n          picture\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetTaskUpdates($taskId: ID!) {\n    taskUpdates(taskId: $taskId) {\n      id\n      notes\n      progress\n      createdAt\n      user {\n        id\n        name\n        picture\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTaskUpdates($taskId: ID!) {\n    taskUpdates(taskId: $taskId) {\n      id\n      notes\n      progress\n      createdAt\n      user {\n        id\n        name\n        picture\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateTaskWithFiles($taskId: ID!, $completed: Boolean, $completionFiles: [String!]) {\n    updateTask(taskId: $taskId, completed: $completed, completionFiles: $completionFiles) {\n      id\n      status\n      completed\n      completionFiles {\n        id\n        url\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTaskWithFiles($taskId: ID!, $completed: Boolean, $completionFiles: [String!]) {\n    updateTask(taskId: $taskId, completed: $completed, completionFiles: $completionFiles) {\n      id\n      status\n      completed\n      completionFiles {\n        id\n        url\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation AddTaskUpdate($taskId: ID!, $notes: String, $progress: Int) {\n    addTaskUpdate(taskId: $taskId, notes: $notes, progress: $progress) {\n      id\n      notes\n      progress\n      createdAt\n      user {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddTaskUpdate($taskId: ID!, $notes: String, $progress: Int) {\n    addTaskUpdate(taskId: $taskId, notes: $notes, progress: $progress) {\n      id\n      notes\n      progress\n      createdAt\n      user {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetTeamDetails($teamId: ID!) {\n    team(id: $teamId) {\n      id\n      name\n      leader {\n        id\n        name\n      }\n      members {\n        id\n        name\n        picture\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTeamDetails($teamId: ID!) {\n    team(id: $teamId) {\n      id\n      name\n      leader {\n        id\n        name\n      }\n      members {\n        id\n        name\n        picture\n      }\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;