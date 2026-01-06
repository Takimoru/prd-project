import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

async function check() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const email = 'nicolastzakis@students.universitasmulia.ac.id';
  
  const user = await userRepo.findOne({
    where: { email },
  });

  if (user) {
    console.log('User found:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('User NOT found with email:', email);
    
    // Check for similar emails
    const allUsers = await userRepo.find();
    const similar = allUsers.filter(u => u.email.toLowerCase().includes('nicolastzakis'));
    if (similar.length > 0) {
      console.log('Similar users found:');
      console.log(JSON.stringify(similar, null, 2));
    }
  }

  await AppDataSource.destroy();
}

check().catch(console.error);
