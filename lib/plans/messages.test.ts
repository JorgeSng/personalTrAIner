import { planGenerateErrorMessage } from "@/lib/plans/messages";

describe("planGenerateErrorMessage", () => {
  it("maps known API codes to Spanish copy", () => {
    expect(planGenerateErrorMessage("GEMINI_NOT_CONFIGURED")).toMatch(/gemini/i);
    expect(planGenerateErrorMessage("GEMINI_INVALID_PLAN")).toMatch(/fallado/i);
    expect(planGenerateErrorMessage("GEMINI_REQUEST_FAILED")).toMatch(/fallado/i);
    expect(planGenerateErrorMessage("PROFILE_REQUIRED")).toMatch(/onboarding/i);
    expect(planGenerateErrorMessage("INTERNAL_ERROR")).toMatch(/generar/i);
    expect(planGenerateErrorMessage(undefined)).toMatch(/generar/i);
  });
});
