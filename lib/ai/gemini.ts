import { GoogleGenerativeAI } from "@google/generative-ai";

import { getGeminiApiKey, getMissingGeminiEnvMessage } from "@/lib/config/env";
import { HttpError } from "@/lib/errors/http-error";

export type PlanGenerateStubResult = {
  mock: boolean;
  message: string;
  weekLabel: string;
};

export async function generatePlanStub(): Promise<PlanGenerateStubResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return {
      mock: true,
      message: getMissingGeminiEnvMessage(),
      weekLabel: "week-1-stub",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    await model.generateContent(
      "Reply with exactly: personalTrAIner scaffold connectivity ok",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Gemini error";
    throw new HttpError(502, "GEMINI_REQUEST_FAILED", message);
  }

  return {
    mock: false,
    message: "Gemini connectivity ok (full plan generation in spec 003)",
    weekLabel: "week-1-stub",
  };
}
