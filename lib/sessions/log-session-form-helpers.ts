import type { WorkoutSessionCreate } from "@/lib/validation/schemas/workout-session";

import {
  SESSION_VALIDATION_FUTURE_DATE,
  SESSION_VALIDATION_INVALID_SETS,
  SESSION_VALIDATION_INVALID_WEIGHT,
  SESSION_VALIDATION_NO_EXERCISES,
} from "./messages";

export type LogSessionExerciseInput = {
  exerciseName: string;
  exerciseOrder: number;
  setsCompleted: string;
  weightKg: string;
  reps: string;
};

export type LogSessionFields = {
  performedOn: string;
  notes: string;
};

export function getTodayLocalDateString(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, "0");
  const day = String(referenceDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isFutureLocalDate(
  dateStr: string,
  referenceDate = new Date(),
): boolean {
  return dateStr > getTodayLocalDateString(referenceDate);
}

export function trimReps(reps: string): string {
  return reps.trim();
}

export function isExerciseCompleted(row: LogSessionExerciseInput): boolean {
  const sets = Number.parseInt(row.setsCompleted, 10);
  const reps = trimReps(row.reps);
  return Number.isInteger(sets) && sets >= 1 && reps.length >= 1;
}

function parseWeightKg(
  value: string,
): { ok: true; weightKg: number | null } | { ok: false; error: string } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: true, weightKg: null };
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return { ok: false, error: SESSION_VALIDATION_INVALID_WEIGHT };
  }

  return { ok: true, weightKg: parsed };
}

function parseSetsCompleted(
  value: string,
): { ok: true; setsCompleted: number } | { ok: false; error: string } {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return { ok: false, error: SESSION_VALIDATION_INVALID_SETS };
  }

  return { ok: true, setsCompleted: parsed };
}

export type BuildSessionPayloadResult =
  | { ok: true; payload: WorkoutSessionCreate }
  | { ok: false; error: string };

export function buildSessionCreatePayload(
  planId: string,
  dayIndex: number,
  fields: LogSessionFields,
  rows: LogSessionExerciseInput[],
  referenceDate = new Date(),
): BuildSessionPayloadResult {
  if (isFutureLocalDate(fields.performedOn, referenceDate)) {
    return { ok: false, error: SESSION_VALIDATION_FUTURE_DATE };
  }

  const completedRows = rows.filter(isExerciseCompleted);

  if (completedRows.length === 0) {
    return { ok: false, error: SESSION_VALIDATION_NO_EXERCISES };
  }

  const exercises: WorkoutSessionCreate["exercises"] = [];

  for (const row of completedRows) {
    const setsResult = parseSetsCompleted(row.setsCompleted);
    if (!setsResult.ok) {
      return setsResult;
    }

    const weightResult = parseWeightKg(row.weightKg);
    if (!weightResult.ok) {
      return weightResult;
    }

    const reps = trimReps(row.reps);
    if (reps.length < 1) {
      return { ok: false, error: SESSION_VALIDATION_NO_EXERCISES };
    }

    exercises.push({
      exercise_name: row.exerciseName,
      exercise_order: row.exerciseOrder,
      sets_completed: setsResult.setsCompleted,
      weight_kg: weightResult.weightKg,
      reps,
    });
  }

  const notes = fields.notes.trim();

  return {
    ok: true,
    payload: {
      plan_id: planId,
      day_index: dayIndex,
      performed_on: fields.performedOn,
      notes: notes.length > 0 ? notes : null,
      exercises,
    },
  };
}
