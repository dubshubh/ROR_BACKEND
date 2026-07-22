import { z } from "zod";

const indianPhone = /^[6-9]\d{9}$/;
const status = z.enum(["pending", "approved", "rejected", "contact_again"]);
const booleanFromForm = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());
const optionalLicense = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(5).max(30).regex(/^[A-Za-z0-9 -]+$/, "Enter a valid driving licence number").transform((value) => value.toUpperCase()).optional()
);

function isAtLeast18(date: Date) {
  const today = new Date();
  const minDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return date <= minDob;
}

export const createRiderSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(3).max(100),
    email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
    phone: z.string().trim().regex(indianPhone, "Enter a valid Indian phone number"),
    dob: z.coerce.date().refine(isAtLeast18, "Rider must be at least 18 years old"),
    gender: z.enum(["Male", "Female", "Other"]),
    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
    emergencyContact: z.string().trim().regex(indianPhone, "Enter a valid Indian emergency contact"),
    city: z.string().trim().min(1).max(80),
    state: z.string().trim().min(1).max(80),
    bikeModel: z.string().trim().min(1).max(100),
    bikeNumber: z.string().trim().min(6).max(20).regex(/^[A-Za-z0-9 -]+$/, "Enter a valid bike number").transform((value) => value.toUpperCase()),
    ridingExperience: z.coerce.number().min(0).max(80),
    dlNumber: optionalLicense,
    aadhaarNumber: z.string().trim().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
    joinedOtherGroupBefore: booleanFromForm,
    previousGroupLeaveReason: z.string().trim().max(1000).optional().default(""),
    joinReason: z.string().trim().max(1000).optional().default(""),
    terms: booleanFromForm.refine(Boolean, "Terms must be accepted")
  }).superRefine((body, ctx) => {
    if (body.joinedOtherGroupBefore && !body.previousGroupLeaveReason.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["previousGroupLeaveReason"],
        message: "Reason to leave previous group is required"
      });
    }
  })
});

export const listRidersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(25),
    search: z.string().trim().max(100).optional(),
    status: status.optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    sortBy: z.enum(["fullName", "email", "phone", "city", "bikeNumber", "status", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc")
  })
});

export const updateStatusSchema = z.object({ body: z.object({ status, remark: z.string().trim().max(1000).optional().default("") }) });
export const bulkDeleteRidersSchema = z.object({ body: z.object({ ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(100) }) });
