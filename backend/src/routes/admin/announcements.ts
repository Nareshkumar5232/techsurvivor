import { randomUUID } from "node:crypto";
import { Router } from "express";
import { announcementInputSchema } from "@tech-survivor/shared";
import type { Announcement } from "@tech-survivor/types";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "../../repositories/announcementRepo.js";
import { DEFAULT_EVENT_ID } from "../../repositories/collections.js";
import { logAudit } from "../../services/auditService.js";
import { AppError } from "../../lib/errors.js";
import { asyncHandler, sendSuccess } from "../../lib/response.js";

export const announcementsRouter = Router();

/** There is no getAnnouncement(id) repo helper, so existence is checked by listing and
 *  finding - the announcement collection is small (admin-authored), so this is cheap. */
async function getAnnouncementOrThrow(id: string): Promise<Announcement> {
  const all = await listAnnouncements();
  const found = all.find((a) => a.id === id);
  if (!found) throw new AppError("NOT_FOUND", "Announcement not found");
  return found;
}

announcementsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    // Admin management view: all announcements, including inactive/expired ones.
    sendSuccess(res, await listAnnouncements());
  }),
);

announcementsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = announcementInputSchema.parse(req.body);
    const now = new Date().toISOString();
    const announcement: Announcement = {
      id: randomUUID(),
      eventId: DEFAULT_EVENT_ID,
      title: input.title,
      message: input.message,
      priority: input.priority,
      audience: input.audience,
      publishAt: input.publishAt ?? now,
      expiresAt: input.expiresAt ?? null,
      active: input.active,
      createdAt: now,
      updatedAt: now,
    };
    await createAnnouncement(announcement);
    await logAudit(req.user!, "announcement_created", "announcement", announcement.id, { announcement });
    sendSuccess(res, announcement, "Announcement created", 201);
  }),
);

announcementsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id!;
    const existing = await getAnnouncementOrThrow(id);
    const input = announcementInputSchema.partial().parse(req.body);
    await updateAnnouncement(id, input);
    const updated = await getAnnouncementOrThrow(id);

    await logAudit(req.user!, "announcement_updated", "announcement", id, { before: existing, after: updated });
    sendSuccess(res, updated, "Announcement updated");
  }),
);

announcementsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id!;
    await getAnnouncementOrThrow(id);
    await deleteAnnouncement(id);
    await logAudit(req.user!, "announcement_deleted", "announcement", id, {});
    sendSuccess(res, null, "Announcement deleted");
  }),
);
