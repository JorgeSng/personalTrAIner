import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AUTH_GENERIC_ERROR } from "@/lib/auth/messages";
import { LoginForm } from "@/components/auth/login-form";

const signInWithPassword = jest.fn();
const signUp = jest.fn();
const replace = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithPassword, signUp },
  }),
  isSupabaseConfigured: () => true,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signUp.mockReset();
    replace.mockReset();
    refresh.mockReset();
  });

  it("renders email, password, Entrar and Crear cuenta", () => {
    render(<LoginForm nextPath="/" />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^entrar$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it("shows field errors and does not call Supabase when the form is invalid", async () => {
    render(<LoginForm nextPath="/" />);

    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(await screen.findByText(/email válido/i)).toBeInTheDocument();
    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("shows a generic error when credentials are rejected", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    render(<LoginForm nextPath="/" />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "secret1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(await screen.findByText(AUTH_GENERIC_ERROR)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects to nextPath after a successful login", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1" }, session: {} },
      error: null,
    });

    render(<LoginForm nextPath="/" />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "secret1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret1",
      });
      expect(replace).toHaveBeenCalledWith("/");
    });
  });
});
