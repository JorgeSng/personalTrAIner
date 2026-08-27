# SPEC-010: session-log-schema (tabla, RLS, Zod)

| Campo | Valor |
|---|---|
| **Estado** | approved |
| **Tipo** | infra |
| **Fecha** | 2026-08-27 |
| **Supersede** | — (el ítem roadmap «010 session-log» monolítico se **desglosa** en 010 schema + 011 api + 012 ui) |
| **Depende de** | [SPEC-009](./009-workout-plan-quality.md) (**implemented**); [SPEC-006](./006-workout-plan-schema.md) (implemented — FK a `workout_plans`) |

## Objetivo

Existir en Supabase el modelo de **registro de sesión por ejercicio** (peso × reps) con **RLS** por `auth.uid()`, más **esquema(s) Zod** en el repo alineados. Medible: migración aplicable; Zod + tests Jest; sin HTTP ni pantallas (eso es 011/012).

Esta spec entrega **solo la capa de datos**.

## Comportamiento esperado

1. Tras aplicar la migración, existen las tablas de **Modelo de datos** (sesión + ejercicios de esa sesión).
2. **RLS activado** en ambas. Políticas mínimas para `authenticated`:
   - `SELECT` / `INSERT` / `UPDATE` solo filas propias (`user_id = auth.uid()` en la sesión; ejercicios vía sesión propia).
   - **Sin** política `DELETE` (MVP).
3. **`GRANT`** explícito `SELECT, INSERT, UPDATE` a `authenticated` (mismo patrón que 003/006).
4. Cada sesión **debe** referenciar un `workout_plans.id` existente (`plan_id` obligatorio).
5. Cada fila de ejercicio guarda **`exercise_name` snapshot** (texto en el momento del log), no solo un índice frágil al JSON del plan.
6. Granularidad **por ejercicio** (una fila por ejercicio hecho en la sesión), no por serie ni un único JSON monolítico del día.
7. En el repo: migración en `supabase/migrations/` + Zod (+ tipos) + tests Jest.
8. Trigger **`BEFORE UPDATE`** mantiene `updated_at` donde aplique.
9. **No** cambia auth, perfil, generación de plan, UI ni weekly-iteration.

## Entradas

_N/A (spec infra)._

## Salidas

_N/A (spec infra)._

## Casos límite

- Usuario sin sesiones → válido (aún no ha logueado; UI en 012).
- `plan_id` de otro usuario → RLS / FK + ownership de la sesión lo impiden en la práctica (API 011 validará plan propio).
- Plan `superseded` → los logs históricos **siguen** apuntando a ese `plan_id` (correcto); el snapshot de nombre sigue siendo legible.
- Ejercicio a peso corporal → `weight_kg` puede ser `null`.
- Migración ya aplicada → no editar el mismo archivo; nueva migración incremental.
- Sin `GRANT` / expose → la API (011) no verá las tablas.

## UX / flujos

_N/A (spec infra). La entrada desde `/plan` se define en **012**._

## Modelo de datos

### Decisiones de producto (cerradas 2026-08-27)

| ID | Decisión |
|---|---|
| **D1** | Granularidad **por ejercicio** (opción C) |
| **D2** | `plan_id` **obligatorio** + **snapshot** de `exercise_name` |
| **D3** | UX de entrada desde `/plan` (opción A) — **solo afecta a 012**; aquí no hay UI |

### Relación

```
auth.users (1) ─── (0..N) workout_sessions
                         │
                         ├── plan_id → workout_plans.id
                         │
                         └── (1) ─── (1..N) workout_session_exercises
                                        exercise_name (snapshot)
```

### Tabla `public.workout_sessions`

| Campo | Tipo SQL | Obligatorio | Reglas |
|---|---|---|---|
| `id` | `uuid` | sí | PK; default `gen_random_uuid()` |
| `user_id` | `uuid` | sí | FK → `auth.users(id) ON DELETE CASCADE` |
| `plan_id` | `uuid` | sí | FK → `public.workout_plans(id)` (sin borrar en cascada el plan por logs; preferir `ON DELETE RESTRICT` o `NO ACTION`) |
| `day_index` | `int` | sí | `1..7`; día del plan al que corresponde la sesión |
| `performed_on` | `date` | sí | Fecha calendario en la que se realizó (timezone: fecha local del cliente en 011/012; aquí solo el tipo) |
| `notes` | `text` | no | Notas libres de la sesión |
| `created_at` | `timestamptz` | sí | Default `now()` |
| `updated_at` | `timestamptz` | sí | Default `now()`; trigger `BEFORE UPDATE` |

**Índices sugeridos:** `(user_id, performed_on DESC)`; `(plan_id)`.

### Tabla `public.workout_session_exercises`

| Campo | Tipo SQL | Obligatorio | Reglas |
|---|---|---|---|
| `id` | `uuid` | sí | PK; default `gen_random_uuid()` |
| `session_id` | `uuid` | sí | FK → `workout_sessions(id) ON DELETE CASCADE` |
| `exercise_name` | `text` | sí | Snapshot del nombre (min 1 char a nivel Zod) |
| `exercise_order` | `int` | sí | Orden en la sesión (`≥ 0`); refleja el orden al loguear |
| `sets_completed` | `int` | sí | `≥ 1` |
| `weight_kg` | `numeric` | no | Nullable (peso corporal / sin carga); si presente `≥ 0` |
| `reps` | `text` | sí | Resumen flexible (p. ej. `"10"`, `"10,10,8"`, `"8-10"`) |
| `created_at` | `timestamptz` | sí | Default `now()` |
| `updated_at` | `timestamptz` | sí | Default `now()`; trigger `BEFORE UPDATE` |

**Nota:** no hay tabla por serie en MVP. Si más adelante se necesita detalle por set, se puede extender `reps`/JSON o una spec nueva — fuera de 010.

**Denormalización de `user_id` en exercises:** opcional. Preferencia MVP: **no** duplicar `user_id` en exercises; RLS de exercises vía `EXISTS` a sesión propia (documentar en SQL).

### Forma Zod (MVP)

- `workoutSessionSchema` — campos alineados a la fila sesión (sin `id`/`timestamps` en input de create si se sigue el patrón de profile create; o schema de fila completa para lecturas — **mismo criterio que 006/003**: schema de dominio claro + tests).
- `workoutSessionExerciseSchema` — `exercise_name`, `exercise_order`, `sets_completed`, `weight_kg` nullable, `reps`.
- Schema compuesto de escritura (para 011): p. ej. sesión + `exercises: min(1)` — puede vivir en Zod de 010 para que 011 lo reutilice.

`.strip()` en objetos raíz (convención del repo).

### RLS (esqueleto)

```sql
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_session_exercises ENABLE ROW LEVEL SECURITY;

-- sessions: SELECT/INSERT/UPDATE where user_id = auth.uid()
-- exercises: SELECT/INSERT/UPDATE where session_id IN (
--   SELECT id FROM workout_sessions WHERE user_id = auth.uid()
-- )
-- Sin DELETE
```

### GRANT

```sql
GRANT SELECT, INSERT, UPDATE ON public.workout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workout_session_exercises TO authenticated;
```

## Integraciones

- Supabase Postgres + Auth (`auth.uid()`).
- FK a `workout_plans` (006).
- **No** Gemini, **no** LoadMuscle, **no** service role.

## Fuera de alcance

- Route Handlers / contrato HTTP (**011**).
- UI desde `/plan` / formularios (**012**).
- Weekly iteration / ajuste del plan (**013**).
- Log por serie (opción B), log monolítico por día (opción A).
- Rutas nuevas `/session` o `/log` (decisión 3 = solo desde `/plan` por ahora).
- Edición masiva, gráficos, export CSV.
- Dietas / calorías.
- Cambios a `profiles` o al schema del plan (`content`).

## Criterios de aceptación

- [ ] Migración crea `workout_sessions` y `workout_session_exercises` con columnas, FKs, CHECKs (`day_index` 1..7, `sets_completed` ≥ 1), triggers `updated_at`.
- [ ] RLS + GRANT: SELECT/INSERT/UPDATE own-row (exercises vía sesión); sin DELETE.
- [ ] Zod (+ tipos) en `lib/validation/schemas/` alineado con esta spec; tests Jest (sesión, ejercicios, `weight_kg` null, `reps` no vacío, strip).
- [ ] Documentar apply migration (README o notas, patrón 003/006).
- [ ] No se implementaron rutas HTTP ni UI de log ni weekly-iteration.
- [ ] No se tocaron archivos fuera de migración, Zod, tests y docs de esta spec (y roadmap).
- [ ] Roadmap README: 010 = esta spec; 011 session-log-api; 012 session-log-ui; 013 weekly-iteration.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

1. Migración SQL (tablas + FK + CHECK + RLS + GRANT + triggers).
2. Aplicar en Supabase del desarrollador; verificar Table Editor.
3. Zod + tests.
4. Docs apply migration.
5. Tras `approved` → `implemented`, seguir con **011**.

## Notas de implementación

- **Aprobada** por el usuario 2026-08-27 (D1–D3). Pendiente `implement-from-spec` cuando lo pida; **no** implementar hasta entonces.
- _Rellenar archivos/desviaciones al pasar a `implemented`._
