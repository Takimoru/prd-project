import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { checkIsAdmin } from '../lib/auth-helpers';

export interface ClerkAuth {
  userId?: string;
  clerkId?: string;
  email?: string;
  role?: string;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: ClerkAuth;
    }
  }
}

/**
 * Clerk authentication middleware
 * Verifies Clerk session token and enriches request with user data
 * Per PRD: Maps Clerk users by email; stores role in DB
 */
export async function clerkMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    // Verify token with Clerk
    try {
      // Option 1: Using Clerk's built-in verification
      if (process.env.CLERK_SECRET_KEY) {
        try {
          const verifyResult = await clerkClient.verifyToken(token);
          
          // Get Clerk user to extract email
          const clerkUser = await clerkClient.users.getUser(verifyResult.sub);
          const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
          
          if (email) {
            // Look up user in our database
            const userRepo = AppDataSource.getRepository(User);
            const dbUser = await userRepo.findOne({ where: { email } });
            
            const isAdmin = checkIsAdmin(dbUser, email);
            
            req.auth = {
              userId: dbUser?.id,
              clerkId: verifyResult.sub,
              email: email,
              role: isAdmin ? 'admin' : dbUser?.role,
              sessionId: verifyResult.sid,
            };
          }
        } catch (clerkError) {
          console.error('Clerk verification error:', clerkError);
          // Fall through to backward compatibility mode
        }
      }
      
      // Option 2: Backward compatibility mode for migration period
      // Support email-based auth from localStorage for gradual migration
      if (!req.auth && token.includes('@')) {
        const email = token.toLowerCase().trim();
        const userRepo = AppDataSource.getRepository(User);
        const dbUser = await userRepo.findOne({ where: { email } });
        
        const isAdmin = checkIsAdmin(dbUser, email);
        
        req.auth = {
          userId: dbUser?.id,
          email: email,
          role: isAdmin ? 'admin' : dbUser?.role,
        };
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      // Continue without auth - let resolvers handle authorization
    }

    next();
  } catch (error) {
    console.error('Clerk middleware error:', error);
    next(error);
  }
}

/**
 * Auth guard decorators for role-based access control
 * Per PRD: Implement middleware to check user.role === 'role'
 */
export function requireAuth(req: Request): void {
  if (!req.auth || !req.auth.userId) {
    throw new Error('Authentication required');
  }
}

export function requireRole(req: Request, allowedRoles: string[]): void {
  requireAuth(req);
  if (!req.auth?.role || !allowedRoles.includes(req.auth.role)) {
    throw new Error(`Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`);
  }
}

export function requireAdmin(req: Request): void {
  requireRole(req, ['admin']);
}

export function requireSupervisor(req: Request): void {
  requireRole(req, ['supervisor', 'admin']);
}

export function requireLeader(req: Request): void {
  requireRole(req, ['leader', 'admin']);
}

export function requireStudent(req: Request): void {
  requireRole(req, ['student', 'leader', 'admin']);
}

