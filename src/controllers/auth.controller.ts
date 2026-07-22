import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { Admin, AdminDocument } from "../models/Admin.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { authCookieOptions } from "../utils/cookies.js";
import { recordAudit } from "../services/audit.service.js";

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
