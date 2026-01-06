/**
 * Supervisor Resolver Tests
 * Per PRD Section B: Supervisor Migration PRD - Task B5
 */

import { WeeklyReportResolver } from '../../graphql/resolvers/weeklyReport.resolver';
import { AttendanceResolver } from '../../graphql/resolvers/attendance.resolver';
import { setupTestDatabase, teardownTestDatabase, seedTestData, createMockContext } from '../setup';
import { AppDataSource } from '../../data-source';
import { WeeklyReport } from '../../entities/WeeklyReport';

describe('Supervisor Flows - Weekly Report Review', () => {
  let reportResolver: WeeklyReportResolver;
  let attendanceResolver: AttendanceResolver;
  let testData: any;
  let testReport: WeeklyReport;

  beforeAll(async () => {
    await setupTestDatabase();
    testData = await seedTestData();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    reportResolver = new WeeklyReportResolver();
    attendanceResolver = new AttendanceResolver();

    // Create a test weekly report
    const leaderCtx = createMockContext(testData.leader.id, testData.leader.email, 'student');
    testReport = await reportResolver.submitWeeklySummary(
      {
        teamId: testData.team.id,
        week: '2024-W01',
        description: 'First week progress',
        progressPercentage: 25,
      },
      leaderCtx
    );
  });

  describe('Review Queue', () => {
    it('should show weekly reports for supervised teams', async () => {
      const ctx = createMockContext(testData.supervisor.id, testData.supervisor.email, 'supervisor');
      
      const reports = await reportResolver.myTeamWeeklyReports(ctx);
      
      expect(reports).toBeDefined();
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThan(0);
    });

    it('should show only submitted reports in review queue', async () => {
      const ctx = createMockContext(testData.supervisor.id, testData.supervisor.email, 'supervisor');
      
      const queue = await reportResolver.weeklyReviewQueue(ctx);
      
      expect(queue).toBeDefined();
      expect(Array.isArray(queue)).toBe(true);
      
      // All reports in queue should be 'submitted'
      queue.forEach(report => {
        expect(report.status).toBe('submitted');
      });
    });

    it('should not show reports from non-supervised teams', async () => {
      // Create another supervisor
      const userRepo = AppDataSource.getRepository('User');
      const otherSupervisor = await userRepo.create({
        name: 'Other Supervisor',
        email: 'other@test.com',
        role: 'supervisor',
        googleId: 'google_other',
      });
      await userRepo.save(otherSupervisor);

      const ctx = createMockContext(otherSupervisor.id, otherSupervisor.email, 'supervisor');
      
      const reports = await reportResolver.myTeamWeeklyReports(ctx);
      
      expect(reports).toBeDefined();
      expect(reports.length).toBe(0);
    });
  });

  describe('Report Approval', () => {
    it('should allow supervisor to approve weekly report', async () => {
      const ctx = createMockContext(testData.supervisor.id, testData.supervisor.email, 'supervisor');
      
      const approved = await reportResolver.approveWeeklyReport(testReport.id, ctx);
      
      expect(approved).toBeDefined();
      expect(approved.status).toBe('approved');
    });

    it('should allow supervisor to reject weekly report with feedback', async () => {
      const ctx = createMockContext(testData.supervisor.id, testData.supervisor.email, 'supervisor');
      
      const rejected = await reportResolver.rejectWeeklyReport(
        {
          reportId: testReport.id,
          comment: 'Please provide more details',
        },
        ctx
      );
      
      expect(rejected).toBeDefined();
      expect(rejected.status).toBe('revision_requested');
      expect(rejected.comments).toBeDefined();
      expect(rejected.comments.length).toBeGreaterThan(0);
    });

    it('should prevent non-supervisor from approving reports', async () => {
      const ctx = createMockContext(testData.member.id, testData.member.email, 'student');
      
      await expect(
        reportResolver.approveWeeklyReport(testReport.id, ctx)
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should prevent supervisor from approving other team reports', async () => {
      // Create another supervisor and team
      const userRepo = AppDataSource.getRepository('User');
      const teamRepo = AppDataSource.getRepository('Team');
      
      const otherSupervisor = await userRepo.create({
        name: 'Other Supervisor',
        email: 'other@test.com',
        role: 'supervisor',
        googleId: 'google_other',
      });
      await userRepo.save(otherSupervisor);

      const ctx = createMockContext(otherSupervisor.id, otherSupervisor.email, 'supervisor');
      
      await expect(
        reportResolver.approveWeeklyReport(testReport.id, ctx)
      ).rejects.toThrow('Only the team supervisor can approve reports');
    });
  });

  describe('Feedback Management', () => {
    it('should allow supervisor to add feedback comments', async () => {
      const ctx = createMockContext(testData.supervisor.id, testData.supervisor.email, 'supervisor');
      
      const comment = await reportResolver.addWeeklyReportFeedback(
        {
          reportId: testReport.id,
          comment: 'Good progress, keep it up!',
        },
        ctx
      );
      
      expect(comment).toBeDefined();
      expect(comment.text).toBe('Good progress, keep it up!');
      expect(comment.authorId).toBe(testData.supervisor.id);
    });
  });
});

describe('Supervisor Flows - Attendance Review', () => {
  let attendanceResolver: AttendanceResolver;
  let testData: any;

  beforeAll(async () => {
    await setupTestDatabase();
    testData = await seedTestData();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(() => {
    attendanceResolver = new AttendanceResolver();
  });

  it('should view weekly attendance summary for supervised team', async () => {
    const ctx = createMockContext(testData.supervisor.id, testData.supervisor.email, 'supervisor');
    
    const summary = await attendanceResolver.weeklyAttendanceSummary(
      testData.team.id,
      '2024-W01',
      ctx
    );
    
    expect(summary).toBeDefined();
    expect(summary.teamId).toBe(testData.team.id);
    expect(summary.students).toBeDefined();
    expect(Array.isArray(summary.students)).toBe(true);
  });
});


