import { z } from "zod";

export const sendAdminEmailSchema = z.object({
  body: z.object({
    audience: z.enum(["approvedRiders", "brands", "all", "custom"]),
    category: z.enum(["ride-update", "brand-collaboration", "brand-thanks", "announcement", "custom"]),
    subject: z.string().trim().min(3).max(200),
    message: z.string().trim().min(10).max(5000),
    customRecipients: z.array(z.string().trim().email()).max(100).default([])
  }).superRefine((body, ctx) => {
    if (body.audience === "custom" && body.customRecipients.length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customRecipients"], message: "Add at least one recipient" });
  })
});

export const listEmailLogsSchema = z.object({ query: z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(10) }) });
