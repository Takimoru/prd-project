import { Request, Response, NextFunction } from 'express';

// Placeholder for actual Clerk integration
// In production, use @clerk/clerk-sdk-node verifyToken or similar
export const clerkMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        // Validate token here
        // (req as any).auth = { userId: "decoded-id" };
      }
      next();
    } catch (error) {
      console.error("Auth error:", error);
      res.status(401).json({ error: "Unauthorized" });
    }
  };
};
