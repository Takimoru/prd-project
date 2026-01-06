/**
 * Test Setup and Configuration
 * Per PRD Section: Testing & verification
 */

import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Program } from '../entities/Program';
import { Team } from '../entities/Team';

/**
 * Initialize test database
 */
export async function setupTestDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  
  // Clean all tables before tests
  await AppDataSource.dropDatabase();
  await AppDataSource.synchronize();
}

/**
 * Clean up test database
 */
export async function teardownTestDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}

/**
 * Seed test data
 */
export async function seedTestData() {
  const userRepo = AppDataSource.getRepository(User);
  const programRepo = AppDataSource.getRepository(Program);
  const teamRepo = AppDataSource.getRepository(Team);

  // Create test users
  const admin = userRepo.create({
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'admin',
    googleId: 'google_admin',
  });
  await userRepo.save(admin);

  const supervisor = userRepo.create({
    name: 'Supervisor User',
    email: 'supervisor@test.com',
    role: 'supervisor',
    googleId: 'google_supervisor',
    nidn: 'NIDN001',
  });
  await userRepo.save(supervisor);

  const leader = userRepo.create({
    name: 'Leader User',
    email: 'leader@test.com',
    role: 'student',
    googleId: 'google_leader',
    studentId: 'STU001',
  });
  await userRepo.save(leader);

  const member = userRepo.create({
    name: 'Member User',
    email: 'member@test.com',
    role: 'student',
    googleId: 'google_member',
    studentId: 'STU002',
  });
  await userRepo.save(member);

  // Create test program
  const program = programRepo.create({
    title: 'Test Program 2024',
    description: 'Test field study program',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    archived: false,
    createdBy: admin.id,
  });
  await programRepo.save(program);

  // Create test team
  const team = teamRepo.create({
    name: 'Test Team Alpha',
    programId: program.id,
    leaderId: leader.id,
    supervisorId: supervisor.id,
    progress: 0,
    members: [leader, member],
  });
  await teamRepo.save(team);

  return { admin, supervisor, leader, member, program, team };
}

/**
 * Create mock GraphQL context
 */
export function createMockContext(userId?: string, userEmail?: string, userRole?: string) {
  return {
    req: {} as any,
    res: {} as any,
    userId,
    userEmail,
    userRole,
    pubSub: {
      publish: jest.fn(),
      subscribe: jest.fn(),
      asyncIterator: jest.fn(),
    },
  };
}


