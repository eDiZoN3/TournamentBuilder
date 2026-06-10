import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/openapi/route";

const documentedPaths = [
  "/api/auth/signup",
  "/api/practice-matches",
  "/api/practice-matches/{id}",
  "/api/player-profiles",
  "/api/stats",
  "/api/tournaments",
  "/api/tournaments/{id}",
  "/api/tournaments/{id}/join",
  "/api/tournaments/{id}/start",
  "/api/tournaments/{id}/stats",
  "/api/tournaments/{id}/matches/{matchId}/court",
  "/api/tournaments/{id}/matches/{matchId}/override",
  "/api/tournaments/{id}/matches/{matchId}/scores",
  "/api/tournaments/{id}/matches/{matchId}/status",
  "/api/admin/change-password",
  "/api/admin/dashboard",
  "/api/admin/players",
  "/api/admin/players/{id}/reset-password",
  "/api/admin/stats/reset",
  "/api/admin/users",
  "/api/admin/users/{id}",
];

describe("/api/openapi", () => {
  it("serves a Swagger-compatible OpenAPI document for the app routes", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.openapi).toBe("3.1.0");
    expect(body.info.title).toBe("Raro Volleyball Tournament API");
    expect(Object.keys(body.paths)).toEqual(
      expect.arrayContaining(documentedPaths),
    );
  });

  it("documents auth, shared errors, and request bodies for protected writes", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.components.securitySchemes.cookieAuth).toMatchObject({
      type: "apiKey",
      in: "cookie",
      name: "next-auth.session-token",
    });
    expect(body.components.schemas.ErrorResponse.required).toEqual([
      "error",
      "code",
    ]);
    expect(body.paths["/api/tournaments"].post).toMatchObject({
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
      },
    });
    expect(body.paths["/api/admin/stats/reset"].post.requestBody.content).toHaveProperty(
      "application/json",
    );
    expect(body.paths["/api/practice-matches"].post).toMatchObject({
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
      },
    });
    expect(body.components.schemas.PracticeMatch).toBeDefined();
    expect(body.components.schemas.PracticeMatchRequest).toBeDefined();
    expect(body.components.schemas.PlayerProfileLookupResult).toBeDefined();
    expect(body.paths["/api/player-profiles"].get).toMatchObject({
      security: [{ cookieAuth: [] }],
    });
  });

  it("documents team round-robin player entry and match format metadata", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.components.schemas.RoundRobinMatchFormat).toMatchObject({
      type: "string",
      enum: ["bo1", "bo3"],
    });
    expect(
      body.components.schemas.CreateTournamentRequest.properties.roundRobinMatchFormat,
    ).toEqual({ $ref: "#/components/schemas/RoundRobinMatchFormat" });
    expect(body.components.schemas.Tournament.properties.roundRobinMatchFormat).toEqual(
      { $ref: "#/components/schemas/RoundRobinMatchFormat" },
    );
    expect(body.components.schemas.CreateTournamentRequest.properties.inputMode).toEqual(
      { $ref: "#/components/schemas/InputMode" },
    );
  });

  it("documents knockout variant configuration fields", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.components.schemas.KnockoutBracketType).toMatchObject({
      type: "string",
      enum: ["double_elimination", "single_elimination"],
    });
    expect(body.components.schemas.FirstRoundPairingMode).toMatchObject({
      type: "string",
      enum: ["random", "manual"],
    });
    expect(body.components.schemas.MatchResultMode).toMatchObject({
      type: "string",
      enum: ["points", "winner_only"],
    });
    expect(body.components.schemas.KnockoutMatchFormat).toMatchObject({
      type: "string",
      enum: ["bo3_semis_finals", "bo1"],
    });
    expect(
      body.components.schemas.CreateTournamentRequest.properties,
    ).toMatchObject({
      knockoutBracketType: { $ref: "#/components/schemas/KnockoutBracketType" },
      firstRoundPairingMode: { $ref: "#/components/schemas/FirstRoundPairingMode" },
      matchResultMode: { $ref: "#/components/schemas/MatchResultMode" },
      knockoutMatchFormat: { $ref: "#/components/schemas/KnockoutMatchFormat" },
    });
    expect(body.components.schemas.Tournament.properties).toMatchObject({
      knockoutBracketType: { $ref: "#/components/schemas/KnockoutBracketType" },
      firstRoundPairingMode: { $ref: "#/components/schemas/FirstRoundPairingMode" },
      matchResultMode: { $ref: "#/components/schemas/MatchResultMode" },
      knockoutMatchFormat: { $ref: "#/components/schemas/KnockoutMatchFormat" },
    });
  });
});
