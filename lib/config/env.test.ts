import { getSupabasePublicEnv, getGeminiApiKey } from "@/lib/config/env";

describe("env helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns null when Supabase env is missing", () => {
    expect(getSupabasePublicEnv()).toBeNull();
  });

  it("returns null when Gemini key is missing", () => {
    expect(getGeminiApiKey()).toBeNull();
  });

  it("parses valid Supabase env", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(getSupabasePublicEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
  });
});
