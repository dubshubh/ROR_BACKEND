import { Router } from "express";
import { getCurrentAdmin, loginAdmin, logoutAdmin } from "../controllers/auth.controller.js";
import {
  deleteRider,
  bulkDeleteRiders,
  exportCsv,
  exportExcel,
  getDashboardStats,
  getRiderById,
  streamRiderDocument,
  getRiders,
  updateRiderStatus
} from "../controllers/rider.controller.js";
import { updateCommandCenter, updateLogo } from "../controllers/settings.controller.js";
import { createContent, deleteContent, listAdminContent, updateContent } from "../controllers/content.controller.js";
import { requireAdmin } from "../middlewares/auth.js";
import { contentMediaUpload, logoUpload } from "../middlewares/upload.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginSchema } from "../validators/admin.validator.js";
import { bulkDeleteRidersSchema, listRidersSchema, updateStatusSchema } from "../validators/rider.validator.js";
import { deletePartnerEnquiry, listPartnerEnquiries, updatePartnerEnquiry } from "../controllers/partner.controller.js";
import { listPartnerEnquiriesSchema, updatePartnerEnquirySchema } from "../validators/partner.validator.js";
import { adminEmailRateLimit, adminUploadRateLimit, loginRateLimit } from "../middlewares/rateLimits.js";
import { listEmailLogs, sendAdminEmail } from "../controllers/email.controller.js";
import { listEmailLogsSchema, sendAdminEmailSchema } from "../validators/email.validator.js";

export const adminRoutes = Router();

adminRoutes.post("/login", loginRateLimit, validate(loginSchema), asyncHandler(loginAdmin));
adminRoutes.use(asyncHandler(requireAdmin));
adminRoutes.get("/me", getCurrentAdmin);
adminRoutes.post("/logout", logoutAdmin);
adminRoutes.get("/stats", asyncHandler(getDashboardStats));
adminRoutes.get("/emails", validate(listEmailLogsSchema), asyncHandler(listEmailLogs));
adminRoutes.post("/emails/send", adminEmailRateLimit, validate(sendAdminEmailSchema), asyncHandler(sendAdminEmail));
adminRoutes.get("/content", asyncHandler(listAdminContent));
adminRoutes.post("/content/:kind", adminUploadRateLimit, contentMediaUpload.fields([{ name: "images", maxCount: 8 }, { name: "videos", maxCount: 2 }]), asyncHandler(createContent));
adminRoutes.put("/content/:id", adminUploadRateLimit, contentMediaUpload.fields([{ name: "images", maxCount: 8 }, { name: "videos", maxCount: 2 }]), asyncHandler(updateContent));
adminRoutes.delete("/content/:id", asyncHandler(deleteContent));
adminRoutes.patch("/settings/logo", adminUploadRateLimit, logoUpload.single("logo"), asyncHandler(updateLogo));
adminRoutes.patch("/settings/command-center", asyncHandler(updateCommandCenter));
adminRoutes.get("/partner-enquiries", validate(listPartnerEnquiriesSchema), asyncHandler(listPartnerEnquiries));
adminRoutes.patch("/partner-enquiries/:id", validate(updatePartnerEnquirySchema), asyncHandler(updatePartnerEnquiry));
adminRoutes.delete("/partner-enquiries/:id", asyncHandler(deletePartnerEnquiry));
adminRoutes.get("/riders", validate(listRidersSchema), asyncHandler(getRiders));
adminRoutes.delete("/riders", validate(bulkDeleteRidersSchema), asyncHandler(bulkDeleteRiders));
adminRoutes.get("/riders/export/csv", asyncHandler(exportCsv));
adminRoutes.get("/riders/export/excel", asyncHandler(exportExcel));
adminRoutes.get("/riders/:id/documents/:field", asyncHandler(streamRiderDocument));
adminRoutes.get("/riders/:id", asyncHandler(getRiderById));
adminRoutes.patch("/riders/:id/status", validate(updateStatusSchema), asyncHandler(updateRiderStatus));
adminRoutes.delete("/riders/:id", asyncHandler(deleteRider));
