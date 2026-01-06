// GraphQL-compatible types (no Convex dependency)
export interface ReportTask {
  id: string;
  _id?: string; // Compatibility alias
  title: string;
  completed: boolean;
}

export interface ReportPhoto {
  url: string;
}

export interface SupervisorComment {
  id?: string;
  text: string;
  comment?: string; // Compatibility alias
  authorId?: string;
  commentedBy?: string; // Compatibility alias
  createdAt?: string;
  commentedAt?: number | string; // Compatibility
  author?: {
    id: string;
    name: string;
  };
  commentedByUser?: {
    name: string;
  };
}

export interface WeeklyReport {
  id: string;
  _id?: string; // Compatibility alias
  week: string;
  status: "draft" | "submitted" | "approved" | "revision_requested";
  progressPercentage: number;
  submittedAt?: string | number; // GraphQL returns ISO string
  createdAt?: string;
  description?: string;
  photos?: string[];
  tasks?: ReportTask[];
  comments?: SupervisorComment[];
  supervisorComments?: SupervisorComment[]; // Compatibility alias
  team?: {
    id: string;
    name?: string;
  };
}
