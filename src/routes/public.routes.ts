import { Router } from "express";
import { createRider } from "../controllers/rider.controller.js";
import { listPublicContent } from "../controllers/content.controller.js";
import { getPublicSettings } from "../controllers/settings.controller.js";
import { upload } from "../middlewares/upload.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createRiderSchema } from "../validators/rider.validator.js";
import { createPartnerEnquiry } from "../controllers/partner.controller.js";
import { createPartnerEnquirySchema } from "../validators/partner.validator.js";
import { enquiryRateLimit, registrationRateLimit } from "../middlewares/rateLimits.js";

export const publicRoutes = Router();

publicRoutes.get("/settings", asyncHandler(getPublicSettings));
publicRoutes.get("/content", asyncHandler(listPublicContent));
publicRoutes.post("/partner-enquiries", enquiryRateLimit, validate(createPartnerEnquirySchema), asyncHandler(createPartnerEnquiry));

publicRoutes.post(
  "/riders",
  registrationRateLimit,
  upload.fields([
    { name: "dlFront", maxCount: 1 },
    { name: "dlBack", maxCount: 1 },
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 }
  ]),
  validate(createRiderSchema),
  asyncHandler(createRider)
);
