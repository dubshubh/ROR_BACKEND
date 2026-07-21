import { AuditLog } from "../models/AuditLog.js";

export async function recordAudit(entry: { adminId?: string; action: string; entityType: string; entityId: string; metadata?: Record<string, string | number | boolean> }) {
  if (!entry.adminId) return;
  try {
    await AuditLog.create(entry);
  } catch (error) {
    console.error("Failed to persist admin audit event", error);
  }
}
