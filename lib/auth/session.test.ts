import { HttpError } from "@/lib/errors/http-error";
import { requireUser } from "@/lib/auth/session";

const mockGetUser = jest.fn();
const mockIsSupabaseConfigured = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
  isSupabaseConfigured: () => mockIsSupabaseConfigured(),
}));

describe("requireUser", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockIsSupabaseConfigured.mockReset();
    mockIsSupabaseConfigured.mockReturnValue(true);
  });

  it("throws 401 UNAUTHORIZED when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(requireUser()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("returns the user when a session exists", async () => {
    const user = { id: "user-1", email: "user@example.com" };
    mockGetUser.mockResolvedValue({ data: { user }, error: null });

    await expect(requireUser()).resolves.toEqual(user);
  });

  it("throws 503 when Supabase env is missing", async () => {
    mockIsSupabaseConfigured.mockReturnValue(false);

    await expect(requireUser()).rejects.toBeInstanceOf(HttpError);
    await expect(requireUser()).rejects.toMatchObject({
      status: 503,
      code: "SUPABASE_NOT_CONFIGURED",
    });
  });
});
