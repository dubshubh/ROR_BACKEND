import { Schema, model, type InferSchemaType } from "mongoose";

const fileSchema = new Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true }
  },
  { _id: false }
);

const appSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    logo: { type: fileSchema, default: null }
  },
  { timestamps: true }
);

export type AppSettingDocument = InferSchemaType<typeof appSettingSchema> & { _id: string };
export const AppSetting = model("AppSetting", appSettingSchema);
