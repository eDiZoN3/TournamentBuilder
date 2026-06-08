import { Types } from "mongoose";
import { PlayerProfile, type IPlayerProfile } from "@/lib/models/PlayerProfile";

export interface PlayerProfileSummary {
  _id: string;
  firstName: string;
  surname?: string;
  displayName: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizedQuery(query: string | null): string {
  return (query ?? "").trim().replace(/\s+/g, " ");
}

function normalizedLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return 8;
  }

  return Math.min(Math.max(parsed, 1), 20);
}

export function playerProfileSummary(profile: {
  _id: { toString(): string };
  firstName: string;
  surname?: string | null;
  displayName: string;
}): PlayerProfileSummary {
  return {
    _id: profile._id.toString(),
    firstName: profile.firstName,
    surname: profile.surname ?? undefined,
    displayName: profile.displayName,
  };
}

export async function searchPlayerProfiles(
  query: string | null,
  limitValue: string | null,
): Promise<PlayerProfileSummary[]> {
  const q = normalizedQuery(query);
  const limit = normalizedLimit(limitValue);

  if (!q) {
    return [];
  }

  const pattern = new RegExp(escapeRegExp(q), "i");
  const profiles = await PlayerProfile.find({
    $or: [
      { displayName: pattern },
      { firstName: pattern },
      { surname: pattern },
    ],
  })
    .sort({ displayName: 1, _id: 1 })
    .limit(limit)
    .select("_id firstName surname displayName")
    .lean();

  return profiles.map(playerProfileSummary);
}

export async function playerProfileMapById(
  ids: string[],
): Promise<Map<string, PlayerProfileSummary>> {
  const uniqueIds = [
    ...new Set(ids.filter((id) => Types.ObjectId.isValid(id))),
  ];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const profiles = await PlayerProfile.find({
    _id: { $in: uniqueIds },
  })
    .select("_id firstName surname displayName")
    .lean<IPlayerProfile[]>();

  return new Map(
    profiles.map((profile) => [
      profile._id.toString(),
      playerProfileSummary(profile),
    ]),
  );
}
