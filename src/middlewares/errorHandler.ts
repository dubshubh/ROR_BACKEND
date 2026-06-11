import { ErrorRequestHandler } from "express";
import multer from "multer";
import { sendError } from "../utils/apiResponse.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Uploaded file is too large" : err.message;
    return sendError(res, message, 422);
  }
  if (err?.message?.includes("files are allowed") || err?.message?.includes("logo files are allowed")) {
    return sendError(res, err.message, 422);
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "field";
    return sendError(res, `${field} already exists`, 409);
  }
  return sendError(res, err.message || "Internal server error", err.statusCode || 500);
};
