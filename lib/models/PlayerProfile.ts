import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const playerProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    surname: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  },
);

export interface IPlayerProfile
  extends InferSchemaType<typeof playerProfileSchema> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const PlayerProfile =
  (models.PlayerProfile as Model<IPlayerProfile> | undefined) ??
  model<IPlayerProfile>("PlayerProfile", playerProfileSchema);
