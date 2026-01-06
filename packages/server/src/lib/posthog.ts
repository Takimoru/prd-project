import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

export const initPostHog = () => {
  if (process.env.POSTHOG_API_KEY) {
    client = new PostHog(
      process.env.POSTHOG_API_KEY,
      { host: process.env.POSTHOG_HOST || 'https://app.posthog.com' }
    );
    console.log('✅ PostHog initialized');
  } else {
    console.log('⚠️  PostHog API key not found, running in mock mode');
  }
};

export const capture = (distinctId: string, event: string, properties?: Record<string, any>) => {
  if (client) {
    client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      }
    });
  } else {
    console.log(`[PostHog Mock] ${distinctId} - ${event}`, properties);
  }
};

/**
 * PostHog Analytics Events per PRD
 * Track all role-specific actions for analytics
 */

// Admin Events (per PRD Section A.5)
export const trackProgramCreated = (userId: string, programId: string, programTitle: string) => {
  capture(userId, 'program_created', { programId, programTitle, role: 'admin' });
};

export const trackRegistrationApproved = (adminId: string, registrationId: string, userId: string) => {
  capture(adminId, 'registration_approved', { registrationId, userId, role: 'admin' });
};

export const trackProgramArchived = (adminId: string, programId: string) => {
  capture(adminId, 'program_archived', { programId, role: 'admin' });
};

export const trackExportPerformed = (adminId: string, exportType: string, programId?: string) => {
  capture(adminId, 'export_performed', { exportType, programId, role: 'admin' });
};

// Supervisor Events (per PRD Section B.5)
export const trackWeeklyReportReviewed = (supervisorId: string, reportId: string, teamId: string, status: string) => {
  capture(supervisorId, 'weekly_report_reviewed', { reportId, teamId, status, role: 'supervisor' });
};

export const trackReportApproved = (supervisorId: string, reportId: string, teamId: string) => {
  capture(supervisorId, 'report_approved', { reportId, teamId, role: 'supervisor' });
};

export const trackReportRejected = (supervisorId: string, reportId: string, teamId: string, reason?: string) => {
  capture(supervisorId, 'report_rejected', { reportId, teamId, reason, role: 'supervisor' });
};

// Team Leader Events (per PRD Section C.5)
export const trackWorkProgramCreated = (leaderId: string, workProgramId: string, teamId: string, title: string) => {
  capture(leaderId, 'work_program_created', { workProgramId, teamId, title, role: 'leader' });
};

export const trackTaskCreated = (leaderId: string, taskId: string, teamId: string, taskTitle: string, workProgramId?: string) => {
  capture(leaderId, 'task_created', { taskId, teamId, taskTitle, workProgramId, role: 'leader' });
};

export const trackWeeklySummarySubmitted = (leaderId: string, reportId: string, teamId: string, week: string) => {
  capture(leaderId, 'weekly_summary_submitted', { reportId, teamId, week, role: 'leader' });
};

// Member (Student) Events (per PRD Section D.5)
export const trackCheckin = (userId: string, teamId: string, date: string, status: string) => {
  capture(userId, 'checkin', { teamId, date, status, role: 'student' });
};

export const trackTaskUpdateSubmitted = (userId: string, taskId: string, teamId: string, progress?: number) => {
  capture(userId, 'task_update_submitted', { taskId, teamId, progress, role: 'student' });
};

export const trackFileUploaded = (userId: string, fileName: string, fileType: string, targetId: string, targetType: string) => {
  capture(userId, 'file_uploaded', { fileName, fileType, targetId, targetType, role: 'student' });
};

// Team Events
export const trackTeamCreated = (adminId: string, teamId: string, programId: string) => {
  capture(adminId, 'team_created', { teamId, programId, role: 'admin' });
};

export const trackTeamUpdated = (userId: string, teamId: string, changes: string) => {
  capture(userId, 'team_updated', { teamId, changes });
};

// Registration Events
export const trackRegistrationSubmitted = (email: string, programId: string, registrationId: string) => {
  capture(email, 'registration_submitted', { programId, registrationId });
};

export const trackRegistrationRejected = (adminId: string, registrationId: string, reason?: string) => {
  capture(adminId, 'registration_rejected', { registrationId, reason, role: 'admin' });
};
