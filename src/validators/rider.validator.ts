import { z } from "zod";

const indianPhone = /^[6-9]\d{9}$/;
const status = z.enum(["pending", "approved", "rejected"]);
const booleanFromForm = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());
const optionalString = z.preprocess((value) => (value === "" ? undefined : value), z.string().optional());

function isAtLeast18(date: Date) {
  const today = new Date();
  const minDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return date <= minDob;
}

export const createRiderSchema = z.object({
  body: z.object({
    fullName: z.string().min(3),
    email: z.string().email(),
    phone: z.string().regex(indianPhone, "Enter a valid Indian phone number"),
    dob: z.coerce.date().refine(isAtLeast18, "Rider must be at least 18 years old"),
    gender: z.string().min(1),
    bloodGroup: z.string().min(1),
    emergencyContact: z.string().regex(indianPhone, "Enter a valid Indian emergency contact"),
    city: z.string().min(1),
    state: z.string().min(1),
    bikeModel: z.string().min(1),
    bikeNumber: z.string().min(1),
    ridingExperience: z.coerce.number().min(0),
    dlNumber: optionalString,
    aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
    joinedOtherGroupBefore: booleanFromForm,
    previousGroupLeaveReason: z.string().optional().default(""),
    joinReason: z.string().optional().default(""),
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
    limit: z.coerce.number().min(1).max(1000).default(1000),
    search: z.string().optional(),
    status: status.optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    sortBy: z.enum(["fullName", "email", "phone", "city", "bikeNumber", "status", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc")
  })
});

export const updateStatusSchema = z.object({
  body: z.object({ status })
});
