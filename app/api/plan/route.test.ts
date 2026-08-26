/**
 * @jest-environment node
 */

import { GET } from "@/app/api/plan/route";
import { requireUser } from "@/lib/auth/session";
import { HttpError } from "@/lib/errors/http-error";
import { getActivePlan } from "@/lib/plans/get-active-plan";

jest.mock("@/lib/auth/session", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/lib/plans/get-active-plan", () => ({
  getActivePlan: jest.fn(),
}));

const requireUserMock = requireUser as jest.MockedFunction<typeof requireUser>;
const getActivePlanMock = getActivePlan as jest.MockedFunction<
  typeof getActivePlan
>;

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

describe("GET /api/plan", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
    getActivePlanMock.mockReset();
    requireUserMock.mockResolvedValue(user);
  });

  it("responds 401 when there is no session", async () => {
    requireUserMock.mockRejectedValue(
      new HttpError(401, "UNAUTHORIZED", "Authentication required."),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    });
  });

  it("responds 200 with data null when there is no active plan", async () => {
    getActivePlanMock.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: null });
    expect(getActivePlanMock).toHaveBeenCalledWith("user-1");
  });

  it("responds 200 with the active plan row", async () => {
    getActivePlanMock.mockResolvedValue(planRow);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: planRow });
  });
});
