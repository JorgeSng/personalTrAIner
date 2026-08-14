import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import LoginPage from "@/app/login/page";
import { getSupabasePublicEnv } from "@/lib/config/env";

jest.mock("@/lib/config/env", () => ({
  getSupabasePublicEnv: jest.fn(),
  getMissingSupabaseEnvMessage: () =>
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).",
}));

jest.mock("@/components/auth/login-form", () => ({
  LoginForm: () => <div>formulario-login</div>,
}));

const getSupabasePublicEnvMock = getSupabasePublicEnv as jest.MockedFunction<
  typeof getSupabasePublicEnv
>;

describe("Login page", () => {
  it("shows a configuration message and does not crash when env is missing", async () => {
    getSupabasePublicEnvMock.mockReturnValue(null);

    const ui = await LoginPage({
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(screen.getByText(/supabase no está configurado/i)).toBeInTheDocument();
    expect(screen.queryByText("formulario-login")).not.toBeInTheDocument();
  });
});
