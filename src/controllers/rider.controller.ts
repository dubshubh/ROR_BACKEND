import { Request, Response } from "express";
import { Rider } from "../models/Rider.js";
import { deleteCloudinaryFile, uploadBuffer } from "../services/cloudinary.service.js";
import { dashboardStats, exportRidersCsv, exportRidersExcel, listRiders, type ListOptions } from "../services/rider.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

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

  const [dlFront, dlBack, aadhaarFront, aadhaarBack] = await Promise.all([
    uploadedFiles.dlFront?.[0] ? uploadBuffer(uploadedFiles.dlFront[0], "riders/dl") : Promise.resolve(null),
    uploadedFiles.dlBack?.[0] ? uploadBuffer(uploadedFiles.dlBack[0], "riders/dl") : Promise.resolve(null),
    uploadBuffer(uploadedFiles.aadhaarFront![0], "riders/aadhaar"),
    uploadBuffer(uploadedFiles.aadhaarBack![0], "riders/aadhaar")
  ]);

  const rider = await Rider.create({ ...req.body, dlFront, dlBack, aadhaarFront, aadhaarBack });
  return sendSuccess(res, rider, "Registration submitted", 201);
}

export async function getRiders(req: Request, res: Response) {
  const data = await listRiders(req.query as unknown as ListOptions);
  return sendSuccess(res, data);
}

export async function getRiderById(req: Request, res: Response) {
  const rider = await Rider.findById(req.params.id);
  if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });
  return sendSuccess(res, rider);
}

export async function updateRiderStatus(req: Request, res: Response) {
  const rider = await Rider.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });
  return sendSuccess(res, rider, "Rider status updated");
}

export async function deleteRider(req: Request, res: Response) {
  const rider = await Rider.findByIdAndDelete(req.params.id);
  if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });
  await Promise.all([
    rider.dlFront?.publicId ? deleteCloudinaryFile(rider.dlFront.publicId) : Promise.resolve(),
    rider.dlBack?.publicId ? deleteCloudinaryFile(rider.dlBack.publicId) : Promise.resolve(),
    deleteCloudinaryFile(rider.aadhaarFront.publicId),
    deleteCloudinaryFile(rider.aadhaarBack.publicId)
  ]);
  return sendSuccess(res, null, "Rider deleted");
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
