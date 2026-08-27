import {
  workoutSessionCreateSchema,
  workoutSessionExerciseSchema,
  workoutSessionSchema,
} from "@/lib/validation/schemas/workout-session";

const validSession = {
  plan_id: "550e8400-e29b-41d4-a716-446655440000",
  day_index: 1,
  performed_on: "2026-08-27",
};

const validExercise = {
  exercise_name: "Press banca",
  exercise_order: 0,
  sets_completed: 3,
  weight_kg: 60,
  reps: "10,10,8",
};

const validCreate = {
  ...validSession,
  exercises: [validExercise],
};

describe("workoutSessionSchema", () => {
  it("accepts a valid session payload", () => {
    expect(workoutSessionSchema.safeParse(validSession).success).toBe(true);
  });

  it("accepts optional nullable notes", () => {
    expect(
      workoutSessionSchema.safeParse({ ...validSession, notes: "Buen día" })
        .success,
    ).toBe(true);
    expect(
      workoutSessionSchema.safeParse({ ...validSession, notes: null }).success,
    ).toBe(true);
  });

  it("accepts day_index at boundaries 1 and 7", () => {
    expect(
      workoutSessionSchema.safeParse({ ...validSession, day_index: 1 }).success,
    ).toBe(true);
    expect(
      workoutSessionSchema.safeParse({ ...validSession, day_index: 7 }).success,
    ).toBe(true);
  });

  it("rejects day_index outside 1..7", () => {
    expect(
      workoutSessionSchema.safeParse({ ...validSession, day_index: 0 }).success,
    ).toBe(false);
    expect(
      workoutSessionSchema.safeParse({ ...validSession, day_index: 8 }).success,
    ).toBe(false);
  });

  it("rejects a non-integer day_index", () => {
    expect(
      workoutSessionSchema.safeParse({ ...validSession, day_index: 1.5 })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid plan_id", () => {
    expect(
      workoutSessionSchema.safeParse({
        ...validSession,
        plan_id: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid performed_on date", () => {
    expect(
      workoutSessionSchema.safeParse({
        ...validSession,
        performed_on: "27-08-2026",
      }).success,
    ).toBe(false);
    expect(
      workoutSessionSchema.safeParse({
        ...validSession,
        performed_on: "2026-13-01",
      }).success,
    ).toBe(false);
  });

  it("strips unknown root fields instead of rejecting them", () => {
    const result = workoutSessionSchema.safeParse({
      ...validSession,
      extra_garbage: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("extra_garbage");
    }
  });
});

describe("workoutSessionExerciseSchema", () => {
  it("accepts a valid exercise log", () => {
    expect(workoutSessionExerciseSchema.safeParse(validExercise).success).toBe(
      true,
    );
  });

  it("accepts weight_kg as null (bodyweight)", () => {
    expect(
      workoutSessionExerciseSchema.safeParse({
        ...validExercise,
        weight_kg: null,
      }).success,
    ).toBe(true);
  });

  it("accepts omitted weight_kg", () => {
    const { weight_kg: _omitted, ...withoutWeight } = validExercise;
    expect(
      workoutSessionExerciseSchema.safeParse(withoutWeight).success,
    ).toBe(true);
  });

  it("rejects negative weight_kg", () => {
    expect(
      workoutSessionExerciseSchema.safeParse({
        ...validExercise,
        weight_kg: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects an empty exercise_name", () => {
    expect(
      workoutSessionExerciseSchema.safeParse({
        ...validExercise,
        exercise_name: "",
      }).success,
    ).toBe(false);
  });

  it("rejects exercise_order below 0", () => {
    expect(
      workoutSessionExerciseSchema.safeParse({
        ...validExercise,
        exercise_order: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects sets_completed below 1", () => {
    expect(
      workoutSessionExerciseSchema.safeParse({
        ...validExercise,
        sets_completed: 0,
      }).success,
    ).toBe(false);
  });

  it("accepts flexible non-empty reps strings", () => {
    for (const reps of ["10", "10,10,8", "8-10"]) {
      expect(
        workoutSessionExerciseSchema.safeParse({ ...validExercise, reps })
          .success,
      ).toBe(true);
    }
  });

  it("rejects an empty reps string", () => {
    expect(
      workoutSessionExerciseSchema.safeParse({
        ...validExercise,
        reps: "",
      }).success,
    ).toBe(false);
  });

  it("strips unknown root fields instead of rejecting them", () => {
    const result = workoutSessionExerciseSchema.safeParse({
      ...validExercise,
      extra_garbage: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("extra_garbage");
    }
  });
});

describe("workoutSessionCreateSchema", () => {
  it("accepts a session with at least one exercise", () => {
    expect(workoutSessionCreateSchema.safeParse(validCreate).success).toBe(
      true,
    );
  });

  it("rejects an empty exercises array", () => {
    expect(
      workoutSessionCreateSchema.safeParse({
        ...validSession,
        exercises: [],
      }).success,
    ).toBe(false);
  });

  it("strips unknown root fields instead of rejecting them", () => {
    const result = workoutSessionCreateSchema.safeParse({
      ...validCreate,
      extra_garbage: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("extra_garbage");
    }
  });
});
