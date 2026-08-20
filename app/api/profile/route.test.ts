/**
 * @jest-environment node
 */

import { GET, PATCH, POST } from "./route";
import { requireUser } from "@/lib/auth/session";
import { HttpError } from "@/lib/errors/http-error";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/auth/session", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const requireUserMock = requireUser as jest.MockedFunction<typeof requireUser>;
const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

const user = {
  id: "user-1",
  email: "user@example.com",
} as Awaited<ReturnType<typeof requireUser>>;

const profileRow = {
  user_id: "user-1",
  experience_level: "beginner",
  training_days_per_week: 3,
  equipment: ["dumbbells"],
  injuries_notes: null,
  created_at: "2026-08-19T10:00:00.000Z",
  updated_at: "2026-08-19T10:00:00.000Z",
};

const validBody = {
  experience_level: "beginner" as const,
  training_days_per_week: 3,
  equipment: ["dumbbells"],
};

type QueryResult = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

function jsonRequest(method: string, body: unknown) {
  return new Request("http://localhost/api/profile", {
    method,
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function mockSupabase(result: QueryResult) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
  };
  const from = jest.fn(() => builder);

  createClientMock.mockResolvedValue({ from } as unknown as Awaited<
    ReturnType<typeof createClient>
  >);

  return { builder, from };
}

describe("/api/profile", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
    createClientMock.mockReset();
    requireUserMock.mockResolvedValue(user);
  });

  describe("auth", () => {
    it.each([
      ["GET", () => GET()],
      ["POST", () => POST(jsonRequest("POST", validBody))],
      ["PATCH", () => PATCH(jsonRequest("PATCH", { experience_level: "advanced" }))],
    ] as const)(
      "%s responds 401 UNAUTHORIZED when there is no session",
      async (_method, invoke) => {
        requireUserMock.mockRejectedValue(
          new HttpError(401, "UNAUTHORIZED", "Authentication required."),
        );

        const response = await invoke();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body).toEqual({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
          },
        });
      },
    );

    it("GET responds 503 when Supabase is not configured", async () => {
      requireUserMock.mockRejectedValue(
        new HttpError(
          503,
          "SUPABASE_NOT_CONFIGURED",
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        ),
      );

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.error.code).toBe("SUPABASE_NOT_CONFIGURED");
    });
  });

  describe("GET /api/profile", () => {
    it("responds 200 with data null when no row exists", async () => {
      mockSupabase({ data: null, error: null });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ data: null });
    });

    it("responds 200 with the profile when a row exists", async () => {
      const { builder, from } = mockSupabase({ data: profileRow, error: null });

      const response = await GET();
      const body = await response.json();

      expect(from).toHaveBeenCalledWith("profiles");
      expect(builder.eq).toHaveBeenCalledWith("user_id", user.id);
      expect(response.status).toBe(200);
      expect(body).toEqual({ data: profileRow });
    });

    it("responds 500 INTERNAL_ERROR when Supabase returns an error", async () => {
      mockSupabase({
        data: null,
        error: { message: "connection refused" },
      });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("POST /api/profile", () => {
    it("inserts for auth.uid() and responds 201", async () => {
      const { builder } = mockSupabase({ data: profileRow, error: null });

      const response = await POST(
        jsonRequest("POST", { ...validBody, user_id: "attacker-id" }),
      );
      const body = await response.json();

      expect(builder.insert).toHaveBeenCalledWith({
        ...validBody,
        user_id: user.id,
      });
      expect(response.status).toBe(201);
      expect(body).toEqual({ data: profileRow });
    });

    it("responds 409 CONFLICT when a row already exists", async () => {
      mockSupabase({
        data: null,
        error: {
          code: "23505",
          message: 'duplicate key value violates unique constraint "profiles_pkey"',
        },
      });

      const response = await POST(jsonRequest("POST", validBody));
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error.code).toBe("CONFLICT");
    });

    it("responds 400 VALIDATION_ERROR for an empty equipment array", async () => {
      const response = await POST(
        jsonRequest("POST", { ...validBody, equipment: [] }),
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: expect.any(String),
        },
      });
      expect(createClientMock).not.toHaveBeenCalled();
    });

    it("responds 400 VALIDATION_ERROR when training_days_per_week is out of range", async () => {
      const response = await POST(
        jsonRequest("POST", { ...validBody, training_days_per_week: 8 }),
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("responds 400 VALIDATION_ERROR for invalid JSON", async () => {
      const response = await POST(jsonRequest("POST", "{not-json"));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(createClientMock).not.toHaveBeenCalled();
    });

    it("responds 409 CONFLICT when uniqueness fails without code 23505", async () => {
      mockSupabase({
        data: null,
        error: { message: "duplicate key value violates unique constraint" },
      });

      const response = await POST(jsonRequest("POST", validBody));
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error.code).toBe("CONFLICT");
    });
  });

  describe("PATCH /api/profile", () => {
    it("responds 400 VALIDATION_ERROR for an empty body", async () => {
      const response = await PATCH(jsonRequest("PATCH", {}));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(createClientMock).not.toHaveBeenCalled();
    });

    it("updates the authenticated user's row and responds 200", async () => {
      const updated = { ...profileRow, experience_level: "advanced" };
      const { builder } = mockSupabase({ data: updated, error: null });

      const response = await PATCH(
        jsonRequest("PATCH", {
          experience_level: "advanced",
          user_id: "attacker-id",
        }),
      );
      const body = await response.json();

      expect(builder.update).toHaveBeenCalledWith({ experience_level: "advanced" });
      expect(builder.eq).toHaveBeenCalledWith("user_id", user.id);
      expect(response.status).toBe(200);
      expect(body).toEqual({ data: updated });
    });

    it("responds 404 NOT_FOUND when no row exists", async () => {
      mockSupabase({ data: null, error: null });

      const response = await PATCH(
        jsonRequest("PATCH", { injuries_notes: null }),
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("responds 400 VALIDATION_ERROR for an empty equipment array", async () => {
      const response = await PATCH(jsonRequest("PATCH", { equipment: [] }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
