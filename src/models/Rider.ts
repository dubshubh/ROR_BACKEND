import { Schema, model, type InferSchemaType } from "mongoose";

const fileSchema = new Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true }
  },
  { _id: false }
);

const riderSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 3 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    emergencyContact: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    bikeModel: { type: String, required: true, trim: true },
    bikeNumber: { type: String, required: true, trim: true },
    ridingExperience: { type: Number, required: true, min: 0 },
    dlNumber: { type: String, unique: true, sparse: true, trim: true },
    aadhaarNumber: { type: String, required: true, unique: true, trim: true },
    joinedOtherGroupBefore: { type: Boolean, required: true, default: false },
    previousGroupLeaveReason: { type: String, default: "", trim: true },
    joinReason: { type: String, default: "", trim: true },
    dlFront: { type: fileSchema, default: null },
    dlBack: { type: fileSchema, default: null },
    aadhaarFront: { type: fileSchema, required: true },
    aadhaarBack: { type: fileSchema, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
  },
  { timestamps: true }
);

riderSchema.index({ fullName: "text", email: "text", phone: "text", dlNumber: "text", bikeNumber: "text" });

export type RiderDocument = InferSchemaType<typeof riderSchema> & { _id: string };
export const Rider = model("Rider", riderSchema);
