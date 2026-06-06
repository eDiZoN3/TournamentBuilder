type HttpMethod = "get" | "post" | "put" | "delete";

type JsonObject = Record<string, unknown>;

interface OperationObject {
  tags: string[];
  summary: string;
  description?: string;
  operationId: string;
  parameters?: JsonObject[];
  requestBody?: JsonObject;
  responses: Record<string, JsonObject>;
  security?: Array<Record<string, string[]>>;
}

export interface OpenApiDocument {
  openapi: "3.1.0";
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
  paths: Record<string, Partial<Record<HttpMethod, OperationObject>>>;
  components: {
    parameters: Record<string, JsonObject>;
    responses: Record<string, JsonObject>;
    schemas: Record<string, JsonObject>;
    securitySchemes: Record<string, JsonObject>;
  };
}

const cookieSecurity = [{ cookieAuth: [] }];

function ref(name: string) {
  return { $ref: `#/components/schemas/${name}` };
}

function parameterRef(name: string) {
  return { $ref: `#/components/parameters/${name}` };
}

function responseRef(name: string) {
  return { $ref: `#/components/responses/${name}` };
}

function jsonBody(schema: JsonObject, required = true): JsonObject {
  return {
    required,
    content: {
      "application/json": {
        schema,
      },
    },
  };
}

function jsonResponse(description: string, schema: JsonObject): JsonObject {
  return {
    description,
    content: {
      "application/json": {
        schema,
      },
    },
  };
}

export const openApiDocument: OpenApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Raro Volleyball Tournament API",
    description:
      "HTTP API for managing volleyball tournaments, match scoring, player accounts, admin workflows, and statistics.",
    version: "0.1.0",
  },
  servers: [
    {
      url: "/",
      description: "Current deployment",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "Player account creation and password flows.",
    },
    {
      name: "Public",
      description: "Public tournament and statistics data.",
    },
    {
      name: "Tournaments",
      description: "Tournament lifecycle and bracket operations.",
    },
    {
      name: "Matches",
      description: "Match scoring, status, court, and manual override operations.",
    },
    {
      name: "Practice Matches",
      description: "Player-owned practice matches outside tournament brackets.",
    },
    {
      name: "Admin",
      description: "Administrative dashboard, account, and stats reset operations.",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "next-auth.session-token",
        description:
          "NextAuth session cookie. Secure deployments may use __Secure-next-auth.session-token.",
      },
    },
    parameters: {
      TournamentId: {
        name: "id",
        in: "path",
        required: true,
        description: "MongoDB ObjectId of the tournament.",
        schema: ref("ObjectId"),
      },
      MatchId: {
        name: "matchId",
        in: "path",
        required: true,
        description: "MongoDB ObjectId of the match inside the tournament.",
        schema: ref("ObjectId"),
      },
      UserId: {
        name: "id",
        in: "path",
        required: true,
        description: "MongoDB ObjectId of the user account.",
        schema: ref("ObjectId"),
      },
      PlayerId: {
        name: "id",
        in: "path",
        required: true,
        description: "MongoDB ObjectId of the player user account.",
        schema: ref("ObjectId"),
      },
      PracticeMatchId: {
        name: "id",
        in: "path",
        required: true,
        description: "MongoDB ObjectId of the practice match.",
        schema: ref("ObjectId"),
      },
    },
    responses: {
      BadRequest: jsonResponse("The request payload or path parameter is invalid.", ref("ErrorResponse")),
      Unauthorized: jsonResponse("Authentication is required.", ref("ErrorResponse")),
      Forbidden: jsonResponse("The authenticated user is not allowed to perform this action.", ref("ErrorResponse")),
      NotFound: jsonResponse("The requested resource was not found.", ref("ErrorResponse")),
      ValidationError: jsonResponse("The request failed validation.", ref("ErrorResponse")),
      InternalError: jsonResponse("The server could not complete the request.", ref("ErrorResponse")),
    },
    schemas: {
      ObjectId: {
        type: "string",
        pattern: "^[a-fA-F0-9]{24}$",
        example: "64f1a2b3c4d5e6f7890abc12",
      },
      ErrorResponse: {
        type: "object",
        required: ["error", "code"],
        properties: {
          error: {
            type: "string",
          },
          code: {
            type: "string",
            example: "VALIDATION_ERROR",
          },
        },
      },
      TournamentStatus: {
        type: "string",
        enum: ["draft", "active", "completed"],
      },
      TournamentFormat: {
        type: "string",
        enum: ["double_elimination", "team_round_robin", "individual_mixer"],
      },
      InputMode: {
        type: "string",
        enum: ["teams", "players"],
      },
      RoundRobinMatchFormat: {
        type: "string",
        enum: ["bo1", "bo3"],
      },
      Team: {
        type: "object",
        required: ["_id", "name", "players"],
        properties: {
          _id: ref("ObjectId"),
          name: {
            type: "string",
            example: "Team A",
          },
          players: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
      ScoreSet: {
        type: "object",
        required: ["scoreA", "scoreB", "pointsToWin"],
        properties: {
          scoreA: {
            type: "integer",
            minimum: 0,
          },
          scoreB: {
            type: "integer",
            minimum: 0,
          },
          pointsToWin: {
            type: "integer",
            enum: [11, 15, 21, 25],
          },
        },
      },
      MatchTeamScore: {
        type: "object",
        properties: {
          teamId: ref("ObjectId"),
          sets: {
            type: "array",
            items: ref("ScoreSet"),
          },
        },
      },
      Match: {
        type: "object",
        required: ["_id", "label", "status"],
        properties: {
          _id: ref("ObjectId"),
          label: {
            type: "string",
            example: "WB Final",
          },
          status: {
            type: "string",
            enum: ["pending", "ready", "in_progress", "completed"],
          },
          courtNumber: {
            type: "integer",
            nullable: true,
          },
          teamA: ref("MatchTeamScore"),
          teamB: ref("MatchTeamScore"),
          winnerId: {
            oneOf: [ref("ObjectId"), { type: "null" }],
          },
          loserId: {
            oneOf: [ref("ObjectId"), { type: "null" }],
          },
          isBye: {
            type: "boolean",
          },
        },
      },
      PracticeParticipant: {
        type: "object",
        required: ["displayName"],
        properties: {
          playerProfileId: {
            oneOf: [ref("ObjectId"), { type: "null" }],
          },
          displayName: {
            type: "string",
            minLength: 1,
            maxLength: 120,
            example: "Alice Example",
          },
        },
      },
      PracticeSetRequest: {
        type: "object",
        required: ["scoreA", "scoreB"],
        properties: {
          scoreA: {
            type: "integer",
            minimum: 0,
          },
          scoreB: {
            type: "integer",
            minimum: 0,
          },
        },
      },
      PracticeSet: {
        type: "object",
        required: ["scoreA", "scoreB", "pointsToWin"],
        properties: {
          scoreA: {
            type: "integer",
            minimum: 0,
          },
          scoreB: {
            type: "integer",
            minimum: 0,
          },
          pointsToWin: {
            type: "integer",
            enum: [11, 21],
          },
        },
      },
      PracticeMatchRequest: {
        type: "object",
        required: ["sideA", "sideB", "sets"],
        properties: {
          playedAt: {
            type: "string",
            format: "date-time",
          },
          sideA: {
            type: "array",
            minItems: 1,
            maxItems: 4,
            items: ref("PracticeParticipant"),
          },
          sideB: {
            type: "array",
            minItems: 1,
            maxItems: 4,
            items: ref("PracticeParticipant"),
          },
          sets: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: ref("PracticeSetRequest"),
          },
        },
      },
      PracticeMatch: {
        type: "object",
        required: [
          "_id",
          "createdBy",
          "playedAt",
          "sideA",
          "sideB",
          "sets",
          "winnerSide",
        ],
        properties: {
          _id: ref("ObjectId"),
          createdBy: ref("ObjectId"),
          playedAt: {
            type: "string",
            format: "date-time",
          },
          sideA: {
            type: "array",
            items: ref("PracticeParticipant"),
          },
          sideB: {
            type: "array",
            items: ref("PracticeParticipant"),
          },
          sets: {
            type: "array",
            items: ref("PracticeSet"),
          },
          winnerSide: {
            type: "string",
            enum: ["A", "B"],
          },
        },
      },
      TournamentSummary: {
        type: "object",
        required: [
          "_id",
          "name",
          "status",
          "format",
          "roundRobinMatchFormat",
          "createdAt",
          "allowSelfJoin",
          "teamCount",
          "matchCount",
        ],
        properties: {
          _id: ref("ObjectId"),
          name: {
            type: "string",
            example: "Summer Cup",
          },
          status: ref("TournamentStatus"),
          format: ref("TournamentFormat"),
          roundRobinMatchFormat: ref("RoundRobinMatchFormat"),
          createdAt: {
            type: "string",
            format: "date-time",
          },
          allowSelfJoin: {
            type: "boolean",
          },
          teamCount: {
            type: "integer",
          },
          matchCount: {
            type: "integer",
          },
        },
      },
      Tournament: {
        type: "object",
        required: [
          "_id",
          "name",
          "status",
          "format",
          "roundRobinMatchFormat",
          "teamSize",
          "courtsAvailable",
          "inputMode",
          "teams",
          "matches",
        ],
        properties: {
          _id: ref("ObjectId"),
          name: {
            type: "string",
          },
          status: ref("TournamentStatus"),
          format: ref("TournamentFormat"),
          roundRobinMatchFormat: ref("RoundRobinMatchFormat"),
          teamSize: {
            type: "integer",
            enum: [2, 3, 4],
          },
          courtsAvailable: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          inputMode: ref("InputMode"),
          allowSelfJoin: {
            type: "boolean",
          },
          teams: {
            type: "array",
            items: ref("Team"),
          },
          matches: {
            type: "array",
            items: ref("Match"),
          },
        },
      },
      CreateTournamentRequest: {
        type: "object",
        required: ["name", "teamSize", "courtsAvailable", "inputMode"],
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
          },
          format: ref("TournamentFormat"),
          roundRobinMatchFormat: ref("RoundRobinMatchFormat"),
          teamSize: {
            type: "integer",
            enum: [2, 3, 4],
          },
          courtsAvailable: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          inputMode: ref("InputMode"),
          allowSelfJoin: {
            type: "boolean",
            default: false,
          },
        },
      },
      UpdateTournamentRequest: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
          },
          courtsAvailable: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          teams: {
            type: "array",
            items: ref("Team"),
          },
          players: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
      ScoreUpdateRequest: {
        type: "object",
        required: ["sets"],
        properties: {
          sets: {
            type: "array",
            minItems: 1,
            items: ref("ScoreSet"),
          },
        },
      },
      MatchStatusUpdateRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["ready", "in_progress", "completed"],
          },
        },
      },
      CourtUpdateRequest: {
        type: "object",
        required: ["courtNumber"],
        properties: {
          courtNumber: {
            type: "integer",
            minimum: 1,
          },
        },
      },
      OverrideMatchRequest: {
        type: "object",
        properties: {
          winnerId: ref("ObjectId"),
          teamA: ref("MatchTeamScore"),
          teamB: ref("MatchTeamScore"),
        },
      },
      StatsRow: {
        type: "object",
        required: [
          "name",
          "matchesPlayed",
          "matchesWon",
          "matchesLost",
          "pointsFor",
          "pointsAgainst",
          "winRate",
        ],
        properties: {
          name: {
            type: "string",
          },
          matchesPlayed: {
            type: "integer",
          },
          matchesWon: {
            type: "integer",
          },
          matchesLost: {
            type: "integer",
          },
          pointsFor: {
            type: "integer",
          },
          pointsAgainst: {
            type: "integer",
          },
          winRate: {
            type: "number",
            minimum: 0,
            maximum: 1,
          },
        },
      },
      StatsResponse: {
        type: "object",
        required: ["teams", "players"],
        properties: {
          teams: {
            type: "array",
            items: ref("StatsRow"),
          },
          players: {
            type: "array",
            items: ref("StatsRow"),
          },
          practicePlayers: {
            type: "array",
            items: ref("StatsRow"),
          },
        },
      },
      SignupRequest: {
        type: "object",
        required: ["email", "password", "firstName", "surname"],
        properties: {
          email: {
            type: "string",
            format: "email",
          },
          password: {
            type: "string",
            minLength: 8,
          },
          firstName: {
            type: "string",
          },
          surname: {
            type: "string",
          },
        },
      },
      AdminUser: {
        type: "object",
        required: ["_id", "email", "role"],
        properties: {
          _id: ref("ObjectId"),
          email: {
            type: "string",
            format: "email",
          },
          role: {
            type: "string",
            enum: ["admin", "tournament_lead", "player"],
          },
          firstLogin: {
            type: "boolean",
          },
          forcePasswordChange: {
            type: "boolean",
          },
        },
      },
      CreateAdminUserRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
          },
        },
      },
      CreatePlayerRequest: {
        type: "object",
        required: ["email", "firstName", "surname"],
        properties: {
          email: {
            type: "string",
            format: "email",
          },
          firstName: {
            type: "string",
          },
          surname: {
            type: "string",
          },
        },
      },
      TemporaryPasswordResponse: {
        type: "object",
        required: ["user", "temporaryPassword"],
        properties: {
          user: ref("AdminUser"),
          temporaryPassword: {
            type: "string",
            minLength: 10,
            maxLength: 10,
          },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: {
            type: "string",
          },
          newPassword: {
            type: "string",
            minLength: 8,
          },
        },
      },
      StatsResetRequest: {
        type: "object",
        required: ["scope", "confirmation"],
        properties: {
          scope: {
            type: "string",
            enum: ["player", "tournament", "season", "all"],
          },
          playerProfileId: ref("ObjectId"),
          tournamentId: ref("ObjectId"),
          season: {
            type: "integer",
            minimum: 1900,
            maximum: 3000,
            description: "Calendar year from January 1 through December 31.",
          },
          confirmation: {
            type: "string",
            const: "RESET STATS",
          },
        },
      },
      StatsResetResponse: {
        type: "object",
        required: ["reset", "affectedTournaments"],
        properties: {
          reset: {
            type: "object",
            properties: {
              scope: {
                type: "string",
              },
              resetKey: {
                type: "string",
              },
            },
          },
          affectedTournaments: {
            type: "integer",
          },
        },
      },
    },
  },
  paths: {
    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create a player account",
        operationId: "createPlayerSignup",
        requestBody: jsonBody(ref("SignupRequest")),
        responses: {
          "201": jsonResponse("Player account created.", ref("AdminUser")),
          "409": responseRef("ValidationError"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/stats": {
      get: {
        tags: ["Public"],
        summary: "List global tournament and practice statistics",
        operationId: "getGlobalStats",
        responses: {
          "200": jsonResponse("Global statistics.", ref("StatsResponse")),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/practice-matches": {
      get: {
        tags: ["Practice Matches"],
        summary: "List practice matches for the signed-in player",
        operationId: "listPracticeMatches",
        security: cookieSecurity,
        responses: {
          "200": jsonResponse("Practice matches.", {
            type: "object",
            required: ["practiceMatches"],
            properties: {
              practiceMatches: {
                type: "array",
                items: ref("PracticeMatch"),
              },
            },
          }),
          "401": responseRef("Unauthorized"),
          "500": responseRef("InternalError"),
        },
      },
      post: {
        tags: ["Practice Matches"],
        summary: "Create a practice match",
        operationId: "createPracticeMatch",
        security: cookieSecurity,
        requestBody: jsonBody(ref("PracticeMatchRequest")),
        responses: {
          "201": jsonResponse("Practice match created.", {
            type: "object",
            required: ["match"],
            properties: {
              match: ref("PracticeMatch"),
            },
          }),
          "401": responseRef("Unauthorized"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/practice-matches/{id}": {
      put: {
        tags: ["Practice Matches"],
        summary: "Update a creator-owned practice match",
        operationId: "updatePracticeMatch",
        security: cookieSecurity,
        parameters: [parameterRef("PracticeMatchId")],
        requestBody: jsonBody(ref("PracticeMatchRequest")),
        responses: {
          "200": jsonResponse("Practice match updated.", {
            type: "object",
            required: ["match"],
            properties: {
              match: ref("PracticeMatch"),
            },
          }),
          "401": responseRef("Unauthorized"),
          "403": responseRef("Forbidden"),
          "404": responseRef("NotFound"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
      delete: {
        tags: ["Practice Matches"],
        summary: "Delete a creator-owned practice match",
        operationId: "deletePracticeMatch",
        security: cookieSecurity,
        parameters: [parameterRef("PracticeMatchId")],
        responses: {
          "200": jsonResponse("Practice match deleted.", {
            type: "object",
            required: ["deleted"],
            properties: {
              deleted: {
                type: "boolean",
              },
            },
          }),
          "401": responseRef("Unauthorized"),
          "403": responseRef("Forbidden"),
          "404": responseRef("NotFound"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/tournaments": {
      get: {
        tags: ["Tournaments"],
        summary: "List tournament summaries",
        operationId: "listTournaments",
        responses: {
          "200": jsonResponse("Tournament summaries.", {
            type: "object",
            required: ["tournaments"],
            properties: {
              tournaments: {
                type: "array",
                items: ref("TournamentSummary"),
              },
            },
          }),
          "500": responseRef("InternalError"),
        },
      },
      post: {
        tags: ["Tournaments"],
        summary: "Create a tournament",
        operationId: "createTournament",
        security: cookieSecurity,
        requestBody: jsonBody(ref("CreateTournamentRequest")),
        responses: {
          "201": jsonResponse("Tournament created.", ref("Tournament")),
          "401": responseRef("Unauthorized"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/tournaments/{id}": {
      get: {
        tags: ["Tournaments"],
        summary: "Get one tournament",
        operationId: "getTournament",
        parameters: [parameterRef("TournamentId")],
        responses: {
          "200": jsonResponse("Tournament details.", ref("Tournament")),
          "400": responseRef("BadRequest"),
          "404": responseRef("NotFound"),
          "500": responseRef("InternalError"),
        },
      },
      put: {
        tags: ["Tournaments"],
        summary: "Update a draft tournament",
        operationId: "updateTournament",
        security: cookieSecurity,
        parameters: [parameterRef("TournamentId")],
        requestBody: jsonBody(ref("UpdateTournamentRequest")),
        responses: {
          "200": jsonResponse("Tournament updated.", ref("Tournament")),
          "400": responseRef("BadRequest"),
          "401": responseRef("Unauthorized"),
          "404": responseRef("NotFound"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
      delete: {
        tags: ["Tournaments"],
        summary: "Delete a draft tournament",
        operationId: "deleteTournament",
        security: cookieSecurity,
        parameters: [parameterRef("TournamentId")],
        responses: {
          "200": jsonResponse("Tournament deleted.", {
            type: "object",
            required: ["deleted"],
            properties: {
              deleted: {
                type: "boolean",
              },
            },
          }),
          "400": responseRef("BadRequest"),
          "401": responseRef("Unauthorized"),
          "404": responseRef("NotFound"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/tournaments/{id}/join": {
      post: {
        tags: ["Tournaments"],
        summary: "Join a self-join tournament as the signed-in player",
        operationId: "joinTournament",
        security: cookieSecurity,
        parameters: [parameterRef("TournamentId")],
        responses: {
          "200": jsonResponse("Player joined or was already in the roster.", {
            type: "object",
            required: ["joined", "players", "playerCount"],
            properties: {
              joined: {
                type: "boolean",
              },
              players: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              playerCount: {
                type: "integer",
              },
            },
          }),
          "400": responseRef("BadRequest"),
          "401": responseRef("Unauthorized"),
          "403": responseRef("Forbidden"),
          "404": responseRef("NotFound"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/tournaments/{id}/start": {
      post: {
        tags: ["Tournaments"],
        summary: "Generate the bracket and start a tournament",
        operationId: "startTournament",
        security: cookieSecurity,
        parameters: [parameterRef("TournamentId")],
        responses: {
          "200": jsonResponse("Tournament started.", ref("Tournament")),
          "400": responseRef("BadRequest"),
          "401": responseRef("Unauthorized"),
          "404": responseRef("NotFound"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/tournaments/{id}/stats": {
      get: {
        tags: ["Public"],
        summary: "List team and player statistics for one tournament",
        operationId: "getTournamentStats",
        parameters: [parameterRef("TournamentId")],
        responses: {
          "200": jsonResponse("Tournament statistics.", ref("StatsResponse")),
          "400": responseRef("BadRequest"),
          "404": responseRef("NotFound"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/tournaments/{id}/matches/{matchId}/court": {
      put: {
        tags: ["Matches"],
        summary: "Assign a ready or active match to a court",
        operationId: "assignMatchCourt",
        security: cookieSecurity,
        parameters: [parameterRef("TournamentId"), parameterRef("MatchId")],
        requestBody: jsonBody(ref("CourtUpdateRequest")),
        responses: {
          "200": jsonResponse("Match court updated.", ref("Tournament")),
          "400": responseRef("BadRequest"),
          "401": responseRef("Unauthorized"),
          "404": responseRef("NotFound"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/tournaments/{id}/matches/{matchId}/override": {
      post: {
        tags: ["Matches"],
        summary: "Override a completed match result",
        operationId: "overrideMatchResult",
        security: cookieSecurity,
        parameters: [parameterRef("TournamentId"), parameterRef("MatchId")],
        requestBody: jsonBody(ref("OverrideMatchRequest")),
        responses: {
          "200": jsonResponse("Match override applied.", ref("Tournament")),
          "400": responseRef("BadRequest"),
          "401": responseRef("Unauthorized"),
          "404": responseRef("NotFound"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/tournaments/{id}/matches/{matchId}/scores": {
      put: {
        tags: ["Matches"],
        summary: "Save a match score",
        operationId: "saveMatchScore",
        security: cookieSecurity,
        parameters: [parameterRef("TournamentId"), parameterRef("MatchId")],
        requestBody: jsonBody(ref("ScoreUpdateRequest")),
        responses: {
          "200": jsonResponse("Score saved and bracket advanced.", ref("Tournament")),
          "400": responseRef("BadRequest"),
          "401": responseRef("Unauthorized"),
          "404": responseRef("NotFound"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/tournaments/{id}/matches/{matchId}/status": {
      put: {
        tags: ["Matches"],
        summary: "Change match status",
        operationId: "updateMatchStatus",
        security: cookieSecurity,
        parameters: [parameterRef("TournamentId"), parameterRef("MatchId")],
        requestBody: jsonBody(ref("MatchStatusUpdateRequest")),
        responses: {
          "200": jsonResponse("Match status updated.", ref("Tournament")),
          "400": responseRef("BadRequest"),
          "401": responseRef("Unauthorized"),
          "404": responseRef("NotFound"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/admin/change-password": {
      post: {
        tags: ["Admin"],
        summary: "Change the signed-in user's password",
        operationId: "changePassword",
        security: cookieSecurity,
        requestBody: jsonBody(ref("ChangePasswordRequest")),
        responses: {
          "200": jsonResponse("Password changed.", {
            type: "object",
            required: ["success"],
            properties: {
              success: {
                type: "boolean",
              },
            },
          }),
          "401": responseRef("Unauthorized"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/admin/dashboard": {
      get: {
        tags: ["Admin"],
        summary: "Load admin dashboard metrics",
        operationId: "getAdminDashboard",
        security: cookieSecurity,
        responses: {
          "200": jsonResponse("Dashboard metrics.", {
            type: "object",
            additionalProperties: true,
          }),
          "401": responseRef("Unauthorized"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/admin/players": {
      get: {
        tags: ["Admin"],
        summary: "List player accounts",
        operationId: "listPlayerAccounts",
        security: cookieSecurity,
        responses: {
          "200": jsonResponse("Player accounts.", {
            type: "object",
            required: ["players"],
            properties: {
              players: {
                type: "array",
                items: ref("AdminUser"),
              },
            },
          }),
          "401": responseRef("Unauthorized"),
          "403": responseRef("Forbidden"),
          "500": responseRef("InternalError"),
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a player account with a temporary password",
        operationId: "createPlayerAccount",
        security: cookieSecurity,
        requestBody: jsonBody(ref("CreatePlayerRequest")),
        responses: {
          "201": jsonResponse("Player account created.", ref("TemporaryPasswordResponse")),
          "401": responseRef("Unauthorized"),
          "403": responseRef("Forbidden"),
          "409": responseRef("ValidationError"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/admin/players/{id}/reset-password": {
      post: {
        tags: ["Admin"],
        summary: "Reset a player password",
        operationId: "resetPlayerPassword",
        security: cookieSecurity,
        parameters: [parameterRef("PlayerId")],
        responses: {
          "200": jsonResponse("Temporary password generated.", ref("TemporaryPasswordResponse")),
          "400": responseRef("BadRequest"),
          "401": responseRef("Unauthorized"),
          "403": responseRef("Forbidden"),
          "404": responseRef("NotFound"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/admin/stats/reset": {
      post: {
        tags: ["Admin"],
        summary: "Reset statistics by player, tournament, season, or all data",
        description:
          "Season resets apply to the full calendar year from January 1 through December 31.",
        operationId: "resetStats",
        security: cookieSecurity,
        requestBody: jsonBody(ref("StatsResetRequest")),
        responses: {
          "200": jsonResponse("Stats reset recorded.", ref("StatsResetResponse")),
          "400": responseRef("BadRequest"),
          "401": responseRef("Unauthorized"),
          "403": responseRef("Forbidden"),
          "404": responseRef("NotFound"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List tournament lead accounts",
        operationId: "listAdminUsers",
        security: cookieSecurity,
        responses: {
          "200": jsonResponse("Tournament lead accounts.", {
            type: "object",
            required: ["users"],
            properties: {
              users: {
                type: "array",
                items: ref("AdminUser"),
              },
            },
          }),
          "401": responseRef("Unauthorized"),
          "403": responseRef("Forbidden"),
          "500": responseRef("InternalError"),
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a tournament lead account",
        operationId: "createAdminUser",
        security: cookieSecurity,
        requestBody: jsonBody(ref("CreateAdminUserRequest")),
        responses: {
          "201": jsonResponse("Tournament lead account created.", ref("TemporaryPasswordResponse")),
          "401": responseRef("Unauthorized"),
          "403": responseRef("Forbidden"),
          "409": responseRef("ValidationError"),
          "422": responseRef("ValidationError"),
          "500": responseRef("InternalError"),
        },
      },
    },
    "/api/admin/users/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete a tournament lead account",
        operationId: "deleteAdminUser",
        security: cookieSecurity,
        parameters: [parameterRef("UserId")],
        responses: {
          "200": jsonResponse("Tournament lead account deleted.", {
            type: "object",
            required: ["deleted"],
            properties: {
              deleted: {
                type: "boolean",
              },
            },
          }),
          "400": responseRef("BadRequest"),
          "401": responseRef("Unauthorized"),
          "403": responseRef("Forbidden"),
          "404": responseRef("NotFound"),
          "500": responseRef("InternalError"),
        },
      },
    },
  },
};
