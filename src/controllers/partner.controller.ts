import { Request, Response } from "express";
import mongoose from "mongoose";
import { PartnerEnquiry } from "../models/PartnerEnquiry.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { escapeRegex } from "../utils/regex.js";
import { recordAudit } from "../services/audit.service.js";

export async function createPartnerEnquiry(req: Request, res: Response) {
  const enquiry = await PartnerEnquiry.create(req.body);
  return sendSuccess(res, enquiry, "Partnership enquiry submitted", 201);
}

export async function listPartnerEnquiries(req: Request, res: Response) {
  const { page, limit, status, search } = req.query as unknown as { page: number; limit: number; status?: "new" | "reviewed"; search?: string };
  const filter: Record<string, unknown> = status ? { status } : {};
  if (search) {
    const expression = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ brandName: expression }, { contactName: expression }, { email: expression }, { category: expression }];
  }
  const [enquiries, total] = await Promise.all([
    PartnerEnquiry.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    PartnerEnquiry.countDocuments(filter)
  ]);
  return sendSuccess(res, { enquiries, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function updatePartnerEnquiry(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Enquiry not found" });
  const enquiry = await PartnerEnquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
  await recordAudit({ adminId: req.admin?.id, action: "partner-enquiry.status-updated", entityType: "partner-enquiry", entityId: enquiry.id, metadata: { status: req.body.status } });
  return sendSuccess(res, enquiry, "Enquiry status updated");
}

export async function deletePartnerEnquiry(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Enquiry not found" });
  const enquiry = await PartnerEnquiry.findByIdAndDelete(req.params.id);
  if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
  await recordAudit({ adminId: req.admin?.id, action: "partner-enquiry.deleted", entityType: "partner-enquiry", entityId: enquiry.id });
  return sendSuccess(res, null, "Enquiry deleted");
}
