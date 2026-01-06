import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Program } from '../entities/Program';
import { Team } from '../entities/Team';

async function verify() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const programRepo = AppDataSource.getRepository(Program);
  const teamRepo = AppDataSource.getRepository(Team);

  const users = await userRepo.find();
  console.log('Users:', users.length);
  const programs = await programRepo.find();
  console.log('Programs:', programs.length);
  const teams = await teamRepo.find();
  console.log('Teams:', teams.length);

  if (users.length > 0 && programs.length > 0 && teams.length > 0) {
    console.log("Verification SUCCESS");
  } else {
    console.log("Verification FAILED");
  }

  await AppDataSource.destroy();
}

verify();
