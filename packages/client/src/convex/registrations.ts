import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkIsAdmin } from "./auth";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const generatePaymentUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const submitRegistration = mutation({
  args: {
    programId: v.id("programs"),
    fullName: v.string(),
    studentId: v.string(),
    phone: v.string(),
    email: v.string(),
    paymentProofStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    const hasActive = existing.some(
      (reg) => reg.status === "pending" || reg.status === "approved"
    );
    if (hasActive) {
      throw new Error(
        "You already have a registration in progress. Please wait for admin review."
      );
    }

    let paymentProofUrl: string | undefined;
    if (args.paymentProofStorageId) {
      const generatedUrl = await ctx.storage.getUrl(
        args.paymentProofStorageId
      );
      paymentProofUrl = generatedUrl ?? undefined;
    }

    return await ctx.db.insert("registrations", {
      programId: args.programId,
      userId: undefined,
      fullName: args.fullName,
      studentId: args.studentId,
      phone: args.phone,
      email,
      paymentProofStorageId: args.paymentProofStorageId,
      paymentProofUrl,
      status: "pending",
      submittedAt: new Date().toISOString(),
      reviewNotes: undefined,
    });
  },
});

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
    let queryBuilder = ctx.db
      .query("registrations")
      .withIndex("by_program", (q) => q.eq("programId", args.programId));

    const registrations = await queryBuilder.collect();

    if (args.status) {
      return registrations.filter((r) => r.status === args.status);
    }

    // Enrich with user data
    return Promise.all(
      registrations.map(async (registration) => {
        const user = registration.userId
          ? await ctx.db.get(registration.userId)
          : null;
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

export const getPendingRegistrations = query({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("registrations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return Promise.all(
      pending.map(async (registration) => {
        const program = await ctx.db.get(registration.programId);
        const reviewedBy = registration.reviewedBy
          ? await ctx.db.get(registration.reviewedBy)
          : null;
        return {
          ...registration,
          program,
          reviewedBy,
        };
      })
    );
  },
});

// Get all approved registrations
export const getApprovedRegistrations = query({
  args: {},
  handler: async (ctx) => {
    const approved = await ctx.db
      .query("registrations")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    return Promise.all(
      approved.map(async (registration) => {
        const program = await ctx.db.get(registration.programId);
        const reviewedBy = registration.reviewedBy
          ? await ctx.db.get(registration.reviewedBy)
          : null;
        const user = registration.userId
          ? await ctx.db.get(registration.userId)
          : null;
        return {
          ...registration,
          program,
          reviewedBy,
          user,
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
// Deprecated in favor of public registration page
export const registerForProgram = mutation({
  args: {
    programId: v.id("programs"),
    userId: v.id("users"),
  },
  handler: async () => {
    throw new Error(
      "Registration must be completed through the public registration page."
    );
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

    const registration = await ctx.db.get(args.registrationId);
    if (!registration) {
      throw new Error("Registration not found");
    }

    await ctx.db.patch(args.registrationId, {
      status: "approved",
      reviewedBy: args.adminId,
      reviewedAt: new Date().toISOString(),
    });

    let registrationOwner =
      (registration.userId && (await ctx.db.get(registration.userId))) || null;

    if (!registrationOwner && registration.email) {
      registrationOwner = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", registration.email!))
        .first();
    }

    if (registrationOwner && !registration.userId) {
      await ctx.db.patch(args.registrationId, {
        userId: registrationOwner._id,
      });
    }

    if (
      registrationOwner &&
      registrationOwner.role !== "admin" &&
      registrationOwner.role !== "supervisor" &&
      registrationOwner.role !== "student"
    ) {
      await ctx.db.patch(registrationOwner._id, {
        role: "student",
        studentId: registration.studentId || registrationOwner.studentId,
      });
    }

    // If no user account exists yet, create one so the student can be added to teams
    if (!registrationOwner && registration.email) {
      const newUserId = await ctx.db.insert("users", {
        name: registration.fullName || registration.email.split("@")[0],
        email: registration.email,
        role: "student",
        studentId: registration.studentId,
        googleId: `approved-${registration._id}`, // Placeholder, will be updated on first login
        picture: undefined,
      });

      // Link the registration to the new user
      await ctx.db.patch(args.registrationId, {
        userId: newUserId,
      });
    }
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

    const registration = await ctx.db.get(args.registrationId);
    if (!registration) {
      throw new Error("Registration not found");
    }

    await ctx.db.patch(args.registrationId, {
      status: "rejected",
      reviewedBy: args.adminId,
      reviewedAt: new Date().toISOString(),
    });
  },
});

