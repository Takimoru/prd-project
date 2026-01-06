import { Resolver, Subscription, Root, Arg, ID } from "type-graphql";
import { Team } from "../../entities/Team";
import { Task } from "../../entities/Task";
import { Attendance } from "../../entities/Attendance";
import { WeeklyReport } from "../../entities/WeeklyReport";

@Resolver()
export class SubscriptionResolver {
  @Subscription(() => Team, {
    topics: "TEAM_UPDATED",
    filter: ({ payload, args }) => payload.teamId === args.teamId,
  })
  async teamUpdated(
    @Arg("teamId", () => ID) teamId: string,
    @Root() payload: { teamId: string; team: Team }
  ): Promise<Team> {
    return payload.team;
  }

  @Subscription(() => Task, {
    topics: "TASK_UPDATED",
    filter: ({ payload, args }) => {
      if (args.teamId) {
        return payload.teamId === args.teamId;
      }
      if (args.taskId) {
        return payload.taskId === args.taskId;
      }
      return true;
    },
  })
  async taskUpdated(
    @Arg("teamId", () => ID, { nullable: true }) teamId?: string,
    @Arg("taskId", () => ID, { nullable: true }) taskId?: string,
    @Root() payload?: { teamId?: string; taskId?: string; task: Task }
  ): Promise<Task> {
    return payload!.task;
  }

  @Subscription(() => Attendance, {
    topics: "ATTENDANCE_CHECKED_IN",
    filter: ({ payload, args }) => payload.teamId === args.teamId,
  })
  async attendanceCheckedIn(
    @Arg("teamId", () => ID) teamId: string,
    @Root() payload: { teamId: string; attendance: Attendance }
  ): Promise<Attendance> {
    return payload.attendance;
  }

  @Subscription(() => WeeklyReport, {
    topics: "REPORT_SUBMITTED",
    filter: ({ payload, args }) => payload.teamId === args.teamId,
  })
  async reportSubmitted(
    @Arg("teamId", () => ID) teamId: string,
    @Root() payload: { teamId: string; report: WeeklyReport }
  ): Promise<WeeklyReport> {
    return payload.report;
  }

  @Subscription(() => WeeklyReport, {
    topics: "REPORT_UPDATED",
    filter: ({ payload, args }) => payload.teamId === args.teamId,
  })
  async reportUpdated(
    @Arg("teamId", () => ID) teamId: string,
    @Root() payload: { teamId: string; report: WeeklyReport }
  ): Promise<WeeklyReport> {
    return payload.report;
  }
}
