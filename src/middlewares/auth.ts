import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Admin } from "../models/Admin.js";

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; role: "admin"; email: string };
    }
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ success: false, message: "Authentication required" });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; role: "admin" };
    const admin = await Admin.findById(payload.id).select("email role");
    if (!admin || admin.role !== "admin") return res.status(403).json({ success: false, message: "Forbidden" });
    req.admin = { id: admin.id, role: "admin", email: admin.email };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
