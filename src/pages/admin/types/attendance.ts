import { Id } from "../../../../convex/_generated/dataModel";

export interface AttendanceAttendee {
  userId: Id<"users">;
  userName: string;
  timestamp: string;
  status?: "present" | "permission" | "alpha";
  excuse?: string;
}

export interface DailyAttendance {
  date: string;
  attendees: AttendanceAttendee[];
}

export interface AttendanceTotal {
  userId: string;
  userName: string;
  presentCount: number;
  lastCheckIn?: string;
  approvalStatus?: "approved" | "rejected" | "pending";
}

export interface StudentAttendanceWeek {
  userId: string;
  userName: string;
  email?: string;
  presentCount: number;
  lastCheckIn?: string;
  approvalStatus: "approved" | "rejected" | "pending";
  dailyRecords: {
    date: string;
    status?: "present" | "permission" | "alpha";
    excuse?: string;
    timestamp?: string;
  }[];
}

export interface AttendanceSummary {
  teamId: Id<"teams">;
  week: string;
  startDate: string;
  endDate: string;
  students: StudentAttendanceWeek[];
}

export interface TeamMember {
  _id: Id<"users">;
  name: string;
  email: string;
}
