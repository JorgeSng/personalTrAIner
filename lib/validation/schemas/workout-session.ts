import { z } from "zod";

export const workoutSessionSchema = z
  .object({
    plan_id: z.string().uuid(),
    day_index: z.number().int().min(1).max(7),
    performed_on: z.string().date(),
    notes: z.string().nullable().optional(),
  })
  .strip();

export const workoutSessionExerciseSchema = z
  .object({
    exercise_name: z.string().min(1),
    exercise_order: z.number().int().min(0),
    sets_completed: z.number().int().min(1),
    weight_kg: z.number().min(0).nullable().optional(),
    reps: z.string().min(1),
  })
  .strip();

export const workoutSessionCreateSchema = workoutSessionSchema
  .extend({
    exercises: z.array(workoutSessionExerciseSchema).min(1),
  })
  .strip();

export type WorkoutSession = z.infer<typeof workoutSessionSchema>;
export type WorkoutSessionExercise = z.infer<
  typeof workoutSessionExerciseSchema
>;
export type WorkoutSessionCreate = z.infer<typeof workoutSessionCreateSchema>;
