// GraphQL-compatible types (no Convex dependency)
export interface AttendanceAttendee {
  userId: string;
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
  teamId: string;
  week: string;
  startDate: string;
  endDate: string;
  dates: string[];
  students: StudentAttendanceWeek[];
}

export interface TeamMember {
  id: string;
  _id?: string; // Compatibility alias
  name: string;
  email: string;
}
