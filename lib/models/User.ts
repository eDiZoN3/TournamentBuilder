import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export type IUser = InferSchemaType<typeof userSchema>;

export const User = models.User ?? model<IUser>("User", userSchema);

