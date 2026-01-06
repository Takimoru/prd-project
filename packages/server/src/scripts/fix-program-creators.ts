import { AppDataSource } from "../data-source";
import { Program } from "../entities/Program";
import { User } from "../entities/User";

async function migrate() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const programRepo = AppDataSource.getRepository(Program);
    const userRepo = AppDataSource.getRepository(User);

    const programs = await programRepo.find({ relations: ['creator'] });
    console.log(`Found ${programs.length} programs to check.`);

    let fixedCount = 0;
    for (const program of programs) {
      if (!program.creator && program.createdBy) {
        console.log(`Fixing program: ${program.title} (${program.id})`);
        
        const user = await userRepo.findOne({ where: { id: program.createdBy } });
        if (user) {
          program.creator = user;
          await programRepo.save(program);
          fixedCount++;
        } else {
          console.warn(`Could not find creator user with ID: ${program.createdBy} for program ${program.id}`);
        }
      }
    }

    console.log(`Migration complete. Fixed ${fixedCount} programs.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
