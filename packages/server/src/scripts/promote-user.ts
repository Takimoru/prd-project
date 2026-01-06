import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

async function promote() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const email = 'nicolastzakis@students.universitasmulia.ac.id';
  
  const user = await userRepo.findOne({
    where: { email },
  });

  if (user) {
    console.log('User found, promoting to admin...');
    user.role = 'admin';
    await userRepo.save(user);
    console.log('User promoted successfully.');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('User NOT found with email:', email);
  }

  await AppDataSource.destroy();
}

promote().catch(console.error);
