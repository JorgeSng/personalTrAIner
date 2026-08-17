import { credentialsSchema } from "@/lib/validation/schemas/auth";

describe("credentialsSchema", () => {
  it("accepts a valid email and password", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "secret1",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty email", () => {
    const result = credentialsSchema.safeParse({
      email: "",
      password: "secret1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = credentialsSchema.safeParse({
      email: "not-an-email",
      password: "secret1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "12345",
    });

    expect(result.success).toBe(false);
  });
});
