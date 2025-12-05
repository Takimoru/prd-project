import { v } from "convex/values";
import { query } from "./_generated/server";

export const get = query({
  args: { teamId: v.optional(v.id("teams")) },
  handler: async (ctx, args) => {
    if (!args.teamId) return [];

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_team_timestamp", (q) => q.eq("teamId", args.teamId!))
      .order("desc")
      .take(10);

    // Join with user details to get the name of the person who did the action
    const activitiesWithUser = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          ...activity,
          userName: user?.name || "Unknown User",
          userPicture: user?.picture,
        };
      })
    );

    return activitiesWithUser;
  },
});
