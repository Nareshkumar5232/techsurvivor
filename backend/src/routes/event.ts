import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getEventConfigOrThrow, getEventStatusForUser } from "../services/eventService.js";
import { listActiveAnnouncements } from "../repositories/announcementRepo.js";
import { getAttempt } from "../repositories/mcqRepo.js";
import { ROUND1_ID } from "../repositories/collections.js";
import { asyncHandler, sendSuccess } from "../lib/response.js";

export const eventRouter = Router();

eventRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const event = await getEventConfigOrThrow();
    sendSuccess(res, event);
  }),
);

eventRouter.get(
  "/status",
  authenticate,
  asyncHandler(async (req, res) => {
    const status = await getEventStatusForUser(req.user!.uid);
    sendSuccess(res, status);
  }),
);

eventRouter.get(
  "/announcements",
  authenticate,
  asyncHandler(async (req, res) => {
    const all = await listActiveAnnouncements(new Date().toISOString());
    const isAdmin = req.user!.role === "admin";
    const qualified = isAdmin
      ? false
      : (await getAttempt(req.user!.uid, ROUND1_ID))?.qualified === true;

    const visible = all.filter((a) => {
      if (a.audience === "all") return true;
      if (isAdmin) return a.audience === "admins";
      if (a.audience === "participants") return true;
      if (a.audience === "qualified") return qualified;
      return false;
    });
    sendSuccess(res, visible);
  }),
);
