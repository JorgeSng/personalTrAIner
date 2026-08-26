import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";

import Home from "@/app/page";
import { getUser } from "@/lib/auth/session";
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

jest.mock("@/components/auth/logout-button", () => ({
  LogoutButton: () => <button type="button">Cerrar sesión</button>,
}));

const getUserMock = getUser as jest.MockedFunction<typeof getUser>;
const hasSessionProfileMock = hasSessionProfile as jest.MockedFunction<
  typeof hasSessionProfile
>;
const redirectMock = redirect as jest.MockedFunction<typeof redirect>;

describe("Home page", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    hasSessionProfileMock.mockReset();
    redirectMock.mockReset();
    redirectMock.mockImplementation((url) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  it("renders the authenticated shell when the user has a profile", async () => {
    getUserMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as Awaited<ReturnType<typeof getUser>>);
    hasSessionProfileMock.mockResolvedValue(true);

    render(await Home());

    expect(screen.getByRole("heading", { name: /personalTrAIner/i })).toBeInTheDocument();
    expect(screen.getByText(/sesión iniciada/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver mi plan/i })).toHaveAttribute(
      "href",
      "/plan",
    );
  });

  it("redirects authenticated users without a profile to onboarding", async () => {
    getUserMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as Awaited<ReturnType<typeof getUser>>);
    hasSessionProfileMock.mockResolvedValue(false);

    await expect(Home()).rejects.toThrow("NEXT_REDIRECT:/onboarding");
  });
});
