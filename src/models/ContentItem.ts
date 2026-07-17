import { Schema, model } from "mongoose";

const imageSchema = new Schema(
  { publicId: { type: String, required: true }, url: { type: String, required: true } },
  { _id: false }
);

const contentItemSchema = new Schema(
  {
    kind: { type: String, enum: ["event", "ride", "brand", "photo", "intercity"], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    date: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ["upcoming", "completed"], default: "upcoming" },
    location: { type: String, default: "", trim: true, maxlength: 160 },
    startLocation: { type: String, default: "", trim: true, maxlength: 160 },
    destination: { type: String, default: "", trim: true, maxlength: 160 },
    category: { type: String, default: "", trim: true, maxlength: 160 },
    videoUrl: { type: String, default: "", trim: true, maxlength: 500 },
    image: imageSchema,
    images: { type: [imageSchema], default: [] },
    videos: { type: [imageSchema], default: [] },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const ContentItem = model("ContentItem", contentItemSchema);
