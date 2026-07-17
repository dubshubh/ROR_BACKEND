import multer from "multer";

const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const logoMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only jpg, jpeg, png, and pdf files are allowed"));
    }
    cb(null, true);
  }
});

export const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!logoMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only jpg, jpeg, png, and webp logo files are allowed"));
    }
    cb(null, true);
  }
});

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!logoMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only jpg, jpeg, png, and webp image files are allowed"));
    }
    cb(null, true);
  }
});

export const contentMediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const allowed = [...logoMimeTypes, "video/mp4", "video/webm"];
    if (!allowed.includes(file.mimetype)) return cb(new Error("Only jpg, jpeg, png, webp, mp4, and webm media files are allowed"));
    cb(null, true);
  }
});
