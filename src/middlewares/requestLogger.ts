import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"].slice(0, 100) : randomUUID();
  const startedAt = process.hrtime.bigint();
  res.setHeader("X-Request-Id", requestId);
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.log(JSON.stringify({ level: "info", requestId, method: req.method, route: req.originalUrl.split("?")[0], status: res.statusCode, durationMs: Number(durationMs.toFixed(1)) }));
  });
  next();
}
