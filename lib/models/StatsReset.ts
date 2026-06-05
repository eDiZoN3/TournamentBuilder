import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

export type StatsResetScope = "player" | "tournament" | "season" | "all";

const statsResetSchema = new Schema(
  {
    resetKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    scope: {
      type: String,
      enum: ["player", "tournament", "season", "all"],
      required: true,
    },
    playerProfileId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    playerNameKey: {
      type: String,
      default: null,
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    season: {
      type: Number,
      default: null,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

statsResetSchema.index({ scope: 1 });
statsResetSchema.index({ tournamentId: 1 });
statsResetSchema.index({ season: 1 });
statsResetSchema.index({ playerProfileId: 1 });

export interface IStatsReset extends InferSchemaType<typeof statsResetSchema> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const StatsReset =
  (models.StatsReset as Model<IStatsReset> | undefined) ??
  model<IStatsReset>("StatsReset", statsResetSchema);
