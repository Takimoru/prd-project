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
}

export interface AttendanceSummary {
  teamId: Id<"teams">;
  week: string;
  startDate: string;
  endDate: string;
  daily: DailyAttendance[];
  totals: AttendanceTotal[];
  approval?: {
    status: "approved" | "rejected";
    supervisorId: Id<"users">;
    approvedAt: string;
    notes?: string;
  };
}

export interface TeamMember {
  _id: Id<"users">;
  name: string;
  email: string;
}
