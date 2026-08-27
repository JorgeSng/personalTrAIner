# SPEC-011: session-log-api (Route Handlers crear/leer)

| Campo | Valor |
|---|---|
| **Estado** | implemented |
| **Tipo** | api |
| **Fecha** | 2026-08-27 |
| **Supersede** | — (capa API del desglose session-log 010 → 011 → 012) |
| **Depende de** | [SPEC-010](./010-session-log-schema.md) (**implemented**); [SPEC-006](./006-workout-plan-schema.md) (implemented — ownership de `plan_id`); [SPEC-002](./002-auth.md) (implemented) |

## Objetivo

Exponer un contrato HTTP para **crear** y **leer** logs de sesión de entrenamiento (sesión + ejercicios peso × reps) del usuario autenticado, persistidos en `workout_sessions` / `workout_session_exercises` (010) con validación Zod y RLS.

Medible: con sesión + un `plan_id` propio, `POST /api/sessions` crea la sesión con ≥1 ejercicio; `GET /api/sessions` lista las propias; `GET /api/sessions/[id]` devuelve detalle con ejercicios. **Sin UI** (012).

## Comportamiento esperado

1. Endpoints **protegidos**: sin sesión → `401` vía `requireUser()` / `HttpError`.
2. **`POST /api/sessions`**
   - Valida body con `workoutSessionCreateSchema` (010): `plan_id`, `day_index`, `performed_on`, `notes?`, `exercises` (min 1).
   - `user_id` **siempre** de `auth.uid()` (no se acepta en body; strip).
   - Verifica que `plan_id` exista y pertenezca al usuario (cualquier `status`: `active` o `superseded`). Si no → `404 PLAN_NOT_FOUND` (**D4**).
   - Inserta fila en `workout_sessions` y luego las filas en `workout_session_exercises` (misma sesión) (**D6**).
   - Éxito → `201 { data: <SessionDetail> }` (sesión + `exercises` ordenados por `exercise_order`).
3. **`GET /api/sessions`**
   - Lista sesiones **propias**, orden `performed_on DESC`, luego `created_at DESC`.
   - Query opcional `plan_id` (uuid): filtra por ese plan (solo si es propio vía RLS; si uuid inválido → `400`).
   - Query opcional `limit` (entero, default **20**, máx **50**) (**D5**).
   - Respuesta: `200 { data: <SessionSummary[]> }` **sin** array de ejercicios anidados (detalle en GET by id).
4. **`GET /api/sessions/[id]`**
   - Si la sesión es propia → `200 { data: <SessionDetail> }` (incluye `exercises`).
   - Si no existe o no es propia (RLS) → `404 SESSION_NOT_FOUND`.
5. **Sin** `PATCH` / `DELETE` en MVP (**D2**). Sin listado de ejercicios ajenos a una sesión.
6. Sin config Supabase → `503 SUPABASE_NOT_CONFIGURED`. Body inválido → `400 VALIDATION_ERROR`.
7. **No** implementa UI, weekly-iteration, Gemini ni cambios de schema/migración.

## Entradas

### `POST /api/sessions`

- **Auth:** sesión (`requireUser()`).
- **Body JSON** (`workoutSessionCreateSchema`):

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `plan_id` | uuid string | sí | Debe ser plan del usuario |
| `day_index` | int `1..7` | sí | Día del plan |
| `performed_on` | string `YYYY-MM-DD` | sí | Fecha local del cliente |
| `notes` | string \| null | no | |
| `exercises` | array min 1 | sí | Ver abajo |

Cada elemento de `exercises` (`workoutSessionExerciseSchema`):

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `exercise_name` | string min 1 | sí | Snapshot |
| `exercise_order` | int ≥ 0 | sí | |
| `sets_completed` | int ≥ 1 | sí | |
| `weight_kg` | number ≥ 0 \| null | no | null = peso corporal |
| `reps` | string min 1 | sí | p. ej. `"10"`, `"10,10,8"` |

### `GET /api/sessions`

- **Auth:** sesión.
- **Query:**
  - `plan_id` (opcional, uuid)
  - `limit` (opcional, int; default 20; máx 50)

### `GET /api/sessions/[id]`

- **Auth:** sesión.
- **Path:** `id` = uuid de `workout_sessions`.
- **Body:** N/A.

## Salidas

### Forma de éxito

JSON `{ data: ... }` (patrón 004/007).

**`SessionSummary`** (lista):

| Campo | Tipo |
|---|---|
| `id` | uuid string |
| `user_id` | uuid string |
| `plan_id` | uuid string |
| `day_index` | number |
| `performed_on` | string (`YYYY-MM-DD`) |
| `notes` | string \| null |
| `created_at` | string ISO timestamptz |
| `updated_at` | string ISO timestamptz |

**`SessionExercise`:**

| Campo | Tipo |
|---|---|
| `id` | uuid string |
| `session_id` | uuid string |
| `exercise_name` | string |
| `exercise_order` | number |
| `sets_completed` | number |
| `weight_kg` | number \| null |
| `reps` | string |
| `created_at` | string ISO |
| `updated_at` | string ISO |

**`SessionDetail`:** `SessionSummary` + `exercises: SessionExercise[]` (ordenados por `exercise_order` asc).

- `POST /api/sessions` → `201 { data: SessionDetail }`
- `GET /api/sessions` → `200 { data: SessionSummary[] }` (array vacío si no hay filas)
- `GET /api/sessions/[id]` → `200 { data: SessionDetail }`

### Errores

| Status | `code` | Cuándo |
|---|---|---|
| 401 | `UNAUTHORIZED` | Sin sesión |
| 400 | `VALIDATION_ERROR` | Body/query inválidos (Zod / `limit` / uuid) |
| 404 | `PLAN_NOT_FOUND` | `plan_id` inexistente o de otro usuario (POST) |
| 404 | `SESSION_NOT_FOUND` | Sesión inexistente o no propia (GET by id) |
| 503 | `SUPABASE_NOT_CONFIGURED` | Env Supabase faltante |
| 500 | `INTERNAL_ERROR` | Fallo inesperado al persistir/leer |

Formato: `{ error: { code, message } }`.

## Casos límite

- Usuario sin sesiones → `GET` lista `[]` (válido).
- `POST` con `exercises: []` → `400 VALIDATION_ERROR`.
- `weight_kg: null` → permitido (peso corporal).
- `plan_id` de plan `superseded` propio → **permitido** (logs históricos / re-log; 010).
- `plan_id` ajeno o inexistente → `404 PLAN_NOT_FOUND` (no filtrar solo por RLS del insert de sesión).
- `GET /api/sessions/[id]` de otro usuario → `404` (RLS no devuelve fila).
- `limit` > 50 → `400` o clamp a 50 — **preferir `400 VALIDATION_ERROR`**.
- Fallo a mitad de inserts (sesión ok, exercises no) → `500`; sin `DELETE` en MVP no se limpia la sesión huérfana (**D6**; documentar; raro si RLS/GRANT ok).
- No validar en MVP que `day_index` exista en el JSON `content` del plan (solo rango 1..7 vía Zod).

## UX / flujos

_N/A (api)._ Consumidores: spec-012 y tests Jest.

## Modelo de datos

Sin tablas nuevas. Usa 010:

- `public.workout_sessions`
- `public.workout_session_exercises`
- Lectura de `public.workout_plans` solo para ownership de `plan_id` en POST.

Cliente Supabase **server** + sesión; **no** service role.

## Integraciones

- `requireUser()` (`lib/auth/session.ts`).
- Zod: `workoutSessionCreateSchema` (y schemas 010) desde `lib/validation/schemas/`.
- Helpers en `lib/sessions/` (handlers finos, patrón `lib/plans/`) (**D7**).
- **No** Gemini, **no** LoadMuscle.

## Decisiones (cerradas 2026-08-27)

| ID | Decisión |
|---|---|
| **D1** | Rutas: `/api/sessions` + `/api/sessions/[id]` |
| **D2** | Métodos MVP: solo POST + GET (lista + detalle); sin PATCH/DELETE |
| **D3** | Create: un POST con sesión + `exercises` (`workoutSessionCreateSchema`) |
| **D4** | `plan_id` propio, cualquier status (`active` o `superseded`) |
| **D5** | Lista ligera (sin exercises); detalle con exercises en GET by id; `limit` default 20 / máx 50 |
| **D6** | Persistencia: insert sesión + bulk exercises (sin RPC); riesgo huérfano documentado |
| **D7** | Helpers en `lib/sessions/` + Route Handlers finos |

## Fuera de alcance

- UI / formularios desde `/plan` (**012**).
- Weekly iteration (**013**).
- `PATCH` / `DELETE` de sesiones o ejercicios.
- Paginación cursor / infinite scroll.
- Validar `day_index` contra `content.days` del plan.
- Gráficos, export CSV, edición masiva.
- Cambios a migraciones / RLS / Zod de dominio de 010 (salvo reexports o schemas de query mínimos).
- Auth, perfil, generación de plan, Gemini.

## Criterios de aceptación

- [x] Existen Route Handlers: `POST`/`GET` en `/api/sessions` y `GET` en `/api/sessions/[id]`.
- [x] Todas las rutas llaman a `requireUser()`; sin sesión → `401 UNAUTHORIZED`.
- [x] `POST` valida con `workoutSessionCreateSchema`; inserta sesión + ejercicios; exige plan propio; responde `201 { data: SessionDetail }`.
- [x] `GET` lista → `200 { data: SessionSummary[] }` con `limit`/`plan_id` opcionales; array vacío válido.
- [x] `GET` by id → `200 SessionDetail` o `404 SESSION_NOT_FOUND`.
- [x] Errores: `400 VALIDATION_ERROR`, `404 PLAN_NOT_FOUND` / `SESSION_NOT_FOUND`, `503 SUPABASE_NOT_CONFIGURED`, formato `{ error: { code, message } }`.
- [x] Tests Jest del contrato HTTP (happy + 401/400/404; mocks Supabase; sin E2E).
- [x] No UI ni weekly-iteration; no migraciones nuevas; no service role.
- [x] No se tocaron archivos fuera de routes, `lib/sessions/` (o equivalente), tests y docs/roadmap de esta spec.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

1. ~~Confirmar decisiones D1–D7 → `approved`.~~ (hecho 2026-08-27)
2. ~~Helpers `lib/sessions/` (create, list, getById + ownership de plan).~~
3. ~~Route Handlers + wiring errores.~~
4. ~~Tests Jest del contrato.~~
5. ~~Actualizar README breve (endpoints) si hace falta.~~
6. ~~Spec → `implemented`; seguir con **012**.~~

## Notas de implementación

- Draft creado con `write-spec` 2026-08-27.
- **Aprobada** por el usuario 2026-08-27 (D1–D7 = opción A en todas).
- **Implementada** 2026-08-27 con `implement-from-spec`.
- Archivos:
  - `app/api/sessions/route.ts` — `GET` lista + `POST` create
  - `app/api/sessions/[id]/route.ts` — `GET` detalle
  - `lib/sessions/` — `create-session`, `list-sessions`, `get-session-by-id`, `map-session`, `types`
  - `lib/validation/schemas/workout-session.ts` — `workoutSessionListQuerySchema` (query mínimo 011)
  - Tests: `app/api/sessions/**/*.test.ts`, `lib/sessions/*.test.ts`
  - `README.md` — tabla API
- Desviaciones: ninguna. Persistencia D6 (insert sesión + bulk exercises; si falla el segundo → `500`, sesión huérfana posible sin `DELETE` en MVP).
- `weight_kg` numérico de Postgres se normaliza a `number` en el mapper.
