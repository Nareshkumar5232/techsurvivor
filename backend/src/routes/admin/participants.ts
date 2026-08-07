import { Router } from "express";
import { patchParticipantAdminSchema } from "@tech-survivor/shared";
import type { UserStatus } from "@tech-survivor/types";
import { getAttempt } from "../../repositories/mcqRepo.js";
import { getUserById, listUsers, setDisqualified, updateUser } from "../../repositories/userRepo.js";
import { ROUND1_ID } from "../../repositories/collections.js";
import { logAudit } from "../../services/auditService.js";
import { AppError } from "../../lib/errors.js";
import { asyncHandler, sendSuccess } from "../../lib/response.js";

export const participantsRouter = Router();

participantsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === "string" ? (req.query.status as UserStatus) : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const users = await listUsers({ status, search });

    const withQualification = await Promise.all(
      users.map(async (user) => {
        const attempt = await getAttempt(user.uid, ROUND1_ID);
        return {
          ...user,
          round1Qualified: attempt ? attempt.qualified : null,
        };
      }),
    );

    sendSuccess(res, withQualification);
  }),
);

participantsRouter.patch(
  "/:userId",
  asyncHandler(async (req, res) => {
    const userId = req.params.userId!;
    const existing = await getUserById(userId);
    if (!existing) throw new AppError("NOT_FOUND", "Participant not found");

    const input = patchParticipantAdminSchema.parse(req.body);

    if (input.disqualified !== undefined) {
      await setDisqualified(userId, input.disqualified, input.disqualificationReason ?? null);
    } else if (input.status !== undefined) {
      await updateUser(userId, { status: input.status });
    }

    const updated = await getUserById(userId);

    await logAudit(req.user!, "participant_updated", "user", userId, {
      before: {
        status: existing.status,
        disqualified: existing.disqualified,
        disqualificationReason: existing.disqualificationReason,
      },
      after: {
        status: updated?.status,
        disqualified: updated?.disqualified,
        disqualificationReason: updated?.disqualificationReason,
      },
      input,
    });

    sendSuccess(res, updated, "Participant updated");
  }),
);
