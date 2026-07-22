import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8)
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().trim().toLowerCase().email() })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().trim().min(40).max(200),
    password: z.string().min(8).max(128)
      .regex(/[a-z]/, "Password requires a lowercase letter")
      .regex(/[A-Z]/, "Password requires an uppercase letter")
      .regex(/\d/, "Password requires a number")
  })
});
