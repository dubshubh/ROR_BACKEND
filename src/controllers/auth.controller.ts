import { Request, Response } from "express";
import { createHash, randomBytes } from "node:crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { Admin, AdminDocument } from "../models/Admin.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { authCookieOptions } from "../utils/cookies.js";
import { recordAudit } from "../services/audit.service.js";
import { sendEmail } from "../services/email.service.js";

const ADMIN_EMAIL = "rebelsonroads@gmail.com";

export async function loginAdmin(req: Request, res: Response) {
  const email = req.body.email.trim().toLowerCase();
  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }
  const admin = (await Admin.findOne({ email })) as AdminDocument | null;
  if (!admin || !(await admin.comparePassword(req.body.password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const signOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  const token = jwt.sign({ id: admin._id, role: admin.role }, env.JWT_SECRET, signOptions);
  res.cookie(env.AUTH_COOKIE_NAME, token, authCookieOptions);
  await recordAudit({ adminId: admin.id, action: "admin.login", entityType: "admin", entityId: admin.id });
  return sendSuccess(res, { admin: { id: admin._id, email: admin.email, role: admin.role } }, "Logged in");
}

export function getCurrentAdmin(req: Request, res: Response) {
  return sendSuccess(res, { admin: req.admin }, "Authenticated admin fetched");
}

export function logoutAdmin(_req: Request, res: Response) {
  const { maxAge: _maxAge, ...clearOptions } = authCookieOptions;
  res.clearCookie(env.AUTH_COOKIE_NAME, clearOptions);
  return sendSuccess(res, null, "Logged out");
}

export async function forgotAdminPassword(req: Request, res: Response) {
  const genericMessage = "If this address belongs to an administrator, a reset link has been sent.";
  const email = String(req.body.email).trim().toLowerCase();
  const admin = (await Admin.findOne({ email }).select("+passwordResetToken +passwordResetExpires")) as AdminDocument | null;
  if (!admin || email !== ADMIN_EMAIL) return sendSuccess(res, null, genericMessage);

  const token = randomBytes(32).toString("hex");
  admin.passwordResetToken = createHash("sha256").update(token).digest("hex");
  admin.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await admin.save({ validateBeforeSave: false });
  const frontendOrigin = env.FRONTEND_URL.split(",")[0].trim().replace(/\/$/, "");
  const resetUrl = `${frontendOrigin}/admin/reset-password?token=${token}`;

  try {
    await sendEmail({
      recipients: [{ email: ADMIN_EMAIL, name: "Rebels on Roads Admin" }],
      subject: "Reset your Rebels on Roads admin password",
      htmlContent: `<div style="font-family:Arial,sans-serif;background:#0b0b0b;color:#f4e4d5;padding:32px"><h1 style="color:#ff535b">Password reset</h1><p>A password reset was requested for the Rebels on Roads admin panel.</p><p><a href="${resetUrl}" style="display:inline-block;background:#d91b1b;color:#fff;padding:14px 22px;text-decoration:none">Reset password</a></p><p>This secure link expires in 30 minutes. If you did not request this, ignore this email.</p></div>`,
      textContent: `Reset your Rebels on Roads admin password: ${resetUrl}\nThis link expires in 30 minutes.`,
      category: "password-reset",
      audience: "admin",
      source: "automation",
      relatedEntityType: "admin",
      relatedEntityId: admin.id
    });
    await recordAudit({ adminId: admin.id, action: "admin.password-reset-requested", entityType: "admin", entityId: admin.id });
  } catch (error) {
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save({ validateBeforeSave: false });
    throw error;
  }

  const developmentData = env.NODE_ENV === "development" && !env.EMAIL_ENABLED ? { previewResetUrl: resetUrl } : null;
  return sendSuccess(res, developmentData, genericMessage);
}

export async function resetAdminPassword(req: Request, res: Response) {
  const tokenHash = createHash("sha256").update(String(req.body.token)).digest("hex");
  const admin = (await Admin.findOne({ passwordResetToken: tokenHash, passwordResetExpires: { $gt: new Date() } }).select("+passwordResetToken +passwordResetExpires")) as AdminDocument | null;
  if (!admin) return res.status(400).json({ success: false, message: "This reset link is invalid or has expired" });
  admin.password = req.body.password;
  admin.passwordResetToken = undefined;
  admin.passwordResetExpires = undefined;
  await admin.save();
  const { maxAge: _maxAge, ...clearOptions } = authCookieOptions;
  res.clearCookie(env.AUTH_COOKIE_NAME, clearOptions);
  await recordAudit({ adminId: admin.id, action: "admin.password-reset-completed", entityType: "admin", entityId: admin.id });
  return sendSuccess(res, null, "Password updated successfully");
}
