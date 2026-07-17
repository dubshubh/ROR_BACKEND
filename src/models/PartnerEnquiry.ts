import { Schema, model } from "mongoose";

const partnerEnquirySchema = new Schema(
  {
    brandName: { type: String, required: true, trim: true, maxlength: 120 },
    contactName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    website: { type: String, default: "", trim: true, maxlength: 300 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ["new", "reviewed"], default: "new", index: true }
  },
  { timestamps: true }
);

export const PartnerEnquiry = model("PartnerEnquiry", partnerEnquirySchema);
