import { Router } from "express";
import { profileInputSchema } from "@tech-survivor/shared";
import { authenticate } from "../middleware/auth.js";
import { loadProfile } from "../middleware/profile.js";
import { createProfile, patchProfile } from "../services/userService.js";
import { asyncHandler, sendSuccess } from "../lib/response.js";

export const profileRouter = Router();

profileRouter.get(
  "/",
  authenticate,
  loadProfile,
  asyncHandler(async (req, res) => {
    sendSuccess(res, req.profile);
  }),
);

profileRouter.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const input = profileInputSchema.parse(req.body);
    const profile = await createProfile(req.user!, input);
    sendSuccess(res, profile, "Profile created", 201);
  }),
);

profileRouter.patch(
  "/",
  authenticate,
  loadProfile,
  asyncHandler(async (req, res) => {
    const input = profileInputSchema.partial().parse(req.body);
    const profile = await patchProfile(req.user!, input);
    sendSuccess(res, profile, "Profile updated");
  }),
);
