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

import { POST as addCategory } from "@/app/api/groups/[id]/categories/route";
import {
  DELETE as removeCategory,
  PUT as renameCategory,
} from "@/app/api/groups/[id]/categories/[catId]/route";

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

function ctx(id: string, catId?: string) {
  return {
    params: Promise.resolve(catId ? { id, catId } : { id }),
  };
}

describe("/api/groups/[id]/categories", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(true);
  });

  describe("POST — add category", () => {
    it("adds a category with position 0 to an empty group", async () => {
      const group = await TournamentGroup.create({ name: "Cup" });

      const res = await addCategory(
        request(`http://localhost/api/groups/${group._id}/categories`, "POST", {
          name: "Category A",
        }),
        ctx(group._id.toString()),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.categories).toHaveLength(1);
      expect(body.categories[0].name).toBe("Category A");
      expect(body.categories[0].position).toBe(0);
    });

    it("assigns incrementing positions when adding multiple categories", async () => {
      const group = await TournamentGroup.create({
        name: "Cup",
        categories: [{ name: "Existing", position: 0 }],
      });

      await addCategory(
        request(`http://localhost/api/groups/${group._id}/categories`, "POST", {
          name: "New Cat",
        }),
        ctx(group._id.toString()),
      );

      const updated = await TournamentGroup.findById(group._id).lean();
      expect(updated!.categories).toHaveLength(2);
      expect(updated!.categories[1].position).toBe(1);
    });

    it("returns 400 when name is missing", async () => {
      const group = await TournamentGroup.create({ name: "Cup" });

      const res = await addCategory(
        request(`http://localhost/api/groups/${group._id}/categories`, "POST", {}),
        ctx(group._id.toString()),
      );
      expect(res.status).toBe(400);
    });

    it("returns 409 when group is not draft", async () => {
      const group = await TournamentGroup.create({
        name: "Cup",
        status: "active",
      });

      const res = await addCategory(
        request(`http://localhost/api/groups/${group._id}/categories`, "POST", {
          name: "Cat",
        }),
        ctx(group._id.toString()),
      );
      expect(res.status).toBe(409);
    });

    it("returns 404 for unknown group id", async () => {
      const res = await addCategory(
        request(
          `http://localhost/api/groups/${new Types.ObjectId()}/categories`,
          "POST",
          { name: "Cat" },
        ),
        ctx(new Types.ObjectId().toString()),
      );
      expect(res.status).toBe(404);
    });

    it("returns 401 when not authenticated", async () => {
      requireAdmin.mockResolvedValue(false);
      const group = await TournamentGroup.create({ name: "Cup" });

      const res = await addCategory(
        request(`http://localhost/api/groups/${group._id}/categories`, "POST", {
          name: "Cat",
        }),
        ctx(group._id.toString()),
      );
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE — remove category", () => {
    it("removes the specified category and leaves others intact", async () => {
      const group = await TournamentGroup.create({
        name: "Cup",
        categories: [
          { name: "Cat A", position: 0 },
          { name: "Cat B", position: 1 },
        ],
      });
      const catId = group.categories[0]._id.toString();

      const res = await removeCategory(
        request(
          `http://localhost/api/groups/${group._id}/categories/${catId}`,
          "DELETE",
        ),
        ctx(group._id.toString(), catId),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.categories).toHaveLength(1);
      expect(body.categories[0].name).toBe("Cat B");
    });

    it("returns 409 when group is not draft", async () => {
      const group = await TournamentGroup.create({
        name: "Cup",
        status: "active",
        categories: [{ name: "Cat A", position: 0 }],
      });
      const catId = group.categories[0]._id.toString();

      const res = await removeCategory(
        request(
          `http://localhost/api/groups/${group._id}/categories/${catId}`,
          "DELETE",
        ),
        ctx(group._id.toString(), catId),
      );
      expect(res.status).toBe(409);
    });

    it("returns 404 when category does not exist", async () => {
      const group = await TournamentGroup.create({ name: "Cup" });

      const res = await removeCategory(
        request(
          `http://localhost/api/groups/${group._id}/categories/${new Types.ObjectId()}`,
          "DELETE",
        ),
        ctx(group._id.toString(), new Types.ObjectId().toString()),
      );
      expect(res.status).toBe(404);
    });

    it("returns 401 when not authenticated", async () => {
      requireAdmin.mockResolvedValue(false);
      const group = await TournamentGroup.create({
        name: "Cup",
        categories: [{ name: "Cat A", position: 0 }],
      });
      const catId = group.categories[0]._id.toString();

      const res = await removeCategory(
        request(
          `http://localhost/api/groups/${group._id}/categories/${catId}`,
          "DELETE",
        ),
        ctx(group._id.toString(), catId),
      );
      expect(res.status).toBe(401);
    });
  });

  describe("PUT — rename category", () => {
    it("updates the category name", async () => {
      const group = await TournamentGroup.create({
        name: "Cup",
        categories: [{ name: "Old Name", position: 0 }],
      });
      const catId = group.categories[0]._id.toString();

      const res = await renameCategory(
        request(
          `http://localhost/api/groups/${group._id}/categories/${catId}`,
          "PUT",
          { name: "New Name" },
        ),
        ctx(group._id.toString(), catId),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.categories[0].name).toBe("New Name");
    });

    it("returns 409 when group is not draft", async () => {
      const group = await TournamentGroup.create({
        name: "Cup",
        status: "active",
        categories: [{ name: "Cat", position: 0 }],
      });
      const catId = group.categories[0]._id.toString();

      const res = await renameCategory(
        request(
          `http://localhost/api/groups/${group._id}/categories/${catId}`,
          "PUT",
          { name: "New" },
        ),
        ctx(group._id.toString(), catId),
      );
      expect(res.status).toBe(409);
    });

    it("returns 400 when name is missing", async () => {
      const group = await TournamentGroup.create({
        name: "Cup",
        categories: [{ name: "Cat", position: 0 }],
      });
      const catId = group.categories[0]._id.toString();

      const res = await renameCategory(
        request(
          `http://localhost/api/groups/${group._id}/categories/${catId}`,
          "PUT",
          {},
        ),
        ctx(group._id.toString(), catId),
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 when category does not exist", async () => {
      const group = await TournamentGroup.create({ name: "Cup" });

      const res = await renameCategory(
        request(
          `http://localhost/api/groups/${group._id}/categories/${new Types.ObjectId()}`,
          "PUT",
          { name: "New" },
        ),
        ctx(group._id.toString(), new Types.ObjectId().toString()),
      );
      expect(res.status).toBe(404);
    });

    it("returns 401 when not authenticated", async () => {
      requireAdmin.mockResolvedValue(false);
      const group = await TournamentGroup.create({
        name: "Cup",
        categories: [{ name: "Cat", position: 0 }],
      });
      const catId = group.categories[0]._id.toString();

      const res = await renameCategory(
        request(
          `http://localhost/api/groups/${group._id}/categories/${catId}`,
          "PUT",
          { name: "New" },
        ),
        ctx(group._id.toString(), catId),
      );
      expect(res.status).toBe(401);
    });
  });
});
