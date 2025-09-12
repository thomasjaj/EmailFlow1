import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Simple authentication middleware for standalone deployment
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Simple login endpoint for standalone deployment
export async function setupSimpleAuth(app: any) {
  // Auto-login endpoint for standalone deployment
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      // Create or get the default admin user
      let user = await storage.getUser(1);
      if (!user) {
        user = await storage.upsertUser({
          id: 1,
          email: "admin@emailpro.com",
          firstName: "Admin",
          lastName: "User",
        });
      }
      
      req.session!.userId = user.id;
      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.userId = undefined;
        return res.status(401).json({ message: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });
}