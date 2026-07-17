import { connectDb } from "../config/db.js";
import { env } from "../config/env.js";
import { ensureConfiguredAdmin } from "../services/admin.service.js";

await connectDb();

if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
await ensureConfiguredAdmin();

console.log(`Admin seeded: ${env.ADMIN_EMAIL}`);
process.exit(0);
