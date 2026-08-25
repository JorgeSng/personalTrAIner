/**
 * @jest-environment node
 */

import { generateWorkoutPlanJson } from "@/lib/ai/gemini";
import { HttpError } from "@/lib/errors/http-error";
import { generateAndPersistPlan } from "@/lib/plans/generate-and-persist";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/ai/gemini", () => ({
  generateWorkoutPlanJson: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const generateWorkoutPlanJsonMock =
  generateWorkoutPlanJson as jest.MockedFunction<typeof generateWorkoutPlanJson>;
const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

const profileRow = {
  user_id: "user-1",
  experience_level: "beginner",
  training_days_per_week: 3,
  equipment: ["dumbbells"],
  injuries_notes: null,
};

const validPlanJson = {
  week_label: "Semana 1",
  days: [
    {
      day_index: 1,
      exercises: [{ name: "Press", sets: 3, reps: "8-12" }],
    },
    {
      day_index: 2,
      exercises: [{ name: "Remo", sets: 3, reps: "10" }],
    },
    {
      day_index: 3,
      exercises: [{ name: "Sentadilla", sets: 3, reps: "8" }],
    },
  ],
};

const planRow = {
  id: "plan-1",
  user_id: "user-1",
  status: "active" as const,
  week_label: "Semana 1",
  content: validPlanJson,
  created_at: "2026-08-24T12:00:00.000Z",
  updated_at: "2026-08-24T12:00:00.000Z",
};

type QueryResult = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

function mockSupabase(options: {
  profile: QueryResult;
  update?: QueryResult;
  insert?: QueryResult;
  insertSecond?: QueryResult;
}) {
  const profilesBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(options.profile),
  };

  let insertCall = 0;
  const insertBuilder = {
    insert: jest.fn(),
  };

  const from = jest.fn((table: string) => {
    if (table === "profiles") {
      return profilesBuilder;
    }

    return {
      update: () => ({
        eq: () => ({
          eq: async () => options.update ?? { data: null, error: null },
        }),
      }),
      insert: (payload: unknown) => {
        insertBuilder.insert(payload);
        return {
          select: () => ({
            single: async () => {
              insertCall += 1;
              if (insertCall === 1) {
                return options.insert ?? { data: planRow, error: null };
              }
              return (
                options.insertSecond ??
                options.insert ?? { data: planRow, error: null }
              );
            },
          }),
        };
      },
    };
  });

  createClientMock.mockResolvedValue({ from } as unknown as Awaited<
    ReturnType<typeof createClient>
  >);

  return { from, insertBuilder };
}

describe("generateAndPersistPlan", () => {
  beforeEach(() => {
    generateWorkoutPlanJsonMock.mockReset();
    createClientMock.mockReset();
  });

  it("throws PROFILE_REQUIRED without calling Gemini when profile is missing", async () => {
    mockSupabase({
      profile: { data: null, error: null },
    });

    await expect(generateAndPersistPlan("user-1")).rejects.toMatchObject({
      status: 404,
      code: "PROFILE_REQUIRED",
    });
    expect(generateWorkoutPlanJsonMock).not.toHaveBeenCalled();
  });

  it("generates, validates, supersedes previous active, and inserts the new plan", async () => {
    const update = jest.fn();
    const profilesBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: profileRow, error: null }),
    };
    const insert = jest.fn();
    const from = jest.fn((table: string) => {
      if (table === "profiles") {
        return profilesBuilder;
      }
      return {
        update: (payload: unknown) => {
          update(payload);
          return {
            eq: () => ({
              eq: async () => ({ data: null, error: null }),
            }),
          };
        },
        insert: (payload: unknown) => {
          insert(payload);
          return {
            select: () => ({
              single: async () => ({ data: planRow, error: null }),
            }),
          };
        },
      };
    });
    createClientMock.mockResolvedValue({ from } as unknown as Awaited<
      ReturnType<typeof createClient>
    >);
    generateWorkoutPlanJsonMock.mockResolvedValue(validPlanJson);

    const result = await generateAndPersistPlan("user-1");

    expect(result).toEqual(planRow);
    expect(generateWorkoutPlanJsonMock).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ status: "superseded" });
    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      status: "active",
      week_label: "Semana 1",
      content: validPlanJson,
    });
  });

  it("retries once with a corrective hint when days.length mismatches, then persists", async () => {
    mockSupabase({
      profile: { data: profileRow, error: null },
      insert: { data: planRow, error: null },
    });
    generateWorkoutPlanJsonMock
      .mockResolvedValueOnce({
        week_label: "Semana 1",
        days: [validPlanJson.days[0]],
      })
      .mockResolvedValueOnce(validPlanJson);

    const result = await generateAndPersistPlan("user-1");

    expect(result).toEqual(planRow);
    expect(generateWorkoutPlanJsonMock).toHaveBeenCalledTimes(2);
    expect(generateWorkoutPlanJsonMock.mock.calls[1][1]?.correctiveHint).toEqual(
      expect.stringMatching(/3/),
    );
  });

  it("throws GEMINI_INVALID_PLAN after a failed retry and does not insert", async () => {
    const { insertBuilder } = mockSupabase({
      profile: { data: profileRow, error: null },
    });
    generateWorkoutPlanJsonMock.mockResolvedValue({
      week_label: "Semana 1",
      days: [validPlanJson.days[0]],
    });

    await expect(generateAndPersistPlan("user-1")).rejects.toMatchObject({
      status: 502,
      code: "GEMINI_INVALID_PLAN",
    });
    expect(generateWorkoutPlanJsonMock).toHaveBeenCalledTimes(2);
    expect(insertBuilder.insert).not.toHaveBeenCalled();
  });

  it("propagates GEMINI_NOT_CONFIGURED from Gemini", async () => {
    mockSupabase({
      profile: { data: profileRow, error: null },
    });
    generateWorkoutPlanJsonMock.mockRejectedValue(
      new HttpError(
        503,
        "GEMINI_NOT_CONFIGURED",
        "GEMINI_API_KEY is not configured. See .env.example.",
      ),
    );

    await expect(generateAndPersistPlan("user-1")).rejects.toMatchObject({
      status: 503,
      code: "GEMINI_NOT_CONFIGURED",
    });
  });
});
