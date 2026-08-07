import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getUserById } from "../repositories/userRepo.js";
import { asyncHandler, sendSuccess } from "../lib/response.js";

export const authRouter = Router();

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await getUserById(req.user!.uid);
    sendSuccess(res, {
      uid: req.user!.uid,
      email: req.user!.email,
      emailVerified: req.user!.emailVerified,
      role: req.user!.role,
      profile,
    });
  }),
);
