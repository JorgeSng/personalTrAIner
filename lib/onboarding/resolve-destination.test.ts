import {
  resolvePostAuthDestination,
  resolveProfileGateRedirect,
} from "@/lib/onboarding/resolve-destination";

describe("resolvePostAuthDestination", () => {
  it("sends users without a profile to onboarding", () => {
    expect(resolvePostAuthDestination(false, "/")).toBe("/onboarding");
    expect(resolvePostAuthDestination(false, "/entrenamiento")).toBe(
      "/onboarding",
    );
  });

  it("keeps a safe next path when the user already has a profile", () => {
    expect(resolvePostAuthDestination(true, "/")).toBe("/");
    expect(resolvePostAuthDestination(true, "/entrenamiento")).toBe(
      "/entrenamiento",
    );
  });
});

describe("resolveProfileGateRedirect", () => {
  it("sends users without a profile away from home to onboarding", () => {
    expect(
      resolveProfileGateRedirect({ pathname: "/", hasProfile: false }),
    ).toBe("/onboarding");
  });

  it("sends users with a profile away from onboarding to home", () => {
    expect(
      resolveProfileGateRedirect({
        pathname: "/onboarding",
        hasProfile: true,
      }),
    ).toBe("/");
  });

  it("does not redirect when the gate does not apply", () => {
    expect(
      resolveProfileGateRedirect({ pathname: "/", hasProfile: true }),
    ).toBeNull();
    expect(
      resolveProfileGateRedirect({
        pathname: "/onboarding",
        hasProfile: false,
      }),
    ).toBeNull();
  });
});
