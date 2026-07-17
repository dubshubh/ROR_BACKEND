import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureConfiguredAdmin } from "./services/admin.service.js";

connectDb()
  .then(async () => {
    await ensureConfiguredAdmin();
    app.listen(env.PORT, () => console.log(`API running on port ${env.PORT}`));
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
