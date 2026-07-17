import { Request, Response } from "express";
import mongoose from "mongoose";
import { ContentItem } from "../models/ContentItem.js";
import { deleteCloudinaryFile, uploadBuffer } from "../services/cloudinary.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

const kinds = ["event", "ride", "brand", "photo", "intercity"] as const;

function parseKind(value: unknown) {
  if (!kinds.includes(value as (typeof kinds)[number])) {
    const error = new Error("Content kind must be event, ride, brand, photo, or intercity") as Error & { statusCode: number };
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
    startLocation: String(body.startLocation ?? "").trim(),
    destination: String(body.destination ?? "").trim(),
    category: String(body.category ?? "").trim(),
    videoUrl: String(body.videoUrl ?? "").trim(),
    status: body.status === "completed" ? "completed" : "upcoming",
    date: body.date ? new Date(String(body.date)) : undefined,
    endDate: body.endDate ? new Date(String(body.endDate)) : undefined,
    sortOrder: Number(body.sortOrder) || 0
  };
}

export async function listPublicContent(_req: Request, res: Response) {
  const items = await ContentItem.find().sort({ sortOrder: 1, date: 1, createdAt: -1 }).lean();
  return sendSuccess(res, {
    rides: items.filter((item) => item.kind === "ride"),
    events: items.filter((item) => item.kind === "event"),
    intercity: items.filter((item) => item.kind === "intercity"),
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
  const files = (req.files as Record<string, Express.Multer.File[]> | undefined) ?? {};
  const images = await Promise.all((files.images ?? []).map((file) => uploadBuffer(file, `site/${kind}s/images`)));
  const videos = await Promise.all((files.videos ?? []).map((file) => uploadBuffer(file, `site/${kind}s/videos`)));
  if (kind === "photo" && !images.length && !videos.length && !data.videoUrl) {
    const error = new Error("A photo or video URL is required") as Error & { statusCode: number };
    error.statusCode = 422;
    throw error;
  }
  const item = await ContentItem.create({ ...data, images, videos, image: images[0] });
  return sendSuccess(res, item, "Content created", 201);
}

export async function updateContent(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Content not found" });
  const item = await ContentItem.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Content not found" });
  const previousImages = item.images.length ? item.images : item.image ? [item.image] : [];
  const previousVideos = item.videos;
  const files = (req.files as Record<string, Express.Multer.File[]> | undefined) ?? {};
  const images = files.images?.length
    ? await Promise.all(files.images.map((file) => uploadBuffer(file, `site/${item.kind}s/images`)))
    : previousImages;
  const videos = files.videos?.length
    ? await Promise.all(files.videos.map((file) => uploadBuffer(file, `site/${item.kind}s/videos`)))
    : previousVideos;
  Object.assign(item, fields(req.body, item.kind), { images, videos, image: images[0] });
  await item.save();
  if (files.images?.length) await Promise.all(previousImages.map((image) => deleteCloudinaryFile(image.publicId)));
  if (files.videos?.length) await Promise.all(previousVideos.map((video) => deleteCloudinaryFile(video.publicId)));
  return sendSuccess(res, item, "Content updated");
}

export async function deleteContent(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Content not found" });
  const item = await ContentItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Content not found" });
  const images = item.images.length ? item.images : item.image ? [item.image] : [];
  await Promise.all([...images, ...item.videos].map((media) => deleteCloudinaryFile(media.publicId)));
  return sendSuccess(res, null, "Content deleted");
}
