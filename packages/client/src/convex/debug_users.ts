import { query } from "./_generated/server";

export const inspectState = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const approvedRegistrations = await ctx.db
      .query("registrations")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();
    const allTeams = await ctx.db.query("teams").collect();

    const students = allUsers.filter((u) => u.role === "student");
    
    // Check which approved registrations have a corresponding user
    const registrationsWithUser = approvedRegistrations.map((reg) => {
      const user = allUsers.find((u) => u.email === reg.email);
      return {
        email: reg.email,
        hasUser: !!user,
        userRole: user?.role,
        userId: user?._id,
        regUserId: reg.userId,
      };
    });

    // Check which students are already in a team
    const studentsInTeams = new Set<string>();
    allTeams.forEach((team) => {
      if (team.leaderId) studentsInTeams.add(team.leaderId);
      if (team.memberIds) team.memberIds.forEach((id) => studentsInTeams.add(id));
    });

    const availableStudents = students.filter(
      (s) => !studentsInTeams.has(s._id)
    );

    return {
      totalUsers: allUsers.length,
      totalStudents: students.length,
      totalApprovedRegistrations: approvedRegistrations.length,
      registrationsAnalysis: registrationsWithUser,
      studentsInTeamsCount: studentsInTeams.size,
      availableStudentsCount: availableStudents.length,
      availableStudentsSample: availableStudents.slice(0, 5).map(s => ({ name: s.name, email: s.email, id: s._id })),
      studentsInTeamsSample: Array.from(studentsInTeams).slice(0, 5),
    };
  },
});
