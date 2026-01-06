import { Resolver, Query, Mutation, Arg, ID, Ctx } from 'type-graphql';
import { Registration } from '../../entities/Registration';
import { User } from '../../entities/User';
import { SubmitRegistrationInput } from '../inputs/RegistrationInputs';
import { Context } from '../context';
import { checkIsAdmin } from '../../lib/auth-helpers';
import { AppDataSource } from '../../data-source';
import { In } from 'typeorm';
import * as PostHog from '../../lib/posthog';

@Resolver(() => Registration)
export class RegistrationResolver {
  @Query(() => [Registration])
  async pendingRegistrations(@Ctx() ctx: Context): Promise<Registration[]> {
    const regRepo = AppDataSource.getRepository(Registration);
    return await regRepo.find({
      where: { status: 'pending' },
      relations: ['program', 'user', 'reviewedBy'],
      order: { submittedAt: 'DESC' },
    });
  }

  @Query(() => [Registration])
  async approvedRegistrations(@Ctx() ctx: Context): Promise<Registration[]> {
    const regRepo = AppDataSource.getRepository(Registration);
    return await regRepo.find({
      where: { status: 'approved' },
      relations: ['program', 'user', 'reviewedBy'],
      order: { submittedAt: 'DESC' },
    });
  }

  @Query(() => [Registration])
  async registrations(
    @Arg('programId', () => ID) programId: string,
    @Arg('status', { nullable: true }) status?: string,
    @Ctx() ctx?: Context
  ): Promise<Registration[]> {
    const regRepo = AppDataSource.getRepository(Registration);
    
    const where: any = { programId };
    if (status) {
      where.status = status;
    }

    return await regRepo.find({
      where,
      relations: ['program', 'user', 'reviewedBy'],
    });
  }

  @Mutation(() => Registration)
  async submitRegistration(
    @Arg('input') input: SubmitRegistrationInput,
    @Ctx() ctx: Context
  ): Promise<Registration> {
    const regRepo = AppDataSource.getRepository(Registration);
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check for existing active registrations
    const existing = await regRepo.find({
      where: [
        { email: normalizedEmail, status: 'pending' },
        { email: normalizedEmail, status: 'approved' },
      ],
    });

    if (existing.length > 0) {
      throw new Error(
        'You already have a registration in progress. Please wait for admin review.'
      );
    }

    const registration = regRepo.create({
      programId: input.programId,
      fullName: input.fullName,
      studentId: input.studentId,
      phone: input.phone,
      email: normalizedEmail,
      paymentProofUrl: input.paymentProofUrl,
      status: 'pending',
    });

    const saved = await regRepo.save(registration);

    // Track analytics: registration_submitted
    PostHog.trackRegistrationSubmitted(normalizedEmail, input.programId, saved.id);

    return await regRepo.findOne({
      where: { id: saved.id },
      relations: ['program'],
    }) as Registration;
  }

  @Mutation(() => Registration)
  async approveRegistration(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<Registration> {
    if (!ctx.userId && !ctx.userEmail) {
      throw new Error('Authentication required');
    }

    const userRepo = AppDataSource.getRepository(User);
    const regRepo = AppDataSource.getRepository(Registration);

    const admin = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!admin || !checkIsAdmin(admin)) {
      throw new Error('Only admins can approve registrations');
    }

    const registration = await regRepo.findOne({ where: { id } });

    if (!registration) {
      throw new Error('Registration not found');
    }

    // Update registration
    registration.status = 'approved';
    registration.reviewedById = admin.id;
    registration.reviewedAt = new Date();
    await regRepo.save(registration);

    // Find or create user
    let user = registration.userId
      ? await userRepo.findOne({ where: { id: registration.userId } })
      : null;

    if (!user && registration.email) {
      user = await userRepo.findOne({
        where: { email: registration.email },
      });
    }

    if (user) {
      // Update user role if needed
      if (user.role !== 'admin' && user.role !== 'supervisor' && user.role !== 'student') {
        user.role = 'student';
        user.studentId = registration.studentId || user.studentId;
        await userRepo.save(user);
      }

      // Link registration to user
      if (!registration.userId) {
        registration.userId = user.id;
        await regRepo.save(registration);
      }
    } else if (registration.email) {
      // Create new user account
      const newUser = userRepo.create({
        name: registration.fullName || registration.email.split('@')[0],
        email: registration.email,
        role: 'student',
        studentId: registration.studentId,
        googleId: `approved-${registration.id}`,
      });
      const savedUser = await userRepo.save(newUser);

      registration.userId = savedUser.id;
      await regRepo.save(registration);
      user = savedUser;
    }

    const updated = await regRepo.findOne({
      where: { id },
      relations: ['program', 'reviewedBy', 'user'],
    }) as Registration;

    // Track analytics: registration_approved (per PRD Section A.5)
    PostHog.trackRegistrationApproved(admin.id, updated.id, user?.id || '');

    return updated;
  }

  @Mutation(() => Registration)
  async rejectRegistration(
    @Arg('id', () => ID) id: string,
    @Arg('reviewNotes', { nullable: true }) reviewNotes?: string,
    @Ctx() ctx?: Context
  ): Promise<Registration> {
    if (!ctx?.userId && !ctx?.userEmail) {
      throw new Error('Authentication required');
    }

    const userRepo = AppDataSource.getRepository(User);
    const regRepo = AppDataSource.getRepository(Registration);

    const admin = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!admin || !checkIsAdmin(admin)) {
      throw new Error('Only admins can reject registrations');
    }

    const registration = await regRepo.findOne({ where: { id } });

    if (!registration) {
      throw new Error('Registration not found');
    }

    registration.status = 'rejected';
    registration.reviewedById = admin.id;
    registration.reviewedAt = new Date();
    registration.reviewNotes = reviewNotes;
    await regRepo.save(registration);

    // Track analytics: registration_rejected (per PRD Section A.5)
    PostHog.trackRegistrationRejected(admin.id, registration.id, reviewNotes);

    return await regRepo.findOne({
      where: { id },
      relations: ['program', 'reviewedBy'],
    }) as Registration;
  }
}
