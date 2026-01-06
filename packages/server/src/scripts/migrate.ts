import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Program } from '../entities/Program';
import { Team } from '../entities/Team';
import { Registration } from '../entities/Registration';
import { Attendance } from '../entities/Attendance';

const DATA_DIR = path.join(__dirname, '../../../data'); // Adjust as needed
const SNAPSHOT_FILE = path.join(DATA_DIR, 'convex-snapshot.json');

async function migrate() {
  console.log('Starting migration...');
  
  if (!fs.existsSync(SNAPSHOT_FILE)) {
    console.error(`Snapshot file not found at ${SNAPSHOT_FILE}`);
    console.log('Please place your Convex export JSON at backend/data/convex-snapshot.json');
    return;
  }

  await AppDataSource.initialize();

  const data = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));

  const userRepo = AppDataSource.getRepository(User);
  const programRepo = AppDataSource.getRepository(Program);
  const teamRepo = AppDataSource.getRepository(Team);
  const regRepo = AppDataSource.getRepository(Registration);
  const attendanceRepo = AppDataSource.getRepository(Attendance);

  // 1. Users
  if (data.users) {
    console.log(`Migrating ${data.users.length} users...`);
    for (const user of data.users) {
      const entity = userRepo.create({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        nidn: user.nidn,
        googleId: user.googleId,
        picture: user.picture,
      });
      await userRepo.save(entity);
    }
  }

  // 2. Programs
  if (data.programs) {
    console.log(`Migrating ${data.programs.length} programs...`);
    for (const prog of data.programs) {
      const entity = programRepo.create({
        id: prog._id,
        title: prog.title,
        description: prog.description,
        startDate: new Date(prog.startDate),
        endDate: new Date(prog.endDate),
        archived: prog.archived || false,
        createdBy: prog.createdBy,
      });
      await programRepo.save(entity);
    }
  }

  // 3. Teams
  if (data.teams) {
    console.log(`Migrating ${data.teams.length} teams...`);
    for (const team of data.teams) {
      const members = team.memberIds
        ? await userRepo.findByIds(team.memberIds)
        : [];
      
      const entity = teamRepo.create({
        id: team._id,
        programId: team.programId,
        leaderId: team.leaderId,
        supervisorId: team.supervisorId,
        name: team.name,
        progress: team.progress || 0,
        members: members,
      });
      await teamRepo.save(entity);
    }
  }

  // 4. Registrations
  if (data.registrations) {
    console.log(`Migrating ${data.registrations.length} registrations...`);
    for (const reg of data.registrations) {
      const entity = regRepo.create({
        id: reg._id,
        programId: reg.programId,
        userId: reg.userId,
        fullName: reg.fullName,
        studentId: reg.studentId,
        phone: reg.phone,
        email: reg.email,
        paymentProofUrl: reg.paymentProofUrl,
        status: reg.status,
        reviewNotes: reg.reviewNotes || reg.rejectionReason,
      });
      await regRepo.save(entity);
    }
  }

  // 5. Attendance
  if (data.attendance) {
    console.log(`Migrating ${data.attendance.length} attendance records...`);
    for (const att of data.attendance) {
      const entity = attendanceRepo.create({
        id: att._id,
        teamId: att.teamId,
        userId: att.userId,
        date: att.date,
        status: att.status,
        excuse: att.excuse,
        photoUrl: att.photoUrl,
        lat: att.gps?.latitude,
        long: att.gps?.longitude,
      });
      await attendanceRepo.save(entity);
    }
  }

  console.log('Migration complete!');
  await AppDataSource.destroy();
}

migrate().catch(console.error);
