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
    status: { type: String, enum: ["upcoming", "ongoing", "completed"], default: "upcoming" },
    location: { type: String, default: "", trim: true, maxlength: 160 },
    startLocation: { type: String, default: "", trim: true, maxlength: 160 },
    destination: { type: String, default: "", trim: true, maxlength: 160 },
    routeWaypoints: {
      type: [{ type: String, trim: true, maxlength: 160 }],
      default: [],
      validate: {
        validator: (values: string[]) => values.length <= 8,
        message: "A route can contain at most 8 stops"
      }
    },
    category: { type: String, default: "", trim: true, maxlength: 160 },
    websiteUrl: { type: String, default: "", trim: true, maxlength: 500 },
    partnershipBond: { type: String, default: "", trim: true, maxlength: 1200 },
    collaborationSince: { type: String, default: "", trim: true, maxlength: 40 },
    videoUrl: { type: String, default: "", trim: true, maxlength: 500 },
    image: imageSchema,
    images: { type: [imageSchema], default: [] },
    videos: { type: [imageSchema], default: [] },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

contentItemSchema.index({ kind: 1, status: 1, date: 1 });

export const ContentItem = model("ContentItem", contentItemSchema);
