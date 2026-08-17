/**
 * @jest-environment node
 */

import { POST } from "@/app/api/plan/generate/route";
import { HttpError } from "@/lib/errors/http-error";
import { requireUser } from "@/lib/auth/session";

jest.mock("@/lib/auth/session", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/lib/ai/gemini", () => ({
  generatePlanStub: jest.fn(async () => ({
    mock: true,
    message: "GEMINI_API_KEY is not configured. See .env.example.",
    weekLabel: "week-1-stub",
  })),
}));

const requireUserMock = requireUser as jest.MockedFunction<typeof requireUser>;

describe("POST /api/plan/generate", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
  });

  it("responds 401 when there is no session", async () => {
    requireUserMock.mockRejectedValue(
      new HttpError(401, "UNAUTHORIZED", "Authentication required."),
    );

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    });
  });

  it("keeps the Gemini stub when the user is authenticated", async () => {
    requireUserMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as Awaited<ReturnType<typeof requireUser>>);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.data.mock).toBe(true);
  });
});
