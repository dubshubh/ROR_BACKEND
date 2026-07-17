import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { Admin, AdminDocument } from "../models/Admin.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function loginAdmin(req: Request, res: Response) {
  const email = req.body.email.trim().toLowerCase();
  const admin = (await Admin.findOne({ email })) as AdminDocument | null;
  if (!admin || !(await admin.comparePassword(req.body.password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const signOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  const token = jwt.sign({ id: admin._id, role: admin.role }, env.JWT_SECRET, signOptions);
  return sendSuccess(res, { token, admin: { id: admin._id, email: admin.email, role: admin.role } }, "Logged in");
}
