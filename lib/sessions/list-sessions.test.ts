/**
 * @jest-environment node
 */

import { listSessions } from "@/lib/sessions/list-sessions";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const createClientMock = createClient as jest.MockedFunction<
  typeof createClient
>;

const userId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";

const rows = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    user_id: userId,
    plan_id: planId,
    day_index: 1,
    performed_on: "2026-08-27",
    notes: null,
    created_at: "2026-08-27T10:00:00.000Z",
    updated_at: "2026-08-27T10:00:00.000Z",
  },
];

describe("listSessions", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("lists own sessions ordered by performed_on then created_at desc", async () => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: rows, error: null }),
    };
    const from = jest.fn(() => builder);
    createClientMock.mockResolvedValue({ from } as unknown as Awaited<
      ReturnType<typeof createClient>
    >);

    const result = await listSessions(userId, { limit: 20 });

    expect(from).toHaveBeenCalledWith("workout_sessions");
    expect(builder.eq).toHaveBeenCalledWith("user_id", userId);
    expect(builder.order).toHaveBeenNthCalledWith(1, "performed_on", {
      ascending: false,
    });
    expect(builder.order).toHaveBeenNthCalledWith(2, "created_at", {
      ascending: false,
    });
    expect(builder.limit).toHaveBeenCalledWith(20);
    expect(result).toEqual(rows);
  });

  it("filters by plan_id when provided", async () => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: rows, error: null }),
    };
    createClientMock.mockResolvedValue({
      from: jest.fn(() => builder),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    await listSessions(userId, { plan_id: planId, limit: 10 });

    expect(builder.eq).toHaveBeenCalledWith("user_id", userId);
    expect(builder.eq).toHaveBeenCalledWith("plan_id", planId);
    expect(builder.limit).toHaveBeenCalledWith(10);
  });

  it("returns empty array when there are no rows", async () => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    createClientMock.mockResolvedValue({
      from: jest.fn(() => builder),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    await expect(listSessions(userId, { limit: 20 })).resolves.toEqual([]);
  });
});
