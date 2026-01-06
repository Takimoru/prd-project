import { Context } from '../graphql/context';

/**
 * Auth helpers per PRD requirements
 * Enforce role-based access control per role
 */

// Helper to check if a user is admin (by user object or email)
export function checkIsAdmin(
  user: { email: string; role: string } | null,
  email?: string
): boolean {
  if (!user && !email) return false;

  const emailToCheck = user?.email || email || '';
  if (!emailToCheck) return false;

  // Check if email is in admin list
  const hardcodedAdmins = [
    'nicolastzakis@students.universitasmulia.ac.id',
    'nicolastzakis@students.universitasmulia.ac.id',
  ].map((e) => e.toLowerCase());

  const envAdmins =
    process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) ||
    [];

  const allAdminEmails = [...hardcodedAdmins, ...envAdmins];
  const emailLower = emailToCheck.toLowerCase();

  // Check role or email list
  return user?.role === 'admin' || allAdminEmails.includes(emailLower);
}

export function isAllowedDomain(email: string): boolean {
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [];
  if (allowedDomains.length === 0) return true;
  
  const emailDomain = email.split('@')[1];
  return allowedDomains.includes(emailDomain);
}

/**
 * Role checking utilities per PRD
 */
export function checkHasRole(user: { role: string } | null, allowedRoles: string[]): boolean {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
}

export function checkIsSupervisor(user: { role: string } | null): boolean {
  return checkHasRole(user, ['supervisor', 'admin']);
}

export function checkIsLeader(user: { role: string } | null): boolean {
  return checkHasRole(user, ['leader', 'admin']);
}

export function checkIsStudent(user: { role: string } | null): boolean {
  return checkHasRole(user, ['student', 'leader', 'admin']);
}

/**
 * Context-based auth guards for GraphQL resolvers
 * Per PRD: Clerk role enforcement via GraphQL middleware
 */
export function requireAuth(ctx: Context): void {
  if (!ctx.userId && !ctx.userEmail) {
    throw new Error('Authentication required');
  }
}

export function requireRole(ctx: Context, allowedRoles: string[]): void {
  requireAuth(ctx);
  if (!ctx.userRole || !allowedRoles.includes(ctx.userRole)) {
    throw new Error(`Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`);
  }
}

export function requireAdminRole(ctx: Context): void {
  requireRole(ctx, ['admin']);
}

export function requireSupervisorRole(ctx: Context): void {
  requireRole(ctx, ['supervisor', 'admin']);
}

export function requireLeaderRole(ctx: Context): void {
  requireRole(ctx, ['leader', 'admin']);
}

export function requireStudentRole(ctx: Context): void {
  requireRole(ctx, ['student', 'leader', 'admin']);
}

