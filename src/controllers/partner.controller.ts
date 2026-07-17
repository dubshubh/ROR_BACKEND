import { Request, Response } from "express";
import mongoose from "mongoose";
import { PartnerEnquiry } from "../models/PartnerEnquiry.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function createPartnerEnquiry(req: Request, res: Response) {
  const enquiry = await PartnerEnquiry.create(req.body);
  return sendSuccess(res, enquiry, "Partnership enquiry submitted", 201);
}

export async function listPartnerEnquiries(req: Request, res: Response) {
  const filter = req.query.status === "new" || req.query.status === "reviewed" ? { status: req.query.status } : {};
  const enquiries = await PartnerEnquiry.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, enquiries);
}

export async function updatePartnerEnquiry(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Enquiry not found" });
  const enquiry = await PartnerEnquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
  return sendSuccess(res, enquiry, "Enquiry status updated");
}

export async function deletePartnerEnquiry(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Enquiry not found" });
  const enquiry = await PartnerEnquiry.findByIdAndDelete(req.params.id);
  if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
  return sendSuccess(res, null, "Enquiry deleted");
}
