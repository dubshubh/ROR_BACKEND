import { ErrorRequestHandler } from "express";
import multer from "multer";
import { sendError } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (!(err instanceof AppError) || err.statusCode >= 500) console.error(err);
  if (err instanceof AppError) return sendError(res, err.message, err.statusCode, err.code, err.details);
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Uploaded file is too large" : err.message;
    return sendError(res, message, 422, "UPLOAD_ERROR");
  }
  if (err?.message?.includes("files are allowed") || err?.message?.includes("media files are allowed")) {
    return sendError(res, err.message, 422, "UPLOAD_ERROR");
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "field";
    return sendError(res, `${field} already exists`, 409, "CONFLICT");
  }
  if (err instanceof mongoose.Error.CastError) return sendError(res, "Resource not found", 404, "NOT_FOUND");
  if (err instanceof mongoose.Error.ValidationError) return sendError(res, "Database validation failed", 422, "VALIDATION_ERROR");
  const statusCode = typeof err?.statusCode === "number" ? err.statusCode : 500;
  const safeMessage = statusCode < 500 || env.NODE_ENV !== "production" ? err?.message || "Request failed" : "Internal server error";
  return sendError(res, safeMessage, statusCode, statusCode < 500 ? "REQUEST_ERROR" : "INTERNAL_ERROR");
};
