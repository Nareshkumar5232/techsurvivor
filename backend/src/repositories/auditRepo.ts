import type { AuditLog } from "@tech-survivor/types";
import { getDb } from "../config/firebaseAdmin.js";
import { COLLECTIONS } from "./collections.js";

function auditCol() {
  return getDb().collection(COLLECTIONS.AUDIT_LOGS);
}

export async function createAuditLog(log: AuditLog): Promise<void> {
  await auditCol().doc(log.id).set(log);
}

export async function listAuditLogs(limit = 200): Promise<AuditLog[]> {
  const snap = await auditCol().orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => d.data() as AuditLog);
}
