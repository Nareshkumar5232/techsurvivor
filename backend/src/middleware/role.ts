import type { NextFunction, Request, Response } from "express";
import type { Role } from "@tech-survivor/types";
import { AppError } from "../lib/errors.js";

export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError("UNAUTHENTICATED", "Authentication required");
    }
    if (!allowed.includes(req.user.role)) {
      throw new AppError("UNAUTHORIZED", "You do not have permission to perform this action");
    }
    next();
  };
}

export const requireAdmin = requireRole("admin");
export const requireParticipant = requireRole("participant");
