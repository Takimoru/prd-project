import { Resolver, Query, Arg, ID, Ctx, Mutation, FieldResolver, Root } from "type-graphql";
import { User } from "../../entities/User";
import { Attendance } from "../../entities/Attendance";
import { Registration } from "../../entities/Registration";
import { Context } from "../context";
import { AppDataSource } from "../../data-source";
import { Like } from "typeorm";
import { requireAdminRole } from "../../lib/auth-helpers";
import { debugLog } from "../../lib/debug-logger";
import {
  CreateSupervisorInput,
  UpdateSupervisorInput,
} from "../inputs/UserInputs";

@Resolver(() => User)
export class UserResolver {
  @Query(() => [User])
  async users(
    @Arg("role", { nullable: true }) role?: string,
    @Ctx() ctx?: Context
  ): Promise<User[]> {
    const userRepo = AppDataSource.getRepository(User);

    if (role) {
      return await userRepo.find({
        where: { role },
        order: { name: "ASC" },
      });
    }

    return await userRepo.find({
      order: { name: "ASC" },
    });
  }

  @Query(() => User, { nullable: true })
  async user(
    @Arg("id", () => ID) id: string,
    @Ctx() ctx?: Context
  ): Promise<User | null> {
    const userRepo = AppDataSource.getRepository(User);
    return await userRepo.findOne({ where: { id } });
  }

  @FieldResolver(() => [Attendance])
  async attendance(
    @Root() user: User,
    @Arg('startDate', { nullable: true }) startDate?: string,
    @Arg('endDate', { nullable: true }) endDate?: string,
  ): Promise<Attendance[]> {
    debugLog(`[UserResolver] attendance called for user ${user.id} (${startDate} to ${endDate})`);
    try {
      const attendanceRepo = AppDataSource.getRepository(Attendance);
      
      let query = attendanceRepo
        .createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.team', 'team')
        .leftJoinAndSelect('attendance.user', 'attendanceUser')
        .where('attendance.userId = :userId', { userId: user.id })
        .orderBy('attendance.date', 'DESC');

      if (startDate && endDate) {
        query = query
          .andWhere('attendance.date >= :startDate', { startDate })
          .andWhere('attendance.date <= :endDate', { endDate });
      }

      const records = await query.getMany();
      debugLog(`[UserResolver] attendance: Found ${records.length} records`);
      return records.filter(r => r && r.team); // Filter out records with broken team relation
    } catch (error: any) {
      debugLog(`[UserResolver] attendance ERROR: ${error.message}`);
      console.error('[UserResolver] attendance error:', error);
      throw error;
    }
  }

  @FieldResolver(() => [Registration])
  async registrations(
    @Root() user: User
  ): Promise<Registration[]> {
    debugLog(`[UserResolver] registrations called for user ${user.id}`);
    try {
      const registrationRepo = AppDataSource.getRepository(Registration);
      const records = await registrationRepo.find({
        where: { userId: user.id },
        relations: ['program'],
        order: { submittedAt: 'DESC' }
      });
      debugLog(`[UserResolver] registrations: Found ${records.length} records`);
      return records;
    } catch (error: any) {
      debugLog(`[UserResolver] registrations ERROR: ${error.message}`);
      console.error('[UserResolver] registrations error:', error);
      throw error;
    }
  }

  @Query(() => [User])
  async searchUsers(
    @Arg("searchTerm") searchTerm: string,
    @Ctx() ctx?: Context
  ): Promise<User[]> {
    const userRepo = AppDataSource.getRepository(User);

    return await userRepo.find({
      where: [
        { name: Like(`%${searchTerm}%`) },
        { email: Like(`%${searchTerm}%`) },
        { studentId: Like(`%${searchTerm}%`) },
      ],
      take: 20,
    });
  }

  @Query(() => [User])
  async studentsByProgram(
    @Arg("programId", () => ID) programId: string,
    @Ctx() ctx?: Context
  ): Promise<User[]> {
    const userRepo = AppDataSource.getRepository(User);

    // Query users who have approved registrations for this program
    const students = await userRepo
      .createQueryBuilder("user")
      .innerJoin("user.registrations", "registration")
      .where("registration.programId = :programId", { programId })
      .andWhere("registration.status = :status", { status: "approved" })
      .getMany();

    return students;
  }

  @Mutation(() => User)
  async syncUser(
    @Arg("email") email: string,
    @Arg("name") name: string,
    @Arg("googleId") googleId: string,
    @Arg("picture", { nullable: true }) picture?: string,
    @Ctx() ctx?: Context
  ): Promise<User> {
    const userRepo = AppDataSource.getRepository(User);

    let user = await userRepo.findOne({ where: { email } });

    if (user) {
      // Update existing user
      user.name = name;
      user.googleId = googleId;
      if (picture) user.picture = picture;
      return await userRepo.save(user);
    } else {
      // Create new user
      const newUser = userRepo.create({
        email,
        name,
        googleId,
        picture,
        role: "pending",
      });
      return await userRepo.save(newUser);
    }
  }

  @Mutation(() => User)
  async createSupervisor(
    @Arg("input") input: CreateSupervisorInput,
    @Ctx() ctx: Context
  ): Promise<User> {
    console.log(`[UserResolver] createSupervisor called by ${ctx.userEmail} (Role: ${ctx.userRole})`);
    requireAdminRole(ctx);

    const userRepo = AppDataSource.getRepository(User);

    // Check if user with email already exists
    const existingUser = await userRepo.findOne({
      where: { email: input.email },
    });
    if (existingUser) {
      console.log(`[UserResolver] createSupervisor: User ${input.email} already exists`);
      const error = new Error("User with this email already exists");
      (error as any).extensions = { code: "BAD_USER_INPUT" };
      throw error;
    }

    // Validate email domain
    if (!input.email.endsWith("@universitasmulia.ac.id")) {
      const error = new Error("Email must be a valid @universitasmulia.ac.id address");
      (error as any).extensions = { code: "BAD_USER_INPUT" };
      throw error;
    }

    // Generate a unique googleId for supervisor (since they don't use Google OAuth)
    // Note: Password is not stored in User entity, supervisors will use email-based auth
    const googleId = `supervisor_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    console.log(`[UserResolver] createSupervisor: Creating new supervisor ${input.email} with googleId ${googleId}`);
    
    const supervisor = userRepo.create({
      email: input.email,
      name: input.name,
      nidn: input.nidn,
      role: "supervisor",
      googleId,
    });

    try {
      const saved = await userRepo.save(supervisor);
      console.log(`[UserResolver] createSupervisor: Success saved ID ${saved.id}`);
      return saved;
    } catch (dbError) {
      console.error('[UserResolver] createSupervisor: DB Error', dbError);
      throw dbError;
    }
  }

  @Mutation(() => User)
  async updateSupervisor(
    @Arg("id", () => ID) id: string,
    @Arg("input") input: UpdateSupervisorInput,
    @Ctx() ctx: Context
  ): Promise<User> {
    requireAdminRole(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const supervisor = await userRepo.findOne({
      where: { id, role: "supervisor" },
    });

    if (!supervisor) {
      const error = new Error("Supervisor not found");
      (error as any).extensions = { code: "NOT_FOUND" };
      throw error;
    }

    // Update fields
    if (input.email !== undefined) {
      // Validate email domain
      if (!input.email.endsWith("@universitasmulia.ac.id")) {
        const error = new Error("Email must be a valid @universitasmulia.ac.id address");
        (error as any).extensions = { code: "BAD_USER_INPUT" };
        throw error;
      }

      // Check if email is already taken by another user
      const existingUser = await userRepo.findOne({
        where: { email: input.email },
      });
      if (existingUser && existingUser.id !== id) {
        const error = new Error("Email already taken by another user");
        (error as any).extensions = { code: "BAD_USER_INPUT" };
        throw error;
      }
      supervisor.email = input.email;
    }
    if (input.name !== undefined) supervisor.name = input.name;
    if (input.nidn !== undefined) supervisor.nidn = input.nidn;
    // Note: Password is not stored in User entity, password field is ignored

    return await userRepo.save(supervisor);
  }

  @Mutation(() => Boolean)
  async deleteSupervisor(
    @Arg("id", () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    requireAdminRole(ctx);

    const userRepo = AppDataSource.getRepository(User);
    const supervisor = await userRepo.findOne({
      where: { id, role: "supervisor" },
    });

    if (!supervisor) {
      const error = new Error("Supervisor not found");
      (error as any).extensions = { code: "NOT_FOUND" };
      throw error;
    }

    await userRepo.remove(supervisor);
    return true;
  }
}
