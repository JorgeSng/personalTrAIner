/**
 * @jest-environment node
 */

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("stays public and returns 200 without a session", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
  });
});
