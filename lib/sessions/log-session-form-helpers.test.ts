import {
  buildSessionCreatePayload,
  getTodayLocalDateString,
  isExerciseCompleted,
  isFutureLocalDate,
} from "@/lib/sessions/log-session-form-helpers";
import {
  SESSION_VALIDATION_FUTURE_DATE,
  SESSION_VALIDATION_INVALID_WEIGHT,
  SESSION_VALIDATION_NO_EXERCISES,
} from "@/lib/sessions/messages";

const planId = "22222222-2222-4222-8222-222222222222";
const referenceDate = new Date(2026, 7, 28, 12, 0, 0);

describe("log-session-form-helpers", () => {
  describe("getTodayLocalDateString", () => {
    it("formats local date as YYYY-MM-DD", () => {
      expect(getTodayLocalDateString(referenceDate)).toBe("2026-08-28");
    });
  });

  describe("isFutureLocalDate", () => {
    it("returns true for dates after today", () => {
      expect(isFutureLocalDate("2026-08-29", referenceDate)).toBe(true);
    });

    it("returns false for today and past dates", () => {
      expect(isFutureLocalDate("2026-08-28", referenceDate)).toBe(false);
      expect(isFutureLocalDate("2026-08-27", referenceDate)).toBe(false);
    });
  });

  describe("isExerciseCompleted", () => {
    it("requires sets >= 1 and non-empty trimmed reps", () => {
      expect(
        isExerciseCompleted({
          exerciseName: "Press",
          exerciseOrder: 0,
          setsCompleted: "3",
          weightKg: "",
          reps: "10,10,8",
        }),
      ).toBe(true);

      expect(
        isExerciseCompleted({
          exerciseName: "Press",
          exerciseOrder: 0,
          setsCompleted: "0",
          weightKg: "",
          reps: "10",
        }),
      ).toBe(false);

      expect(
        isExerciseCompleted({
          exerciseName: "Press",
          exerciseOrder: 0,
          setsCompleted: "3",
          weightKg: "",
          reps: "   ",
        }),
      ).toBe(false);
    });
  });

  describe("buildSessionCreatePayload", () => {
    const baseRows = [
      {
        exerciseName: "Press banca",
        exerciseOrder: 0,
        setsCompleted: "3",
        weightKg: "60",
        reps: "10,10,8",
      },
      {
        exerciseName: "Fondos",
        exerciseOrder: 1,
        setsCompleted: "",
        weightKg: "",
        reps: "",
      },
    ];

    it("builds payload with only completed exercises", () => {
      const result = buildSessionCreatePayload(
        planId,
        1,
        { performedOn: "2026-08-28", notes: "" },
        baseRows,
        referenceDate,
      );

      expect(result).toEqual({
        ok: true,
        payload: {
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
        },
      });
    });

    it("maps empty weight to null (bodyweight)", () => {
      const result = buildSessionCreatePayload(
        planId,
        2,
        { performedOn: "2026-08-28", notes: "Bien" },
        [
          {
            exerciseName: "Dominadas",
            exerciseOrder: 0,
            setsCompleted: "2",
            weightKg: "",
            reps: "8,7",
          },
        ],
        referenceDate,
      );

      expect(result).toEqual({
        ok: true,
        payload: {
          plan_id: planId,
          day_index: 2,
          performed_on: "2026-08-28",
          notes: "Bien",
          exercises: [
            {
              exercise_name: "Dominadas",
              exercise_order: 0,
              sets_completed: 2,
              weight_kg: null,
              reps: "8,7",
            },
          ],
        },
      });
    });

    it("rejects future performed_on", () => {
      const result = buildSessionCreatePayload(
        planId,
        1,
        { performedOn: "2026-08-29", notes: "" },
        baseRows,
        referenceDate,
      );

      expect(result).toEqual({
        ok: false,
        error: SESSION_VALIDATION_FUTURE_DATE,
      });
    });

    it("rejects when no exercises are completed", () => {
      const result = buildSessionCreatePayload(
        planId,
        1,
        { performedOn: "2026-08-28", notes: "" },
        [
          {
            exerciseName: "Press",
            exerciseOrder: 0,
            setsCompleted: "",
            weightKg: "",
            reps: "",
          },
        ],
        referenceDate,
      );

      expect(result).toEqual({
        ok: false,
        error: SESSION_VALIDATION_NO_EXERCISES,
      });
    });

    it("rejects invalid weight on a completed exercise", () => {
      const result = buildSessionCreatePayload(
        planId,
        1,
        { performedOn: "2026-08-28", notes: "" },
        [
          {
            exerciseName: "Press",
            exerciseOrder: 0,
            setsCompleted: "3",
            weightKg: "-5",
            reps: "10",
          },
        ],
        referenceDate,
      );

      expect(result).toEqual({
        ok: false,
        error: SESSION_VALIDATION_INVALID_WEIGHT,
      });
    });
  });
});
