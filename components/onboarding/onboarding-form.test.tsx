import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import {
  ONBOARDING_CONFLICT_ERROR,
  ONBOARDING_EQUIPMENT_REQUIRED,
  ONBOARDING_GENERIC_ERROR,
  ONBOARDING_NETWORK_ERROR,
} from "@/lib/onboarding/messages";

const replace = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

describe("OnboardingForm", () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
    global.fetch = jest.fn();
  });

  function fillValidForm() {
    fireEvent.click(screen.getByLabelText(/principiante/i));
    fireEvent.change(screen.getByLabelText(/días de entrenamiento por semana/i), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByLabelText(/mancuernas/i));
  }

  it("renders experience, days, equipment presets and optional notes", () => {
    render(<OnboardingForm />);

    expect(
      screen.getByRole("button", { name: /guardar y continuar/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/principiante/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mancuernas/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/lesiones o limitaciones/i),
    ).toBeInTheDocument();
  });

  it("validates empty equipment locally and does not call the API", async () => {
    render(<OnboardingForm />);

    fireEvent.click(screen.getByLabelText(/principiante/i));
    fireEvent.change(screen.getByLabelText(/días de entrenamiento por semana/i), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: /guardar y continuar/i }));

    expect(
      await screen.findByText(ONBOARDING_EQUIPMENT_REQUIRED),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("POSTs /api/profile and redirects home on 201", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          experience_level: "beginner",
          training_days_per_week: 3,
          equipment: ["dumbbells"],
        },
      }),
    });

    render(<OnboardingForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /guardar y continuar/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(replace).toHaveBeenCalledWith("/");
      expect(refresh).toHaveBeenCalled();
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(String(init.body))).toEqual({
      experience_level: "beginner",
      training_days_per_week: 3,
      equipment: ["dumbbells"],
    });
  });

  it("adds custom equipment chips and includes them in the POST body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: {} }),
    });

    render(<OnboardingForm />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/^otro$/i), {
      target: { value: "Kettlebell" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^añadir$/i }));
    fireEvent.click(screen.getByRole("button", { name: /guardar y continuar/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(String(init.body)).equipment).toEqual([
      "dumbbells",
      "Kettlebell",
    ]);
  });

  it("shows a conflict message with home action on 409", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: { code: "CONFLICT", message: "exists" },
      }),
    });

    render(<OnboardingForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /guardar y continuar/i }));

    expect(await screen.findByText(ONBOARDING_CONFLICT_ERROR)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ir al inicio/i })).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalledWith("/");
  });

  it("shows a clear message on network failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new TypeError("Failed to fetch"));

    render(<OnboardingForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /guardar y continuar/i }));

    expect(await screen.findByText(ONBOARDING_NETWORK_ERROR)).toBeInTheDocument();
  });

  it("shows a generic API error on 500", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: { code: "INTERNAL_ERROR", message: "boom" },
      }),
    });

    render(<OnboardingForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /guardar y continuar/i }));

    expect(await screen.findByText(ONBOARDING_GENERIC_ERROR)).toBeInTheDocument();
  });

  it("disables the CTA while the request is in flight", async () => {
    let resolveFetch: (value: unknown) => void = () => undefined;
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(<OnboardingForm />);
    fillValidForm();
    const submit = screen.getByRole("button", { name: /guardar y continuar/i });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(submit).toBeDisabled();
    });

    resolveFetch({
      ok: true,
      status: 201,
      json: async () => ({ data: {} }),
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });
  });
});
