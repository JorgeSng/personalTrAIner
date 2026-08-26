import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { GeneratePlanCta } from "@/components/plan/generate-plan-cta";
import {
  PLAN_GEMINI_CONFIG_ERROR,
  PLAN_GEMINI_FAILED_ERROR,
  PLAN_GENERATING_LABEL,
  PLAN_NETWORK_ERROR,
  PLAN_PROFILE_REQUIRED_ERROR,
} from "@/lib/plans/messages";

const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("GeneratePlanCta", () => {
  beforeEach(() => {
    refresh.mockReset();
    global.fetch = jest.fn();
  });

  it("shows Generar plan when there is no plan", () => {
    render(<GeneratePlanCta hasPlan={false} />);

    expect(
      screen.getByRole("button", { name: /generar plan/i }),
    ).toBeInTheDocument();
  });

  it("shows Regenerar plan when there is a plan", () => {
    render(<GeneratePlanCta hasPlan />);

    expect(
      screen.getByRole("button", { name: /regenerar plan/i }),
    ).toBeInTheDocument();
  });

  it("POSTs /api/plan/generate with {} and refreshes on 201", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: "plan-1" } }),
    });

    render(<GeneratePlanCta hasPlan={false} />);
    fireEvent.click(screen.getByRole("button", { name: /generar plan/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/plan/generate",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }),
      );
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("disables the CTA while submitting and shows loading copy", async () => {
    let resolveFetch: ((value: unknown) => void) | undefined;
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(<GeneratePlanCta hasPlan />);
    fireEvent.click(screen.getByRole("button", { name: /regenerar plan/i }));

    const loadingButton = await screen.findByRole("button", {
      name: PLAN_GENERATING_LABEL,
    });
    expect(loadingButton).toBeDisabled();

    resolveFetch?.({
      ok: true,
      status: 201,
      json: async () => ({ data: {} }),
    });

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("shows a Gemini config error for 503 GEMINI_NOT_CONFIGURED", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        error: { code: "GEMINI_NOT_CONFIGURED", message: "..." },
      }),
    });

    render(<GeneratePlanCta hasPlan={false} />);
    fireEvent.click(screen.getByRole("button", { name: /generar plan/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      PLAN_GEMINI_CONFIG_ERROR,
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows a generation failure for 502 GEMINI_INVALID_PLAN", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({
        error: { code: "GEMINI_INVALID_PLAN", message: "..." },
      }),
    });

    render(<GeneratePlanCta hasPlan />);
    fireEvent.click(screen.getByRole("button", { name: /regenerar plan/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      PLAN_GEMINI_FAILED_ERROR,
    );
  });

  it("shows PROFILE_REQUIRED copy for 404", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: { code: "PROFILE_REQUIRED", message: "..." },
      }),
    });

    render(<GeneratePlanCta hasPlan={false} />);
    fireEvent.click(screen.getByRole("button", { name: /generar plan/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      PLAN_PROFILE_REQUIRED_ERROR,
    );
  });

  it("shows a network error when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new TypeError("Failed to fetch"));

    render(<GeneratePlanCta hasPlan={false} />);
    fireEvent.click(screen.getByRole("button", { name: /generar plan/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      PLAN_NETWORK_ERROR,
    );
  });
});
