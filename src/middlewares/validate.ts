import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) {
      const errors = result.error.flatten();
      const firstFieldError = Object.values(errors.fieldErrors).flat()[0];
      return res.status(422).json({
        success: false,
        message: firstFieldError ?? "Validation failed",
        errors
      });
    }
    req.body = result.data.body ?? req.body;
    req.query = result.data.query ?? req.query;
    next();
  };
}
