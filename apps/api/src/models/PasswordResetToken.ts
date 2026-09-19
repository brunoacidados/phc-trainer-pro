import { Schema, model, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IPasswordResetToken {
  userId: Types.ObjectId;
  kind: "reset" | "verify";
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}
export type PasswordResetTokenDoc = HydratedDocument<IPasswordResetToken>;

const schema = new Schema<IPasswordResetToken, Model<IPasswordResetToken>>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  kind: { type: String, enum: ["reset", "verify"], default: "reset" },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken = model<IPasswordResetToken, Model<IPasswordResetToken>>(
  "PasswordResetToken",
  schema,
);
