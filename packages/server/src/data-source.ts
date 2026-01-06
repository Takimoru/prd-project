import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Program } from "./entities/Program";
import { Team } from "./entities/Team";
import { Task } from "./entities/Task";
import { TaskUpdate } from "./entities/TaskUpdate";
import { TaskFile } from "./entities/TaskFile";
import { Registration } from "./entities/Registration";
import { Attendance } from "./entities/Attendance";
import { WeeklyReport } from "./entities/WeeklyReport";
import { Comment } from "./entities/Comment";
import { WorkProgram } from "./entities/WorkProgram";
import { WorkProgramProgress } from "./entities/WorkProgramProgress";
import { Activity } from "./entities/Activity";
import { WeeklyAttendanceApproval } from "./entities/WeeklyAttendanceApproval";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_PATH || "./database.sqlite",
  synchronize: true, // Auto-create tables (dev only)
  logging: false,
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
  migrations: [],
  subscribers: [],
});
