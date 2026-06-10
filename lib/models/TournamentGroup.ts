import {
  Schema,
  Types,
  model,
  models,
  type Model,
} from "mongoose";
import type { IMatch, ITeam } from "@/lib/models/Tournament";

export type IGroupTeam = ITeam;
export type IGroupMatch = IMatch;

export interface IGroupCategory {
  _id: Types.ObjectId;
  name: string;
  position: number;
  matches: IGroupMatch[];
  currentMatchId: Types.ObjectId | null;
}

export interface ITournamentGroup {
  _id: Types.ObjectId;
  name: string;
  status: "draft" | "active" | "completed";
  teams: IGroupTeam[];
  categories: IGroupCategory[];
  createdAt: Date;
  updatedAt: Date;
}

const setScoreSchema = new Schema(
  {
    scoreA: { type: Number, required: true },
    scoreB: { type: Number, required: true },
    pointsToWin: { type: Number, enum: [11, 21], required: true },
  },
  { _id: false },
);

const teamSlotSchema = new Schema(
  {
    teamId: { type: Schema.Types.ObjectId, required: true },
    sets: { type: [setScoreSchema], default: [] },
  },
  { _id: false },
);

const groupTeamSchema = new Schema<IGroupTeam>({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  players: { type: [String], default: [] },
  playerProfileIds: { type: [Schema.Types.ObjectId], default: [] },
  seed: { type: Number, default: 0 },
});

const groupMatchSchema = new Schema<IGroupMatch>({
  bracket: { type: String, enum: ["winner", "loser"], required: true },
  round: { type: Number, required: true },
  position: { type: Number, required: true },
  label: { type: String, default: "" },
  placeRange: { type: String, default: "" },
  format: { type: String, enum: ["bo1", "bo3"], required: true },
  teamA: { type: teamSlotSchema, default: null },
  teamB: { type: teamSlotSchema, default: null },
  status: {
    type: String,
    enum: ["pending", "ready", "in_progress", "completed"],
    default: "pending",
  },
  winnerId: { type: Schema.Types.ObjectId, default: null },
  loserId: { type: Schema.Types.ObjectId, default: null },
  winnerNextMatchId: { type: Schema.Types.ObjectId, default: null },
  winnerNextSlot: { type: String, enum: ["A", "B", null], default: null },
  loserNextMatchId: { type: Schema.Types.ObjectId, default: null },
  loserNextSlot: { type: String, enum: ["A", "B", null], default: null },
  isBye: { type: Boolean, default: false },
  isWBFinal: { type: Boolean, default: false },
  isLBFinal: { type: Boolean, default: false },
  courtNumber: { type: Number, default: null },
});

const groupCategorySchema = new Schema<IGroupCategory>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  position: { type: Number, required: true },
  matches: { type: [groupMatchSchema], default: [] },
  currentMatchId: { type: Schema.Types.ObjectId, default: null },
});

const tournamentGroupSchema = new Schema<ITournamentGroup>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    status: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "draft",
      required: true,
    },
    teams: { type: [groupTeamSchema], default: [] },
    categories: { type: [groupCategorySchema], default: [] },
  },
  { timestamps: true },
);

export const TournamentGroup =
  (models.TournamentGroup as Model<ITournamentGroup> | undefined) ??
  model<ITournamentGroup>("TournamentGroup", tournamentGroupSchema);
