import { Request, Response } from "express";
import mongoose from "mongoose";
import { ContentItem } from "../models/ContentItem.js";
import { deleteAssets, rollbackUploadedAssets, uploadAssets, type UploadedFile } from "../services/cloudinary.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { recordAudit } from "../services/audit.service.js";

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
  const routeWaypoints = String(body.routeWaypoints ?? "")
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8);
  const websiteUrl = String(body.websiteUrl ?? "").trim();
  if (websiteUrl) {
    try {
      const parsed = new URL(websiteUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      const error = new Error("Brand website must be a valid HTTP or HTTPS URL") as Error & { statusCode: number };
      error.statusCode = 422;
      throw error;
    }
  }
  return {
    kind,
    title,
    description: String(body.description ?? "").trim(),
    location: String(body.location ?? "").trim(),
    startLocation: String(body.startLocation ?? "").trim(),
    destination: String(body.destination ?? "").trim(),
    routeWaypoints,
    category: String(body.category ?? "").trim(),
    websiteUrl,
    partnershipBond: String(body.partnershipBond ?? "").trim(),
    collaborationSince: String(body.collaborationSince ?? "").trim(),
    videoUrl: String(body.videoUrl ?? "").trim(),
    status: body.status === "completed" ? "completed" : body.status === "ongoing" ? "ongoing" : "upcoming",
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
  const imageFiles = files.images ?? [];
  const videoFiles = files.videos ?? [];
  const uploaded = await uploadAssets([
    ...imageFiles.map((file) => ({ file, folder: `site/${kind}s/images` })),
    ...videoFiles.map((file) => ({ file, folder: `site/${kind}s/videos` }))
  ]);
  const images = uploaded.slice(0, imageFiles.length);
  const videos = uploaded.slice(imageFiles.length);
  if (kind === "photo" && !images.length && !videos.length && !data.videoUrl) {
    await rollbackUploadedAssets(uploaded);
    const error = new Error("A photo or video URL is required") as Error & { statusCode: number };
    error.statusCode = 422;
    throw error;
  }
  try {
    const item = await ContentItem.create({ ...data, images, videos, image: images[0] });
    await recordAudit({ adminId: req.admin?.id, action: "content.created", entityType: "content", entityId: item.id, metadata: { kind } });
    return sendSuccess(res, item, "Content created", 201);
  } catch (error) {
    await rollbackUploadedAssets(uploaded);
    throw error;
  }
}

export async function updateContent(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Content not found" });
  const item = await ContentItem.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Content not found" });
  const previousImages = item.images.length ? item.images : item.image ? [item.image] : [];
  const previousVideos = item.videos;
  const files = (req.files as Record<string, Express.Multer.File[]> | undefined) ?? {};
  const parseRetainedIds = (value: unknown) => String(value ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  const retainedImageIds = parseRetainedIds(req.body.retainedImageIds);
  const retainedVideoIds = parseRetainedIds(req.body.retainedVideoIds);
  const retainedImages = item.kind === "photo" && "retainedImageIds" in req.body ? previousImages.filter((asset) => retainedImageIds.includes(asset.publicId)) : previousImages;
  const retainedVideos = item.kind === "photo" && "retainedVideoIds" in req.body ? previousVideos.filter((asset) => retainedVideoIds.includes(asset.publicId)) : previousVideos;
  const newImages = files.images?.length
    ? await uploadAssets(files.images.map((file) => ({ file, folder: `site/${item.kind}s/images` })))
    : [];
  let newVideos: UploadedFile[] = [];
  try {
    newVideos = files.videos?.length
      ? await uploadAssets(files.videos.map((file) => ({ file, folder: `site/${item.kind}s/videos` })))
      : [];
    const images = item.kind === "photo" ? [...retainedImages, ...newImages] : newImages.length ? newImages : previousImages;
    const videos = item.kind === "photo" ? [...retainedVideos, ...newVideos] : newVideos.length ? newVideos : previousVideos;
    if (images.length > 8 || videos.length > 2) {
      const limitError = new Error("Photography collections support up to 8 photos and 2 videos") as Error & { statusCode: number };
      limitError.statusCode = 422;
      throw limitError;
    }
    Object.assign(item, fields(req.body, item.kind), { images, videos, image: images[0] });
    await item.save();
  } catch (error) {
    await rollbackUploadedAssets([...newImages, ...newVideos]);
    throw error;
  }
  const removedImages = item.kind === "photo" ? previousImages.filter((asset) => !retainedImages.some((retained) => retained.publicId === asset.publicId)) : newImages.length ? previousImages : [];
  const removedVideos = item.kind === "photo" ? previousVideos.filter((asset) => !retainedVideos.some((retained) => retained.publicId === asset.publicId)) : newVideos.length ? previousVideos : [];
  await deleteAssets([...removedImages, ...removedVideos]);
  await recordAudit({ adminId: req.admin?.id, action: "content.updated", entityType: "content", entityId: item.id, metadata: { kind: item.kind } });
  return sendSuccess(res, item, "Content updated");
}

export async function deleteContent(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Content not found" });
  const item = await ContentItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Content not found" });
  const images = item.images.length ? item.images : item.image ? [item.image] : [];
  await deleteAssets([...images, ...item.videos]);
  await recordAudit({ adminId: req.admin?.id, action: "content.deleted", entityType: "content", entityId: item.id, metadata: { kind: item.kind } });
  return sendSuccess(res, null, "Content deleted");
}
