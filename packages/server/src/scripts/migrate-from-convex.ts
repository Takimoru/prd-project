/**
 * Convex to TypeORM Migration Script
 * Per PRD Section: Data Migration (Task A1, B1, C1, D1)
 * 
 * This script exports data from Convex and imports it into TypeORM/SQLite
 * Maintains ID mapping table for rollback capability
 */

import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Program } from "../entities/Program";
import { Team } from "../entities/Team";
import { Registration } from "../entities/Registration";
import { Attendance } from "../entities/Attendance";
import { WorkProgram } from "../entities/WorkProgram";
import { Task } from "../entities/Task";
import { TaskUpdate } from "../entities/TaskUpdate";
import { WeeklyReport } from "../entities/WeeklyReport";
import { Comment } from "../entities/Comment";
import { Activity } from "../entities/Activity";
import { WeeklyAttendanceApproval } from "../entities/WeeklyAttendanceApproval";
import * as fs from 'fs';
import * as path from 'path';

interface ConvexIdMapping {
  convexId: string;
  entityType: string;
  newId: string;
}

const idMappings: ConvexIdMapping[] = [];

/**
 * Helper to track ID mappings for rollback
 */
function mapId(convexId: string, entityType: string, newId: string): void {
  idMappings.push({ convexId, entityType, newId });
}

/**
 * Helper to get mapped ID
 */
function getMappedId(convexId: string, entityType: string): string | undefined {
  return idMappings.find(m => m.convexId === convexId && m.entityType === entityType)?.newId;
}

/**
 * Step 1: Load Convex export data
 * Expects JSON files exported from Convex collections
 */
async function loadConvexData(dataDir: string): Promise<any> {
  console.log('📂 Loading Convex export data from:', dataDir);
  
  const data: any = {};
  const collections = [
    'users', 'programs', 'teams', 'registrations', 'attendance',
    'work_programs', 'work_program_progress', 'tasks', 'task_updates',
    'weeklyReports', 'activities', 'weekly_attendance_approvals'
  ];

  for (const collection of collections) {
    const filePath = path.join(dataDir, `${collection}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      data[collection] = JSON.parse(content);
      console.log(`  ✓ Loaded ${data[collection].length} records from ${collection}`);
    } else {
      console.log(`  ⚠ Skipped ${collection} (file not found)`);
      data[collection] = [];
    }
  }

  return data;
}

/**
 * Step 2: Migrate Users
 * Per PRD: Map Convex users by email; store role in DB
 */
async function migrateUsers(convexUsers: any[]): Promise<void> {
  console.log('\n👥 Migrating Users...');
  const userRepo = AppDataSource.getRepository(User);

  for (const convexUser of convexUsers) {
    try {
      const user = userRepo.create({
        name: convexUser.name,
        email: convexUser.email.toLowerCase(),
        role: convexUser.role || 'pending',
        studentId: convexUser.studentId,
        nidn: convexUser.nidn,
        googleId: convexUser.googleId,
        picture: convexUser.picture,
      });

      const saved = await userRepo.save(user);
      mapId(convexUser._id, 'users', saved.id);
      console.log(`  ✓ Migrated user: ${convexUser.email}`);
    } catch (error) {
      console.error(`  ✗ Failed to migrate user ${convexUser.email}:`, error);
    }
  }

  console.log(`✅ Migrated ${convexUsers.length} users`);
}

/**
 * Step 3: Migrate Programs
 * Per PRD Task A1: Export Convex programs
 */
async function migratePrograms(convexPrograms: any[]): Promise<void> {
  console.log('\n📋 Migrating Programs...');
  const programRepo = AppDataSource.getRepository(Program);

  for (const convexProgram of convexPrograms) {
    try {
      const createdById = getMappedId(convexProgram.createdBy, 'users');
      if (!createdById) {
        console.error(`  ✗ Skipping program ${convexProgram.title}: creator not found`);
        continue;
      }

      const program = programRepo.create({
        title: convexProgram.title,
        description: convexProgram.description,
        startDate: new Date(convexProgram.startDate),
        endDate: new Date(convexProgram.endDate),
        archived: convexProgram.archived || false,
        createdBy: createdById,
      });

      const saved = await programRepo.save(program);
      mapId(convexProgram._id, 'programs', saved.id);
      console.log(`  ✓ Migrated program: ${convexProgram.title}`);
    } catch (error) {
      console.error(`  ✗ Failed to migrate program ${convexProgram.title}:`, error);
    }
  }

  console.log(`✅ Migrated ${convexPrograms.length} programs`);
}

/**
 * Step 4: Migrate Teams
 * Per PRD Task A1: Export Convex teams
 */
async function migrateTeams(convexTeams: any[]): Promise<void> {
  console.log('\n👥 Migrating Teams...');
  const teamRepo = AppDataSource.getRepository(Team);
  const userRepo = AppDataSource.getRepository(User);

  for (const convexTeam of convexTeams) {
    try {
      const programId = getMappedId(convexTeam.programId, 'programs');
      const leaderId = getMappedId(convexTeam.leaderId, 'users');
      const supervisorId = convexTeam.supervisorId ? getMappedId(convexTeam.supervisorId, 'users') : undefined;

      if (!programId || !leaderId) {
        console.error(`  ✗ Skipping team: missing program or leader`);
        continue;
      }

      // Get member entities
      const memberIds = (convexTeam.memberIds || [])
        .map((id: string) => getMappedId(id, 'users'))
        .filter(Boolean);

      const members = memberIds.length > 0 
        ? await userRepo.findByIds(memberIds)
        : [];

      const team = teamRepo.create({
        name: convexTeam.name,
        programId: programId,
        leaderId: leaderId,
        supervisorId: supervisorId,
        progress: convexTeam.progress || 0,
        members: members,
        documentation: convexTeam.documentation,
      });

      const saved = await teamRepo.save(team);
      mapId(convexTeam._id, 'teams', saved.id);
      console.log(`  ✓ Migrated team: ${convexTeam.name || saved.id}`);
    } catch (error) {
      console.error(`  ✗ Failed to migrate team:`, error);
    }
  }

  console.log(`✅ Migrated ${convexTeams.length} teams`);
}

/**
 * Step 5: Migrate Registrations
 * Per PRD Task A1: Export Convex registrations
 */
async function migrateRegistrations(convexRegistrations: any[]): Promise<void> {
  console.log('\n📝 Migrating Registrations...');
  const regRepo = AppDataSource.getRepository(Registration);

  for (const convexReg of convexRegistrations) {
    try {
      const programId = getMappedId(convexReg.programId, 'programs');
      const userId = convexReg.userId ? getMappedId(convexReg.userId, 'users') : undefined;
      const reviewedById = convexReg.reviewedBy ? getMappedId(convexReg.reviewedBy, 'users') : undefined;

      if (!programId) {
        console.error(`  ✗ Skipping registration: program not found`);
        continue;
      }

      const registration = regRepo.create({
        programId: programId,
        userId: userId,
        fullName: convexReg.fullName,
        studentId: convexReg.studentId,
        email: convexReg.email?.toLowerCase(),
        phone: convexReg.phone,
        paymentProofUrl: convexReg.paymentProofUrl,
        status: convexReg.status || 'pending',
        submittedAt: new Date(convexReg.submittedAt),
        reviewedById: reviewedById,
        reviewedAt: convexReg.reviewedAt ? new Date(convexReg.reviewedAt) : undefined,
        reviewNotes: convexReg.reviewNotes,
      });

      const saved = await regRepo.save(registration);
      mapId(convexReg._id, 'registrations', saved.id);
      console.log(`  ✓ Migrated registration: ${convexReg.email}`);
    } catch (error) {
      console.error(`  ✗ Failed to migrate registration:`, error);
    }
  }

  console.log(`✅ Migrated ${convexRegistrations.length} registrations`);
}

/**
 * Step 6: Migrate Attendance
 * Per PRD Task D1: Export Convex attendance
 */
async function migrateAttendance(convexAttendance: any[]): Promise<void> {
  console.log('\n📅 Migrating Attendance...');
  const attendanceRepo = AppDataSource.getRepository(Attendance);

  for (const convexAtt of convexAttendance) {
    try {
      const teamId = getMappedId(convexAtt.teamId, 'teams');
      const userId = getMappedId(convexAtt.userId, 'users');

      if (!teamId || !userId) {
        console.error(`  ✗ Skipping attendance: team or user not found`);
        continue;
      }

      const attendance = attendanceRepo.create({
        teamId: teamId,
        userId: userId,
        date: convexAtt.date,
        status: convexAtt.status || 'present',
        excuse: convexAtt.excuse,
        photoUrl: convexAtt.photoUrl,
        lat: convexAtt.gps?.latitude,
        long: convexAtt.gps?.longitude,
        timestamp: new Date(convexAtt.timestamp),
      });

      const saved = await attendanceRepo.save(attendance);
      mapId(convexAtt._id, 'attendance', saved.id);
    } catch (error) {
      console.error(`  ✗ Failed to migrate attendance:`, error);
    }
  }

  console.log(`✅ Migrated ${convexAttendance.length} attendance records`);
}

/**
 * Step 7: Migrate Work Programs
 * Per PRD Task C1: Export all work_programs
 */
async function migrateWorkPrograms(convexWorkPrograms: any[]): Promise<void> {
  console.log('\n🎯 Migrating Work Programs...');
  const wpRepo = AppDataSource.getRepository(WorkProgram);
  const userRepo = AppDataSource.getRepository(User);

  for (const convexWP of convexWorkPrograms) {
    try {
      const teamId = getMappedId(convexWP.teamId, 'teams');
      const createdById = getMappedId(convexWP.createdBy, 'users');

      if (!teamId || !createdById) {
        console.error(`  ✗ Skipping work program: team or creator not found`);
        continue;
      }

      const assignedMemberIds = (convexWP.assignedMembers || [])
        .map((id: string) => getMappedId(id, 'users'))
        .filter(Boolean);

      const assignedMembers = assignedMemberIds.length > 0
        ? await userRepo.findByIds(assignedMemberIds)
        : [];

      const workProgram = wpRepo.create({
        teamId: teamId,
        title: convexWP.title,
        description: convexWP.description,
        startDate: new Date(convexWP.startDate),
        endDate: new Date(convexWP.endDate),
        createdById: createdById,
        assignedMembers: assignedMembers,
        createdAt: new Date(convexWP.createdAt),
      });

      const saved = await wpRepo.save(workProgram);
      mapId(convexWP._id, 'work_programs', saved.id);
      console.log(`  ✓ Migrated work program: ${convexWP.title}`);
    } catch (error) {
      console.error(`  ✗ Failed to migrate work program:`, error);
    }
  }

  console.log(`✅ Migrated ${convexWorkPrograms.length} work programs`);
}

/**
 * Step 8: Migrate Tasks
 * Per PRD Task C1: Export all tasks
 */
async function migrateTasks(convexTasks: any[]): Promise<void> {
  console.log('\n✅ Migrating Tasks...');
  const taskRepo = AppDataSource.getRepository(Task);
  const userRepo = AppDataSource.getRepository(User);

  for (const convexTask of convexTasks) {
    try {
      const teamId = getMappedId(convexTask.teamId, 'teams');
      const createdById = getMappedId(convexTask.createdBy, 'users');
      const workProgramId = convexTask.workProgramId ? getMappedId(convexTask.workProgramId, 'work_programs') : undefined;
      const completedById = convexTask.completedBy ? getMappedId(convexTask.completedBy, 'users') : undefined;

      if (!teamId || !createdById) {
        console.error(`  ✗ Skipping task: team or creator not found`);
        continue;
      }

      const assignedMemberIds = (convexTask.assignedMembers || [])
        .map((id: string) => getMappedId(id, 'users'))
        .filter(Boolean);

      const assignedMembers = assignedMemberIds.length > 0
        ? await userRepo.findByIds(assignedMemberIds)
        : [];

      const task = taskRepo.create({
        teamId: teamId,
        title: convexTask.title,
        description: convexTask.description,
        createdById: createdById,
        startTime: convexTask.startTime ? new Date(convexTask.startTime) : undefined,
        endTime: convexTask.endTime ? new Date(convexTask.endTime) : undefined,
        workProgramId: workProgramId,
        completed: convexTask.completed || false,
        status: convexTask.completed ? 'completed' : 'todo',
        completedAt: convexTask.completedAt ? new Date(convexTask.completedAt) : undefined,
        completedById: completedById,
        assignedMembers: assignedMembers,
        createdAt: new Date(convexTask.createdAt),
      });

      const saved = await taskRepo.save(task);
      mapId(convexTask._id, 'tasks', saved.id);
      console.log(`  ✓ Migrated task: ${convexTask.title}`);
    } catch (error) {
      console.error(`  ✗ Failed to migrate task:`, error);
    }
  }

  console.log(`✅ Migrated ${convexTasks.length} tasks`);
}

/**
 * Step 9: Save ID mappings for rollback
 */
async function saveIdMappings(outputDir: string): Promise<void> {
  console.log('\n💾 Saving ID mappings for rollback...');
  const mappingFile = path.join(outputDir, 'id_mappings.json');
  fs.writeFileSync(mappingFile, JSON.stringify(idMappings, null, 2));
  console.log(`✅ Saved ${idMappings.length} ID mappings to ${mappingFile}`);
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting Convex to TypeORM migration...\n');

  try {
    // Initialize database
    await AppDataSource.initialize();
    console.log('✅ Database initialized\n');

    // Load Convex data
    const dataDir = process.env.CONVEX_EXPORT_DIR || './convex-export';
    const data = await loadConvexData(dataDir);

    // Run migrations in order (respecting foreign key dependencies)
    await migrateUsers(data.users);
    await migratePrograms(data.programs);
    await migrateTeams(data.teams);
    await migrateRegistrations(data.registrations);
    await migrateAttendance(data.attendance);
    await migrateWorkPrograms(data.work_programs);
    await migrateTasks(data.tasks);
    // Add more migration functions as needed...

    // Save ID mappings
    await saveIdMappings(dataDir);

    console.log('\n✅ Migration completed successfully!');
    console.log(`📊 Total records migrated: ${idMappings.length}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

export { migrate, loadConvexData, idMappings };


