import {
  experienceLevelSchema,
  profilePatchSchema,
  profileSchema,
} from "@/lib/validation/schemas/profile";

const validProfile = {
  experience_level: "beginner" as const,
  training_days_per_week: 3,
  equipment: ["dumbbells", "pull-up bar"],
};

describe("experienceLevelSchema", () => {
  it.each(["beginner", "intermediate", "advanced"] as const)(
    "accepts %s",
    (level) => {
      expect(experienceLevelSchema.safeParse(level).success).toBe(true);
    },
  );

  it("rejects an invalid level", () => {
    expect(experienceLevelSchema.safeParse("expert").success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts a valid profile", () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
  });

  it("rejects an invalid experience_level", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      experience_level: "expert",
    });

    expect(result.success).toBe(false);
  });

  it("rejects training_days_per_week below 1", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      training_days_per_week: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects training_days_per_week above 7", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      training_days_per_week: 8,
    });

    expect(result.success).toBe(false);
  });

  it("accepts training_days_per_week at boundaries 1 and 7", () => {
    expect(
      profileSchema.safeParse({ ...validProfile, training_days_per_week: 1 })
        .success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({ ...validProfile, training_days_per_week: 7 })
        .success,
    ).toBe(true);
  });

  it("rejects an empty equipment array", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      equipment: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects equipment entries that are empty strings", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      equipment: ["dumbbells", ""],
    });

    expect(result.success).toBe(false);
  });

  it("accepts injuries_notes when omitted, null, or a string", () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
    expect(
      profileSchema.safeParse({ ...validProfile, injuries_notes: null }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({
        ...validProfile,
        injuries_notes: "Hombro derecho",
      }).success,
    ).toBe(true);
  });

  it("strips user_id instead of rejecting it", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      user_id: "attacker-id",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("user_id");
    }
  });
});

describe("profilePatchSchema", () => {
  it("rejects an empty object", () => {
    const result = profilePatchSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects a body that only contains unknown fields", () => {
    const result = profilePatchSchema.safeParse({ user_id: "attacker-id" });

    expect(result.success).toBe(false);
  });

  it("accepts a single valid field", () => {
    const result = profilePatchSchema.safeParse({
      experience_level: "advanced",
    });

    expect(result.success).toBe(true);
  });

  it("accepts injuries_notes set to null", () => {
    const result = profilePatchSchema.safeParse({ injuries_notes: null });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.injuries_notes).toBeNull();
    }
  });

  it("rejects an empty equipment array", () => {
    const result = profilePatchSchema.safeParse({ equipment: [] });

    expect(result.success).toBe(false);
  });

  it("rejects training_days_per_week outside 1..7", () => {
    expect(
      profilePatchSchema.safeParse({ training_days_per_week: 0 }).success,
    ).toBe(false);
    expect(
      profilePatchSchema.safeParse({ training_days_per_week: 8 }).success,
    ).toBe(false);
  });
});
