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
    logo: { type: fileSchema, default: null },
    commandCenter: {
      launchTitle: { type: String, default: "Sunrise Ride to Alibaug", trim: true, maxlength: 120 },
      launchDetails: { type: String, default: "Ride start: 5:30 AM · Meet point: Gateway of the city", trim: true, maxlength: 240 },
      membersCount: { type: String, default: "120+", trim: true, maxlength: 20 },
      runsCount: { type: String, default: "35", trim: true, maxlength: 20 }
    }
  },
  { timestamps: true }
);

export type AppSettingDocument = InferSchemaType<typeof appSettingSchema> & { _id: string };
export const AppSetting = model("AppSetting", appSettingSchema);
