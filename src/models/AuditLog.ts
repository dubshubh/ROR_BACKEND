import { Schema, model } from "mongoose";

const auditLogSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
export const AuditLog = model("AuditLog", auditLogSchema);
