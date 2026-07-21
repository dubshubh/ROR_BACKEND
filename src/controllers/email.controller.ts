import type { Request, Response } from "express";
import { EmailLog } from "../models/EmailLog.js";
import { PartnerEnquiry } from "../models/PartnerEnquiry.js";
import { Rider } from "../models/Rider.js";
import { recordAudit } from "../services/audit.service.js";
import { sendEmail, type EmailRecipient } from "../services/email.service.js";
import { brandedEmail, textToParagraphs } from "../services/email-template.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

async function resolveRecipients(audience: string, customRecipients: string[]) {
  const recipients: EmailRecipient[] = [];
  if (audience === "approvedRiders" || audience === "all") {
    const riders = await Rider.find({ status: "approved" }).select("fullName email").lean();
    recipients.push(...riders.map((rider) => ({ email: rider.email, name: rider.fullName })));
  }
  if (audience === "brands" || audience === "all") {
    const brands = await PartnerEnquiry.find().select("brandName contactName email").lean();
    recipients.push(...brands.map((brand) => ({ email: brand.email, name: brand.contactName || brand.brandName })));
  }
  if (audience === "custom") recipients.push(...customRecipients.map((email) => ({ email })));
  return [...new Map(recipients.map((recipient) => [recipient.email.toLowerCase(), recipient])).values()];
}

export async function sendAdminEmail(req: Request, res: Response) {
  const { audience, category, subject, message, customRecipients } = req.body as { audience: string; category: string; subject: string; message: string; customRecipients: string[] };
  const recipients = await resolveRecipients(audience, customRecipients);
  if (!recipients.length) return res.status(422).json({ success: false, code: "NO_RECIPIENTS", message: "No recipients match this audience" });
  if (recipients.length > 1000) return res.status(422).json({ success: false, code: "RECIPIENT_LIMIT", message: "Audience exceeds the 1,000-recipient safety limit" });

  const result = await sendEmail({ recipients, subject, category, audience, source: "admin", adminId: req.admin?.id, htmlContent: brandedEmail({ eyebrow: category.replace(/-/g, " "), title: subject, greeting: "Hello from Rebels on Roads,", paragraphs: textToParagraphs(message) }), textContent: message });
  await recordAudit({ adminId: req.admin?.id, action: "email.sent", entityType: "email", entityId: `${Date.now()}`, metadata: { audience, category, recipientCount: result.recipientCount, sentCount: result.sentCount } });
  return sendSuccess(res, result, result.status === "skipped" ? "Email delivery is disabled; message logged" : "Email delivery completed", 201);
}

export async function listEmailLogs(req: Request, res: Response) {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const [logs, total] = await Promise.all([EmailLog.find().select("source category subject audience recipientCount sentCount failedCount status createdAt errorMessage").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), EmailLog.countDocuments()]);
  return sendSuccess(res, { logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
