import { workoutPlanContentSchema } from "@/lib/validation/schemas/workout-plan";

const validExercise = {
  name: "Press banca",
  sets: 3,
  reps: "8-12",
  rest_between_sets_sec: 90,
  rest_after_exercise_sec: 120,
};

const validDay = {
  day_index: 1,
  exercises: [validExercise],
};

const validContent = {
  week_label: "Semana 1",
  days: [validDay],
};

describe("workoutPlanContentSchema", () => {
  it("accepts a valid plan content", () => {
    expect(workoutPlanContentSchema.safeParse(validContent).success).toBe(true);
  });

  it("rejects an empty week_label", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      week_label: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty days array", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      days: [],
    });

    expect(result.success).toBe(false);
  });

  it("accepts day_index at boundaries 1 and 7", () => {
    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [{ ...validDay, day_index: 1 }],
      }).success,
    ).toBe(true);
    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [{ ...validDay, day_index: 7 }],
      }).success,
    ).toBe(true);
  });

  it("rejects day_index outside 1..7", () => {
    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [{ ...validDay, day_index: 0 }],
      }).success,
    ).toBe(false);
    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [{ ...validDay, day_index: 8 }],
      }).success,
    ).toBe(false);
  });

  it("rejects a non-integer day_index", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      days: [{ ...validDay, day_index: 1.5 }],
    });

    expect(result.success).toBe(false);
  });

  it("accepts an optional day label", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      days: [{ ...validDay, label: "Push" }],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty exercises array", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      days: [{ ...validDay, exercises: [] }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty exercise name", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      days: [
        {
          ...validDay,
          exercises: [{ ...validExercise, name: "" }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects sets below 1", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      days: [
        {
          ...validDay,
          exercises: [{ ...validExercise, sets: 0 }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-integer sets value", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      days: [
        {
          ...validDay,
          exercises: [{ ...validExercise, sets: 2.5 }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts reps as a non-empty string range or number-like", () => {
    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [
          {
            ...validDay,
            exercises: [{ ...validExercise, reps: "8-12" }],
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [
          {
            ...validDay,
            exercises: [{ ...validExercise, reps: "10" }],
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects an empty reps string", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      days: [
        {
          ...validDay,
          exercises: [{ ...validExercise, reps: "" }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts optional notes", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      days: [
        {
          ...validDay,
          exercises: [{ ...validExercise, notes: "Tempo controlado" }],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts loadmuscle_url as https, null, or omitted", () => {
    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [
          {
            ...validDay,
            exercises: [
              {
                ...validExercise,
                loadmuscle_url: "https://www.loadmuscle.com/exercise/bench-press",
              },
            ],
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [
          {
            ...validDay,
            exercises: [{ ...validExercise, loadmuscle_url: null }],
          },
        ],
      }).success,
    ).toBe(true);
    expect(workoutPlanContentSchema.safeParse(validContent).success).toBe(true);
  });

  it("requires rest_between_sets_sec and rest_after_exercise_sec as int >= 0", () => {
    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [
          {
            ...validDay,
            exercises: [
              {
                ...validExercise,
                rest_between_sets_sec: 0,
                rest_after_exercise_sec: 0,
              },
            ],
          },
        ],
      }).success,
    ).toBe(true);

    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [
          {
            ...validDay,
            exercises: [
              {
                name: "Press",
                sets: 3,
                reps: "8",
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [
          {
            ...validDay,
            exercises: [
              {
                ...validExercise,
                rest_between_sets_sec: -1,
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      workoutPlanContentSchema.safeParse({
        ...validContent,
        days: [
          {
            ...validDay,
            exercises: [
              {
                ...validExercise,
                rest_after_exercise_sec: 1.5,
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects a non-https loadmuscle_url", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      days: [
        {
          ...validDay,
          exercises: [
            {
              ...validExercise,
              loadmuscle_url: "http://www.loadmuscle.com/exercise/bench-press",
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid loadmuscle_url", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      days: [
        {
          ...validDay,
          exercises: [{ ...validExercise, loadmuscle_url: "not-a-url" }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("strips unknown root fields instead of rejecting them", () => {
    const result = workoutPlanContentSchema.safeParse({
      ...validContent,
      extra_garbage: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("extra_garbage");
    }
  });
});
