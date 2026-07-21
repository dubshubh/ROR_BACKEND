import { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendError(res: Response, message = "Error", statusCode = 500, code = "INTERNAL_ERROR", errors?: unknown) {
  return res.status(statusCode).json({ success: false, message, code, ...(errors === undefined ? {} : { errors }) });
}
