import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Program } from "../entities/Program";
import { Team } from "../entities/Team";
import { Task } from "../entities/Task";
import { TaskUpdate } from "../entities/TaskUpdate";
import { TaskFile } from "../entities/TaskFile";
import { Registration } from "../entities/Registration";
import { Attendance } from "../entities/Attendance";
import { WeeklyReport } from "../entities/WeeklyReport";
import { Comment } from "../entities/Comment";
import { WorkProgram } from "../entities/WorkProgram";
import { WorkProgramProgress } from "../entities/WorkProgramProgress";
import { Activity } from "../entities/Activity";
import { WeeklyAttendanceApproval } from "../entities/WeeklyAttendanceApproval";
import * as fs from "fs";

async function checkDatabase() {
  const ds = new DataSource({
    type: "sqlite",
    database: "./database.sqlite",
    entities: [
        User,
        Program,
        Team,
        Task,
        TaskUpdate,
        TaskFile,
        Registration,
        Attendance,
        WeeklyReport,
        Comment,
        WorkProgram,
        WorkProgramProgress,
        Activity,
        WeeklyAttendanceApproval,
    ],
    synchronize: false,
  });

  let output = "";
  const log = (msg: string) => {
    output += msg + "\n";
  };

  try {
    await ds.initialize();
    
    const userRepo = ds.getRepository(User);
    const teamRepo = ds.getRepository(Team);

    const users = await userRepo.find();
    log("--- Users ---");
    users.forEach(u => log(`${u.id}: ${u.email} (${u.role})`));

    const teams = await teamRepo.find({
        relations: ["members", "leader", "supervisor", "program"]
    });
    log("\n--- Teams ---");
    if (teams.length === 0) {
        log("No teams found in database.");
    }
    teams.forEach(t => {
      log(`Team: ${t.name} (ID: ${t.id})`);
      log(`  Program: ${t.program?.title}`);
      log(`  Leader: ${t.leader?.email} (ID: ${t.leader?.id})`);
      log(`  Supervisor: ${t.supervisor?.email} (ID: ${t.supervisor?.id})`);
      log(`  Members (${t.members?.length || 0}):`);
      t.members?.forEach(m => log(`    - ${m.email} (ID: ${m.id})`));
    });

    fs.writeFileSync("./debug_output.txt", output);
    console.log("Results written to ./debug_output.txt");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    if (ds.isInitialized) await ds.destroy();
  }
}

checkDatabase();
