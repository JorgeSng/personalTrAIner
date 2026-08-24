# SPEC-007: workout-plan-api (Gemini + persistencia)

| Campo | Valor |
|---|---|
| **Estado** | draft |
| **Tipo** | api |
| **Fecha** | 2026-08-21 |
| **Supersede** | — (sustituye el alcance API del bloque histórico `workout-plan-engine`) |
| **Depende de** | [SPEC-006](./006-workout-plan-schema.md) (approved → must be **implemented** antes de implementar esta); [SPEC-004](./004-profile-api.md) (implemented); [SPEC-002](./002-auth.md) (implemented) |

## Objetivo

Exponer un contrato HTTP para **generar** un plan de entrenamiento con **Gemini** a partir del **perfil** del usuario autenticado, **validarlo** con `workoutPlanContentSchema` (006), **persistirlo** en `workout_plans` como único `active`, y **leer** el plan activo. Medible: con perfil y `GEMINI_API_KEY`, un `POST` genera y guarda; un `GET` devuelve el activo o `null`.

Sustituye el **stub** de scaffold en `POST /api/plan/generate`. Sin UI (008).

## Comportamiento esperado

1. Endpoints de plan **protegidos**: sin sesión → `401` (`requireUser()`).
2. **`GET /api/plan`** (ruta acordada; ver Decisiones):
   - Plan `active` del usuario → `200 { data: <fila o proyección> }`.
   - Sin plan activo → `200 { data: null }`.
3. **`POST /api/plan/generate`**:
   - Requiere perfil existente; si no hay fila en `profiles` → error de precondición (`404` o `409`/`PRECONDITION`; código estable documentado en implementación).
   - Lee perfil (server/Supabase con sesión; **no** hardcodear perfil).
   - Llama a Gemini (modelo Flash ya usado en scaffold) con prompt que incluye experiencia, días/semana, equipment, lesiones.
   - Exige JSON alineado a `workoutPlanContentSchema`; valida con Zod.
   - Post-validación: `days.length` debe igualar `training_days_per_week` del perfil (si Gemini falla → `502` o reintento único documentado; no persistir inválido).
   - Persistencia: marcar plan `active` previo como `superseded`; insertar nuevo `active` con `content` + `week_label`.
   - Éxito → `201 { data: <plan guardado> }` (o `200` si se documenta regeneración; preferir **201** en alta de fila nueva).
4. Sin `GEMINI_API_KEY` → `503` con código claro (no devolver plan mock como “éxito” engañoso; el stub actual de scaffold se reemplaza).
5. Fallo de red/API Gemini → `502` `GEMINI_REQUEST_FAILED`.
6. Body de generate: **vacío** o `{}` en MVP (sin overrides); el perfil manda.
7. **No** implementa UI ni session log.

## Entradas

### `GET /api/plan`

- **Auth:** sesión (`requireUser()`).
- **Body:** N/A.
- **Query:** N/A en MVP (solo activo).

### `POST /api/plan/generate`

- **Auth:** sesión (`requireUser()`).
- **Body:** vacío / `{}` (MVP).
- **Headers:** N/A.

## Salidas

### Éxito

- `GET /api/plan`: `200 { data: PlanRow | null }`
  - `PlanRow` incluye al menos: `id`, `user_id`, `status`, `week_label`, `content`, `created_at`, `updated_at` (o subset documentado; `content` cumple Zod 006).
- `POST /api/plan/generate`: `201 { data: PlanRow }`

### Errores (alineados al repo)

| Status | code (ej.) | Cuándo |
|---|---|---|
| 401 | `UNAUTHORIZED` | Sin sesión |
| 400 | `VALIDATION_ERROR` | JSON Gemini / Zod inválido tras parseo |
| 404 o 409 | `PROFILE_REQUIRED` / `PRECONDITION_FAILED` | Sin perfil |
| 502 | `GEMINI_REQUEST_FAILED` | Error proveedor / respuesta inutilizable |
| 503 | `GEMINI_NOT_CONFIGURED` o `SUPABASE_NOT_CONFIGURED` | Env faltante |
| 500 | `INTERNAL_ERROR` | Otros |

## Casos límite

- Usuario con perfil pero sin plan → GET `data: null`; POST crea el primero.
- Regenerar → anterior `active` pasa a `superseded`; GET solo ve el nuevo.
- Gemini devuelve días ≠ `training_days_per_week` → no persistir; error controlado.
- Gemini inventa `loadmuscle_url` no https → Zod falla o se normaliza a `null` (elegir una; documentar en notas; preferir **fallar validación** o **coerce a null** de URLs inválidas — **recomendación: coerce a `null`** para no bloquear el plan entero).
- Concurrencia de dos generate → el índice único parcial de 006 + transacción/orden supersede→insert debe evitar dos `active`.
- Sin key Gemini → 503, no crash.

## UX / flujos

_N/A (spec api)._ Consumidores: spec-008 y tests.

## Modelo de datos

Usa `workout_plans` (006) y lee `profiles` (003). Sin tablas nuevas.

## Integraciones

- Gemini vía `@google/generative-ai` (`lib/ai/gemini.ts` evoluciona de stub a generación real).
- Supabase sesión + RLS.
- LoadMuscle: solo URLs en JSON; **no** scrapear.
- **No** service role.

## Decisiones (cerradas 2026-08-21)

| ID | Decisión |
|---|---|
| **D1** | `GET /api/plan` = plan activo; `POST /api/plan/generate` = generar+guardar |
| **D2** | Regenerar supersede + insert (historial) |
| **D3** | `days.length` === `training_days_per_week` |
| **D4** | Sin body de overrides en MVP |
| **D5** | URLs LoadMuscle inválidas → coerce a `null` (plan usable) |

## Fuera de alcance

- UI `/plan` (008).
- Edición manual / PATCH de plan.
- Session log (009), weekly iteration (010).
- Cambios de schema 006 (salvo bug bloqueante → actualizar 006 primero).
- Deploy Vercel.

## Criterios de aceptación

- [ ] `GET /api/plan` autenticado: `200` con plan activo o `data: null`.
- [ ] `POST /api/plan/generate` con perfil + Gemini configurado: valida Zod, persiste `active`, responde `201`.
- [ ] Sin perfil → error de precondición (no genera).
- [ ] Sin `GEMINI_API_KEY` → `503`; stub de “connectivity ok” eliminado del camino feliz.
- [ ] Regenerar deja un solo `active` y conserva histórico `superseded`.
- [ ] Tests Jest del contrato (Gemini mockeado; sin E2E obligatorio).
- [ ] No se implementó UI de plan ni session log.
- [ ] No se tocaron archivos fuera de API plan, `lib/ai`, helpers de plan, tests y docs de esta spec (ajustes mínimos si 006 lo exige).
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

1. Spec-006 **implemented**.
2. Extender `lib/ai/gemini.ts` (prompt + parse JSON).
3. Implementar `GET /api/plan` + reemplazar `POST /api/plan/generate`.
4. Tests con mocks.
5. Actualizar esta spec a `implemented`.

## Notas de implementación

_Rellenar al pasar a `implemented`._
