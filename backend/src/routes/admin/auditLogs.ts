import { Router } from "express";
import { listAuditLogs } from "../../repositories/auditRepo.js";
import { asyncHandler, sendSuccess } from "../../lib/response.js";

export const auditLogsRouter = Router();

auditLogsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const rawLimit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const limit = rawLimit !== undefined && Number.isFinite(rawLimit) ? rawLimit : undefined;
    sendSuccess(res, await listAuditLogs(limit));
  }),
);
