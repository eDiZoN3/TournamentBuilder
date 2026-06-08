import {
  Schema,
  Types,
  model,
  models,
  type Model,
} from "mongoose";

export interface ISetScore {
  scoreA: number;
  scoreB: number;
  pointsToWin: 11 | 21;
}

export interface ITeam {
  _id: Types.ObjectId;
  name: string;
  players: string[];
  playerProfileIds?: Array<Types.ObjectId | null>;
  seed: number;
}

export interface IJoinedPlayer {
  userId: Types.ObjectId;
  playerProfileId: Types.ObjectId;
  firstName: string;
  surname?: string;
  displayName: string;
  email: string;
  joinedAt: Date;
}

export type TournamentFormat =
  | "double_elimination"
  | "team_round_robin"
  | "individual_mixer";

export type RoundRobinMatchFormat = "bo1" | "bo3";

export interface ITeamSlot {
  teamId: Types.ObjectId;
  sets: ISetScore[];
}

export interface IMatch {
  _id: Types.ObjectId;
  bracket: "winner" | "loser";
  round: number;
  position: number;
  label: string;
  placeRange: string;
  format: RoundRobinMatchFormat;
  teamA: ITeamSlot | null;
  teamB: ITeamSlot | null;
  status: "pending" | "ready" | "in_progress" | "completed";
  winnerId: Types.ObjectId | null;
  loserId: Types.ObjectId | null;
  winnerNextMatchId: Types.ObjectId | null;
  winnerNextSlot: "A" | "B" | null;
  loserNextMatchId: Types.ObjectId | null;
  loserNextSlot: "A" | "B" | null;
  isBye: boolean;
  isWBFinal: boolean;
  isLBFinal: boolean;
  courtNumber: number | null;
}

export interface ITournament {
  _id: Types.ObjectId;
  name: string;
  status: "draft" | "active" | "completed";
  format: TournamentFormat;
  roundRobinMatchFormat: RoundRobinMatchFormat;
  teamSize: 2 | 3 | 4;
  courtsAvailable: number;
  inputMode: "teams" | "players";
  allowSelfJoin: boolean;
  createdAt: Date;
  updatedAt: Date;
  teams: ITeam[];
  joinedPlayers: IJoinedPlayer[];
  matches: IMatch[];
  currentMatchIds: Types.ObjectId[];
}

const setScoreSchema = new Schema<ISetScore>(
  {
    scoreA: {
      type: Number,
      required: true,
    },
    scoreB: {
      type: Number,
      required: true,
    },
    pointsToWin: {
      type: Number,
      enum: [11, 21],
      required: true,
    },
  },
  {
    _id: false,
  },
);

const teamSlotSchema = new Schema<ITeamSlot>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    sets: {
      type: [setScoreSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const teamSchema = new Schema<ITeam>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  players: {
    type: [String],
    default: [],
  },
  playerProfileIds: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
  seed: {
    type: Number,
    default: 0,
  },
});

const joinedPlayerSchema = new Schema<IJoinedPlayer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    playerProfileId: {
      type: Schema.Types.ObjectId,
      required: true,
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
      trim: true,
      lowercase: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const matchSchema = new Schema<IMatch>({
  bracket: {
    type: String,
    enum: ["winner", "loser"],
    required: true,
  },
  round: {
    type: Number,
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  label: {
    type: String,
    default: "",
  },
  placeRange: {
    type: String,
    default: "",
  },
  format: {
    type: String,
    enum: ["bo1", "bo3"],
    required: true,
  },
  teamA: {
    type: teamSlotSchema,
    default: null,
  },
  teamB: {
    type: teamSlotSchema,
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "ready", "in_progress", "completed"],
    default: "pending",
  },
  winnerId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
  loserId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
  winnerNextMatchId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
  winnerNextSlot: {
    type: String,
    enum: ["A", "B", null],
    default: null,
  },
  loserNextMatchId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
  loserNextSlot: {
    type: String,
    enum: ["A", "B", null],
    default: null,
  },
  isBye: {
    type: Boolean,
    default: false,
  },
  isWBFinal: {
    type: Boolean,
    default: false,
  },
  isLBFinal: {
    type: Boolean,
    default: false,
  },
  courtNumber: {
    type: Number,
    default: null,
  },
});

const tournamentSchema = new Schema<ITournament>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "draft",
      required: true,
    },
    format: {
      type: String,
      enum: ["double_elimination", "team_round_robin", "individual_mixer"],
      default: "double_elimination",
      required: true,
    },
    roundRobinMatchFormat: {
      type: String,
      enum: ["bo1", "bo3"],
      default: "bo1",
      required: true,
    },
    teamSize: {
      type: Number,
      enum: [2, 3, 4],
      required: true,
    },
    courtsAvailable: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    inputMode: {
      type: String,
      enum: ["teams", "players"],
      required: true,
    },
    allowSelfJoin: {
      type: Boolean,
      default: false,
      required: true,
    },
    teams: {
      type: [teamSchema],
      default: [],
    },
    joinedPlayers: {
      type: [joinedPlayerSchema],
      default: [],
    },
    matches: {
      type: [matchSchema],
      default: [],
    },
    currentMatchIds: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

tournamentSchema.index({ status: 1 });

export const Tournament =
  (models.Tournament as Model<ITournament> | undefined) ??
  model<ITournament>("Tournament", tournamentSchema);

