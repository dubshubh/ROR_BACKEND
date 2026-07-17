import { Schema, model } from "mongoose";

const imageSchema = new Schema(
  { publicId: { type: String, required: true }, url: { type: String, required: true } },
  { _id: false }
);

const contentItemSchema = new Schema(
  {
    kind: { type: String, enum: ["ride", "photo", "brand"], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    date: { type: Date },
    status: { type: String, enum: ["upcoming", "completed"], default: "upcoming" },
    location: { type: String, default: "", trim: true, maxlength: 160 },
    category: { type: String, default: "", trim: true, maxlength: 160 },
    image: imageSchema,
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const ContentItem = model("ContentItem", contentItemSchema);
