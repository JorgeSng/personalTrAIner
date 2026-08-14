import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { HomeShell } from "@/components/auth/home-shell";

jest.mock("@/components/auth/logout-button", () => ({
  LogoutButton: () => <button type="button">Cerrar sesión</button>,
}));

describe("HomeShell", () => {
  it("shows the session email and logout control", () => {
    render(<HomeShell email="user@example.com" />);

    expect(screen.getByRole("heading", { name: /personalTrAIner/i })).toBeInTheDocument();
    expect(screen.getByText(/sesión iniciada/i)).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cerrar sesión/i })).toBeInTheDocument();
  });
});
