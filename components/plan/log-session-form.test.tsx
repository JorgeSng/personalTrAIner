import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LogSessionForm } from "@/components/plan/log-session-form";
import { getTodayLocalDateString } from "@/lib/sessions/log-session-form-helpers";
import {
  SESSION_CANCEL_CTA,
  SESSION_HELP_COPY,
  SESSION_NETWORK_ERROR,
  SESSION_PLAN_NOT_FOUND,
  SESSION_SAVE_CTA,
  SESSION_SUBMITTING_LABEL,
  SESSION_SUCCESS_COPY,
  SESSION_VALIDATION_NO_EXERCISES,
} from "@/lib/sessions/messages";

const planId = "22222222-2222-4222-8222-222222222222";

const exercises = [
  { name: "Press banca" },
  { name: "Fondos" },
];

describe("LogSessionForm", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 28, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows Registrar sesión and opens the form panel", () => {
    render(
      <LogSessionForm planId={planId} dayIndex={1} exercises={exercises} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /registrar sesión/i }));

    expect(screen.getByText(SESSION_HELP_COPY)).toBeInTheDocument();
    expect(screen.getByLabelText(/^fecha$/i)).toHaveValue(
      getTodayLocalDateString(),
    );
    expect(screen.getByText("Press banca")).toBeInTheDocument();
    expect(screen.getByText("Fondos")).toBeInTheDocument();
  });

  it("shows local validation error without calling the API", async () => {
    render(
      <LogSessionForm planId={planId} dayIndex={1} exercises={exercises} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /registrar sesión/i }));
    fireEvent.click(screen.getByRole("button", { name: SESSION_SAVE_CTA }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      SESSION_VALIDATION_NO_EXERCISES,
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("POSTs /api/sessions with completed exercises on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: "session-1" } }),
    });

    render(
      <LogSessionForm planId={planId} dayIndex={1} exercises={exercises} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /registrar sesión/i }));

    const setsInputs = screen.getAllByLabelText(/series hechas/i);
    fireEvent.change(setsInputs[0], { target: { value: "3" } });
    fireEvent.change(screen.getAllByLabelText(/^reps$/i)[0], {
      target: { value: "10,10,8" },
    });
    fireEvent.change(screen.getAllByLabelText(/peso \(kg\)/i)[0], {
      target: { value: "60" },
    });

    fireEvent.click(screen.getByRole("button", { name: SESSION_SAVE_CTA }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/sessions",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: planId,
            day_index: 1,
            performed_on: "2026-08-28",
            notes: null,
            exercises: [
              {
                exercise_name: "Press banca",
                exercise_order: 0,
                sets_completed: 3,
                weight_kg: 60,
                reps: "10,10,8",
              },
            ],
          }),
        }),
      );
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      SESSION_SUCCESS_COPY,
    );
    expect(
      screen.queryByRole("button", { name: SESSION_SAVE_CTA }),
    ).not.toBeInTheDocument();
  });

  it("disables submit while the request is in flight", async () => {
    let resolveFetch: ((value: unknown) => void) | undefined;
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(
      <LogSessionForm planId={planId} dayIndex={2} exercises={exercises} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /registrar sesión/i }));
    fireEvent.change(screen.getAllByLabelText(/series hechas/i)[0], {
      target: { value: "2" },
    });
    fireEvent.change(screen.getAllByLabelText(/^reps$/i)[0], {
      target: { value: "8,7" },
    });
    fireEvent.click(screen.getByRole("button", { name: SESSION_SAVE_CTA }));

    const loadingButton = await screen.findByRole("button", {
      name: SESSION_SUBMITTING_LABEL,
    });
    expect(loadingButton).toBeDisabled();

    resolveFetch?.({
      ok: true,
      status: 201,
      json: async () => ({ data: {} }),
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        SESSION_SUCCESS_COPY,
      );
    });
  });

  it("shows API validation error on 400", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: "VALIDATION_ERROR", message: "Día inválido" },
      }),
    });

    render(
      <LogSessionForm planId={planId} dayIndex={1} exercises={exercises} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /registrar sesión/i }));
    fireEvent.change(screen.getAllByLabelText(/series hechas/i)[0], {
      target: { value: "1" },
    });
    fireEvent.change(screen.getAllByLabelText(/^reps$/i)[0], {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: SESSION_SAVE_CTA }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Día inválido");
  });

  it("shows plan not found copy on 404 PLAN_NOT_FOUND", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: { code: "PLAN_NOT_FOUND", message: "..." },
      }),
    });

    render(
      <LogSessionForm planId={planId} dayIndex={1} exercises={exercises} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /registrar sesión/i }));
    fireEvent.change(screen.getAllByLabelText(/series hechas/i)[0], {
      target: { value: "1" },
    });
    fireEvent.change(screen.getAllByLabelText(/^reps$/i)[0], {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: SESSION_SAVE_CTA }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      SESSION_PLAN_NOT_FOUND,
    );
  });

  it("shows network error when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );

    render(
      <LogSessionForm planId={planId} dayIndex={1} exercises={exercises} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /registrar sesión/i }));
    fireEvent.change(screen.getAllByLabelText(/series hechas/i)[0], {
      target: { value: "1" },
    });
    fireEvent.change(screen.getAllByLabelText(/^reps$/i)[0], {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: SESSION_SAVE_CTA }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      SESSION_NETWORK_ERROR,
    );
  });

  it("closes the panel on cancel without POST", () => {
    render(
      <LogSessionForm planId={planId} dayIndex={1} exercises={exercises} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /registrar sesión/i }));
    fireEvent.click(screen.getByRole("button", { name: SESSION_CANCEL_CTA }));

    expect(
      screen.getByRole("button", { name: /registrar sesión/i }),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
