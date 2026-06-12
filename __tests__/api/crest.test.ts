import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTeams } from "@/__tests__/helpers/factories";
import { Tournament } from "@/lib/models/Tournament";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import { PUT as updateCrest } from "@/app/api/tournaments/[id]/teams/[teamId]/crest/route";

const validCrest = {
  field: "blue",
  division: "perPale",
  divisionColor: "gold",
  charge: "cross",
  chargeColor: "silver",
};

function request(id: string, teamId: string, body?: unknown) {
  return new NextRequest(
    `http://localhost:3000/api/tournaments/${id}/teams/${teamId}/crest`,
    {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { "content-type": "application/json" },
    },
  );
}

function context(id: string, teamId: string) {
  return { params: Promise.resolve({ id, teamId }) };
}

describe("PUT /api/tournaments/[id]/teams/[teamId]/crest", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  it("requires an authenticated admin", async () => {
    requireAdmin.mockResolvedValue(false);

    const id = new Types.ObjectId().toString();
    const teamId = new Types.ObjectId().toString();
    const response = await updateCrest(
      request(id, teamId, validCrest),
      context(id, teamId),
    );

    expect(response.status).toBe(401);
  });

  it("persists a valid crest on the team", async () => {
    const teams = makeTeams(2);
    const tournament = await Tournament.create({
      name: "Knightly Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      status: "active",
      theme: "knight",
      teams,
    });
    const teamId = tournament.teams[0]._id.toString();

    const response = await updateCrest(
      request(tournament._id.toString(), teamId, validCrest),
      context(tournament._id.toString(), teamId),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      teamId,
      crest: validCrest,
    });

    const reloaded = await Tournament.findById(tournament._id);
    expect(reloaded?.teams[0].crest).toMatchObject(validCrest);
    // The other team is untouched.
    expect(reloaded?.teams[1].crest ?? null).toBeNull();
  });

  it("rejects an invalid crest payload", async () => {
    const tournament = await Tournament.create({
      name: "Knightly Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams: makeTeams(2),
    });
    const teamId = tournament.teams[0]._id.toString();

    const response = await updateCrest(
      request(tournament._id.toString(), teamId, { field: "chartreuse" }),
      context(tournament._id.toString(), teamId),
    );

    expect(response.status).toBe(422);
  });

  it("returns 404 for an unknown team", async () => {
    const tournament = await Tournament.create({
      name: "Knightly Cup",
      teamSize: 2,
      courtsAvailable: 1,
      inputMode: "teams",
      teams: makeTeams(2),
    });
    const missingTeamId = new Types.ObjectId().toString();

    const response = await updateCrest(
      request(tournament._id.toString(), missingTeamId, validCrest),
      context(tournament._id.toString(), missingTeamId),
    );

    expect(response.status).toBe(404);
  });
});
