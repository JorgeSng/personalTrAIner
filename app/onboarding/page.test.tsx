import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";

import OnboardingPage from "@/app/onboarding/page";
import { getUser } from "@/lib/auth/session";
import { getSupabasePublicEnv } from "@/lib/config/env";
import { hasSessionProfile } from "@/lib/onboarding/get-session-profile";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/auth/session", () => ({
  getUser: jest.fn(),
}));

jest.mock("@/lib/onboarding/get-session-profile", () => ({
  hasSessionProfile: jest.fn(),
}));

jest.mock("@/lib/config/env", () => ({
  getSupabasePublicEnv: jest.fn(),
}));

jest.mock("@/components/onboarding/onboarding-form", () => ({
  OnboardingForm: () => <div>formulario-onboarding</div>,
}));

const getUserMock = getUser as jest.MockedFunction<typeof getUser>;
const hasSessionProfileMock = hasSessionProfile as jest.MockedFunction<
  typeof hasSessionProfile
>;
const getSupabasePublicEnvMock = getSupabasePublicEnv as jest.MockedFunction<
  typeof getSupabasePublicEnv
>;
const redirectMock = redirect as jest.MockedFunction<typeof redirect>;

describe("Onboarding page", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    hasSessionProfileMock.mockReset();
    getSupabasePublicEnvMock.mockReset();
    redirectMock.mockReset();
    redirectMock.mockImplementation((url) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  it("redirects unauthenticated users to login", async () => {
    getUserMock.mockResolvedValue(null);

    await expect(OnboardingPage()).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fonboarding",
    );
  });

  it("redirects users with a profile to home", async () => {
    getUserMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as Awaited<ReturnType<typeof getUser>>);
    hasSessionProfileMock.mockResolvedValue(true);

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("renders the onboarding form when authenticated without a profile", async () => {
    getUserMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as Awaited<ReturnType<typeof getUser>>);
    hasSessionProfileMock.mockResolvedValue(false);
    getSupabasePublicEnvMock.mockReturnValue({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });

    render(await OnboardingPage());

    expect(
      screen.getByRole("heading", { name: /onboarding/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/cuéntanos cómo entrenas/i)).toBeInTheDocument();
    expect(screen.getByText("formulario-onboarding")).toBeInTheDocument();
  });
});
