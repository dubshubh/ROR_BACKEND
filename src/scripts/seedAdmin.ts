import { connectDb } from "../config/db.js";
import { env } from "../config/env.js";
import { Admin } from "../models/Admin.js";

await connectDb();

if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
}

const existingAdmin = await Admin.findOne({ email: env.ADMIN_EMAIL });
if (existingAdmin) {
  existingAdmin.password = env.ADMIN_PASSWORD;
  existingAdmin.role = "admin";
  await existingAdmin.save();
} else {
  await Admin.create({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, role: "admin" });
}

console.log(`Admin seeded: ${env.ADMIN_EMAIL}`);
process.exit(0);
