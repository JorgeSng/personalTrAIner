import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { PlanPanel } from "@/components/plan/plan-panel";
import { PLAN_EMPTY_COPY } from "@/lib/plans/messages";
import type { PlanRow } from "@/lib/plans/types";
import type { WorkoutPlanContent } from "@/lib/validation/schemas/workout-plan";

const planFixture: PlanRow = {
  id: "plan-1",
  user_id: "user-1",
  status: "active",
  week_label: "Semana 1 — Full body",
  content: {
    week_label: "Semana 1 — Full body",
    days: [
      {
        day_index: 1,
        label: "Empuje",
        exercises: [
          {
            name: "Press banca",
            sets: 3,
            reps: "8-12",
            notes: "Controla la bajada",
            rest_between_sets_sec: 90,
            rest_after_exercise_sec: 120,
            loadmuscle_url: "https://www.loadmuscle.com/press",
          },
          {
            name: "Fondos",
            sets: 2,
            reps: "10",
            rest_between_sets_sec: 60,
            rest_after_exercise_sec: 0,
            loadmuscle_url: null,
          },
        ],
      },
      {
        day_index: 2,
        exercises: [
          {
            name: "Dominadas",
            sets: 3,
            reps: "6-8",
            rest_between_sets_sec: 90,
            rest_after_exercise_sec: 0,
          },
        ],
      },
    ],
  },
  created_at: "2026-08-25T12:00:00.000Z",
  updated_at: "2026-08-25T12:00:00.000Z",
};

describe("PlanPanel", () => {
  it("shows the empty state when there is no plan", () => {
    render(<PlanPanel plan={null} />);

    expect(screen.getByText(PLAN_EMPTY_COPY)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("lists week_label, days, sets × reps, notes, rests and technique states", () => {
    render(<PlanPanel plan={planFixture} />);

    expect(
      screen.getByRole("heading", { name: /semana 1 — full body/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /empuje/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /día 2/i })).toBeInTheDocument();
    expect(screen.getByText("Press banca")).toBeInTheDocument();
    expect(screen.getByText("3 × 8-12")).toBeInTheDocument();
    expect(screen.getByText("Controla la bajada")).toBeInTheDocument();
    expect(screen.getAllByText("Descanso entre series: 90 s").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText("Descanso hasta el siguiente: 2 min"),
    ).toBeInTheDocument();
    expect(screen.getByText("Descanso entre series: 1 min")).toBeInTheDocument();
    expect(screen.queryByText(/descanso hasta el siguiente: 0/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver técnica/i })).toHaveAttribute(
      "href",
      "https://www.loadmuscle.com/press",
    );
    expect(screen.getAllByText(/técnica pendiente/i)).toHaveLength(2);
    expect(screen.getByText("Dominadas")).toBeInTheDocument();
    expect(screen.getByText("3 × 6-8")).toBeInTheDocument();
  });

  it("does not crash on legacy plans without rest fields", () => {
    const legacyPlan: PlanRow = {
      ...planFixture,
      content: {
        week_label: "Plan antiguo",
        days: [
          {
            day_index: 1,
            exercises: [
              {
                name: "Press",
                sets: 3,
                reps: "8",
              },
            ],
          },
        ],
      } as WorkoutPlanContent,
    };

    render(<PlanPanel plan={legacyPlan} />);

    expect(screen.getByText("Press")).toBeInTheDocument();
    expect(screen.getByText("3 × 8")).toBeInTheDocument();
    expect(screen.queryByText(/descanso entre series/i)).not.toBeInTheDocument();
    expect(screen.getByText(/técnica pendiente/i)).toBeInTheDocument();
  });
});
