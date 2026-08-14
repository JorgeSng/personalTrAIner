/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from "next/server";

import { proxy } from "@/proxy";
import { copyCookies, updateSession } from "@/lib/supabase/middleware";

jest.mock("@/lib/supabase/middleware", () => ({
  updateSession: jest.fn(),
  copyCookies: jest.fn((_from: NextResponse, to: NextResponse) => to),
}));

const updateSessionMock = updateSession as jest.MockedFunction<typeof updateSession>;
const copyCookiesMock = copyCookies as jest.MockedFunction<typeof copyCookies>;

function requestFor(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

describe("proxy", () => {
  beforeEach(() => {
    updateSessionMock.mockReset();
    copyCookiesMock.mockReset();
    copyCookiesMock.mockImplementation((_from, to) => to);
  });

  it("redirects protected pages without a session to /login?next=", async () => {
    updateSessionMock.mockResolvedValue({
      user: null,
      response: NextResponse.next(),
    });

    const response = await proxy(requestFor("/"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2F");
  });

  it("does not redirect API routes", async () => {
    const passthrough = NextResponse.next();
    updateSessionMock.mockResolvedValue({
      user: null,
      response: passthrough,
    });

    const response = await proxy(requestFor("/api/plan/generate"));

    expect(response).toBe(passthrough);
  });
});
