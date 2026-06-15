import {
  Schema,
  Types,
  model,
  models,
  type Model,
} from "mongoose";
import {
  DEFAULT_TOURNAMENT_THEME,
  TOURNAMENT_THEME_IDS,
} from "@/lib/tournamentTheme";

export interface ISetScore {
  scoreA: number;
  scoreB: number;
  pointsToWin: 11 | 21;
}

export interface ITeamCrest {
  field: string;
  division: string;
  divisionColor: string;
  charge: string;
  chargeColor: string;
}

export interface ITeam {
  _id: Types.ObjectId;
  name: string;
  players: string[];
  playerProfileIds?: Array<Types.ObjectId | null>;
  seed: number;
  /** Optional heraldic crest, shown only by the knight theme. */
  crest?: ITeamCrest | null;
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
  | "individual_mixer"
  | "event";

export type RoundRobinMatchFormat = "bo1" | "bo3";
export type KnockoutBracketType =
  | "double_elimination"
  | "single_elimination";
export type FirstRoundPairingMode = "random" | "manual";
export type MatchResultMode = "points" | "winner_only";
export type KnockoutMatchFormat = "bo3_semis_finals" | "bo1";

/** Smallest allowed team size. */
export const MIN_TEAM_SIZE = 2;
/** Largest allowed team size for custom team sizes. */
export const MAX_TEAM_SIZE = 20;

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
  eventDisciplineIndex?: number | null;
  eventDisciplineName?: string | null;
}

export interface ITournament {
  _id: Types.ObjectId;
  name: string;
  status: "draft" | "active" | "completed";
  format: TournamentFormat;
  theme: string;
  knockoutBracketType: KnockoutBracketType;
  firstRoundPairingMode: FirstRoundPairingMode;
  matchResultMode: MatchResultMode;
  knockoutMatchFormat: KnockoutMatchFormat;
  roundRobinMatchFormat: RoundRobinMatchFormat;
  teamSize: number;
  courtsAvailable: number;
  inputMode: "teams" | "players";
  allowSelfJoin: boolean;
  eventParticipantCount?: number;
  eventDisciplineCount?: number;
  eventDisciplines?: string[];
  eventDrawSeed?: number;
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

const teamCrestSchema = new Schema<ITeamCrest>(
  {
    field: { type: String, required: true },
    division: { type: String, required: true },
    divisionColor: { type: String, required: true },
    charge: { type: String, required: true },
    chargeColor: { type: String, required: true },
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
  crest: {
    type: teamCrestSchema,
    default: null,
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
  eventDisciplineIndex: {
    type: Number,
    default: null,
  },
  eventDisciplineName: {
    type: String,
    default: null,
    trim: true,
    maxlength: 80,
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
      enum: ["double_elimination", "team_round_robin", "individual_mixer", "event"],
      default: "double_elimination",
      required: true,
    },
    theme: {
      type: String,
      enum: [...TOURNAMENT_THEME_IDS],
      default: DEFAULT_TOURNAMENT_THEME,
      required: true,
    },
    knockoutBracketType: {
      type: String,
      enum: ["double_elimination", "single_elimination"],
      default: "double_elimination",
      required: true,
    },
    firstRoundPairingMode: {
      type: String,
      enum: ["random", "manual"],
      default: "random",
      required: true,
    },
    matchResultMode: {
      type: String,
      enum: ["points", "winner_only"],
      default: "points",
      required: true,
    },
    knockoutMatchFormat: {
      type: String,
      enum: ["bo3_semis_finals", "bo1"],
      default: "bo3_semis_finals",
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
      min: MIN_TEAM_SIZE,
      max: MAX_TEAM_SIZE,
      validate: {
        validator: Number.isInteger,
        message: "teamSize must be an integer",
      },
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
    eventParticipantCount: {
      type: Number,
      min: 2,
      max: 32,
      default: 2,
      required: true,
    },
    eventDisciplineCount: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
      required: true,
    },
    eventDisciplines: {
      type: [String],
      default: [],
    },
    eventDrawSeed: {
      type: Number,
      default: 1,
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

