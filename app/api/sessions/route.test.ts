/**
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/sessions/route";
import { requireUser } from "@/lib/auth/session";
import { HttpError } from "@/lib/errors/http-error";
import { createSession } from "@/lib/sessions/create-session";
import { listSessions } from "@/lib/sessions/list-sessions";

jest.mock("@/lib/auth/session", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/lib/sessions/create-session", () => ({
  createSession: jest.fn(),
}));

jest.mock("@/lib/sessions/list-sessions", () => ({
  listSessions: jest.fn(),
}));

const requireUserMock = requireUser as jest.MockedFunction<typeof requireUser>;
const createSessionMock = createSession as jest.MockedFunction<
  typeof createSession
>;
const listSessionsMock = listSessions as jest.MockedFunction<
  typeof listSessions
>;

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "user@example.com",
} as Awaited<ReturnType<typeof requireUser>>;

const planId = "22222222-2222-4222-8222-222222222222";

const validBody = {
  plan_id: planId,
  day_index: 1,
  performed_on: "2026-08-27",
  notes: null,
  exercises: [
    {
      exercise_name: "Press banca",
      exercise_order: 0,
      sets_completed: 3,
      weight_kg: 60,
      reps: "10,10,8",
    },
  ],
};

const sessionDetail = {
  id: "33333333-3333-4333-8333-333333333333",
  user_id: user.id,
  plan_id: planId,
  day_index: 1,
  performed_on: "2026-08-27",
  notes: null,
  created_at: "2026-08-27T10:00:00.000Z",
  updated_at: "2026-08-27T10:00:00.000Z",
  exercises: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      session_id: "33333333-3333-4333-8333-333333333333",
      exercise_name: "Press banca",
      exercise_order: 0,
      sets_completed: 3,
      weight_kg: 60,
      reps: "10,10,8",
      created_at: "2026-08-27T10:00:00.000Z",
      updated_at: "2026-08-27T10:00:00.000Z",
    },
  ],
};

const sessionSummary = {
  id: sessionDetail.id,
  user_id: sessionDetail.user_id,
  plan_id: sessionDetail.plan_id,
  day_index: sessionDetail.day_index,
  performed_on: sessionDetail.performed_on,
  notes: sessionDetail.notes,
  created_at: sessionDetail.created_at,
  updated_at: sessionDetail.updated_at,
};

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function getRequest(query = "") {
  return new Request(`http://localhost/api/sessions${query}`, {
    method: "GET",
  });
}

describe("/api/sessions", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
    createSessionMock.mockReset();
    listSessionsMock.mockReset();
    requireUserMock.mockResolvedValue(user);
  });

  describe("auth", () => {
    it.each([
      ["GET", () => GET(getRequest())],
      ["POST", () => POST(jsonRequest(validBody))],
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

      const response = await GET(getRequest());
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.error.code).toBe("SUPABASE_NOT_CONFIGURED");
    });
  });

  describe("POST /api/sessions", () => {
    it("creates a session and responds 201 with SessionDetail", async () => {
      createSessionMock.mockResolvedValue(sessionDetail);

      const response = await POST(
        jsonRequest({ ...validBody, user_id: "attacker-id" }),
      );
      const body = await response.json();

      expect(createSessionMock).toHaveBeenCalledWith(user.id, {
        plan_id: planId,
        day_index: 1,
        performed_on: "2026-08-27",
        notes: null,
        exercises: validBody.exercises,
      });
      expect(response.status).toBe(201);
      expect(body).toEqual({ data: sessionDetail });
    });

    it("responds 400 VALIDATION_ERROR for empty exercises", async () => {
      const response = await POST(
        jsonRequest({ ...validBody, exercises: [] }),
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(createSessionMock).not.toHaveBeenCalled();
    });

    it("responds 400 VALIDATION_ERROR for invalid JSON", async () => {
      const response = await POST(jsonRequest("{not-json"));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(createSessionMock).not.toHaveBeenCalled();
    });

    it("responds 404 PLAN_NOT_FOUND when createSession throws it", async () => {
      createSessionMock.mockRejectedValue(
        new HttpError(404, "PLAN_NOT_FOUND", "Workout plan not found."),
      );

      const response = await POST(jsonRequest(validBody));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({
        error: {
          code: "PLAN_NOT_FOUND",
          message: "Workout plan not found.",
        },
      });
    });
  });

  describe("GET /api/sessions", () => {
    it("responds 200 with empty list when there are no sessions", async () => {
      listSessionsMock.mockResolvedValue([]);

      const response = await GET(getRequest());
      const body = await response.json();

      expect(listSessionsMock).toHaveBeenCalledWith(user.id, {
        limit: 20,
      });
      expect(response.status).toBe(200);
      expect(body).toEqual({ data: [] });
    });

    it("responds 200 with SessionSummary[] and forwards plan_id/limit", async () => {
      listSessionsMock.mockResolvedValue([sessionSummary]);

      const response = await GET(
        getRequest(`?plan_id=${planId}&limit=10`),
      );
      const body = await response.json();

      expect(listSessionsMock).toHaveBeenCalledWith(user.id, {
        plan_id: planId,
        limit: 10,
      });
      expect(response.status).toBe(200);
      expect(body).toEqual({ data: [sessionSummary] });
    });

    it("responds 400 VALIDATION_ERROR for invalid plan_id", async () => {
      const response = await GET(getRequest("?plan_id=not-a-uuid"));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(listSessionsMock).not.toHaveBeenCalled();
    });

    it("responds 400 VALIDATION_ERROR when limit exceeds 50", async () => {
      const response = await GET(getRequest("?limit=51"));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(listSessionsMock).not.toHaveBeenCalled();
    });
  });
});
