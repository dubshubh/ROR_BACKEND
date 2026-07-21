import rateLimit from "express-rate-limit";

function createLimiter(windowMs: number, limit: number, message: string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message, code: "RATE_LIMITED" }
  });
}

export const loginRateLimit = createLimiter(15 * 60 * 1000, 5, "Too many login attempts. Try again later.");
export const registrationRateLimit = createLimiter(60 * 60 * 1000, 10, "Too many registration attempts. Try again later.");
export const enquiryRateLimit = createLimiter(60 * 60 * 1000, 10, "Too many enquiries. Try again later.");
export const adminUploadRateLimit = createLimiter(15 * 60 * 1000, 60, "Too many upload requests. Try again later.");
export const adminEmailRateLimit = createLimiter(15 * 60 * 1000, 10, "Too many email sends. Try again later.");
