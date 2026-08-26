# SPEC-007: workout-plan-api (Gemini + persistencia)

| Campo | Valor |
|---|---|
| **Estado** | implemented |
| **Tipo** | api |
| **Fecha** | 2026-08-24 |
| **Supersede** | — (sustituye el alcance API del bloque histórico `workout-plan-engine`) |
| **Depende de** | [SPEC-006](./006-workout-plan-schema.md) (**implemented**); [SPEC-004](./004-profile-api.md) (implemented); [SPEC-002](./002-auth.md) (implemented); [ADR-001](../adr/001-tech-stack.md) (accepted) |

## Objetivo

Exponer un contrato HTTP para **generar** un plan de entrenamiento con **Gemini** a partir del **perfil** del usuario autenticado, **validarlo** con `workoutPlanContentSchema` (006), **persistirlo** en `workout_plans` como único `active`, y **leer** el plan activo.

Medible: con perfil + `GEMINI_API_KEY`, un `POST /api/plan/generate` genera, valida y guarda; un `GET /api/plan` devuelve el activo o `null`. Sustituye el stub de scaffold en `POST /api/plan/generate`. Sin UI (008).

## Comportamiento esperado

1. Endpoints de plan **protegidos**: sin sesión → `401` vía `requireUser()` / `HttpError`.
2. **`GET /api/plan`**
   - Si existe fila `status = 'active'` del usuario → `200 { data: <PlanRow> }`.
   - Si no hay plan activo → `200 { data: null }` (estado válido; UI en 008).
3. **`POST /api/plan/generate`**
   - Body vacío / `{}` (MVP: sin overrides; el perfil manda).
   - Requiere fila en `profiles` para `auth.uid()`. Sin perfil → **no** llama a Gemini; responde `404 PROFILE_REQUIRED` (D6).
   - Lee el perfil vía cliente Supabase server + sesión (**no** hardcodear perfil; **no** service role).
   - Orquestación en `lib/plans/` + llamada Gemini en `lib/ai/gemini.ts`; route handlers finos (D8).
   - Llama a Gemini (`gemini-3.6-flash`; ver notas — sustituye `gemini-2.0-flash` del scaffold, retirado por Google) con prompt que incluye al menos: `experience_level`, `training_days_per_week`, `equipment`, `injuries_notes`.
   - Exige respuesta parseable a JSON alineado a `workoutPlanContentSchema` (006).
   - **Pre-proceso:** URLs `loadmuscle_url` que no sean https válidas → **coerce a `null`** (D5) antes del parse Zod final, para no tumbar el plan entero.
   - Valida con Zod y post-valida `content.days.length === profile.training_days_per_week`. Si falla: **1 reintento** con prompt correctivo; si sigue fallando → **no** persistir y `502 GEMINI_INVALID_PLAN` (D7).
   - Persistencia (orden):
     1. Marcar plan `active` previo del usuario (si existe) como `superseded`.
     2. Insertar nueva fila `active` con `week_label` = `content.week_label`, `content` = JSON validado, `user_id` = `auth.uid()`.
   - El índice único parcial de 006 + este orden evitan dos `active`.
   - Éxito → `201 { data: <PlanRow> }` (siempre alta de fila nueva, también al regenerar).
4. Sin `GEMINI_API_KEY` → `503` `GEMINI_NOT_CONFIGURED`. **No** devolver stub/`mock: true` como éxito engañoso; se elimina el camino feliz del stub actual.
5. Fallo de red / API Gemini / respuesta inutilizable (no JSON) → `502` `GEMINI_REQUEST_FAILED`.
6. Sin config Supabase → `503` `SUPABASE_NOT_CONFIGURED` (patrón existente).
7. **No** implementa UI, PATCH de plan, ni session log.

## Entradas

### `GET /api/plan`

- **Auth:** sesión (`requireUser()`).
- **Body:** N/A.
- **Query:** N/A en MVP (solo plan activo).

### `POST /api/plan/generate`

- **Auth:** sesión (`requireUser()`).
- **Body:** vacío o `{}` (MVP). Cualquier otro shape se ignora o se rechaza con `400 VALIDATION_ERROR` si se valida body estricto vacío — preferir aceptar solo `{}` / sin body.
- **No** se acepta perfil ni overrides en el body.

## Salidas

### Forma de éxito

JSON `{ data: ... }` (mismo patrón que spec-004).

**`PlanRow`** (proyección mínima; columnas de 006):

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `string` (uuid) | |
| `user_id` | `string` (uuid) | |
| `status` | `"active"` \| `"superseded"` | En respuestas de GET activo / POST generate será `"active"` |
| `week_label` | `string` | Denormalizado; igual a `content.week_label` al insertar |
| `content` | object | Cumple `workoutPlanContentSchema` |
| `created_at` | `string` (ISO timestamptz) | |
| `updated_at` | `string` (ISO timestamptz) | |

- `GET /api/plan`: `200 { data: PlanRow | null }`
- `POST /api/plan/generate`: `201 { data: PlanRow }`

### Errores (alineados al repo)

| Status | `code` | Cuándo |
|---|---|---|
| 401 | `UNAUTHORIZED` | Sin sesión |
| 400 | `VALIDATION_ERROR` | Body generate inválido (si se valida estricto) |
| 404 | `PROFILE_REQUIRED` | Sin perfil (D6) |
| 502 | `GEMINI_REQUEST_FAILED` | Error proveedor / red / no JSON |
| 502 | `GEMINI_INVALID_PLAN` | Tras 1 reintento: Zod falla o `days.length` ≠ perfil (D7) |
| 503 | `GEMINI_NOT_CONFIGURED` | Falta `GEMINI_API_KEY` |
| 503 | `SUPABASE_NOT_CONFIGURED` | Env Supabase faltante |
| 500 | `INTERNAL_ERROR` | Otros (p. ej. fallo inesperado al persistir) |

Formato error: `{ error: { code, message } }` (igual que profile-api).

## Casos límite

- Perfil sí, plan no → GET `data: null`; POST crea el primero.
- Regenerar → anterior `active` → `superseded`; GET solo ve el nuevo; histórico no se lista en MVP.
- Gemini devuelve `days.length` ≠ `training_days_per_week` → 1 reintento; si falla → `502 GEMINI_INVALID_PLAN`; no persistir (D7).
- Gemini inventa `loadmuscle_url` http / basura → coerce a `null`; el resto del plan puede guardarse.
- Concurrencia de dos generate → índice único parcial + orden supersede→insert; si choca unicidad → normalizar a error controlado (`409 CONFLICT` o `500` documentado en notas; preferir reintentar supersede+insert una vez o fallar con mensaje claro).
- Sin key Gemini → `503`, no crash, no mock de éxito.
- Usuario autenticado no puede leer/escribir planes ajenos (RLS 006).

## UX / flujos

_N/A (spec api)._ Consumidores: spec-008 y tests Jest.

## Modelo de datos

Sin tablas nuevas. Usa:

- `public.workout_plans` (006) — insert/update vía sesión + RLS.
- `public.profiles` (003/004) — lectura del perfil del usuario.

## Integraciones

- Gemini vía `@google/generative-ai`; evolucionar `lib/ai/gemini.ts` (eliminar stub de connectivity como camino feliz).
- Supabase server client + `requireUser()`; **no** service role.
- LoadMuscle: solo campo URL en JSON; **no** scrapear ni validar catálogo.
- Zod: `workoutPlanContentSchema` desde `lib/validation/schemas/`.

## Decisiones

### Cerradas

| ID | Decisión | Cuándo |
|---|---|---|
| **D1** | `GET /api/plan` = plan activo; `POST /api/plan/generate` = generar + guardar | roadmap 2026-08-21 |
| **D2** | Regenerar = supersede del activo + insert del nuevo (historial) | roadmap 2026-08-21 |
| **D3** | `content.days.length` debe === `profiles.training_days_per_week` | roadmap 2026-08-21 |
| **D4** | Sin body de overrides en MVP | roadmap 2026-08-21 |
| **D5** | URLs LoadMuscle inválidas → coerce a `null` antes de Zod final | roadmap 2026-08-21 |
| **D6** | Sin perfil → `404 PROFILE_REQUIRED` (no llama a Gemini) | aprobado 2026-08-24 (ex-O1) |
| **D7** | Plan inválido (Zod o días ≠ perfil): 1 reintento correctivo; si falla → `502 GEMINI_INVALID_PLAN` | aprobado 2026-08-24 (ex-O2) |
| **D8** | Lógica en `lib/ai/gemini.ts` + `lib/plans/` + route handlers finos | aprobado 2026-08-24 (ex-O3) |

## Fuera de alcance

- UI `/plan` y CTAs (008).
- Edición manual / `PATCH` / `DELETE` de plan.
- Listado de histórico `superseded` (solo activo en GET).
- Session log (010), weekly iteration (011).
- Cambios de schema SQL/Zod de 006 (salvo bug bloqueante → actualizar 006 primero).
- Deploy Vercel.
- Catálogo curado LoadMuscle o scrapeo.
- Dietas / calorías.

## Criterios de aceptación

- [x] `GET /api/plan` autenticado: `200` con plan activo o `data: null`.
- [x] `POST /api/plan/generate` con perfil + Gemini configurado: valida Zod (tras coerce URL), exige `days.length` === perfil, persiste `active`, responde `201 { data: PlanRow }`.
- [x] Sin perfil → `404 PROFILE_REQUIRED`; **no** llama a Gemini.
- [x] Sin `GEMINI_API_KEY` → `503 GEMINI_NOT_CONFIGURED`; eliminado el stub de “connectivity ok” como éxito.
- [x] Regenerar deja un solo `active` y conserva filas `superseded`.
- [x] Fallos Gemini (red / no JSON / plan inválido tras 1 reintento → `GEMINI_INVALID_PLAN`) → códigos documentados; **no** persiste inválido.
- [x] Tests Jest del contrato (Gemini mockeado; sin E2E obligatorio).
- [x] No se implementó UI de plan ni session log.
- [x] No se tocaron archivos fuera de API plan, `lib/ai`, helpers de plan, tests y docs de esta spec (ajustes mínimos si 006 lo exige).
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

1. Extender/reemplazar `lib/ai/gemini.ts` (prompt + parse JSON + coerce URL + 1 reintento).
2. Añadir `lib/plans/` (orquestación: perfil → Gemini → validate → supersede + insert) y `GET /api/plan`.
3. Reemplazar `POST /api/plan/generate` (quitar stub feliz).
4. Tests con mocks de Gemini y Supabase.
5. `update-spec` → `implemented` + notas.

## Notas de implementación

- **Handlers:** `app/api/plan/route.ts` (`GET`); `app/api/plan/generate/route.ts` (`POST`, body vacío/`{}` estricto → `400 VALIDATION_ERROR` si hay keys).
- **Gemini:** `lib/ai/gemini.ts` — `generateWorkoutPlanJson` (`gemini-3.6-flash`); elimina stub/`mock: true`. Códigos `GEMINI_NOT_CONFIGURED` / `GEMINI_REQUEST_FAILED`.
- **Orquestación:** `lib/plans/generate-and-persist.ts` (perfil → generate → validate → supersede+insert); `get-active-plan.ts`; `parse-plan-content.ts` + `coerce-loadmuscle-urls.ts` (D5); tipos en `types.ts`.
- **Concurrencia:** choque de unicidad (`23505`) → reintento supersede+insert **una vez**; si vuelve a chocar → `409 CONFLICT`.
- **Tests:** `lib/ai/gemini.test.ts`, `lib/plans/*.test.ts`, `app/api/plan/route.test.ts`, `app/api/plan/generate/route.test.ts` (Gemini/Supabase mockeados).
- **Docs:** README (tabla API + sección SPEC-007); roadmap `docs/specs/README.md`.
- **Desviaciones:** ninguna funcional respecto a D1–D8. Body generate se valida estricto (`{}` o vacío), no se ignoran overrides silenciosamente. Modelo: scaffold/spec pedían `gemini-2.0-flash`; Google lo retiró (404) → `gemini-3.6-flash` (2026-08-25).
- **Pendiente:** UI en SPEC-008; aplicar migración 006 en el proyecto Supabase si aún no está.

_Aprobada 2026-08-24; implementada 2026-08-24._
