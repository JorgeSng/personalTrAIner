/**
 * @jest-environment node
 */

import { getSessionProfile, hasSessionProfile } from "@/lib/onboarding/get-session-profile";
import { getUser } from "@/lib/auth/session";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

jest.mock("@/lib/auth/session", () => ({
  getUser: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
  isSupabaseConfigured: jest.fn(),
}));

const getUserMock = getUser as jest.MockedFunction<typeof getUser>;
const createClientMock = createClient as jest.MockedFunction<typeof createClient>;
const isSupabaseConfiguredMock = isSupabaseConfigured as jest.MockedFunction<
  typeof isSupabaseConfigured
>;

describe("getSessionProfile", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    createClientMock.mockReset();
    isSupabaseConfiguredMock.mockReset();
  });

  it("returns null when Supabase is not configured", async () => {
    isSupabaseConfiguredMock.mockReturnValue(false);

    await expect(getSessionProfile()).resolves.toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns null when there is no session user", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    getUserMock.mockResolvedValue(null);

    await expect(getSessionProfile()).resolves.toBeNull();
  });

  it("returns the profile row when it exists", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    getUserMock.mockResolvedValue({
      id: "user-1",
    } as Awaited<ReturnType<typeof getUser>>);

    const maybeSingle = jest.fn().mockResolvedValue({
      data: { user_id: "user-1", experience_level: "beginner" },
      error: null,
    });
    createClientMock.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle }),
        }),
      }),
    } as never);

    await expect(getSessionProfile()).resolves.toEqual({
      user_id: "user-1",
      experience_level: "beginner",
    });
    await expect(hasSessionProfile()).resolves.toBe(true);
  });

  it("returns null when no profile row exists", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    getUserMock.mockResolvedValue({
      id: "user-1",
    } as Awaited<ReturnType<typeof getUser>>);

    const maybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    createClientMock.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle }),
        }),
      }),
    } as never);

    await expect(getSessionProfile()).resolves.toBeNull();
    await expect(hasSessionProfile()).resolves.toBe(false);
  });
});
