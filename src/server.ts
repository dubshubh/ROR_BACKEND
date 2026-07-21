import { app } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureConfiguredAdmin } from "./services/admin.service.js";

connectDb()
  .then(async () => {
    await ensureConfiguredAdmin();
    const server = app.listen(env.PORT, () => console.log(`API running on port ${env.PORT}`));
    let shuttingDown = false;
    const shutdown = (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`${signal} received; shutting down`);
      server.close(() => {
        disconnectDb()
          .then(() => process.exit(0))
          .catch((error: unknown) => {
            console.error("Failed to close MongoDB connection", error);
            process.exit(1);
          });
      });
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
