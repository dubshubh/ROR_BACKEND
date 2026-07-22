import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { publicRoutes } from "./routes/public.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { AppError } from "./utils/appError.js";
import { isRorVercelOrigin } from "./utils/cors.js";

export const app = express();

if (env.TRUST_PROXY) app.set("trust proxy", 1);
app.use(requestLogger);
app.use(helmet());
const configuredOrigins = env.CORS_ORIGINS || env.FRONTEND_URL;
const configuredOriginRules = configuredOrigins
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOriginRules.filter((origin) => !origin.includes("*")),
  ...(env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"]
    : [])
]);
const allowedOriginPatterns = configuredOriginRules
  .filter((origin) => origin.includes("*"))
  .map((origin) => {
    const escaped = origin.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^${escaped.replace(/\*/g, "[^.]+")}$`);
  });

function isAllowedOrigin(origin: string) {
  const normalizedOrigin = origin.replace(/\/$/, "");
  if (allowedOrigins.has(normalizedOrigin)) return true;
  if (allowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin))) return true;
  // Vercel generates a new hostname for every preview deployment. Restrict the
  // fallback to this project's deployment prefix instead of trusting all of vercel.app.
  if (isRorVercelOrigin(normalizedOrigin)) return true;

  if (env.NODE_ENV === "development") {
    try {
      return new URL(normalizedOrigin).hostname.endsWith(".trycloudflare.com");
    } catch {
      return false;
    }
  }

  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) return callback(null, true);
      return callback(new AppError(`CORS blocked origin: ${origin}`, 403, "CORS_ORIGIN_BLOCKED"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get("/health", (_req, res) => res.json({ success: true, message: "OK" }));
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use(errorHandler);
