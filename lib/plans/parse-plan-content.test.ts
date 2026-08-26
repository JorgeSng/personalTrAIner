import { parsePlanContent } from "@/lib/plans/parse-plan-content";

const validContent = {
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
          rest_after_exercise_sec: 120,
        },
      ],
    },
    {
      day_index: 2,
      exercises: [
        {
          name: "Remo",
          sets: 3,
          reps: "10",
          rest_between_sets_sec: 90,
          rest_after_exercise_sec: 0,
        },
      ],
    },
    {
      day_index: 3,
      exercises: [
        {
          name: "Sentadilla",
          sets: 3,
          reps: "8",
          rest_between_sets_sec: 120,
          rest_after_exercise_sec: 0,
        },
      ],
    },
  ],
};

describe("parsePlanContent", () => {
  it("accepts valid content matching training_days_per_week", () => {
    const result = parsePlanContent(validContent, 3);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.days).toHaveLength(3);
      expect(result.data.week_label).toBe("Semana 1");
      expect(result.data.days[0].exercises[0].rest_between_sets_sec).toBe(90);
    }
  });

  it("coerces invalid loadmuscle_url then enriches from catalog by name", () => {
    const withBadUrl = {
      ...validContent,
      days: [
        {
          day_index: 1,
          exercises: [
            {
              name: "Dominadas",
              sets: 3,
              reps: "8-12",
              rest_between_sets_sec: 90,
              rest_after_exercise_sec: 120,
              loadmuscle_url: "http://bad.example",
            },
          ],
        },
        validContent.days[1],
        validContent.days[2],
      ],
    };

    const result = parsePlanContent(withBadUrl, 3);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.days[0].exercises[0].loadmuscle_url).toBe(
        "https://loadmuscle.com/exercises/pull-up",
      );
    }
  });

  it("enriches loadmuscle_url from catalog after coerce", () => {
    const withCatalogName = {
      ...validContent,
      days: [
        {
          day_index: 1,
          exercises: [
            {
              name: "Dominadas",
              sets: 3,
              reps: "6-8",
              rest_between_sets_sec: 90,
              rest_after_exercise_sec: 0,
              loadmuscle_url: null,
            },
          ],
        },
        validContent.days[1],
        validContent.days[2],
      ],
    };

    const result = parsePlanContent(withCatalogName, 3);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.days[0].exercises[0].loadmuscle_url).toBe(
        "https://loadmuscle.com/exercises/pull-up",
      );
    }
  });

  it("fails when days.length does not match profile", () => {
    const result = parsePlanContent(validContent, 4);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/days/i);
    }
  });

  it("fails when Zod validation fails", () => {
    const result = parsePlanContent({ week_label: "", days: [] }, 3);

    expect(result.ok).toBe(false);
  });

  it("fails when rest fields are missing", () => {
    const result = parsePlanContent(
      {
        week_label: "Semana 1",
        days: [
          {
            day_index: 1,
            exercises: [{ name: "Press", sets: 3, reps: "8" }],
          },
        ],
      },
      1,
    );

    expect(result.ok).toBe(false);
  });
});
