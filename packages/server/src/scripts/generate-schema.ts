import "reflect-metadata";
import path from "path";
import { buildSchema } from "type-graphql";
import { AuthResolver } from "../graphql/resolvers/auth.resolver";
import { ProgramResolver } from "../graphql/resolvers/program.resolver";
import { TeamResolver } from "../graphql/resolvers/team.resolver";
import { TaskResolver } from "../graphql/resolvers/task.resolver";
import { RegistrationResolver } from "../graphql/resolvers/registration.resolver";
import { AttendanceResolver } from "../graphql/resolvers/attendance.resolver";
import { UserResolver } from "../graphql/resolvers/user.resolver";
import { ReportResolver } from "../graphql/resolvers/report.resolver";
import { SubscriptionResolver } from "../graphql/resolvers/subscription.resolver";
import { WorkProgramResolver } from "../graphql/resolvers/workProgram.resolver";
import { WeeklyReportResolver } from "../graphql/resolvers/weeklyReport.resolver";
import { AdminResolver } from "../graphql/resolvers/admin.resolver";
import { ActivityResolver } from "../graphql/resolvers/activity.resolver";
import { LogsheetResolver } from "../graphql/resolvers/logsheet.resolver";

async function generateSchema() {
  await buildSchema({
    resolvers: [
      AuthResolver,
      ProgramResolver,
      TeamResolver,
      TaskResolver,
      RegistrationResolver,
      AttendanceResolver,
      UserResolver,
      ReportResolver,
      SubscriptionResolver,
      WorkProgramResolver,
      WeeklyReportResolver,
      AdminResolver,
      ActivityResolver,
      LogsheetResolver,
    ],
    validate: false,
    emitSchemaFile: path.resolve(__dirname, "../../schema.graphql"),
  });
  console.log("Schema generated successfully at", path.resolve(__dirname, "../../schema.graphql"));
}

generateSchema().catch(console.error);
