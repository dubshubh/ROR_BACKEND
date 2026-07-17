import { Request, Response } from "express";
import mongoose from "mongoose";
import { ContentItem } from "../models/ContentItem.js";
import { deleteCloudinaryFile, uploadBuffer } from "../services/cloudinary.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

const kinds = ["ride", "photo", "brand"] as const;

function parseKind(value: unknown) {
  if (!kinds.includes(value as (typeof kinds)[number])) {
    const error = new Error("Content kind must be ride, photo, or brand") as Error & { statusCode: number };
    error.statusCode = 422;
    throw error;
  }
  return value as (typeof kinds)[number];
}

function fields(body: Record<string, unknown>, kind: string) {
  const title = String(body.title ?? "").trim();
  if (!title) {
    const error = new Error("Title is required") as Error & { statusCode: number };
    error.statusCode = 422;
    throw error;
  }
  return {
    kind,
    title,
    description: String(body.description ?? "").trim(),
    location: String(body.location ?? "").trim(),
    category: String(body.category ?? "").trim(),
    status: body.status === "completed" ? "completed" : "upcoming",
    date: body.date ? new Date(String(body.date)) : undefined,
    sortOrder: Number(body.sortOrder) || 0
  };
}

export async function listPublicContent(_req: Request, res: Response) {
  const items = await ContentItem.find().sort({ sortOrder: 1, date: 1, createdAt: -1 }).lean();
  return sendSuccess(res, {
    rides: items.filter((item) => item.kind === "ride"),
    photos: items.filter((item) => item.kind === "photo"),
    brands: items.filter((item) => item.kind === "brand")
  });
}

export async function listAdminContent(req: Request, res: Response) {
  const kind = req.query.kind ? parseKind(req.query.kind) : undefined;
  const items = await ContentItem.find(kind ? { kind } : {}).sort({ kind: 1, sortOrder: 1, createdAt: -1 });
  return sendSuccess(res, items);
}

export async function createContent(req: Request, res: Response) {
  const kind = parseKind(req.params.kind);
  const data = fields(req.body, kind);
  const image = req.file ? await uploadBuffer(req.file, `site/${kind}s`) : undefined;
  if (kind === "photo" && !image) {
    const error = new Error("An event photo is required") as Error & { statusCode: number };
    error.statusCode = 422;
    throw error;
  }
  const item = await ContentItem.create({ ...data, image });
  return sendSuccess(res, item, "Content created", 201);
}

export async function updateContent(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Content not found" });
  const item = await ContentItem.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Content not found" });
  const previousImage = item.image;
  const image = req.file ? await uploadBuffer(req.file, `site/${item.kind}s`) : previousImage;
  Object.assign(item, fields(req.body, item.kind), { image });
  await item.save();
  if (req.file && previousImage?.publicId) await deleteCloudinaryFile(previousImage.publicId);
  return sendSuccess(res, item, "Content updated");
}

export async function deleteContent(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Content not found" });
  const item = await ContentItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Content not found" });
  if (item.image?.publicId) await deleteCloudinaryFile(item.image.publicId);
  return sendSuccess(res, null, "Content deleted");
}
