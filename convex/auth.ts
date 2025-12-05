import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to check if a user is admin (by user object or email)
export function checkIsAdmin(
  user: { email: string; role: string } | null,
  email?: string
): boolean {
  if (!user && !email) return false;

  const emailToCheck = user?.email || email || "";
  if (!emailToCheck) return false;

  // Check if email is in admin list
  const hardcodedAdmins = [
    "nicolastzakis@students.unviersitasmulia.ac.id",
    "nicolastzakis@students.universitasmulia.ac.id",
  ].map((e) => e.toLowerCase());

  const envAdmins =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ||
    [];

  const allAdminEmails = [...hardcodedAdmins, ...envAdmins];
  const emailLower = emailToCheck.toLowerCase();

  // Check role or email list
  return user?.role === "admin" || allAdminEmails.includes(emailLower);
}

// Check if email is in admin list
function isAdminEmail(email: string): boolean {
  // Hardcoded admin emails (for development/fallback)
  const hardcodedAdmins = [
    "nicolastzakis@students.unviersitasmulia.ac.id",
    "nicolastzakis@students.universitasmulia.ac.id", // In case of typo fix
  ].map((e) => e.toLowerCase());

  // Admin emails from environment variable (comma-separated)
  const envAdmins =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ||
    [];

  const allAdminEmails = [...hardcodedAdmins, ...envAdmins];
  const emailLower = email.toLowerCase();

  console.log("Admin check:", {
    email: emailLower,
    hardcodedAdmins,
    envAdmins,
    allAdminEmails,
    isAdmin: allAdminEmails.includes(emailLower),
  });

  return allAdminEmails.includes(emailLower);
}

// Get current user by email (for Google OAuth)
export const getCurrentUser = query({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = null;

    // Try to get user from Convex auth first (if configured)
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    // Fallback to email parameter (from localStorage)
    if (!user && args.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first();
    }

    // If user exists, check admin status
    // Note: Auto-update happens in createOrUpdateUser mutation
    if (user) {
      const emailToCheck = identity?.email || args.email;
      // If email is in admin list but role isn't admin, return admin role (will be updated on next login)
      if (emailToCheck && isAdminEmail(emailToCheck) && user.role !== "admin") {
        return { ...user, role: "admin" as const };
      }
      return user;
    }

    return null;
  },
});

// Create or update user after Google OAuth
export const createOrUpdateUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    googleId: v.string(),
    picture: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("supervisor"), v.literal("student"))
    ),
    studentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase();
    // Check if email is in admin list
    const shouldBeAdmin = isAdminEmail(args.email);

    const matchingRegistration = await ctx.db
      .query("registrations")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    const registrationRole =
      matchingRegistration?.status === "approved"
        ? "student"
        : matchingRegistration?.status === "pending"
          ? "pending"
          : undefined;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      // Update existing user
      // Preserve supervisor and admin roles, handle student/pending based on registration
      const finalRole = shouldBeAdmin
        ? "admin"
        : existingUser.role === "supervisor"
          ? "supervisor" // Preserve supervisor role
          : registrationRole === "student"
            ? "student"
            : registrationRole === "pending" &&
                (existingUser.role === "pending" || !existingUser.role)
              ? "pending"
              : args.role || existingUser.role;

      await ctx.db.patch(existingUser._id, {
        name: args.name,
        googleId: args.googleId,
        picture: args.picture,
        role: finalRole,
        studentId: existingUser.studentId || matchingRegistration?.studentId,
      });

      if (
        matchingRegistration &&
        matchingRegistration.userId !== existingUser._id
      ) {
        await ctx.db.patch(matchingRegistration._id, {
          userId: existingUser._id,
        });
      }
      return existingUser._id;
    }

    // Create new user
    // If email is in admin list, assign admin role, otherwise use provided role or default to student
    const defaultRole = shouldBeAdmin
      ? "admin"
      : registrationRole
        ? registrationRole
        : args.role || "pending";

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      googleId: args.googleId,
      picture: args.picture,
      role: defaultRole,
      studentId: args.studentId || matchingRegistration?.studentId,
    });

    if (matchingRegistration) {
      await ctx.db.patch(matchingRegistration._id, {
        userId,
      });
    }

    return userId;
  },
});

// Update user role (Admin only, or for initial setup)
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("supervisor"),
      v.literal("student")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      role: args.role,
    });
    return args.userId;
  },
});

// Get user by email (for admin operations)
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Set admin role by email (for initial setup - use with caution!)
// You can call this from Convex dashboard Functions tab
export const setAdminByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error(`User with email ${args.email} not found`);
    }

    await ctx.db.patch(user._id, {
      role: "admin",
    });

    return user._id;
  },
});

// Check if user is admin
export const isAdmin = query({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.email) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email!))
      .first();

    return user?.role === "admin" || isAdminEmail(args.email);
  },
});

// Get admin emails list (for reference)
export const getAdminEmails = query({
  args: {},
  handler: async () => {
    const adminEmails =
      process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    return adminEmails;
  },
});

// Check if email is from allowed domain (university domain)
export const isAllowedDomain = query({
  args: {
    email: v.string(),
  },
  handler: async (_ctx, args) => {
    // TODO: Configure allowed domain in environment or settings
    // For now, return true - you should add domain validation
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(",") || [];
    const emailDomain = args.email.split("@")[1];
    return allowedDomains.length === 0 || allowedDomains.includes(emailDomain);
  },
});
