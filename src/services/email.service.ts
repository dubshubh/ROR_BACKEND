import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { EmailLog } from "../models/EmailLog.js";

export type EmailRecipient = { email: string; name?: string };
type SendInput = { recipients: EmailRecipient[]; subject: string; htmlContent: string; textContent: string; category: string; audience: string; source: "automation" | "admin"; adminId?: string; relatedEntityType?: string; relatedEntityId?: string };

async function sendOne(recipient: EmailRecipient, input: SendInput) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY ?? "", "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME }, replyTo: { email: env.BREVO_REPLY_TO_EMAIL, name: env.BREVO_SENDER_NAME }, to: [recipient], subject: input.subject, htmlContent: input.htmlContent, headers: { "Idempotency-Key": randomUUID() }, tags: ["rebels-on-roads", input.category] })
  });
  const payload = await response.json().catch(() => ({})) as { messageId?: string; message?: string };
  if (!response.ok) throw new Error(payload.message || `Brevo request failed with status ${response.status}`);
  return payload.messageId ?? "accepted";
}

export async function sendEmail(input: SendInput) {
  const recipients = [...new Map(input.recipients.map((recipient) => [recipient.email.trim().toLowerCase(), { ...recipient, email: recipient.email.trim().toLowerCase() }])).values()];
  if (!env.EMAIL_ENABLED) {
    await EmailLog.create({ ...input, recipientCount: recipients.length, sentCount: 0, failedCount: 0, status: "skipped", providerMessageIds: [], errorMessage: "Email delivery is disabled" });
    return { status: "skipped" as const, recipientCount: recipients.length, sentCount: 0, failedCount: 0 };
  }

  const messageIds: string[] = [];
  const errors: string[] = [];
  for (let index = 0; index < recipients.length; index += 10) {
    const results = await Promise.allSettled(recipients.slice(index, index + 10).map((recipient) => sendOne(recipient, input)));
    results.forEach((result) => result.status === "fulfilled" ? messageIds.push(result.value) : errors.push(result.reason instanceof Error ? result.reason.message : "Email delivery failed"));
  }
  const status = errors.length === 0 ? "sent" : messageIds.length ? "partial" : "failed";
  await EmailLog.create({ ...input, recipientCount: recipients.length, sentCount: messageIds.length, failedCount: errors.length, status, providerMessageIds: messageIds, errorMessage: errors[0] });
  return { status, recipientCount: recipients.length, sentCount: messageIds.length, failedCount: errors.length };
}
