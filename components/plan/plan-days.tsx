import { ExerciseTechnique } from "@/components/plan/exercise-technique";
import { LogSessionForm } from "@/components/plan/log-session-form";
import { formatRestSeconds } from "@/lib/plans/format-rest-seconds";
import type { WorkoutPlanDay, WorkoutPlanExercise } from "@/lib/validation/schemas/workout-plan";

type Props = {
  planId: string;
  days: WorkoutPlanDay[];
};

function readRestSec(
  exercise: WorkoutPlanExercise,
  key: "rest_between_sets_sec" | "rest_after_exercise_sec",
): number | undefined {
  const value = exercise[key] as number | undefined;
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

export function PlanDays({ planId, days }: Props) {
  return (
    <div className="flex flex-col gap-8">
      {days.map((day) => {
        const heading = day.label?.trim() || `Día ${day.day_index}`;

        return (
          <section key={day.day_index} className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-zinc-900">{heading}</h3>
            <ul className="flex flex-col gap-4">
              {day.exercises.map((exercise, index) => {
                const restBetween = readRestSec(exercise, "rest_between_sets_sec");
                const restAfter = readRestSec(exercise, "rest_after_exercise_sec");

                return (
                  <li
                    key={`${day.day_index}-${exercise.name}-${index}`}
                    className="flex flex-col gap-1 border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0"
                  >
                    <p className="font-medium text-zinc-900">{exercise.name}</p>
                    <p className="text-sm text-zinc-600">
                      {exercise.sets} × {exercise.reps}
                    </p>
                    {exercise.notes ? (
                      <p className="text-sm text-zinc-500">{exercise.notes}</p>
                    ) : null}
                    {restBetween !== undefined ? (
                      <p className="text-sm text-zinc-500">
                        Descanso entre series: {formatRestSeconds(restBetween)}
                      </p>
                    ) : null}
                    {restAfter !== undefined && restAfter > 0 ? (
                      <p className="text-sm text-zinc-500">
                        Descanso hasta el siguiente:{" "}
                        {formatRestSeconds(restAfter)}
                      </p>
                    ) : null}
                    <ExerciseTechnique loadmuscleUrl={exercise.loadmuscle_url} />
                  </li>
                );
              })}
            </ul>
            <LogSessionForm
              planId={planId}
              dayIndex={day.day_index}
              exercises={day.exercises.map((exercise) => ({
                name: exercise.name,
              }))}
            />
          </section>
        );
      })}
    </div>
  );
}
