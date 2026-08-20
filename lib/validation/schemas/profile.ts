import { z } from "zod";

export const experienceLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const profileSchema = z
  .object({
    experience_level: experienceLevelSchema,
    training_days_per_week: z.number().int().min(1).max(7),
    equipment: z.array(z.string().min(1)).min(1),
    injuries_notes: z.string().nullable().optional(),
  })
  .strip();

export const profilePatchSchema = profileSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required." },
);

export type ExperienceLevel = z.infer<typeof experienceLevelSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type ProfilePatch = z.infer<typeof profilePatchSchema>;
