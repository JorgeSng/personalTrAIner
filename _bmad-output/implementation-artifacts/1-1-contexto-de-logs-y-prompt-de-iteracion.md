# Story 1.1: Contexto de logs y prompt de iteración

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a usuario de personalTrAIner,
I want que el sistema recopile mi perfil y los logs de sesión registrados desde que el plan activo está vigente,
so that el plan de la semana siguiente se ajuste a mi progreso real sin que yo tome decisiones técnicas.

## Acceptance Criteria

1. **Given** un plan activo vigente y sesiones registradas desde que está activo **When** se prepara el contexto de iteración **Then** el contexto incluye el perfil del usuario (nivel, `training_days_per_week`, material, lesiones) y los logs de sesión (peso × reps por ejercicio) posteriores a la creación del plan activo **And** no se incluyen logs de sesiones anteriores al plan activo.
2. **Given** una semana incompleta (menos sesiones registradas que `training_days_per_week`) **When** se construye el prompt para Gemini **Then** incluye la regla de progresión conservadora (menos datos de progreso → ajuste más cauto).
3. **Given** que no existe ningún log de sesión nuevo desde el plan activo **When** se solicita el contexto de iteración **Then** el sistema lo detecta y no construye prompt ni llama a Gemini (base del bloqueo de la Story 1.2).
4. **Given** el pipeline de iteración en `lib/plans`/`lib/ai` **When** se implementa **Then** existen tests unitarios (Jest, junto al archivo) del contexto, del prompt y de las reglas de progresión escritos antes del código de producto, manteniendo cobertura global ≥75%.

## Tasks / Subtasks

- [ ] T1. Escribir tests del contexto de iteración ANTES del código de producto (AC: 1, 3, 4)
  - [ ] T1.1. Test: con plan activo + sesiones registradas → el contexto contiene perfil (experience_level, training_days_per_week, equipment, injuries_notes) y logs con peso × reps por ejercicio.
  - [ ] T1.2. Test: sesiones de planes anteriores (otro `plan_id`) quedan excluidas del contexto.
  - [ ] T1.3. Test: semana incompleta (`sesiones < training_days_per_week`) → el prompt incluye la regla de progresión conservadora.
  - [ ] T1.4. Test: sin sesiones nuevas desde el plan activo → resultado «sin logs nuevos», sin construir prompt y sin llamar a Gemini.
- [ ] T2. Implementar recopilación de contexto en `lib/plans` (AC: 1)
  - [ ] T2.1. Cargar plan activo con `getActivePlan(userId)` (`lib/plans/get-active-plan.ts`).
  - [ ] T2.2. Cargar perfil (mismo select que `loadProfile` en `lib/plans/generate-and-persist.ts`: `experience_level, training_days_per_week, equipment, injuries_notes`).
  - [ ] T2.3. Consultar `workout_sessions` filtrando por `plan_id = planActivo.id` y traer sus `workout_session_exercises` (peso × reps por ejercicio).
- [ ] T3. Implementar regla de progresión conservadora (AC: 2)
  - [ ] T3.1. Comparar nº de sesiones encontradas vs `training_days_per_week` del perfil.
  - [ ] T3.2. Inyectar la regla en el prompt solo cuando `sesiones < training_days_per_week`.
- [ ] T4. Implementar construcción del prompt de iteración en `lib/ai` (AC: 2, 3)
  - [ ] T4.1. Extender/reutilizar el patrón de `buildPrompt` (`lib/ai/gemini.ts`) para incorporar perfil + logs + regla conservadora, conservando todas las reglas existentes (JSON only, español, descansos, catálogo LoadMuscle, nº días exacto).
  - [ ] T4.2. El builder no debe ejecutarse si no hay logs nuevos (guard previo, AC 3).
- [ ] T5. Gate de cierre (obligatorio)
  - [ ] T5.1. Diagnósticos IDE en archivos tocados; corregir errores nuevos.
  - [ ] T5.2. `npm run lint:ci`, `npm run typecheck`, `npm test` en verde; cobertura global ≥75% (umbrales: statements 75, branches 60, functions 70, lines 75 — `jest.config.mjs`).

## Dev Notes

**Metodología BMAD (decisión del usuario, 2026-09-22):** esta story es la guía de implementación y se rige por el flujo BMAD (create-story → dev-story → code-review). **No aplica el gate SDD de spec aprobada** para esta story: no es necesario crear spec-013 antes de codear. Las decisiones de diseño marcadas más abajo quedan resueltas con las decisiones aquí documentadas; si surge un bloqueo real durante la implementación, preguntar al usuario.

### Contexto brownfield y alcance

- MVP funcional (specs 001–012 `implemented`). Esta story es **solo cambios aditivos**: auditoría de arquitectura 2026-09-21 = READY. **No tocar** `proxy.ts`, gates de perfil ni migraciones.
- Alcance de esta story: **solo `lib/`** (contexto + prompt + reglas + tests). Sin route handler (Story 1.2), sin UI (Story 1.3), sin resumen de cambios (Story 1.4).
- Sin dependencias nuevas. Sin estado global cliente. Sin service role (RLS por `auth.uid()`).

### Pipeline existente que hay que REUTILIZAR (no reinventar)

- `generateWorkoutPlanJson(profile, options?)` — `lib/ai/gemini.ts`. Lanza `HttpError(503, GEMINI_NOT_CONFIGURED)` sin key; `HttpError(502, GEMINI_REQUEST_FAILED)` si falla o no-JSON. Modelo `gemini-3.6-flash`. `buildPrompt(profile, options)` ya inyecta: esquema JSON, español obligatorio, `rest_between_sets_sec`/`rest_after_exercise_sec`, no inventar `loadmuscle_url`, nombres preferidos del catálogo, nº de días exacto.
- `generateAndPersistPlan(userId)` — `lib/plans/generate-and-persist.ts`: `loadProfile → generateValidatedContent (parse Zod + reintento con hint correctivo + reintento catálogo) → persistWithRetry (supersede+insert, retry 1x ante 409)`. La iteración debe reutilizar `parsePlanContent` y los hints, NO duplicarlos.
- `getActivePlan(userId)` — `lib/plans/get-active-plan.ts`. Devuelve `PlanRow | null` (`{ id, user_id, status, week_label, content, created_at, updated_at }`).
- `loadProfile(userId)` — `lib/plans/generate-and-persist.ts` (privada hoy): select `user_id, experience_level, training_days_per_week, equipment, injuries_notes`; 404 `PROFILE_REQUIRED` si falta. Reutilizar el mismo shape (`PlanGenerationProfile`, `lib/plans/types.ts`).
- `listSessions(userId, { plan_id, limit })` — `lib/sessions/list-sessions.ts`. **OJO: devuelve `SessionSummary` SIN ejercicios.** El contexto de iteración necesita peso × reps por ejercicio → hay que obtener también `workout_session_exercises` (p. ej. `.in("session_id", ids)` con `.order("exercise_order")`; ver patrón de `getSessionById` en `lib/sessions/get-session-by-id.ts` y mapeadores en `lib/sessions/map-session.ts`).
- Errores: `HttpError(status, code, message)` (`lib/errors/http-error.ts`); copys ES en `lib/*/messages.ts` con mapeo `code → copy` (ejemplo: `planGenerateErrorMessage` en `lib/plans/messages.ts`).
- Env solo vía `lib/config/env.ts`. Alias `@/*` → raíz.

### Shapes de datos (fuente: docs/data-models.md)

- `profiles`: `user_id`, `experience_level` (beginner|intermediate|advanced), `training_days_per_week` (1–7), `equipment` (text[]), `injuries_notes` (nullable).
- `workout_sessions`: `id`, `user_id`, `plan_id` (FK RESTRICT a `workout_plans`), `day_index` (1–7), `performed_on` (date), `notes`, timestamps.
- `workout_session_exercises`: `session_id`, `exercise_name`, `exercise_order` (>=0), `sets_completed` (>=1), `weight_kg` (numeric NULL=o>=0; NULL = peso corporal), `reps` (text, p. ej. `"10,10,8"`).
- `workout_plans`: `id`, `user_id`, `status` (active|superseded), `week_label`, `content` (jsonb = `WorkoutPlanContent`), timestamps. Índice único parcial garantiza ≤1 activo.

### ⚠️ Decisión de query: cómo acotar «logs desde el plan activo»

- `createSession` (`lib/sessions/create-session.ts`) verifica propiedad del plan pero **NO exige `status='active'`**: en teoría puede existir una sesión apuntando a un plan ya `superseded`.
- **Decisión adoptada para esta story:** filtrar por `plan_id = planActivo.id` (usa el índice `(plan_id)` existente y excluye por construcción los logs de planes anteriores; satisface ambos «And/Then» del AC 1). Alternativa por fechas (`created_at > plan.created_at`) descartada: es más frágil (sesiones registradas tarde contra el plan viejo).

### Señal «sin logs nuevos» (AC 3) — decisión adoptada

- El código HTTP definitivo para «sin logs nuevos» (p. ej. `409 NO_NEW_SESSIONS`) se fija en la Story 1.2 (no está en `lib/plans/messages.ts` hoy).
- **Decisión para esta story:** el builder de contexto devuelve un resultado discriminado (p. ej. `{ ok: true, profile, sessions, prompt }` | `{ ok: false, reason: "NO_NEW_SESSIONS" }`) en lugar de lanzar `HttpError`. La Story 1.2 mapeará `reason` → código estable + copy ES. No inventar el código HTTP en esta story.

### Regla de progresión conservadora (AC 2)

- Disparador: `sessions.length < profile.training_days_per_week`.
- El prompt debe instruir a Gemini explícitamente: menos datos de progreso → progresión más cauta (no subir cargas/volumen agresivamente; priorizar técnica y completar semana). Redactar copy del prompt en inglés técnico (el prompt actual ya lo está) manteniendo la exigencia de salida en español.

### `week_label` (Semana N+1)

- **Decisión adoptada para esta story:** derivar «Semana N+1» desde `planActivo.week_label` (si el formato es «Semana N», incrementar el número; si no encaja el patrón, el builder del prompt recibe el `week_label` nuevo como entrada explícita). No inventar formatos nuevos.

### Testing

- Jest + tests junto al archivo (`*.test.ts`), entorno `node` con comentario `@jest-environment node` para módulos que tocan Supabase (patrón: `lib/plans/generate-and-persist.test.ts` — mocks con `jest.mock("@/lib/supabase/server")` y builders encadenados `select/eq/order/limit`).
- Mockear `createClient` y (si aplica) `generateWorkoutPlanJson`; los tests del contexto/prompt NO deben requerir API key.
- Cobertura global ≥75% líneas (umbrales en `jest.config.mjs`; ojo: `lib/ai/**` y `lib/supabase/**` están EXCLUIDOS de cobertura — la lógica nueva de contexto/prompt debería vivir en `lib/plans/` para ser medible).
- Tests escritos ANTES del código de producto (AC 4).

### Project Structure Notes

- Ficheros nuevos previstos: `lib/plans/build-iteration-context.ts` (contexto + detección sin logs) y `lib/plans/build-iteration-prompt.ts` (builder del prompt de iteración); sus tests junto al archivo.
- Superficie total de la épica (para no invadirla aquí): 1 route handler nuevo (Story 1.2), 1–2 componentes en `components/plan/` (Stories 1.3–1.4). Esta story NO crea rutas ni componentes.
- Sin conflictos detectados con la estructura actual; todo es aditivo en `lib/plans`/`lib/ai`.

### References

- [Source: docs/architecture.md#Generación de plan (SPEC-007/009)] — pipeline a reutilizar y regla LoadMuscle.
- [Source: docs/architecture.md#Auditoría de arquitectura (2026-09-21)] — cambios aditivos, decisiones pendientes 1–4.
- [Source: docs/data-models.md#public.workout_sessions (SPEC-010)] y [#public.workout_session_exercises] — shapes y RLS (EXISTS al padre).
- [Source: docs/data-models.md#public.workout_plans (SPEC-006)] — índice único parcial ≤1 activo.
- [Source: docs/development-guide.md#Convenciones de código] — handlers finos, lógica en `lib/`, copys ES, tests junto al archivo.
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — ACs origen; [Source: prd.md#FR2/FR6/FR7] y [NFR2/3/8/9].
- Código: `lib/plans/generate-and-persist.ts`, `lib/plans/get-active-plan.ts`, `lib/ai/gemini.ts`, `lib/sessions/list-sessions.ts`, `lib/sessions/get-session-by-id.ts`, `lib/sessions/map-session.ts`, `lib/plans/types.ts`, `lib/plans/messages.ts`.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List
