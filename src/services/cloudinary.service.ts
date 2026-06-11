import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary.js";

export type UploadedFile = { publicId: string; url: string };

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
