import { Request, Response } from "express";
import { Rider } from "../models/Rider.js";
import { deleteAssets, rollbackUploadedAssets, uploadAssets, type UploadRequest } from "../services/cloudinary.service.js";
import { dashboardStats, exportRidersCsv, exportRidersExcel, listRiders, type ListOptions } from "../services/rider.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { maskAadhaar } from "../utils/mask.js";
import { recordAudit } from "../services/audit.service.js";
import { Readable } from "node:stream";
import { sendEmail } from "../services/email.service.js";
import { registrationReceivedTemplate, riderApprovedTemplate, riderContactAgainTemplate, riderPendingTemplate, riderRejectedTemplate } from "../services/email-template.service.js";
import { env } from "../config/env.js";

async function sendAutomationSafely(input: Parameters<typeof sendEmail>[0]) {
  try { await sendEmail(input); }
  catch (error) { console.error("Automated email failed", error); }
}

const requiredFiles = ["aadhaarFront", "aadhaarBack"] as const;
const optionalFiles = ["dlFront", "dlBack"] as const;

export async function createRider(req: Request, res: Response) {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  for (const field of requiredFiles) {
    if (!files?.[field]?.[0]) {
      return res.status(422).json({ success: false, message: `${field} is required` });
    }
  }

  const duplicate = await Rider.findOne({
    $or: [
      { email: req.body.email },
      { phone: req.body.phone },
      { aadhaarNumber: req.body.aadhaarNumber },
      ...(req.body.dlNumber ? [{ dlNumber: req.body.dlNumber }] : [])
    ]
  }).lean();

  if (duplicate) {
    const duplicateField =
      duplicate.email === req.body.email
        ? "email"
        : duplicate.phone === req.body.phone
          ? "phone"
          : duplicate.aadhaarNumber === req.body.aadhaarNumber
            ? "aadhaarNumber"
            : "dlNumber";

    return res.status(409).json({ success: false, message: `${duplicateField} already exists` });
  }

  const uploadedFiles = files as Record<(typeof requiredFiles)[number] | (typeof optionalFiles)[number], Express.Multer.File[] | undefined>;

  const requests: Array<UploadRequest & { field: (typeof requiredFiles)[number] | (typeof optionalFiles)[number] }> = [];
  for (const field of [...optionalFiles, ...requiredFiles]) {
    const file = uploadedFiles[field]?.[0];
    if (file) requests.push({ field, file, folder: field.startsWith("dl") ? "riders/dl" : "riders/aadhaar" });
  }
  const uploaded = await uploadAssets(requests);
  const assets = Object.fromEntries(requests.map((request, index) => [request.field, uploaded[index]]));

  try {
    const rider = await Rider.create({ ...req.body, ...assets });
    await sendAutomationSafely({
      recipients: [{ email: rider.email, name: rider.fullName }],
      subject: "We received your Rebels on Roads application",
      htmlContent: registrationReceivedTemplate(rider.fullName),
      textContent: `Hello ${rider.fullName},\n\nWe received your Rebels on Roads application. It is pending admin verification. You will receive a separate welcome email only after approval.`,
      category: "rider-registration",
      audience: "rider",
      source: "automation",
      relatedEntityType: "rider",
      relatedEntityId: rider.id
    });
    return sendSuccess(res, { id: rider.id, status: rider.status }, "Registration submitted", 201);
  } catch (error) {
    await rollbackUploadedAssets(uploaded);
    throw error;
  }
}

export async function getRiders(req: Request, res: Response) {
  const data = await listRiders(req.query as unknown as ListOptions);
  return sendSuccess(res, data);
}

export async function getRiderById(req: Request, res: Response) {
  const rider = await Rider.findById(req.params.id).lean();
  if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });
  const { aadhaarFront, aadhaarBack, dlFront, dlBack, ...safeRider } = rider;
  return sendSuccess(res, {
    ...safeRider,
    aadhaarNumber: maskAadhaar(rider.aadhaarNumber),
    aadhaarFront: { available: true, kind: aadhaarFront.url.toLowerCase().includes(".pdf") ? "pdf" : "image" },
    aadhaarBack: { available: true, kind: aadhaarBack.url.toLowerCase().includes(".pdf") ? "pdf" : "image" },
    dlFront: { available: Boolean(dlFront), kind: dlFront?.url.toLowerCase().includes(".pdf") ? "pdf" : "image" },
    dlBack: { available: Boolean(dlBack), kind: dlBack?.url.toLowerCase().includes(".pdf") ? "pdf" : "image" }
  });
}

const documentFields = ["aadhaarFront", "aadhaarBack", "dlFront", "dlBack"] as const;
type DocumentField = (typeof documentFields)[number];

export async function streamRiderDocument(req: Request, res: Response) {
  const field = req.params.field as DocumentField;
  if (!documentFields.includes(field)) return res.status(404).json({ success: false, message: "Document not found" });
  const rider = await Rider.findById(req.params.id).select(documentFields.join(" "));
  const document = rider?.[field];
  if (!document) return res.status(404).json({ success: false, message: "Document not found" });
  const upstream = await fetch(document.url);
  if (!upstream.ok || !upstream.body) return res.status(502).json({ success: false, message: "Document is temporarily unavailable" });
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Disposition", "inline");
  Readable.fromWeb(upstream.body as import("node:stream/web").ReadableStream).pipe(res);
}

export async function updateRiderStatus(req: Request, res: Response) {
  const rider = await Rider.findById(req.params.id);
  if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });
  rider.status = req.body.status;
  rider.adminRemark = req.body.remark;
  await rider.save();
  await recordAudit({ adminId: req.admin?.id, action: `rider.${req.body.status}`, entityType: "rider", entityId: rider.id, metadata: { status: req.body.status, remark: req.body.remark } });
  const origin = env.FRONTEND_URL.split(",")[0]?.trim() || "http://localhost:3000";
  const messages = {
    approved: { subject:"Welcome to Rebels on Roads — application approved", html:riderApprovedTemplate(rider.fullName,origin,rider.adminRemark,env.WHATSAPP_GROUP_URL,env.INSTAGRAM_URL), text:`Welcome ${rider.fullName}! Your application is approved.${rider.adminRemark ? ` Admin note: ${rider.adminRemark}` : ""}${env.WHATSAPP_GROUP_URL ? ` WhatsApp: ${env.WHATSAPP_GROUP_URL}` : ""}${env.INSTAGRAM_URL ? ` Instagram: ${env.INSTAGRAM_URL}` : ""}` },
    rejected: { subject:"An update on your Rebels on Roads application", html:riderRejectedTemplate(rider.fullName,rider.adminRemark), text:`Hello ${rider.fullName}. We cannot approve your application at this time.${rider.adminRemark ? ` Review note: ${rider.adminRemark}` : ""}` },
    contact_again: { subject:"Action needed — update your rider application", html:riderContactAgainTemplate(rider.fullName,origin,rider.adminRemark), text:`Hello ${rider.fullName}. Please apply again with corrected information.${rider.adminRemark ? ` What needs attention: ${rider.adminRemark}` : ""}` },
    pending: { subject:"Your Rebels on Roads application is pending", html:riderPendingTemplate(rider.fullName,rider.adminRemark), text:`Hello ${rider.fullName}. Your application is pending.${rider.adminRemark ? ` Admin note: ${rider.adminRemark}` : ""}` }
  } as const;
  const message = messages[rider.status];
  await sendAutomationSafely({ recipients:[{email:rider.email,name:rider.fullName}],subject:message.subject,htmlContent:message.html,textContent:message.text,category:`rider-${rider.status}`,audience:"rider",source:"automation",relatedEntityType:"rider",relatedEntityId:rider.id });
  return sendSuccess(res, { id: rider.id, status: rider.status, adminRemark: rider.adminRemark }, "Rider status updated and email queued");
}

export async function deleteRider(req: Request, res: Response) {
  const rider = await Rider.findByIdAndDelete(req.params.id);
  if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });
  await deleteAssets([rider.dlFront, rider.dlBack, rider.aadhaarFront, rider.aadhaarBack]);
  await recordAudit({ adminId: req.admin?.id, action: "rider.deleted", entityType: "rider", entityId: rider.id });
  return sendSuccess(res, null, "Rider deleted");
}

export async function bulkDeleteRiders(req: Request, res: Response) {
  const riders = await Rider.find({ _id: { $in: req.body.ids } });
  if (!riders.length) return res.status(404).json({ success: false, message: "No riders found" });
  await Rider.deleteMany({ _id: { $in: riders.map((rider) => rider._id) } });
  await deleteAssets(riders.flatMap((rider) => [rider.dlFront, rider.dlBack, rider.aadhaarFront, rider.aadhaarBack]));
  await Promise.all(riders.map((rider) => recordAudit({ adminId:req.admin?.id,action:"rider.bulk-deleted",entityType:"rider",entityId:rider.id })));
  return sendSuccess(res, { deleted:riders.length }, `${riders.length} riders deleted`);
}

export async function getDashboardStats(_req: Request, res: Response) {
  return sendSuccess(res, await dashboardStats());
}

export async function exportCsv(_req: Request, res: Response) {
  const csv = await exportRidersCsv();
  res.header("Content-Type", "text/csv");
  res.attachment("riders.csv");
  return res.send(csv);
}

export async function exportExcel(_req: Request, res: Response) {
  const buffer = await exportRidersExcel();
  res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.attachment("riders.xlsx");
  return res.send(buffer);
}
