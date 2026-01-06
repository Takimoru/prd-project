import { Id } from "@/convex/_generated/dataModel";

export interface Program {
  _id: Id<"programs">;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isArchived?: boolean;
}

export interface Registration {
  _id: Id<"registrations">;
  programId: Id<"programs">;
  userId: Id<"users">;
  status: "pending" | "approved" | "rejected";
  submittedAt: number;
}

export interface Team {
  _id: Id<"teams">;
  name: string;
  programId: Id<"programs">;
  leaderId: Id<"users">;
  memberIds: Id<"users">[];
}

export interface Attendance {
  _id: Id<"attendance">;
  userId: Id<"users">;
  date: string;
  status: "present" | "absent" | "late";
  checkInTime?: string;
  checkOutTime?: string;
}
