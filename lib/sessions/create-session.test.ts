/**
 * @jest-environment node
 */

import { createSession } from "@/lib/sessions/create-session";
import { HttpError } from "@/lib/errors/http-error";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const createClientMock = createClient as jest.MockedFunction<
  typeof createClient
>;

const userId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const sessionId = "33333333-3333-4333-8333-333333333333";

const input = {
  plan_id: planId,
  day_index: 1,
  performed_on: "2026-08-27",
  notes: null as string | null,
  exercises: [
    {
      exercise_name: "Press banca",
      exercise_order: 0,
      sets_completed: 3,
      weight_kg: 60,
      reps: "10,10,8",
    },
    {
      exercise_name: "Dominadas",
      exercise_order: 1,
      sets_completed: 3,
      weight_kg: null,
      reps: "8",
    },
  ],
};

const sessionRow = {
  id: sessionId,
  user_id: userId,
  plan_id: planId,
  day_index: 1,
  performed_on: "2026-08-27",
  notes: null,
  created_at: "2026-08-27T10:00:00.000Z",
  updated_at: "2026-08-27T10:00:00.000Z",
};

const exerciseRows = [
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
];

type QueryResult = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

function mockSupabase(handlers: {
  plans?: QueryResult;
  sessions?: QueryResult;
  exercises?: QueryResult;
}) {
  const plansBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(
      handlers.plans ?? { data: { id: planId }, error: null },
    ),
  };

  const sessionsBuilder = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(
      handlers.sessions ?? { data: sessionRow, error: null },
    ),
  };

  const exercisesBuilder = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue(
      handlers.exercises ?? { data: exerciseRows, error: null },
    ),
  };

  const from = jest.fn((table: string) => {
    if (table === "workout_plans") return plansBuilder;
    if (table === "workout_sessions") return sessionsBuilder;
    if (table === "workout_session_exercises") return exercisesBuilder;
    throw new Error(`Unexpected table: ${table}`);
  });

  createClientMock.mockResolvedValue({ from } as unknown as Awaited<
    ReturnType<typeof createClient>
  >);

  return { from, plansBuilder, sessionsBuilder, exercisesBuilder };
}

describe("createSession", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("verifies plan ownership, inserts session + exercises, returns detail", async () => {
    const { from, sessionsBuilder, exercisesBuilder, plansBuilder } =
      mockSupabase({});

    const result = await createSession(userId, input);

    expect(from).toHaveBeenCalledWith("workout_plans");
    expect(plansBuilder.eq).toHaveBeenCalledWith("id", planId);
    expect(plansBuilder.eq).toHaveBeenCalledWith("user_id", userId);

    expect(sessionsBuilder.insert).toHaveBeenCalledWith({
      user_id: userId,
      plan_id: planId,
      day_index: 1,
      performed_on: "2026-08-27",
      notes: null,
    });

    expect(exercisesBuilder.insert).toHaveBeenCalledWith([
      {
        session_id: sessionId,
        exercise_name: "Press banca",
        exercise_order: 0,
        sets_completed: 3,
        weight_kg: 60,
        reps: "10,10,8",
      },
      {
        session_id: sessionId,
        exercise_name: "Dominadas",
        exercise_order: 1,
        sets_completed: 3,
        weight_kg: null,
        reps: "8",
      },
    ]);

    expect(result).toEqual({
      ...sessionRow,
      exercises: exerciseRows,
    });
  });

  it("throws PLAN_NOT_FOUND when plan is missing or not owned", async () => {
    mockSupabase({ plans: { data: null, error: null } });

    await expect(createSession(userId, input)).rejects.toMatchObject({
      status: 404,
      code: "PLAN_NOT_FOUND",
    } satisfies Partial<HttpError>);
  });

  it("throws INTERNAL_ERROR when exercise insert fails after session insert", async () => {
    mockSupabase({
      exercises: { data: null, error: { message: "rls denied" } },
    });

    await expect(createSession(userId, input)).rejects.toMatchObject({
      status: 500,
      code: "INTERNAL_ERROR",
    } satisfies Partial<HttpError>);
  });
});
