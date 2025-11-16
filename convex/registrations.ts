import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkIsAdmin } from "./auth";

// Get registrations for a program
export const getRegistrationsByProgram = query({
  args: {
    programId: v.id("programs"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("registrations")
      .withIndex("by_program", (q) => q.eq("programId", args.programId));

    const registrations = await query.collect();

    if (args.status) {
      return registrations.filter((r) => r.status === args.status);
    }

    // Enrich with user data
    return Promise.all(
      registrations.map(async (registration) => {
        const user = await ctx.db.get(registration.userId);
        const reviewedBy = registration.reviewedBy
          ? await ctx.db.get(registration.reviewedBy)
          : null;

        return {
          ...registration,
          user,
          reviewedBy,
        };
      })
    );
  },
});

// Get user registrations
export const getUserRegistrations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Enrich with program data
    return Promise.all(
      registrations.map(async (registration) => {
        const program = await ctx.db.get(registration.programId);
        return {
          ...registration,
          program,
        };
      })
    );
  },
});

// Register for program
export const registerForProgram = mutation({
  args: {
    programId: v.id("programs"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if already registered
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const alreadyRegistered = existing.some(
      (r) => r.programId === args.programId
    );

    if (alreadyRegistered) {
      throw new Error("Already registered for this program");
    }

    const registrationId = await ctx.db.insert("registrations", {
      programId: args.programId,
      userId: args.userId,
      status: "pending",
      submittedAt: new Date().toISOString(),
    });

    return registrationId;
  },
});

// Approve registration (Admin only)
export const approveRegistration = mutation({
  args: {
    registrationId: v.id("registrations"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!checkIsAdmin(admin)) {
      throw new Error("Only admins can approve registrations");
    }

    await ctx.db.patch(args.registrationId, {
      status: "approved",
      reviewedBy: args.adminId,
      reviewedAt: new Date().toISOString(),
    });
  },
});

// Reject registration (Admin only)
export const rejectRegistration = mutation({
  args: {
    registrationId: v.id("registrations"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!checkIsAdmin(admin)) {
      throw new Error("Only admins can reject registrations");
    }

    await ctx.db.patch(args.registrationId, {
      status: "rejected",
      reviewedBy: args.adminId,
      reviewedAt: new Date().toISOString(),
    });
  },
});

