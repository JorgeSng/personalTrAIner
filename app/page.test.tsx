import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import Home from "@/app/page";
import { getUser } from "@/lib/auth/session";

jest.mock("@/lib/auth/session", () => ({
  getUser: jest.fn(),
}));

jest.mock("@/components/auth/logout-button", () => ({
  LogoutButton: () => <button type="button">Cerrar sesión</button>,
}));

const getUserMock = getUser as jest.MockedFunction<typeof getUser>;

describe("Home page", () => {
  it("renders the authenticated shell", async () => {
    getUserMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as Awaited<ReturnType<typeof getUser>>);

    render(await Home());

    expect(screen.getByRole("heading", { name: /personalTrAIner/i })).toBeInTheDocument();
    expect(screen.getByText(/sesión iniciada/i)).toBeInTheDocument();
  });
});
