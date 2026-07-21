import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary.js";

export type UploadedFile = { publicId: string; url: string };
export type UploadRequest = { file: Express.Multer.File; folder: string };

export function uploadBuffer(file: Express.Multer.File, folder: string): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result?: UploadApiResponse) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve({ publicId: result.public_id, url: result.secure_url });
      }
    );
    stream.end(file.buffer);
  });
}

export async function deleteCloudinaryFile(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
}

export async function deleteAssets(assets: ReadonlyArray<{ publicId: string } | null | undefined>) {
  const existingAssets = assets.filter((asset): asset is { publicId: string } => Boolean(asset?.publicId));
  const results = await Promise.allSettled(existingAssets.map((asset) => deleteCloudinaryFile(asset.publicId)));
  const failedCount = results.filter((result) => result.status === "rejected").length;
  if (failedCount) console.error(`Cloudinary cleanup failed for ${failedCount} asset(s)`);
  return { failedCount };
}

export async function rollbackUploadedAssets(assets: UploadedFile[]) {
  await deleteAssets(assets);
}

export async function uploadAssets(requests: UploadRequest[]) {
  const results = await Promise.allSettled(requests.map(({ file, folder }) => uploadBuffer(file, folder)));
  const uploaded = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failed) {
    await rollbackUploadedAssets(uploaded);
    throw failed.reason;
  }
  return uploaded;
}
