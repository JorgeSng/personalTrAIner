import { GoogleGenerativeAI } from "@google/generative-ai";

import { getGeminiApiKey, getMissingGeminiEnvMessage } from "@/lib/config/env";
import { HttpError } from "@/lib/errors/http-error";
import { getPreferredCatalogExerciseNames } from "@/lib/plans/loadmuscle-catalog";
import type { PlanGenerationProfile } from "@/lib/plans/types";

export type GenerateWorkoutPlanOptions = {
  correctiveHint?: string;
};

function buildPrompt(
  profile: PlanGenerationProfile,
  options?: GenerateWorkoutPlanOptions,
): string {
  const injuries =
    profile.injuries_notes && profile.injuries_notes.trim().length > 0
      ? profile.injuries_notes
      : "none";

  const preferredNames = getPreferredCatalogExerciseNames().join("; ");

  const base = [
    "You are a strength coach. Return ONLY valid JSON (no markdown) for a weekly workout plan.",
    "All user-visible strings MUST be in Spanish: week_label, days[].label, exercises[].name, exercises[].notes.",
    'reps may use a neutral range like "8-10" or Spanish context like "8-10 por pierna".',
    "Schema:",
    '{ "week_label": string, "days": [ { "day_index": 1-7, "label"?: string, "exercises": [ { "name": string, "sets": int>=1, "reps": string, "notes"?: string, "rest_between_sets_sec": int>=0, "rest_after_exercise_sec": int>=0, "loadmuscle_url"?: https URL or null } ] } ] }',
    "rest_between_sets_sec: seconds of rest between sets (required, integer >= 0).",
    "rest_after_exercise_sec: seconds of rest after the exercise before the next one (required, integer >= 0; use 0 for the last exercise of a day).",
    "Do NOT invent loadmuscle_url values. Prefer null unless you know a real https://loadmuscle.com/... URL.",
    "When an exercise is equivalent, prefer these exact Spanish names so technique links can be resolved:",
    preferredNames,
    `experience_level: ${profile.experience_level}`,
    `training_days_per_week: ${profile.training_days_per_week}`,
    `equipment: ${JSON.stringify(profile.equipment)}`,
    `injuries_notes: ${injuries}`,
    `The days array MUST contain exactly ${profile.training_days_per_week} day objects.`,
    "Use only the listed equipment. Respect injury notes. Prefer compound lifts when appropriate.",
  ].join("\n");

  if (options?.correctiveHint) {
    return `${base}\n\nCorrection required:\n${options.correctiveHint}`;
  }

  return base;
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

export async function generateWorkoutPlanJson(
  profile: PlanGenerationProfile,
  options?: GenerateWorkoutPlanOptions,
): Promise<unknown> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new HttpError(503, "GEMINI_NOT_CONFIGURED", getMissingGeminiEnvMessage());
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  let text: string;
  try {
    const result = await model.generateContent(buildPrompt(profile, options));
    text = result.response.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Gemini error";
    throw new HttpError(502, "GEMINI_REQUEST_FAILED", message);
  }

  try {
    return JSON.parse(extractJsonText(text)) as unknown;
  } catch {
    throw new HttpError(
      502,
      "GEMINI_REQUEST_FAILED",
      "Gemini returned a non-JSON response.",
    );
  }
}
