import bcrypt from "bcryptjs";
import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ["admin"], default: "admin" },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false }
  },
  { timestamps: true }
);

adminSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export type AdminDocument = HydratedDocument<InferSchemaType<typeof adminSchema>> & {
  comparePassword(candidate: string): Promise<boolean>;
};

export const Admin = model("Admin", adminSchema);
