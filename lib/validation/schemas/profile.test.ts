import { experienceLevelSchema, profileSchema } from "@/lib/validation/schemas/profile";

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
});
