# SPEC-006: workout-plan-schema (tabla, RLS, Zod)

| Campo | Valor |
|---|---|
| **Estado** | implemented |
| **Tipo** | infra |
| **Fecha** | 2026-08-24 |
| **Supersede** | — (bloque histórico `workout-plan-engine` en roadmap; no existía archivo monolítico) |
| **Depende de** | [SPEC-005](./005-onboarding-capture.md) (implemented); [ADR-001](../adr/001-tech-stack.md) (accepted) |

## Objetivo

Existir en Supabase una tabla **`public.workout_plans`** (historial de planes por usuario, **un plan `active` a la vez**) con **RLS** por `auth.uid()`, más un **esquema Zod** en el repo que valide el JSON de contenido (`content`). Medible: migración aplicable sin error; Zod + tests Jest alineados con la forma acordada.

Esta spec entrega **solo la capa de datos**. Sin Route Handlers ni Gemini (spec-007) ni pantallas (spec-008).

## Comportamiento esperado

1. Tras aplicar la migración, existe `public.workout_plans` con las columnas de **Modelo de datos**.
2. **RLS activado**. Políticas mínimas para `authenticated`:
   - `SELECT` / `INSERT` / `UPDATE` solo filas propias (`user_id = auth.uid()`).
   - **Sin** política `DELETE` (MVP).
3. **`GRANT`** explícito `SELECT, INSERT, UPDATE` a `authenticated` (si el proyecto no auto-expone tablas).
4. Como máximo **una fila `status = 'active'`** por `user_id` (índice único parcial u equivalente documentado en SQL).
5. En el repo: migración en `supabase/migrations/` + `workoutPlanContentSchema` (y tipos) en `lib/validation/schemas/` + tests Jest del Zod.
6. Trigger **`BEFORE UPDATE`** mantiene `updated_at`.
7. **No** cambia auth, perfil, stub Gemini ni UI.

## Entradas

_N/A (spec infra). La migración SQL es el artefacto de entrada al aplicar en Supabase._

## Salidas

_N/A (spec infra)._

## Casos límite

- Usuario sin filas en `workout_plans` → estado válido (aún no generó plan; UI en 008).
- Segundo `INSERT` con `status = 'active'` para el mismo usuario → rechazado por unicidad (o se documenta que 007 debe marcar el anterior como `superseded` antes del insert; la DB garantiza como máximo uno activo).
- `content` que no cumpla Zod → rechazado en capa app (007); opcional `CHECK` JSON en DB **no** es requisito MVP.
- Migración ya aplicada → no editar el mismo archivo; nueva migración incremental.
- Proyecto sin «expose new tables» → sin `GRANT`, la API no ve la tabla.

## UX / flujos

_N/A (spec infra)._

## Modelo de datos

### Relación

```
auth.users (1) ────── (0..N) public.workout_plans
     id                    user_id
                           status: active | superseded
                           (≤ 1 active por user)
```

### Columnas (MVP)

| Campo | Tipo SQL | Obligatorio | Reglas |
|---|---|---|---|
| `id` | `uuid` | sí | PK; default `gen_random_uuid()` (o UUID v7 si el repo ya lo usa en convenciones) |
| `user_id` | `uuid` | sí | FK → `auth.users(id) ON DELETE CASCADE` |
| `status` | `text` | sí | `active` \| `superseded` (+ `CHECK`) |
| `week_label` | `text` | sí | Etiqueta legible / id de semana (también puede ir dentro de `content`; columna denormalizada para listados) |
| `content` | `jsonb` | sí | Documento validado por Zod (abajo) |
| `created_at` | `timestamptz` | sí | Default `now()` |
| `updated_at` | `timestamptz` | sí | Default `now()`; trigger `BEFORE UPDATE` |

**Índice:** único parcial `UNIQUE (user_id) WHERE status = 'active'`.

### Forma Zod de `content` (`workoutPlanContentSchema`)

| Campo | Tipo | Reglas |
|---|---|---|
| `week_label` | `string` | `min(1)` |
| `days` | array | `min(1)`; cada día: |
| `days[].day_index` | `number` int | `1..7` |
| `days[].label` | `string` | opcional |
| `days[].exercises` | array | `min(1)` |
| `exercises[].name` | `string` | `min(1)` |
| `exercises[].sets` | `number` int | `≥ 1` |
| `exercises[].reps` | `string` | `min(1)` (p. ej. `"8-12"`, `"10"`) |
| `exercises[].notes` | `string` | opcional |
| `exercises[].loadmuscle_url` | `string` url https \| `null` | opcional/nullable; ausente o `null` = pendiente en UI (008) |

`.strip()` en el objeto raíz (no aceptar campos basura silenciosos de forma distinta al resto del repo: seguir convención de `profileSchema`).

**Nota:** el número de `days` debe poder alinearse con `profiles.training_days_per_week` en **007** (prompt + validación post-Gemini). El schema Zod de 006 **no** exige igualdad con el perfil (no hay join en Zod).

### RLS (esqueleto)

```sql
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

-- SELECT / INSERT / UPDATE own-row para authenticated
-- Sin DELETE
```

### GRANT

```sql
GRANT SELECT, INSERT, UPDATE ON public.workout_plans TO authenticated;
```

## Integraciones

- Supabase Postgres + Auth (`auth.uid()`).
- **No** Gemini, **no** LoadMuscle (solo el campo URL en el schema), **no** service role.

## Decisiones (cerradas 2026-08-21)

| ID | Decisión |
|---|---|
| **D1** | Una tabla `workout_plans`; contenido en `jsonb` (sin tablas de ejercicios hijas en MVP) |
| **D2** | Historial con `active` / `superseded`; ≤ 1 `active` por usuario |
| **D3** | Forma Zod del plan semanal (days → exercises + `loadmuscle_url` opcional) |
| **D4** | Sin DELETE en RLS MVP |

## Fuera de alcance

- Route Handlers / Gemini / regeneración (007).
- UI `/plan` y enlaces «Ver técnica» (008).
- Session log (009), weekly iteration (010).
- Dietas / calorías.
- Catálogo curado LoadMuscle o scrapeo.
- Cambios a `profiles` (003/004/005).

## Criterios de aceptación

- [x] Migración crea `public.workout_plans` con columnas, CHECK de `status`, índice único parcial de un `active` por usuario, trigger `updated_at`.
- [x] RLS + GRANT documentados/aplicados (SELECT/INSERT/UPDATE own-row; sin DELETE).
- [x] Zod `workoutPlanContentSchema` (+ tipos) en `lib/validation/schemas/` alineado con la forma de esta spec.
- [x] Tests Jest del Zod (días, ejercicios, reps string, url/null, strip).
- [x] README o notas: cómo aplicar la migración (mismo patrón que 003).
- [x] No se implementaron rutas HTTP de plan ni UI ni llamada real a Gemini de generación de plan.
- [x] No se tocaron archivos fuera de migración, Zod, tests y docs de esta spec.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

1. Redactar migración SQL (tabla + CHECK + índice parcial + RLS + GRANT + trigger).
2. Aplicar en proyecto Supabase del desarrollador; comprobar Table Editor.
3. Añadir Zod + tests.
4. Actualizar README (apply migration) si hace falta.
5. Spec-007 puede implementarse después de **approved → implemented** de esta.

## Notas de implementación

- **Migración:** `supabase/migrations/20260824120000_create_workout_plans.sql` — tabla, CHECK `status`, índice único parcial `workout_plans_one_active_per_user`, RLS (SELECT/INSERT/UPDATE own-row; sin DELETE), GRANT, trigger `workout_plans_set_updated_at`. PK `id` con `gen_random_uuid()` (el repo no usa UUID v7 aún).
- **Zod:** `lib/validation/schemas/workout-plan.ts` — `workoutPlanContentSchema`, schemas anidados `workoutPlanDaySchema` / `workoutPlanExerciseSchema`, tipos exportados; reexport en `lib/validation/schemas/index.ts`.
- **Tests:** `lib/validation/schemas/workout-plan.test.ts` (18 casos: días 1–7, ejercicios, reps string, `loadmuscle_url` https/null/omitido, strip).
- **Docs:** README sección «Plan de entrenamiento (SPEC-006)» con apply migration + verificación RLS/índice activo.
- **Desviaciones:** ninguna respecto a la forma de datos. Schemas Zod anidados también usan `.strip()` (la spec exige strip en la raíz; se aplica también a day/exercise por consistencia).
- **Pendiente manual:** aplicar la migración en el proyecto Supabase del desarrollador (SQL Editor) y comprobar Table Editor.

_Decisiones D1–D4 validadas al aprobar la draft (2026-08-21)._
