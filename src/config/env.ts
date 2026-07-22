import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  AUTH_COOKIE_NAME: z.string().min(1).default("ror_admin_session"),
  AUTH_COOKIE_MAX_AGE_MS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60 * 1000),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_DOMAIN: z.string().trim().optional(),
  TRUST_PROXY: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  FRONTEND_URL: z.string().min(1).default("http://localhost:3000"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  EMAIL_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  BREVO_API_KEY: z.string().trim().optional(),
  BREVO_SENDER_EMAIL: z.string().email().default("rebelsonroads@gmail.com"),
  BREVO_SENDER_NAME: z.string().trim().min(1).default("Rebels on Roads"),
  BREVO_REPLY_TO_EMAIL: z.string().email().default("rebelsonroads@gmail.com")
  ,WHATSAPP_GROUP_URL: z.string().url().optional()
  ,INSTAGRAM_URL: z.string().url().optional()
}).superRefine((values, ctx) => {
  if (values.EMAIL_ENABLED && !values.BREVO_API_KEY) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["BREVO_API_KEY"], message: "BREVO_API_KEY is required when EMAIL_ENABLED=true" });
});

export const env = envSchema.parse(process.env);
