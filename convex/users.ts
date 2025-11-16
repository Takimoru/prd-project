import { v } from "convex/values";
import { query } from "./_generated/server";

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

