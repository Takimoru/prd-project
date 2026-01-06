import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { checkIsAdmin } from "./auth";

// Get all users (for admin team management)
export const getAllUsers = query({
  args: {
    role: v.optional(
      v.union(v.literal("admin"), v.literal("supervisor"), v.literal("student"))
    ),
  },
  handler: async (ctx, args) => {
    if (args.role) {
      // Filter by role if provided
      const allUsers = await ctx.db.query("users").collect();
      return allUsers.filter((user) => user.role === args.role);
    }
    return await ctx.db.query("users").collect();
  },
});

// Search users by name or email
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const searchLower = args.searchTerm.toLowerCase();
    return allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.studentId?.toLowerCase().includes(searchLower)
    );
  },
});

// Supervisor CRUD operations (Admin only)

// Create supervisor
export const createSupervisor = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    nidn: v.string(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!checkIsAdmin(admin)) {
      throw new Error("Only admins can create supervisors");
    }

    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Email already exists");
    }

    // Create supervisor user with mock googleId
    const supervisorId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      role: "supervisor",
      nidn: args.nidn,
      googleId: `mock_${Date.now()}_${args.email}`, // Mock Google ID for testing
    });

    return supervisorId;
  },
});

// Update supervisor
export const updateSupervisor = mutation({
  args: {
    supervisorId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    nidn: v.optional(v.string()),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!checkIsAdmin(admin)) {
      throw new Error("Only admins can update supervisors");
    }

    const supervisor = await ctx.db.get(args.supervisorId);
    if (!supervisor) {
      throw new Error("Supervisor not found");
    }

    if (supervisor.role !== "supervisor") {
      throw new Error("User is not a supervisor");
    }

    // Check if email is being changed and if it already exists
    if (args.email && args.email !== supervisor.email) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first();

      if (existing) {
        throw new Error("Email already exists");
      }
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.nidn !== undefined) updates.nidn = args.nidn;

    await ctx.db.patch(args.supervisorId, updates);
    return args.supervisorId;
  },
});

// Delete supervisor
export const deleteSupervisor = mutation({
  args: {
    supervisorId: v.id("users"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!checkIsAdmin(admin)) {
      throw new Error("Only admins can delete supervisors");
    }

    const supervisor = await ctx.db.get(args.supervisorId);
    if (!supervisor) {
      throw new Error("Supervisor not found");
    }

    if (supervisor.role !== "supervisor") {
      throw new Error("User is not a supervisor");
    }

    // Check if supervisor is assigned to any teams
    const teamsWithSupervisor = await ctx.db
      .query("teams")
      .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
      .collect();

    if (teamsWithSupervisor.length > 0) {
      throw new Error(
        `Cannot delete supervisor: assigned to ${teamsWithSupervisor.length} team(s). Please reassign teams first.`
      );
    }

    await ctx.db.delete(args.supervisorId);
    return args.supervisorId;
  },
});


// Get students by program
export const getStudentsByProgram = query({
  args: {
    programId: v.id("programs"),
  },
  handler: async (ctx, args) => {
    // Find approved registrations for this program
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    // Get the users for these registrations
    const students = await Promise.all(
      registrations.map(async (reg) => {
        if (!reg.userId) return null;
        const user = await ctx.db.get(reg.userId);
        return user;
      })
    );

    return students.filter((s) => s !== null);
  },
});
