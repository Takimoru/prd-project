// GraphQL-compatible types (no Convex dependency)
export interface Supervisor {
  id: string;
  _id?: string; // Compatibility alias
  email: string;
  name: string;
  role: "admin" | "supervisor" | "student" | "pending";
  nidn?: string;
  picture?: string;
}

export interface SupervisorForm {
  email: string;
  name: string;
  nidn: string;
  password?: string;
}
