import {
  SESSION_GENERIC_ERROR,
  SESSION_PLAN_NOT_FOUND,
  SESSION_SERVICE_UNAVAILABLE,
  SESSION_VALIDATION_ERROR,
  sessionErrorMessage,
} from "@/lib/sessions/messages";

describe("sessionErrorMessage", () => {
  it("maps PLAN_NOT_FOUND", () => {
    expect(sessionErrorMessage("PLAN_NOT_FOUND")).toBe(SESSION_PLAN_NOT_FOUND);
  });

  it("maps VALIDATION_ERROR with API message when present", () => {
    expect(sessionErrorMessage("VALIDATION_ERROR", "Campo inválido")).toBe(
      "Campo inválido",
    );
  });

  it("falls back for VALIDATION_ERROR without API message", () => {
    expect(sessionErrorMessage("VALIDATION_ERROR")).toBe(
      SESSION_VALIDATION_ERROR,
    );
  });

  it("maps SUPABASE_NOT_CONFIGURED", () => {
    expect(sessionErrorMessage("SUPABASE_NOT_CONFIGURED")).toBe(
      SESSION_SERVICE_UNAVAILABLE,
    );
  });

  it("returns generic error for unknown codes", () => {
    expect(sessionErrorMessage("INTERNAL_ERROR")).toBe(SESSION_GENERIC_ERROR);
    expect(sessionErrorMessage(undefined)).toBe(SESSION_GENERIC_ERROR);
  });
});
