import { sanitizeNextPath } from "@/lib/auth/safe-next";

describe("sanitizeNextPath", () => {
  it("keeps an internal relative path", () => {
    expect(sanitizeNextPath("/")).toBe("/");
    expect(sanitizeNextPath("/entrenamiento")).toBe("/entrenamiento");
  });

  it("defaults to / when next is missing", () => {
    expect(sanitizeNextPath(null)).toBe("/");
    expect(sanitizeNextPath(undefined)).toBe("/");
    expect(sanitizeNextPath("")).toBe("/");
  });

  it("rejects absolute URLs, protocols and protocol-relative paths", () => {
    expect(sanitizeNextPath("https://evil.example")).toBe("/");
    expect(sanitizeNextPath("http://evil.example/x")).toBe("/");
    expect(sanitizeNextPath("//evil.example")).toBe("/");
    expect(sanitizeNextPath("/\\evil.example")).toBe("/");
    expect(sanitizeNextPath("login")).toBe("/");
  });
});
