import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkIsAdmin } from "./auth";

// Get all programs (filtered by archived status)
export const getAllPrograms = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const includeArchived = args.includeArchived ?? false;
    
    if (includeArchived) {
      return await ctx.db.query("programs").collect();
    }
    
    return await ctx.db
      .query("programs")
      .withIndex("by_archived", (q) => q.eq("archived", false))
      .collect();
  },
});

// Get program by ID
export const getProgramById = query({
  args: {
    programId: v.id("programs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.programId);
  },
});

// Create new program (Admin only)
export const createProgram = mutation({
  args: {
    title: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    description: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const creator = await ctx.db.get(args.createdBy);
    if (!checkIsAdmin(creator)) {
      throw new Error("Only admins can create programs");
    }

    const programId = await ctx.db.insert("programs", {
      title: args.title,
      startDate: args.startDate,
      endDate: args.endDate,
      description: args.description,
      archived: false,
      createdBy: args.createdBy,
    });
    return programId;
  },
});

// Archive program (Admin only)
export const archiveProgram = mutation({
  args: {
    programId: v.id("programs"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!checkIsAdmin(admin)) {
      throw new Error("Only admins can archive programs");
    }

    await ctx.db.patch(args.programId, {
      archived: true,
    });
  },
});

// Update program (Admin only)
export const updateProgram = mutation({
  args: {
    programId: v.id("programs"),
    adminId: v.id("users"),
    title: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!checkIsAdmin(admin)) {
      throw new Error("Only admins can update programs");
    }

    const { programId, adminId, ...updates } = args;
    await ctx.db.patch(programId, updates);
  },
});

