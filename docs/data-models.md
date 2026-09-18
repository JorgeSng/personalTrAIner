# Modelos de datos — personalTrAIner

Postgres en Supabase. Todas las tablas tienen **RLS habilitado** con políticas por `auth.uid()` — cada usuario solo ve/edita sus filas. Migraciones en `supabase/migrations/` (aplicadas a mano vía SQL Editor; no hay CLI de Supabase en el repo).

## Diagrama

```
auth.users (Supabase Auth)
  ├── 1:1  profiles              (user_id PK → auth.users.id)
  └── 1:N  workout_plans         (user_id → auth.users.id)
              │  ≤1 fila status='active' por usuario
              └── 1:N workout_sessions     (plan_id → workout_plans.id, ON DELETE RESTRICT)
                          └── 1:N workout_session_exercises (session_id → …, CASCADE)
```

## `public.profiles` (SPEC-003)

1:1 con `auth.users`. Sin fila = usuario sin onboarding (la app le redirige a `/onboarding`).

| Columna | Tipo | Restricciones |
|---|---|---|
| `user_id` | uuid | PK, FK → `auth.users.id` ON DELETE CASCADE |
| `experience_level` | text | CHECK `beginner|intermediate|advanced` |
| `training_days_per_week` | smallint | CHECK 1–7 |
| `equipment` | text[] | CHECK `cardinality > 0` |
| `injuries_notes` | text | nullable |
| `created_at` / `updated_at` | timestamptz | `updated_at` vía trigger `set_profiles_updated_at` |

**RLS:** `select_own`, `insert_own`, `update_own` (`auth.uid() = user_id`). Sin política DELETE.
**Grants:** `SELECT, INSERT, UPDATE` a `authenticated`.
**Zod:** `profileSchema` / `profilePatchSchema` (`lib/validation/schemas/profile.ts`).

## `public.workout_plans` (SPEC-006)

Historial de planes por usuario; como máximo uno `active`.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | uuid | PK `gen_random_uuid()` |
| `user_id` | uuid | FK → `auth.users.id` CASCADE |
| `status` | text | CHECK `active|superseded` |
| `week_label` | text | NOT NULL |
| `content` | jsonb | Plan completo (validado en app con Zod) |
| `created_at` / `updated_at` | timestamptz | trigger `set_workout_plans_updated_at` |

**Índice único parcial:** `workout_plans_one_active_per_user ON (user_id) WHERE status='active'` — garantiza ≤1 activo.
**RLS:** `select_own`, `insert_own`, `update_own`. Sin DELETE.
**Zod:** `workoutPlanContentSchema` (`lib/validation/schemas/workout-plan.ts`) — `content` = `{ week_label, days[] }` con `day_index` 1–7, `exercises[]` con `name`, `sets`, `reps`, `rest_between_sets_sec`, `rest_after_exercise_sec`, `notes?`, `loadmuscle_url?` (https o null).

## `public.workout_sessions` (SPEC-010)

Un log de sesión de entrenamiento (qué día del plan, qué fecha).

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `auth.users.id` CASCADE |
| `plan_id` | uuid | FK → `workout_plans.id` **ON DELETE RESTRICT** |
| `day_index` | int | CHECK 1–7 |
| `performed_on` | date | NOT NULL |
| `notes` | text | nullable |
| `created_at` / `updated_at` | timestamptz | trigger |

**Índices:** `(user_id, performed_on DESC)`, `(plan_id)`.
**RLS:** `select_own`, `insert_own`, `update_own` por `auth.uid() = user_id`.
**Zod:** `workoutSessionSchema` / `workoutSessionCreateSchema`.

## `public.workout_session_exercises` (SPEC-010)

Una fila por ejercicio realizado dentro de la sesión (no por serie).

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | uuid | PK |
| `session_id` | uuid | FK → `workout_sessions.id` CASCADE |
| `exercise_name` | text | `char_length >= 1` |
| `exercise_order` | int | `>= 0` |
| `sets_completed` | int | `>= 1` |
| `weight_kg` | numeric | `NULL` o `>= 0` (NULL = peso corporal) |
| `reps` | text | `char_length >= 1` (p. ej. `"10,10,8"`) |
| `created_at` / `updated_at` | timestamptz | trigger |

**RLS:** sin `user_id` propio — políticas `EXISTS` sobre la sesión padre (`workout_sessions.user_id = auth.uid()`). Sin DELETE.
**Zod:** `workoutSessionExerciseSchema`.

## Estrategia de migraciones

- Archivos `supabase/migrations/YYYYMMDDHHMMSS_descripcion.sql`, aplicados manualmente en el SQL Editor de Supabase.
- **No modificar migraciones aplicadas** — crear una nueva (regla `api-conventions`).
- Cada migración incluye: tabla + CHECKs + RLS + policies + `GRANT` a `authenticated` + trigger `updated_at`.
- Patrón RLS uniforme: `*_own` con `auth.uid() = user_id`; en tablas hijas sin `user_id`, `EXISTS` al padre.
- Sin política `DELETE` en MVP.

## Notas

- IDs: `gen_random_uuid()` (uuid v4). La regla `api-conventions` menciona UUID v7 "donde aplique" — las migraciones actuales usan v4.
- La validación de `content` (jsonb) vive en la app (Zod), no en la base de datos.
