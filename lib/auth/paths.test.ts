import { buildLoginRedirect, resolvePageRedirect } from "@/lib/auth/paths";

describe("buildLoginRedirect", () => {
  it("sends unauthenticated users to /login with a relative next", () => {
    expect(buildLoginRedirect("/")).toBe("/login?next=%2F");
    expect(buildLoginRedirect("/entrenamiento")).toBe("/login?next=%2Fentrenamiento");
  });
});

describe("resolvePageRedirect", () => {
  it("redirects protected pages without a session to login", () => {
    expect(resolvePageRedirect({ pathname: "/", hasUser: false })).toBe(
      "/login?next=%2F",
    );
  });

  it("allows /login without a session", () => {
    expect(resolvePageRedirect({ pathname: "/login", hasUser: false })).toBeNull();
  });

  it("redirects authenticated users away from /login to /", () => {
    expect(resolvePageRedirect({ pathname: "/login", hasUser: true })).toBe("/");
  });

  it("does not redirect API routes (401 is handled in the route)", () => {
    expect(resolvePageRedirect({ pathname: "/api/health", hasUser: false })).toBeNull();
    expect(
      resolvePageRedirect({ pathname: "/api/plan/generate", hasUser: false }),
    ).toBeNull();
  });

  it("allows protected pages when there is a session", () => {
    expect(resolvePageRedirect({ pathname: "/", hasUser: true })).toBeNull();
    expect(
      resolvePageRedirect({ pathname: "/onboarding", hasUser: true }),
    ).toBeNull();
    expect(resolvePageRedirect({ pathname: "/plan", hasUser: true })).toBeNull();
  });

  it("redirects /onboarding without a session to login", () => {
    expect(
      resolvePageRedirect({ pathname: "/onboarding", hasUser: false }),
    ).toBe("/login?next=%2Fonboarding");
  });

  it("redirects /plan without a session to login", () => {
    expect(resolvePageRedirect({ pathname: "/plan", hasUser: false })).toBe(
      "/login?next=%2Fplan",
    );
  });
});
