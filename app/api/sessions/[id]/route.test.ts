/**
 * @jest-environment node
 */

import { GET } from "@/app/api/sessions/[id]/route";
import { requireUser } from "@/lib/auth/session";
import { HttpError } from "@/lib/errors/http-error";
import { getSessionById } from "@/lib/sessions/get-session-by-id";

jest.mock("@/lib/auth/session", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/lib/sessions/get-session-by-id", () => ({
  getSessionById: jest.fn(),
}));

const requireUserMock = requireUser as jest.MockedFunction<typeof requireUser>;
const getSessionByIdMock = getSessionById as jest.MockedFunction<
  typeof getSessionById
>;

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "user@example.com",
} as Awaited<ReturnType<typeof requireUser>>;

const sessionId = "33333333-3333-4333-8333-333333333333";

const sessionDetail = {
  id: sessionId,
  user_id: user.id,
  plan_id: "22222222-2222-4222-8222-222222222222",
  day_index: 1,
  performed_on: "2026-08-27",
  notes: null,
  created_at: "2026-08-27T10:00:00.000Z",
  updated_at: "2026-08-27T10:00:00.000Z",
  exercises: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      session_id: sessionId,
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

function invokeGet(id: string) {
  return GET(new Request(`http://localhost/api/sessions/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /api/sessions/[id]", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
    getSessionByIdMock.mockReset();
    requireUserMock.mockResolvedValue(user);
  });

  it("responds 401 UNAUTHORIZED when there is no session", async () => {
    requireUserMock.mockRejectedValue(
      new HttpError(401, "UNAUTHORIZED", "Authentication required."),
    );

    const response = await invokeGet(sessionId);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    });
  });

  it("responds 200 with SessionDetail when the session is owned", async () => {
    getSessionByIdMock.mockResolvedValue(sessionDetail);

    const response = await invokeGet(sessionId);
    const body = await response.json();

    expect(getSessionByIdMock).toHaveBeenCalledWith(user.id, sessionId);
    expect(response.status).toBe(200);
    expect(body).toEqual({ data: sessionDetail });
  });

  it("responds 404 SESSION_NOT_FOUND when missing or not owned", async () => {
    getSessionByIdMock.mockRejectedValue(
      new HttpError(404, "SESSION_NOT_FOUND", "Workout session not found."),
    );

    const response = await invokeGet(sessionId);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: {
        code: "SESSION_NOT_FOUND",
        message: "Workout session not found.",
      },
    });
  });

  it("responds 400 VALIDATION_ERROR for an invalid uuid", async () => {
    const response = await invokeGet("not-a-uuid");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(getSessionByIdMock).not.toHaveBeenCalled();
  });
});
