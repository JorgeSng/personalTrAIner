# Contratos API — personalTrAIner

Route Handlers de Next.js (`app/api/**`). Todas las rutas de producto exigen sesión Supabase (`requireUser`); `/api/health` es pública.

## Convenciones

- **Auth:** `requireUser()` (`lib/auth/session.ts`) → `401 UNAUTHORIZED` si no hay sesión; `503 SUPABASE_NOT_CONFIGURED` si faltan env vars.
- **Validación:** Zod en el límite (`lib/validation/schemas/`). Body inválido → `400 VALIDATION_ERROR` con el primer `issue.message`.
- **Errores:** `HttpError(status, code, message)` → respuesta `{ "error": { "code", "message" } }`. Errores inesperados → `500 INTERNAL_ERROR` con mensaje genérico (no se filtra el detalle interno).
- **Éxito:** `{ "data": ... }`.

## GET /api/health

Pública. Estado del servicio e integraciones.

**Respuesta 200:**

```json
{
  "status": "ok",
  "service": "personaltrainer",
  "integrations": {
    "supabase": "configured" | "missing",
    "gemini": "configured" | "missing"
  }
}
```

## GET /api/plan

Devuelve el plan `active` del usuario autenticado.

**Respuesta 200:** `{ "data": PlanRow | null }` — `null` si aún no hay plan.

`PlanRow`: `{ id, user_id, status: "active"|"superseded", week_label, content: WorkoutPlanContent, created_at, updated_at }`.

`WorkoutPlanContent` (Zod `workoutPlanContentSchema`):

```json
{
  "week_label": "Semana 1",
  "days": [
    {
      "day_index": 1,
      "label": "opcional",
      "exercises": [
        {
          "name": "Press banca",
          "sets": 3,
          "reps": "8-12",
          "notes": "opcional",
          "rest_between_sets_sec": 90,
          "rest_after_exercise_sec": 120,
          "loadmuscle_url": "https://loadmuscle.com/... | null"
        }
      ]
    }
  ]
}
```

**Errores:** `401`, `503 SUPABASE_NOT_CONFIGURED`, `500`.

## POST /api/plan/generate

Genera un plan con Gemini a partir del perfil del usuario, lo valida con Zod, marca el `active` anterior como `superseded` e inserta el nuevo como `active`.

**Body:** vacío o `{}` (schema `.strict()` — cualquier campo extra → `400`).

**Respuesta 201:** `{ "data": PlanRow }` (el nuevo plan activo).

**Errores:**

| Status | Code | Cuándo |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body no es JSON válido o tiene campos |
| 401 | `UNAUTHORIZED` | Sin sesión |
| 404 | `PROFILE_REQUIRED` | El usuario no tiene fila en `profiles` |
| 409 | `CONFLICT` | Carrera al activar el plan (reintenta una vez internamente) |
| 502 | `GEMINI_REQUEST_FAILED` | Gemini no responde o devuelve no-JSON |
| 502 | `GEMINI_INVALID_PLAN` | JSON inválido tras reintento con hint correctivo |
| 503 | `GEMINI_NOT_CONFIGURED` | Falta `GEMINI_API_KEY` |
| 503 | `SUPABASE_NOT_CONFIGURED` | Faltan env de Supabase |

## GET /api/profile

Devuelve el perfil del usuario.

**Respuesta 200:** `{ "data": Profile | null }` — `null` si aún no completó onboarding.

`Profile`: `{ experience_level: "beginner"|"intermediate"|"advanced", training_days_per_week: 1-7, equipment: string[], injuries_notes: string|null, ...timestamps }`.

## POST /api/profile

Crea el perfil (una sola vez; PK = `user_id`).

**Body** (`profileSchema`):

```json
{
  "experience_level": "beginner" | "intermediate" | "advanced",
  "training_days_per_week": 3,
  "equipment": ["dumbbells", "bodyweight"],
  "injuries_notes": "opcional | null"
}
```

**Respuesta 201:** `{ "data": Profile }`.

**Errores:** `400 VALIDATION_ERROR`, `401`, `409 CONFLICT` (perfil ya existe), `500`, `503`.

## PATCH /api/profile

Actualización parcial (`profilePatchSchema` = `profileSchema.partial()` con al menos un campo).

**Respuesta 200:** `{ "data": Profile }`.

**Errores:** `400`, `401`, `404 NOT_FOUND` (sin perfil), `500`, `503`.

## GET /api/sessions

Lista logs de sesión del usuario (más reciente primero).

**Query** (`workoutSessionListQuerySchema`):

- `plan_id?: uuid` — filtra por plan.
- `limit?: int` — 1–50, defecto 20 (`z.coerce`).

**Respuesta 200:** `{ "data": SessionSummary[] }` — sin ejercicios (vista resumen).

`SessionSummary`: `{ id, user_id, plan_id, day_index, performed_on, notes|null, created_at, updated_at }`.

**Errores:** `400` (query inválida), `401`, `500`, `503`.

## POST /api/sessions

Crea una sesión + sus ejercicios (una fila por ejercicio).

**Body** (`workoutSessionCreateSchema`):

```json
{
  "plan_id": "uuid",
  "day_index": 1,
  "performed_on": "YYYY-MM-DD",
  "notes": "opcional | null",
  "exercises": [
    {
      "exercise_name": "Press banca",
      "exercise_order": 0,
      "sets_completed": 3,
      "weight_kg": 60,
      "reps": "10,10,8"
    }
  ]
}
```

- `exercises`: mínimo 1.
- `weight_kg`: `number >= 0 | null` (null = peso corporal).
- `reps`: string libre (p. ej. `"10,10,8"` por serie).

El servidor verifica que `plan_id` pertenece al usuario antes de insertar.

**Respuesta 201:** `{ "data": SessionDetail }` — sesión + `exercises[]` ordenados por `exercise_order`.

**Errores:** `400`, `401`, `404 PLAN_NOT_FOUND`, `500`, `503`.

## GET /api/sessions/[id]

Detalle de una sesión con ejercicios.

**Respuesta 200:** `{ "data": SessionDetail }`.

**Errores:** `400 VALIDATION_ERROR` (id no UUID), `401`, `404 SESSION_NOT_FOUND`, `500`, `503`.

## Mapa de errores común

| Code | Status | Origen típico |
|---|---|---|
| `UNAUTHORIZED` | 401 | `requireUser` sin sesión |
| `VALIDATION_ERROR` | 400 | Zod en body/query/params |
| `NOT_FOUND` | 404 | Recurso inexistente o de otro usuario (RLS) |
| `CONFLICT` | 409 | PK/índice único (`profiles`, plan activo) |
| `SUPABASE_NOT_CONFIGURED` | 503 | Faltan `NEXT_PUBLIC_SUPABASE_*` |
| `GEMINI_NOT_CONFIGURED` | 503 | Falta `GEMINI_API_KEY` |
| `GEMINI_REQUEST_FAILED` / `GEMINI_INVALID_PLAN` | 502 | Fallo o JSON inválido de Gemini |
| `INTERNAL_ERROR` | 500 | Catch-all |
