import { Types } from "mongoose";
import {
  type IPracticeMatch,
  type IPracticeParticipant,
  type IPracticeSetScore,
} from "@/lib/models/PracticeMatch";
import { validateSet } from "@/lib/scoring";

export interface PracticeMatchInput {
  createdBy: Types.ObjectId;
  playedAt: Date;
  sideA: IPracticeParticipant[];
  sideB: IPracticeParticipant[];
  sets: IPracticeSetScore[];
  winnerSide: "A" | "B";
}

export type PracticeMatchParseResult =
  | {
      ok: true;
      value: PracticeMatchInput;
    }
  | {
      ok: false;
      error: string;
    };

export interface SerializedPracticeParticipant {
  playerProfileId?: string;
  displayName: string;
}

export interface SerializedPracticeMatch {
  _id: string;
  createdBy: string;
  playedAt: string;
  sideA: SerializedPracticeParticipant[];
  sideB: SerializedPracticeParticipant[];
  sets: IPracticeSetScore[];
  winnerSide: "A" | "B";
  createdAt?: string;
  updatedAt?: string;
}

function idString(id: { toString(): string } | string | null | undefined) {
  return id?.toString() ?? "";
}

function normalizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function participantKey(participant: IPracticeParticipant): string {
  return participant.playerProfileId
    ? `profile:${participant.playerProfileId.toString()}`
    : `guest:${normalizeDisplayName(participant.displayName).toLowerCase()}`;
}

function parseObjectId(value: unknown, label: string): Types.ObjectId | string {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    return `${label} must be a valid id.`;
  }

  return new Types.ObjectId(value);
}

function parseParticipant(value: unknown): IPracticeParticipant | string {
  if (!value || typeof value !== "object") {
    return "Participants must be objects.";
  }

  const record = value as Record<string, unknown>;

  if (typeof record.displayName !== "string") {
    return "Participant displayName is required.";
  }

  const displayName = normalizeDisplayName(record.displayName);

  if (!displayName || displayName.length > 120) {
    return "Participant displayName must be 1 to 120 characters.";
  }

  if (record.playerProfileId === undefined || record.playerProfileId === null) {
    return {
      displayName,
    };
  }

  const playerProfileId = parseObjectId(
    record.playerProfileId,
    "Participant playerProfileId",
  );

  if (typeof playerProfileId === "string") {
    return playerProfileId;
  }

  return {
    playerProfileId,
    displayName,
  };
}

function parseSide(value: unknown, label: string): IPracticeParticipant[] | string {
  if (!Array.isArray(value) || value.length < 1 || value.length > 4) {
    return `${label} must include 1 to 4 participants.`;
  }

  const participants: IPracticeParticipant[] = [];

  for (const participant of value) {
    const parsedParticipant = parseParticipant(participant);

    if (typeof parsedParticipant === "string") {
      return parsedParticipant;
    }

    participants.push(parsedParticipant);
  }

  return participants;
}

function parsePlayedAt(value: unknown): Date | string {
  if (value === undefined || value === null || value === "") {
    return new Date();
  }

  if (typeof value !== "string" && !(value instanceof Date)) {
    return "playedAt must be a valid date.";
  }

  const playedAt = new Date(value);

  if (Number.isNaN(playedAt.getTime())) {
    return "playedAt must be a valid date.";
  }

  return playedAt;
}

function parseSets(value: unknown): IPracticeSetScore[] | string {
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) {
    return "Practice matches require 1 to 3 sets.";
  }

  const sets: IPracticeSetScore[] = [];

  for (const set of value) {
    if (!set || typeof set !== "object") {
      return "Set scores must be objects.";
    }

    const record = set as Record<string, unknown>;
    const { scoreA, scoreB } = record;

    if (typeof scoreA !== "number" || typeof scoreB !== "number") {
      return "Set scores must be numbers.";
    }

    const validation = validateSet(scoreA, scoreB);

    if (!validation.valid) {
      return validation.error;
    }

    sets.push({
      scoreA,
      scoreB,
      pointsToWin: validation.pointsToWin,
    });
  }

  return sets;
}

function winnerSideForSets(sets: IPracticeSetScore[]): "A" | "B" | string {
  const winsA = sets.filter((set) => set.scoreA > set.scoreB).length;
  const winsB = sets.filter((set) => set.scoreB > set.scoreA).length;

  if (winsA === winsB) {
    return "Practice match sets must produce a winner.";
  }

  return winsA > winsB ? "A" : "B";
}

export function parsePracticeMatchPayload(
  payload: unknown,
  creatorProfileId: string,
): PracticeMatchParseResult {
  const createdBy = parseObjectId(creatorProfileId, "Creator playerProfileId");

  if (typeof createdBy === "string") {
    return {
      ok: false,
      error: createdBy,
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      error: "Invalid practice match payload.",
    };
  }

  const record = payload as Record<string, unknown>;
  const playedAt = parsePlayedAt(record.playedAt);

  if (typeof playedAt === "string") {
    return {
      ok: false,
      error: playedAt,
    };
  }

  const sideA = parseSide(record.sideA, "sideA");

  if (typeof sideA === "string") {
    return {
      ok: false,
      error: sideA,
    };
  }

  const sideB = parseSide(record.sideB, "sideB");

  if (typeof sideB === "string") {
    return {
      ok: false,
      error: sideB,
    };
  }

  if (sideA.length !== sideB.length) {
    return {
      ok: false,
      error: "Practice match sides must be the same size.",
    };
  }

  const participants = [...sideA, ...sideB];
  const participantKeys = participants.map(participantKey);

  if (new Set(participantKeys).size !== participantKeys.length) {
    return {
      ok: false,
      error: "Practice match participants must not be duplicated.",
    };
  }

  if (
    !participants.some(
      (participant) => idString(participant.playerProfileId) === createdBy.toString(),
    )
  ) {
    return {
      ok: false,
      error: "Practice match creator must participate.",
    };
  }

  const sets = parseSets(record.sets);

  if (typeof sets === "string") {
    return {
      ok: false,
      error: sets,
    };
  }

  const winnerSide = winnerSideForSets(sets);

  if (winnerSide !== "A" && winnerSide !== "B") {
    return {
      ok: false,
      error: winnerSide,
    };
  }

  return {
    ok: true,
    value: {
      createdBy,
      playedAt,
      sideA,
      sideB,
      sets,
      winnerSide,
    },
  };
}

function serializeParticipant(
  participant: IPracticeParticipant,
): SerializedPracticeParticipant {
  return {
    playerProfileId: participant.playerProfileId?.toString(),
    displayName: participant.displayName,
  };
}

function dateString(date: Date | string | undefined): string | undefined {
  if (!date) {
    return undefined;
  }

  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
}

export function serializePracticeMatch(
  match: IPracticeMatch | (PracticeMatchInput & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date }),
): SerializedPracticeMatch {
  return {
    _id: match._id.toString(),
    createdBy: match.createdBy.toString(),
    playedAt: dateString(match.playedAt)!,
    sideA: match.sideA.map(serializeParticipant),
    sideB: match.sideB.map(serializeParticipant),
    sets: match.sets.map((set) => ({
      scoreA: set.scoreA,
      scoreB: set.scoreB,
      pointsToWin: set.pointsToWin,
    })),
    winnerSide: match.winnerSide,
    createdAt: dateString(match.createdAt),
    updatedAt: dateString(match.updatedAt),
  };
}

export function referencedPlayerProfileIds(
  input: PracticeMatchInput,
): string[] {
  return [
    ...new Set(
      [...input.sideA, ...input.sideB]
        .map((participant) => participant.playerProfileId?.toString())
        .filter((id): id is string => Boolean(id)),
    ),
  ];
}
