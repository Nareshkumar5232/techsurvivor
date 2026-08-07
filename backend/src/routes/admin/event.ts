import { Router } from "express";
import { eventConfigUpdateSchema } from "@tech-survivor/shared";
import { getEvent, updateEvent } from "../../repositories/eventRepo.js";
import { DEFAULT_EVENT_ID } from "../../repositories/collections.js";
import { logAudit } from "../../services/auditService.js";
import { asyncHandler, sendSuccess } from "../../lib/response.js";

export const eventRouter = Router();

eventRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const input = eventConfigUpdateSchema.parse(req.body);
    await updateEvent(input);
    const updated = await getEvent();
    await logAudit(req.user!, "event_config_updated", "event", DEFAULT_EVENT_ID, { input });
    sendSuccess(res, updated, "Event updated");
  }),
);
