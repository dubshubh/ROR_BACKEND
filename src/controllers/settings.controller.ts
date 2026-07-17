import { Request, Response } from "express";
import { AppSetting } from "../models/AppSetting.js";
import { deleteCloudinaryFile, uploadBuffer } from "../services/cloudinary.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

async function getOrCreateSettings() {
  return AppSetting.findOneAndUpdate({ key: "default" }, { $setOnInsert: { key: "default" } }, { upsert: true, new: true });
}

export async function getPublicSettings(_req: Request, res: Response) {
  const settings = await getOrCreateSettings();
  return sendSuccess(res, { logo: settings.logo, commandCenter: settings.commandCenter });
}

export async function updateCommandCenter(req: Request, res: Response) {
  const values = ["launchTitle", "launchDetails", "membersCount", "runsCount"] as const;
  const commandCenter = {
    launchTitle: String(req.body.launchTitle ?? "").trim(),
    launchDetails: String(req.body.launchDetails ?? "").trim(),
    membersCount: String(req.body.membersCount ?? "").trim(),
    runsCount: String(req.body.runsCount ?? "").trim()
  };
  if (values.some((key) => !commandCenter[key])) {
    return res.status(422).json({ success: false, message: "All command center fields are required" });
  }
  if (commandCenter.launchTitle.length > 120 || commandCenter.launchDetails.length > 240 || commandCenter.membersCount.length > 20 || commandCenter.runsCount.length > 20) {
    return res.status(422).json({ success: false, message: "One or more values are too long" });
  }
  const settings = await getOrCreateSettings();
  settings.commandCenter = commandCenter;
  await settings.save();
  return sendSuccess(res, { logo: settings.logo, commandCenter: settings.commandCenter }, "Command center updated");
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

  return sendSuccess(res, { logo, commandCenter: settings.commandCenter }, "Logo updated");
}
