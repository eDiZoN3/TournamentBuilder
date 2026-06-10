import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TournamentGroup } from "@/lib/models/TournamentGroup";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin,
}));

import {
  GET as listGroups,
  POST as createGroup,
} from "@/app/api/groups/route";
import {
  DELETE as deleteGroup,
  GET as getGroup,
} from "@/app/api/groups/[id]/route";

function request(
  url: string,
  method = "GET",
  body?: Record<string, unknown>,
) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
}

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("/api/groups", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  describe("POST /api/groups", () => {
    it("creates a group and returns 201 with draft status", async () => {
      const res = await createGroup(
        request("http://localhost/api/groups", "POST", { name: "Volleyball Cup" }),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body).toMatchObject({
        _id: expect.any(String),
        name: "Volleyball Cup",
        status: "draft",
        teams: [],
        categories: [],
      });
      expect(body.createdAt).toEqual(expect.any(String));
      await expect(TournamentGroup.countDocuments()).resolves.toBe(1);
    });

    it("returns 400 when name is missing", async () => {
      const res = await createGroup(
        request("http://localhost/api/groups", "POST", {}),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when name is an empty string", async () => {
      const res = await createGroup(
        request("http://localhost/api/groups", "POST", { name: "  " }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      requireAdmin.mockResolvedValue(false);
      const res = await createGroup(
        request("http://localhost/api/groups", "POST", { name: "Cup" }),
      );
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/groups", () => {
    it("returns empty list when no groups exist", async () => {
      const res = await listGroups(request("http://localhost/api/groups"));
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ groups: [] });
    });

    it("returns group summaries with teamCount and categoryCount", async () => {
      await TournamentGroup.create({
        name: "Cup A",
        teams: [{ name: "T1", players: [], seed: 1 }],
        categories: [
          { name: "Cat 1", position: 0, matches: [] },
          { name: "Cat 2", position: 1, matches: [] },
        ],
      });
      await TournamentGroup.create({ name: "Cup B" });

      const res = await listGroups(request("http://localhost/api/groups"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.groups).toHaveLength(2);
      expect(body.groups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Cup A",
            status: "draft",
            teamCount: 1,
            categoryCount: 2,
          }),
          expect.objectContaining({
            name: "Cup B",
            status: "draft",
            teamCount: 0,
            categoryCount: 0,
          }),
        ]),
      );
      expect(body.groups[0].createdAt).toEqual(expect.any(String));
    });

    it("returns 401 when not authenticated", async () => {
      requireAdmin.mockResolvedValue(false);
      const res = await listGroups(request("http://localhost/api/groups"));
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/groups/[id]", () => {
    it("returns the full group document", async () => {
      const group = await TournamentGroup.create({
        name: "Full Cup",
        categories: [{ name: "Cat A", position: 0 }],
      });
      const res = await getGroup(
        request(`http://localhost/api/groups/${group._id}`),
        context(group._id.toString()),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        _id: group._id.toString(),
        name: "Full Cup",
        status: "draft",
      });
      expect(body.categories).toHaveLength(1);
      expect(body.categories[0].name).toBe("Cat A");
    });

    it("returns 404 for a non-existent id", async () => {
      const res = await getGroup(
        request(`http://localhost/api/groups/${new Types.ObjectId()}`),
        context(new Types.ObjectId().toString()),
      );
      expect(res.status).toBe(404);
    });

    it("returns 404 for an invalid id format", async () => {
      const res = await getGroup(
        request("http://localhost/api/groups/not-an-id"),
        context("not-an-id"),
      );
      expect(res.status).toBe(404);
    });

    it("is accessible without authentication", async () => {
      requireAdmin.mockResolvedValue(false);
      const group = await TournamentGroup.create({ name: "Public Cup" });
      const res = await getGroup(
        request(`http://localhost/api/groups/${group._id}`),
        context(group._id.toString()),
      );
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/groups/[id]", () => {
    it("deletes a draft group and returns 204", async () => {
      const group = await TournamentGroup.create({ name: "Cup" });
      const res = await deleteGroup(
        request(`http://localhost/api/groups/${group._id}`, "DELETE"),
        context(group._id.toString()),
      );

      expect(res.status).toBe(204);
      await expect(TournamentGroup.findById(group._id)).resolves.toBeNull();
    });

    it("returns 409 when trying to delete an active group", async () => {
      const group = await TournamentGroup.create({
        name: "Active Cup",
        status: "active",
      });
      const res = await deleteGroup(
        request(`http://localhost/api/groups/${group._id}`, "DELETE"),
        context(group._id.toString()),
      );

      expect(res.status).toBe(409);
      await expect(TournamentGroup.findById(group._id)).resolves.not.toBeNull();
    });

    it("returns 404 for a non-existent group", async () => {
      const res = await deleteGroup(
        request(`http://localhost/api/groups/${new Types.ObjectId()}`, "DELETE"),
        context(new Types.ObjectId().toString()),
      );
      expect(res.status).toBe(404);
    });

    it("returns 401 when not authenticated", async () => {
      requireAdmin.mockResolvedValue(false);
      const group = await TournamentGroup.create({ name: "Cup" });
      const res = await deleteGroup(
        request(`http://localhost/api/groups/${group._id}`, "DELETE"),
        context(group._id.toString()),
      );
      expect(res.status).toBe(401);
    });
  });
});
