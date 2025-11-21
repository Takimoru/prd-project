import { mutation } from "./_generated/server";

export const backfillUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const approvedRegistrations = await ctx.db
      .query("registrations")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    let createdCount = 0;
    let updatedCount = 0;
    let errors = [];

    for (const reg of approvedRegistrations) {
      if (!reg.email) {
        errors.push(`Registration ${reg._id} has no email`);
        continue;
      }

      // Check if user exists
      let user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", reg.email!))
        .first();

      if (!user) {
        // Create user
        console.log(`Creating user for ${reg.email}`);
        const userId = await ctx.db.insert("users", {
          name: reg.fullName || reg.email.split("@")[0],
          email: reg.email,
          role: "student",
          studentId: reg.studentId,
          googleId: `approved-${reg._id}`, // Placeholder
        });
        user = await ctx.db.get(userId);
        createdCount++;
      } else {
        // Ensure role is student if it's not admin/supervisor
        if (user.role !== "admin" && user.role !== "supervisor" && user.role !== "student") {
           await ctx.db.patch(user._id, { role: "student" });
           updatedCount++;
        }
      }

      // Link registration to user if not linked
      if (user && reg.userId !== user._id) {
        await ctx.db.patch(reg._id, { userId: user._id });
      }
    }

    return {
      processed: approvedRegistrations.length,
      created: createdCount,
      updated: updatedCount,
      errors,
    };
  },
});
