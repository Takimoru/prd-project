import { DataSource } from "typeorm";
import { Program } from '../entities/Program';
import { User } from '../entities/User';
import { Team } from '../entities/Team';
import { Registration } from '../entities/Registration';

async function listPrograms(dbPath: string) {
  const ds = new DataSource({
    type: "sqlite",
    database: dbPath,
    entities: [Program, User, Team, Registration],
    synchronize: false,
  });

  try {
    await ds.initialize();
    const programRepo = ds.getRepository(Program);
    const programs = await programRepo.find();
    
    console.log(`--- Programs List for ${dbPath} ---`);
    programs.forEach(p => {
      console.log(`ID: ${p.id} | Title: ${p.title} | Archived: ${p.archived}`);
    });
    console.log('-----------------------------------');
  } catch (err) {
    console.log(`Error reading ${dbPath}: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    if (ds.isInitialized) await ds.destroy();
  }
}

async function run() {
  await listPrograms("./database.sqlite");
  await listPrograms("./prisma/dev.db");
}

run();
