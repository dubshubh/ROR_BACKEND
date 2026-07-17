import { env } from "../config/env.js";
import { Admin, type AdminDocument } from "../models/Admin.js";

export async function ensureConfiguredAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return null;

  const email = env.ADMIN_EMAIL.trim().toLowerCase();
  const existingAdmin = (await Admin.findOne({ email })) as AdminDocument | null;

  if (existingAdmin) {
    // Avoid re-hashing the password at every startup when it is already correct.
    if (!(await existingAdmin.comparePassword(env.ADMIN_PASSWORD)) || existingAdmin.role !== "admin") {
      existingAdmin.password = env.ADMIN_PASSWORD;
      existingAdmin.role = "admin";
      await existingAdmin.save();
    }
    return existingAdmin;
  }

  return Admin.create({ email, password: env.ADMIN_PASSWORD, role: "admin" });
}
