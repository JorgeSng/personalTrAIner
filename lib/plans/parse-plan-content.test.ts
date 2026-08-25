import { parsePlanContent } from "@/lib/plans/parse-plan-content";

const validContent = {
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

describe("parsePlanContent", () => {
  it("accepts valid content matching training_days_per_week", () => {
    const result = parsePlanContent(validContent, 3);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.days).toHaveLength(3);
      expect(result.data.week_label).toBe("Semana 1");
    }
  });

  it("coerces invalid loadmuscle_url before Zod", () => {
    const withBadUrl = {
      ...validContent,
      days: [
        {
          day_index: 1,
          exercises: [
            {
              name: "Press",
              sets: 3,
              reps: "8-12",
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
      expect(result.data.days[0].exercises[0].loadmuscle_url).toBeNull();
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
});
