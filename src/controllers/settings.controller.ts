import { Request, Response } from "express";
import { AppSetting } from "../models/AppSetting.js";
import { deleteCloudinaryFile, uploadBuffer } from "../services/cloudinary.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

async function getOrCreateSettings() {
  return AppSetting.findOneAndUpdate({ key: "default" }, { $setOnInsert: { key: "default" } }, { upsert: true, new: true });
}

export async function getPublicSettings(_req: Request, res: Response) {
  const settings = await getOrCreateSettings();
  return sendSuccess(res, { logo: settings.logo });
}

export async function updateLogo(req: Request, res: Response) {
  if (!req.file) {
    return res.status(422).json({ success: false, message: "Logo image is required" });
  }

  const settings = await getOrCreateSettings();
  const previousLogo = settings.logo;
  const logo = await uploadBuffer(req.file, "site/logo");

  settings.logo = logo;
  await settings.save();

  if (previousLogo?.publicId) {
    await deleteCloudinaryFile(previousLogo.publicId);
  }

  return sendSuccess(res, { logo }, "Logo updated");
}
