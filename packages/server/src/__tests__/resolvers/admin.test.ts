/**
 * Admin Resolver Tests
 * Per PRD Section A: Admin Migration PRD - Task A6
 */

import { ProgramResolver } from '../../graphql/resolvers/program.resolver';
import { RegistrationResolver } from '../../graphql/resolvers/registration.resolver';
import { TeamResolver } from '../../graphql/resolvers/team.resolver';
import { setupTestDatabase, teardownTestDatabase, seedTestData, createMockContext } from '../setup';
import { AppDataSource } from '../../data-source';
import { Program } from '../../entities/Program';
import { Registration } from '../../entities/Registration';

describe('Admin Flows - Program Management', () => {
  let programResolver: ProgramResolver;
  let registrationResolver: RegistrationResolver;
  let teamResolver: TeamResolver;
  let testData: any;

  beforeAll(async () => {
    await setupTestDatabase();
    testData = await seedTestData();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(() => {
    programResolver = new ProgramResolver();
    registrationResolver = new RegistrationResolver();
    teamResolver = new TeamResolver();
  });

  describe('Program CRUD Operations', () => {
    it('should allow admin to create program', async () => {
      const ctx = createMockContext(testData.admin.id, testData.admin.email, 'admin');
      
      const program = await programResolver.createProgram(
        {
          title: 'New Program 2025',
          description: 'Test program for 2025',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        },
        ctx
      );

      expect(program).toBeDefined();
      expect(program.title).toBe('New Program 2025');
      expect(program.archived).toBe(false);
    });

    it('should allow admin to archive program', async () => {
      const ctx = createMockContext(testData.admin.id, testData.admin.email, 'admin');
      
      const archived = await programResolver.archiveProgram(testData.program.id, ctx);
      
      expect(archived).toBeDefined();
      expect(archived.archived).toBe(true);
    });

    it('should prevent non-admin from archiving program', async () => {
      const ctx = createMockContext(testData.member.id, testData.member.email, 'student');
      
      await expect(
        programResolver.archiveProgram(testData.program.id, ctx)
      ).rejects.toThrow('Only admins can archive programs');
    });

    it('should list all programs including archived when specified', async () => {
      const ctx = createMockContext(testData.admin.id, testData.admin.email, 'admin');
      
      const programs = await programResolver.programs(true, ctx);
      
      expect(programs).toBeDefined();
      expect(Array.isArray(programs)).toBe(true);
    });
  });

  describe('Registration Approval Flow', () => {
    let testRegistration: Registration;

    beforeEach(async () => {
      // Create a test registration
      const ctx = createMockContext();
      testRegistration = await registrationResolver.submitRegistration(
        {
          programId: testData.program.id,
          fullName: 'Test Student',
          studentId: 'STU999',
          email: 'newstudent@test.com',
          phone: '1234567890',
        },
        ctx
      );
    });

    it('should allow admin to approve registration', async () => {
      const ctx = createMockContext(testData.admin.id, testData.admin.email, 'admin');
      
      const approved = await registrationResolver.approveRegistration(testRegistration.id, ctx);
      
      expect(approved).toBeDefined();
      expect(approved.status).toBe('approved');
      expect(approved.reviewedById).toBe(testData.admin.id);
    });

    it('should allow admin to reject registration', async () => {
      const ctx = createMockContext(testData.admin.id, testData.admin.email, 'admin');
      
      const rejected = await registrationResolver.rejectRegistration(
        testRegistration.id,
        'Incomplete information',
        ctx
      );
      
      expect(rejected).toBeDefined();
      expect(rejected.status).toBe('rejected');
      expect(rejected.reviewNotes).toBe('Incomplete information');
    });

    it('should prevent non-admin from approving registration', async () => {
      const ctx = createMockContext(testData.member.id, testData.member.email, 'student');
      
      await expect(
        registrationResolver.approveRegistration(testRegistration.id, ctx)
      ).rejects.toThrow('Only admins can approve registrations');
    });

    it('should list pending registrations', async () => {
      const ctx = createMockContext(testData.admin.id, testData.admin.email, 'admin');
      
      const pending = await registrationResolver.pendingRegistrations(ctx);
      
      expect(pending).toBeDefined();
      expect(Array.isArray(pending)).toBe(true);
    });
  });

  describe('Team Management', () => {
    it('should allow admin to create team', async () => {
      const ctx = createMockContext(testData.admin.id, testData.admin.email, 'admin');
      
      const team = await teamResolver.createTeam(
        {
          programId: testData.program.id,
          leaderId: testData.leader.id,
          supervisorId: testData.supervisor.id,
          name: 'Test Team Beta',
          memberIds: [testData.leader.id, testData.member.id],
        },
        ctx
      );

      expect(team).toBeDefined();
      expect(team.name).toBe('Test Team Beta');
      expect(team.leaderId).toBe(testData.leader.id);
    });

    it('should allow admin to update team', async () => {
      const ctx = createMockContext(testData.admin.id, testData.admin.email, 'admin');
      
      const updated = await teamResolver.updateTeam(
        testData.team.id,
        { name: 'Updated Team Name', progress: 50 },
        ctx
      );

      expect(updated).toBeDefined();
      expect(updated.name).toBe('Updated Team Name');
      expect(updated.progress).toBe(50);
    });

    it('should prevent non-admin from creating team', async () => {
      const ctx = createMockContext(testData.member.id, testData.member.email, 'student');
      
      await expect(
        teamResolver.createTeam(
          {
            programId: testData.program.id,
            leaderId: testData.leader.id,
            memberIds: [testData.member.id],
          },
          ctx
        )
      ).rejects.toThrow('Only admins can create teams');
    });
  });
});

describe('Admin Flows - CSV Export', () => {
  // TODO: Implement CSV export tests when resolver is created
  it('should generate attendance CSV export', () => {
    expect(true).toBe(true); // Placeholder
  });
});


