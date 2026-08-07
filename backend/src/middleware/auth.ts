import type { NextFunction, Request, Response } from "express";
import type { Role } from "@tech-survivor/types";
import { getFirebaseAuth } from "../config/firebaseAdmin.js";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/response.js";

/**
 * Verifies the Firebase ID token on every request. The resolved role comes
 * from the token's custom claims - set exclusively by the backend via
 * setCustomUserClaims - never from anything the client sends in the request
 * body. Role changes only take effect after the client's next ID-token
 * refresh (Firebase tokens are cached for up to an hour); the frontend forces
 * a refresh right after an admin promotion or disqualification event.
 */
export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("UNAUTHENTICATED", "Missing or invalid Authorization header");
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    throw new AppError("UNAUTHENTICATED", "Missing bearer token");
  }

  let decoded;
  try {
    decoded = await getFirebaseAuth().verifyIdToken(token);
  } catch {
    throw new AppError("UNAUTHENTICATED", "Invalid or expired session token");
  }

  const role: Role = decoded.role === "admin" ? "admin" : "participant";

  req.user = {
    uid: decoded.uid,
    email: decoded.email ?? "",
    emailVerified: decoded.email_verified ?? false,
    role,
  };

  next();
});

/** Same as authenticate, but does not fail when no token is present (public+optional-auth routes). */
export const authenticateOptional = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      next();
      return;
    }
    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      next();
      return;
    }
    try {
      const decoded = await getFirebaseAuth().verifyIdToken(token);
      const role: Role = decoded.role === "admin" ? "admin" : "participant";
      req.user = {
        uid: decoded.uid,
        email: decoded.email ?? "",
        emailVerified: decoded.email_verified ?? false,
        role,
      };
    } catch {
      // Optional auth: an invalid token is treated as anonymous, not an error.
    }
    next();
  },
);
