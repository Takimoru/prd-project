// GraphQL-compatible types (no Convex dependency)
export interface TeamMember {
  id: string;
  _id?: string; // Compatibility alias
  name: string;
  email: string;
  studentId?: string;
}

export interface EnrichedTeam {
  id: string;
  _id?: string; // Compatibility alias
  name?: string;
  programId: string;
  leaderId: string;
  memberIds?: string[]; // Legacy - use members array instead
  leader?: TeamMember | null;
  members?: (TeamMember | null)[];
  supervisorId?: string;
  supervisor?: TeamMember | null;
  progress?: number;
}

export interface TeamForm {
  name: string;
  leaderId: string;
  memberIds: string[];
  supervisorId?: string;
}
