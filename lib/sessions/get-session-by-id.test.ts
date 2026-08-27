/**
 * @jest-environment node
 */

import { getSessionById } from "@/lib/sessions/get-session-by-id";
import { HttpError } from "@/lib/errors/http-error";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const createClientMock = createClient as jest.MockedFunction<
  typeof createClient
>;

const userId = "11111111-1111-4111-8111-111111111111";
const sessionId = "33333333-3333-4333-8333-333333333333";

const sessionRow = {
  id: sessionId,
  user_id: userId,
  plan_id: "22222222-2222-4222-8222-222222222222",
  day_index: 1,
  performed_on: "2026-08-27",
  notes: null,
  created_at: "2026-08-27T10:00:00.000Z",
  updated_at: "2026-08-27T10:00:00.000Z",
};

const exerciseRows = [
  {
    id: "55555555-5555-4555-8555-555555555555",
    session_id: sessionId,
    exercise_name: "Dominadas",
    exercise_order: 1,
    sets_completed: 3,
    weight_kg: null,
    reps: "8",
    created_at: "2026-08-27T10:00:01.000Z",
    updated_at: "2026-08-27T10:00:01.000Z",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    session_id: sessionId,
    exercise_name: "Press banca",
    exercise_order: 0,
    sets_completed: 3,
    weight_kg: "60",
    reps: "10,10,8",
    created_at: "2026-08-27T10:00:00.000Z",
    updated_at: "2026-08-27T10:00:00.000Z",
  },
];

describe("getSessionById", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("returns SessionDetail with exercises ordered by exercise_order", async () => {
    const sessionsBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: sessionRow, error: null }),
    };
    const exercisesBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            ...exerciseRows[1],
            weight_kg: 60,
            exercise_order: 0,
          },
          exerciseRows[0],
        ],
        error: null,
      }),
    };
    const from = jest.fn((table: string) => {
      if (table === "workout_sessions") return sessionsBuilder;
      if (table === "workout_session_exercises") return exercisesBuilder;
      throw new Error(`Unexpected table: ${table}`);
    });
    createClientMock.mockResolvedValue({ from } as unknown as Awaited<
      ReturnType<typeof createClient>
    >);

    const result = await getSessionById(userId, sessionId);

    expect(sessionsBuilder.eq).toHaveBeenCalledWith("id", sessionId);
    expect(sessionsBuilder.eq).toHaveBeenCalledWith("user_id", userId);
    expect(exercisesBuilder.eq).toHaveBeenCalledWith("session_id", sessionId);
    expect(exercisesBuilder.order).toHaveBeenCalledWith("exercise_order", {
      ascending: true,
    });
    expect(result.exercises[0]?.exercise_order).toBe(0);
    expect(result.exercises[0]?.weight_kg).toBe(60);
  });

  it("throws SESSION_NOT_FOUND when row is missing", async () => {
    const sessionsBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    createClientMock.mockResolvedValue({
      from: jest.fn(() => sessionsBuilder),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    await expect(getSessionById(userId, sessionId)).rejects.toMatchObject({
      status: 404,
      code: "SESSION_NOT_FOUND",
    } satisfies Partial<HttpError>);
  });
});
