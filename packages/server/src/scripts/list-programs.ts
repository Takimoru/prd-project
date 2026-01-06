import { AppDataSource } from '../data-source';
import { Program } from '../entities/Program';

async function listPrograms() {
  await AppDataSource.initialize();
  const programRepo = AppDataSource.getRepository(Program);
  const programs = await programRepo.find();
  
  console.log('--- Programs List ---');
  programs.forEach(p => {
    console.log(`ID: ${p.id} | Title: ${p.title} | Archived: ${p.archived} | CreatedAt: ${p.startDate}`);
  });
  console.log('---------------------');
  
  await AppDataSource.destroy();
}

listPrograms();
