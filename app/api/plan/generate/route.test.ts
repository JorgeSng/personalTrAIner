/**
 * @jest-environment node
 */

import { POST } from "@/app/api/plan/generate/route";
import { requireUser } from "@/lib/auth/session";
import { HttpError } from "@/lib/errors/http-error";
import { generateAndPersistPlan } from "@/lib/plans/generate-and-persist";

jest.mock("@/lib/auth/session", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/lib/plans/generate-and-persist", () => ({
  generateAndPersistPlan: jest.fn(),
}));

const requireUserMock = requireUser as jest.MockedFunction<typeof requireUser>;
const generateAndPersistPlanMock =
  generateAndPersistPlan as jest.MockedFunction<typeof generateAndPersistPlan>;

const user = {
  id: "user-1",
  email: "user@example.com",
} as Awaited<ReturnType<typeof requireUser>>;

const planRow = {
  id: "plan-1",
  user_id: "user-1",
  status: "active" as const,
  week_label: "Semana 1",
  content: {
    week_label: "Semana 1",
    days: [
      {
        day_index: 1,
        exercises: [
          {
            name: "Press",
            sets: 3,
            reps: "8-12",
            rest_between_sets_sec: 90,
            rest_after_exercise_sec: 0,
          },
        ],
      },
    ],
  },
  created_at: "2026-08-24T12:00:00.000Z",
  updated_at: "2026-08-24T12:00:00.000Z",
};

function requestWithBody(body?: unknown) {
  if (body === undefined) {
    return new Request("http://localhost/api/plan/generate", { method: "POST" });
  }

  return new Request("http://localhost/api/plan/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/plan/generate", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
    generateAndPersistPlanMock.mockReset();
    requireUserMock.mockResolvedValue(user);
  });

  it("responds 401 when there is no session", async () => {
    requireUserMock.mockRejectedValue(
      new HttpError(401, "UNAUTHORIZED", "Authentication required."),
    );

    const response = await POST(requestWithBody({}));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    });
    expect(generateAndPersistPlanMock).not.toHaveBeenCalled();
  });

  it("responds 201 with the persisted plan for empty body", async () => {
    generateAndPersistPlanMock.mockResolvedValue(planRow);

    const response = await POST(requestWithBody());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ data: planRow });
    expect(generateAndPersistPlanMock).toHaveBeenCalledWith("user-1");
  });

  it("responds 201 for {}", async () => {
    generateAndPersistPlanMock.mockResolvedValue(planRow);

    const response = await POST(requestWithBody({}));

    expect(response.status).toBe(201);
  });

  it("responds 400 VALIDATION_ERROR for a non-empty body object", async () => {
    const response = await POST(requestWithBody({ override: true }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(generateAndPersistPlanMock).not.toHaveBeenCalled();
  });

  it("propagates PROFILE_REQUIRED from orchestration", async () => {
    generateAndPersistPlanMock.mockRejectedValue(
      new HttpError(404, "PROFILE_REQUIRED", "Profile is required before generating a plan."),
    );

    const response = await POST(requestWithBody({}));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("PROFILE_REQUIRED");
  });

  it("propagates GEMINI_NOT_CONFIGURED (no mock success stub)", async () => {
    generateAndPersistPlanMock.mockRejectedValue(
      new HttpError(
        503,
        "GEMINI_NOT_CONFIGURED",
        "GEMINI_API_KEY is not configured. See .env.example.",
      ),
    );

    const response = await POST(requestWithBody({}));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("GEMINI_NOT_CONFIGURED");
    expect(body.data).toBeUndefined();
  });

  it("propagates GEMINI_INVALID_PLAN", async () => {
    generateAndPersistPlanMock.mockRejectedValue(
      new HttpError(
        502,
        "GEMINI_INVALID_PLAN",
        "Gemini returned an invalid workout plan after retry.",
      ),
    );

    const response = await POST(requestWithBody({}));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error.code).toBe("GEMINI_INVALID_PLAN");
  });
});
