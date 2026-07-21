import type { CookieOptions, Request } from "express";
import { env } from "../config/env.js";

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.COOKIE_SAME_SITE,
  maxAge: env.AUTH_COOKIE_MAX_AGE_MS,
  path: "/",
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
};

export function readCookie(req: Request, name: string) {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}
