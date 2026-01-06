import { Resolver, Query, Mutation, Arg, Ctx } from 'type-graphql';
import { User } from '../../entities/User';
import { Registration } from '../../entities/Registration';
import { CreateOrUpdateUserInput } from '../inputs/AuthInputs';
import { Context } from '../context';
import { checkIsAdmin } from '../../lib/auth-helpers';
import { AppDataSource } from '../../data-source';

@Resolver(() => User)
export class AuthResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: Context): Promise<User | null> {
    console.log('[AuthResolver] me called', { userId: ctx.userId, userEmail: ctx.userEmail });
    if (!ctx.userId && !ctx.userEmail) {
      console.log('[AuthResolver] me: no user identifying info in context');
      return null;
    }

    const userRepo = AppDataSource.getRepository(User);
    let user = null;

    // Try to get user by email first (from Clerk or session)
    if (ctx.userEmail) {
      user = await userRepo.findOne({
        where: { email: ctx.userEmail },
      });
      console.log('[AuthResolver] me: found user by email?', !!user);
    }

    // Fallback to userId
    if (!user && ctx.userId) {
      user = await userRepo.findOne({
        where: { id: ctx.userId },
      });
      console.log('[AuthResolver] me: found user by id?', !!user);
    }

    if (!user) {
      console.log('[AuthResolver] me: no user found in DB');
      return null;
    }

    // Check admin status
    if (ctx.userEmail && checkIsAdmin(user, ctx.userEmail) && user.role !== 'admin') {
      // Return user with admin role (will be updated on next login)
      console.log('[AuthResolver] me: user matched as admin via helper, overriding role');
      return { ...user, role: 'admin' } as User;
    }

    console.log('[AuthResolver] me: returning user with role:', user.role);
    return user;
  }

  @Mutation(() => User)
  async syncUser(
    @Arg('input') input: CreateOrUpdateUserInput,
    @Ctx() ctx: Context
  ): Promise<User> {
    console.log('[AuthResolver] syncUser called', { email: input.email });
    const userRepo = AppDataSource.getRepository(User);
    const registrationRepo = AppDataSource.getRepository(Registration);
    
    const normalizedEmail = input.email.toLowerCase();
    const shouldBeAdmin = checkIsAdmin(null, input.email);
    console.log('[AuthResolver] syncUser: shouldBeAdmin?', shouldBeAdmin);

    // Check for matching registration
    const matchingRegistration = await registrationRepo.findOne({
      where: { email: normalizedEmail },
      order: { submittedAt: 'DESC' },
    });

    const registrationRole =
      matchingRegistration?.status === 'approved'
        ? 'student'
        : matchingRegistration?.status === 'pending'
        ? 'pending'
        : undefined;

    const existingUser = await userRepo.findOne({
      where: { email: input.email },
    });

    if (existingUser) {
      console.log('[AuthResolver] syncUser: existing user found with role:', existingUser.role);
      // Update existing user
      const finalRole = shouldBeAdmin
        ? 'admin'
        : existingUser.role === 'supervisor'
        ? 'supervisor'
        : registrationRole === 'student'
        ? 'student'
        : registrationRole === 'pending' &&
          (existingUser.role === 'pending' || !existingUser.role)
        ? 'pending'
        : input.role || existingUser.role;

      console.log('[AuthResolver] syncUser: resolved final role:', finalRole);

      existingUser.name = input.name;
      existingUser.googleId = input.googleId;
      existingUser.picture = input.picture;
      existingUser.role = finalRole;
      existingUser.studentId = existingUser.studentId || matchingRegistration?.studentId;

      const updated = await userRepo.save(existingUser);

      // Link registration if needed
      if (matchingRegistration && matchingRegistration.userId !== updated.id) {
        matchingRegistration.userId = updated.id;
        await registrationRepo.save(matchingRegistration);
      }

      return updated;
    }

    // Create new user
    const defaultRole = shouldBeAdmin
      ? 'admin'
      : registrationRole
      ? registrationRole
      : input.role || 'pending';

    console.log('[AuthResolver] syncUser: creating new user with role:', defaultRole);

    const newUser = userRepo.create({
      name: input.name,
      email: input.email,
      googleId: input.googleId,
      picture: input.picture,
      role: defaultRole,
      studentId: input.studentId || matchingRegistration?.studentId,
    });

    const savedUser = await userRepo.save(newUser);

    // Link registration if needed
    if (matchingRegistration) {
      matchingRegistration.userId = savedUser.id;
      await registrationRepo.save(matchingRegistration);
    }

    return savedUser;
  }

  @Query(() => Boolean)
  async isAdmin(@Arg('email', { nullable: true }) email: string, @Ctx() ctx: Context): Promise<boolean> {
    if (!email && !ctx.userEmail) return false;
    const emailToCheck = email || ctx.userEmail || '';

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { email: emailToCheck },
    });

    return user?.role === 'admin' || checkIsAdmin(user, emailToCheck);
  }
}
