import type { NextFunction, Request, Response } from "express";
import { getUserById } from "../repositories/userRepo.js";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/response.js";

/** Loads the caller's Firestore profile and blocks disqualified accounts everywhere. */
export const loadProfile = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) throw new AppError("UNAUTHENTICATED", "Authentication required");
  const profile = await getUserById(req.user.uid);
  if (!profile) throw new AppError("NOT_FOUND", "User profile not found");
  if (profile.disqualified) {
    throw new AppError("DISQUALIFIED", profile.disqualificationReason ?? "Your participation has been revoked");
  }
  req.profile = profile;
  next();
});

export const requireProfileComplete = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.profile) throw new AppError("UNAUTHENTICATED", "Authentication required");
    if (!req.profile.profileComplete) {
      throw new AppError("PROFILE_INCOMPLETE", "Please complete your profile before continuing");
    }
    next();
  },
);
