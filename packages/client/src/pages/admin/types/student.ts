export interface Registration {
  id: string; // Changed from _id and Id<"registrations">
  fullName?: string;
  email: string;
  studentId?: string;
  phone?: string;
  program?: {
    id: string;
    title: string;
  };
  submittedAt: string | number | Date;
  paymentProofUrl?: string;
  reviewedAt?: string | number | Date;
  reviewedBy?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
  status: string;
}

export type RegistrationTab = "pending" | "approved";
