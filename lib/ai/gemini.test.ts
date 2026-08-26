/**
 * @jest-environment node
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

import { generateWorkoutPlanJson } from "@/lib/ai/gemini";
import { getGeminiApiKey } from "@/lib/config/env";
import { HttpError } from "@/lib/errors/http-error";

jest.mock("@/lib/config/env", () => ({
  getGeminiApiKey: jest.fn(),
  getMissingGeminiEnvMessage: jest.fn(
    () => "GEMINI_API_KEY is not configured. See .env.example.",
  ),
}));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn(),
}));

const getGeminiApiKeyMock = getGeminiApiKey as jest.MockedFunction<
  typeof getGeminiApiKey
>;
const GoogleGenerativeAIMock = GoogleGenerativeAI as jest.MockedClass<
  typeof GoogleGenerativeAI
>;

const profile = {
  experience_level: "beginner",
  training_days_per_week: 3,
  equipment: ["dumbbells"],
  injuries_notes: "rodilla izquierda",
};

function mockGenerateContent(text: string | (() => never)) {
  const generateContent = jest.fn<
    Promise<{ response: { text: () => string } }>,
    [string]
  >(async () => {
    if (typeof text === "function") {
      text();
    }
    return {
      response: {
        text: () => text as string,
      },
    };
  });

  GoogleGenerativeAIMock.mockImplementation(
    () =>
      ({
        getGenerativeModel: () => ({ generateContent }),
      }) as unknown as GoogleGenerativeAI,
  );

  return generateContent;
}

describe("generateWorkoutPlanJson", () => {
  beforeEach(() => {
    getGeminiApiKeyMock.mockReset();
    GoogleGenerativeAIMock.mockReset();
  });

  it("throws GEMINI_NOT_CONFIGURED when the API key is missing", async () => {
    getGeminiApiKeyMock.mockReturnValue(null);

    await expect(generateWorkoutPlanJson(profile)).rejects.toMatchObject({
      status: 503,
      code: "GEMINI_NOT_CONFIGURED",
    });
    expect(GoogleGenerativeAIMock).not.toHaveBeenCalled();
  });

  it("includes profile fields in the prompt and parses JSON", async () => {
    getGeminiApiKeyMock.mockReturnValue("test-key");
    const generateContent = mockGenerateContent(
      JSON.stringify({
        week_label: "Semana 1",
        days: [{ day_index: 1, exercises: [{ name: "Press", sets: 3, reps: "8" }] }],
      }),
    );

    const result = await generateWorkoutPlanJson(profile);

    expect(result).toEqual({
      week_label: "Semana 1",
      days: [{ day_index: 1, exercises: [{ name: "Press", sets: 3, reps: "8" }] }],
    });
    const prompt = generateContent.mock.calls[0]?.[0] ?? "";
    expect(prompt).toContain("beginner");
    expect(prompt).toContain("3");
    expect(prompt).toContain("dumbbells");
    expect(prompt).toContain("rodilla izquierda");
    expect(prompt).toMatch(/Spanish/i);
    expect(prompt).toContain("rest_between_sets_sec");
    expect(prompt).toContain("rest_after_exercise_sec");
    expect(prompt).toMatch(/Do NOT invent loadmuscle_url/i);
    expect(prompt).toContain("prefer these exact Spanish names");
    expect(prompt).toContain("sentadilla goblet");
    expect(GoogleGenerativeAIMock).toHaveBeenCalledWith("test-key");
  });

  it("strips markdown fences before parsing JSON", async () => {
    getGeminiApiKeyMock.mockReturnValue("test-key");
    mockGenerateContent(
      "```json\n{\"week_label\":\"W1\",\"days\":[]}\n```",
    );

    await expect(generateWorkoutPlanJson(profile)).resolves.toEqual({
      week_label: "W1",
      days: [],
    });
  });

  it("appends a corrective hint when provided", async () => {
    getGeminiApiKeyMock.mockReturnValue("test-key");
    const generateContent = mockGenerateContent("{}");

    await generateWorkoutPlanJson(profile, {
      correctiveHint: "Return exactly 3 days.",
    });

    const prompt = generateContent.mock.calls[0]?.[0] ?? "";
    expect(prompt).toContain("Return exactly 3 days.");
  });

  it("throws GEMINI_REQUEST_FAILED when Gemini throws", async () => {
    getGeminiApiKeyMock.mockReturnValue("test-key");
    mockGenerateContent(() => {
      throw new Error("network down");
    });

    await expect(generateWorkoutPlanJson(profile)).rejects.toBeInstanceOf(
      HttpError,
    );
    await expect(generateWorkoutPlanJson(profile)).rejects.toMatchObject({
      status: 502,
      code: "GEMINI_REQUEST_FAILED",
    });
  });

  it("throws GEMINI_REQUEST_FAILED when the response is not JSON", async () => {
    getGeminiApiKeyMock.mockReturnValue("test-key");
    mockGenerateContent("not json at all");

    await expect(generateWorkoutPlanJson(profile)).rejects.toMatchObject({
      status: 502,
      code: "GEMINI_REQUEST_FAILED",
    });
  });
});
