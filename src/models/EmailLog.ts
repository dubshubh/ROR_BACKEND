import { Schema, model } from "mongoose";

const emailLogSchema = new Schema({
  source: { type: String, enum: ["automation", "admin"], required: true, index: true },
  category: { type: String, required: true, index: true },
  subject: { type: String, required: true, maxlength: 200 },
  audience: { type: String, required: true },
  recipientCount: { type: Number, required: true, min: 0 },
  sentCount: { type: Number, required: true, min: 0 },
  failedCount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["sent", "partial", "failed", "skipped"], required: true, index: true },
  providerMessageIds: { type: [String], default: [] },
  adminId: { type: Schema.Types.ObjectId, ref: "Admin" },
  relatedEntityType: { type: String },
  relatedEntityId: { type: String },
  errorMessage: { type: String, maxlength: 500 }
}, { timestamps: true });

emailLogSchema.index({ createdAt: -1 });
export const EmailLog = model("EmailLog", emailLogSchema);
