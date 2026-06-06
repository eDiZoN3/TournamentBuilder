import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { validateSet } from "@/lib/scoring";

export interface IPracticeParticipant {
  playerProfileId?: Types.ObjectId | null;
  displayName: string;
}

export interface IPracticeSetScore {
  scoreA: number;
  scoreB: number;
  pointsToWin: 11 | 21;
}

const practiceParticipantSchema = new Schema<IPracticeParticipant>(
  {
    playerProfileId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
  },
  {
    _id: false,
  },
);

const practiceSetSchema = new Schema<IPracticeSetScore>(
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

const practiceMatchSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    playedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    sideA: {
      type: [practiceParticipantSchema],
      required: true,
      validate: {
        validator: (participants: IPracticeParticipant[]) =>
          participants.length >= 1 && participants.length <= 4,
        message: "Practice match sides must include 1 to 4 players.",
      },
    },
    sideB: {
      type: [practiceParticipantSchema],
      required: true,
      validate: {
        validator: (participants: IPracticeParticipant[]) =>
          participants.length >= 1 && participants.length <= 4,
        message: "Practice match sides must include 1 to 4 players.",
      },
    },
    sets: {
      type: [practiceSetSchema],
      required: true,
      validate: {
        validator: (sets: IPracticeSetScore[]) => sets.length >= 1,
        message: "Practice matches require at least one set.",
      },
    },
    winnerSide: {
      type: String,
      enum: ["A", "B"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

function idString(id: Types.ObjectId | null | undefined): string {
  return id?.toString() ?? "";
}

function participantKey(participant: IPracticeParticipant): string {
  return participant.playerProfileId
    ? `profile:${participant.playerProfileId.toString()}`
    : `guest:${participant.displayName.trim().replace(/\s+/g, " ").toLowerCase()}`;
}

function setWinner(set: IPracticeSetScore): "A" | "B" {
  return set.scoreA > set.scoreB ? "A" : "B";
}

practiceMatchSchema.pre("validate", function validatePracticeMatch(next) {
  const sideA = this.sideA as IPracticeParticipant[];
  const sideB = this.sideB as IPracticeParticipant[];
  const sets = this.sets as IPracticeSetScore[];

  if (sideA.length !== sideB.length) {
    next(new Error("Practice match sides must be the same size."));
    return;
  }

  const creatorId = idString(this.createdBy as Types.ObjectId);
  const participants = [...sideA, ...sideB];
  const creatorParticipates = participants.some(
    (participant) => idString(participant.playerProfileId) === creatorId,
  );

  if (!creatorParticipates) {
    next(new Error("Practice match creator must participate."));
    return;
  }

  const participantKeys = participants.map(participantKey);

  if (new Set(participantKeys).size !== participantKeys.length) {
    next(new Error("Practice match participants must not be duplicated."));
    return;
  }

  let winsA = 0;
  let winsB = 0;

  for (const set of sets) {
    const validation = validateSet(set.scoreA, set.scoreB);

    if (!validation.valid) {
      next(new Error(validation.error));
      return;
    }

    if (validation.pointsToWin !== set.pointsToWin) {
      next(new Error("Practice match set pointsToWin does not match scores."));
      return;
    }

    if (setWinner(set) === "A") {
      winsA += 1;
    } else {
      winsB += 1;
    }
  }

  const winnerSide = this.winnerSide as "A" | "B";

  if (winsA === winsB || (winsA > winsB ? "A" : "B") !== winnerSide) {
    next(new Error("Practice match winner does not match set results."));
    return;
  }

  next();
});

practiceMatchSchema.index({ "sideA.playerProfileId": 1 });
practiceMatchSchema.index({ "sideB.playerProfileId": 1 });

export interface IPracticeMatch
  extends InferSchemaType<typeof practiceMatchSchema> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const PracticeMatch =
  (models.PracticeMatch as Model<IPracticeMatch> | undefined) ??
  model<IPracticeMatch>("PracticeMatch", practiceMatchSchema);
