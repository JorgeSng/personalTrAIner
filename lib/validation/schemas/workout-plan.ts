import { z } from "zod";

const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), {
    message: "Must be an https URL",
  });

export const workoutPlanExerciseSchema = z
  .object({
    name: z.string().min(1),
    sets: z.number().int().min(1),
    reps: z.string().min(1),
    notes: z.string().optional(),
    loadmuscle_url: httpsUrlSchema.nullable().optional(),
  })
  .strip();

export const workoutPlanDaySchema = z
  .object({
    day_index: z.number().int().min(1).max(7),
    label: z.string().optional(),
    exercises: z.array(workoutPlanExerciseSchema).min(1),
  })
  .strip();

export const workoutPlanContentSchema = z
  .object({
    week_label: z.string().min(1),
    days: z.array(workoutPlanDaySchema).min(1),
  })
  .strip();

export type WorkoutPlanExercise = z.infer<typeof workoutPlanExerciseSchema>;
export type WorkoutPlanDay = z.infer<typeof workoutPlanDaySchema>;
export type WorkoutPlanContent = z.infer<typeof workoutPlanContentSchema>;
