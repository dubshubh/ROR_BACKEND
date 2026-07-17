import { z } from "zod";

export const createPartnerEnquirySchema = z.object({
  body: z.object({
    brandName: z.string().trim().min(2).max(120),
    contactName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(7).max(20),
    website: z.union([z.string().trim().url(), z.literal("")]).default(""),
    category: z.string().trim().min(2).max(100),
    message: z.string().trim().min(10).max(2000)
  })
});

export const updatePartnerEnquirySchema = z.object({
  body: z.object({ status: z.enum(["new", "reviewed"]) })
});
