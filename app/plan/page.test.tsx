import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";

import PlanPage from "@/app/plan/page";
import { getUser } from "@/lib/auth/session";
import { hasSessionProfile } from "@/lib/onboarding/get-session-profile";
import { getActivePlan } from "@/lib/plans/get-active-plan";
import { PLAN_EMPTY_COPY } from "@/lib/plans/messages";
import type { PlanRow } from "@/lib/plans/types";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/auth/session", () => ({
  getUser: jest.fn(),
}));

jest.mock("@/lib/onboarding/get-session-profile", () => ({
  hasSessionProfile: jest.fn(),
}));

jest.mock("@/lib/plans/get-active-plan", () => ({
  getActivePlan: jest.fn(),
}));

jest.mock("@/components/plan/generate-plan-cta", () => ({
  GeneratePlanCta: ({ hasPlan }: { hasPlan: boolean }) => (
    <button type="button">
      {hasPlan ? "Regenerar plan" : "Generar plan"}
    </button>
  ),
}));

const getUserMock = getUser as jest.MockedFunction<typeof getUser>;
const hasSessionProfileMock = hasSessionProfile as jest.MockedFunction<
  typeof hasSessionProfile
>;
const getActivePlanMock = getActivePlan as jest.MockedFunction<
  typeof getActivePlan
>;
const redirectMock = redirect as jest.MockedFunction<typeof redirect>;

const planFixture: PlanRow = {
  id: "plan-1",
  user_id: "user-1",
  status: "active",
  week_label: "Semana 1",
  content: {
    week_label: "Semana 1",
    days: [
      {
        day_index: 1,
        label: "Full body",
        exercises: [
          {
            name: "Sentadilla",
            sets: 3,
            reps: "8",
            rest_between_sets_sec: 120,
            rest_after_exercise_sec: 0,
          },
        ],
      },
    ],
  },
  created_at: "2026-08-25T12:00:00.000Z",
  updated_at: "2026-08-25T12:00:00.000Z",
};

describe("Plan page", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    hasSessionProfileMock.mockReset();
    getActivePlanMock.mockReset();
    redirectMock.mockReset();
    redirectMock.mockImplementation((url) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  it("redirects unauthenticated users to login with next=/plan", async () => {
    getUserMock.mockResolvedValue(null);

    await expect(PlanPage()).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fplan",
    );
    expect(getActivePlanMock).not.toHaveBeenCalled();
  });

  it("redirects authenticated users without a profile to onboarding", async () => {
    getUserMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as Awaited<ReturnType<typeof getUser>>);
    hasSessionProfileMock.mockResolvedValue(false);

    await expect(PlanPage()).rejects.toThrow("NEXT_REDIRECT:/onboarding");
    expect(getActivePlanMock).not.toHaveBeenCalled();
  });

  it("renders empty state and Generar plan when there is no active plan", async () => {
    getUserMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as Awaited<ReturnType<typeof getUser>>);
    hasSessionProfileMock.mockResolvedValue(true);
    getActivePlanMock.mockResolvedValue(null);

    render(await PlanPage());

    expect(screen.getByRole("heading", { name: /tu plan/i })).toBeInTheDocument();
    expect(screen.getByText(PLAN_EMPTY_COPY)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /generar plan/i }),
    ).toBeInTheDocument();
    expect(getActivePlanMock).toHaveBeenCalledWith("user-1");
  });

  it("renders the active plan and Regenerar plan CTA", async () => {
    getUserMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as Awaited<ReturnType<typeof getUser>>);
    hasSessionProfileMock.mockResolvedValue(true);
    getActivePlanMock.mockResolvedValue(planFixture);

    render(await PlanPage());

    expect(screen.getByRole("heading", { name: /semana 1/i })).toBeInTheDocument();
    expect(screen.getByText("Sentadilla")).toBeInTheDocument();
    expect(screen.getByText("3 × 8")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /regenerar plan/i }),
    ).toBeInTheDocument();
  });
});
