import { randomUUID } from "node:crypto";
import type { AuthenticatedUser } from "../types/express.js";
import { createAuditLog } from "../repositories/auditRepo.js";

export async function logAudit(
  actor: AuthenticatedUser,
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown> = {},
): Promise<void> {
  await createAuditLog({
    id: randomUUID(),
    actorUid: actor.uid,
    actorEmail: actor.email,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  });
}
