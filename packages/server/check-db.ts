import { DataSource } from "typeorm";
import { FinalReport } from "./src/entities/FinalReport";
import { User } from "./src/entities/User"; // Minimal entities needed
import { Team } from "./src/entities/Team";
import { Program } from "./src/entities/Program";
import dotenv from "dotenv";

dotenv.config();

const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_PATH || "./database.sqlite",
  entities: [
    FinalReport,
    User,
    Team,
    Program
    // Add others if needed to avoid relation errors, but for checking schema of FinalReport, this might be enough if we don't init full connection?
    // Actually TypeORM needs all related entities usually.
  ],
  synchronize: false,
  logging: false,
});

async function check() {
  try {
    const Database = require('better-sqlite3');
    const db = new Database('./database.sqlite');
    
    console.log("Checking columns for final_report...");
    const info = db.prepare("PRAGMA table_info(final_report)").all();
    console.log(info);
    
  } catch (err) {
    console.error(err);
  }
}

check();
