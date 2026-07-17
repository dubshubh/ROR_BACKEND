import { Router } from "express";
import { loginAdmin } from "../controllers/auth.controller.js";
import {
  deleteRider,
  exportCsv,
  exportExcel,
  getDashboardStats,
  getRiderById,
  getRiders,
  updateRiderStatus
} from "../controllers/rider.controller.js";
import { updateCommandCenter, updateLogo } from "../controllers/settings.controller.js";
import { createContent, deleteContent, listAdminContent, updateContent } from "../controllers/content.controller.js";
import { requireAdmin } from "../middlewares/auth.js";
import { imageUpload, logoUpload } from "../middlewares/upload.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginSchema } from "../validators/admin.validator.js";
import { listRidersSchema, updateStatusSchema } from "../validators/rider.validator.js";

export const adminRoutes = Router();

adminRoutes.post("/login", validate(loginSchema), asyncHandler(loginAdmin));
adminRoutes.use(asyncHandler(requireAdmin));
adminRoutes.get("/stats", asyncHandler(getDashboardStats));
adminRoutes.get("/content", asyncHandler(listAdminContent));
adminRoutes.post("/content/:kind", imageUpload.single("image"), asyncHandler(createContent));
adminRoutes.put("/content/:id", imageUpload.single("image"), asyncHandler(updateContent));
adminRoutes.delete("/content/:id", asyncHandler(deleteContent));
adminRoutes.patch("/settings/logo", logoUpload.single("logo"), asyncHandler(updateLogo));
adminRoutes.patch("/settings/command-center", asyncHandler(updateCommandCenter));
adminRoutes.get("/riders", validate(listRidersSchema), asyncHandler(getRiders));
adminRoutes.get("/riders/export/csv", asyncHandler(exportCsv));
adminRoutes.get("/riders/export/excel", asyncHandler(exportExcel));
adminRoutes.get("/riders/:id", asyncHandler(getRiderById));
adminRoutes.patch("/riders/:id/status", validate(updateStatusSchema), asyncHandler(updateRiderStatus));
adminRoutes.delete("/riders/:id", asyncHandler(deleteRider));
