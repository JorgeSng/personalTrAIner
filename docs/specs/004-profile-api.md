# SPEC-004: profile-api (Route Handlers perfil)

| Campo | Valor |
|---|---|
| **Estado** | implemented |
| **Tipo** | api |
| **Fecha** | 2026-08-19 |
| **Supersede** | — |
| **Depende de** | [SPEC-003](./003-profile-schema.md) (approved) |

## Objetivo

Exponer un contrato HTTP para leer/crear/actualizar el perfil del usuario autenticado, persistido en `public.profiles` (RLS) usando `auth.uid()` y validación Zod.

## Comportamiento esperado

1. Los endpoints de perfil son **protegidos**: sin sesión se responde `401` vía `HttpError` y `requireUser()`.
2. **`GET /api/profile`**
   - Si existe fila en `public.profiles` para el usuario autenticado: responde `200` con `{ data: <perfil> }`.
   - Si **no** existe fila: responde `200` con `{ data: null }` (ausencia válida; onboarding en spec-005).
3. **`POST /api/profile`**
   - Valida el body con Zod.
   - Inserta una fila en `public.profiles` para `user_id = auth.uid()` (el cliente **no** envía `user_id`).
   - Si ya existe fila para el usuario: responde `409` (conflicto por PK/1:1).
4. **`PATCH /api/profile`**
   - Valida el body con Zod como **parcial**.
   - Requiere que el body contenga **al menos un campo** a actualizar.
   - Actualiza la fila de `public.profiles` del usuario autenticado.
   - Si no existe fila: responde `404`.
5. **Validación / errores**
   - Body inválido en `POST`/`PATCH` responde `400` con `code = "VALIDATION_ERROR"`.
   - Error de configuración Supabase (env faltante) responde `503` con `code = "SUPABASE_NOT_CONFIGURED"` (de la lógica existente).
6. **No cambia** auth (spec-002) ni implementa UI/onboarding (spec-005). Esta spec solo define Route Handlers y su contrato.

## Entradas

### `GET /api/profile`

- **Auth:** sesión Supabase (requiere `requireUser()`).
- **Body:** N/A.
- **Headers:** N/A.

### `POST /api/profile`

- **Auth:** sesión Supabase (requiere `requireUser()`).
- **Body JSON (Zod — `profileSchema`):**
  - `experience_level`: `"beginner" | "intermediate" | "advanced"`
  - `training_days_per_week`: número entero `1..7`
  - `equipment`: array de strings, longitud `>= 1`, cada string `min(1)`
  - `injuries_notes`: `string | null` (opcional/nullable según schema)
- **No se acepta** `user_id` en el body (se deriva de `auth.uid()`).

### `PATCH /api/profile`

- **Auth:** sesión Supabase (requiere `requireUser()`).
- **Body JSON (Zod — parcial):**
  - Los mismos campos que en `POST`, pero todos **opcionales**.
  - Requisito: el body debe incluir **al menos un campo** para actualizar.
  - `injuries_notes` puede setearse a `null` (si se incluye en el body).
- **No se acepta** `user_id` en el body (se deriva de `auth.uid()`).

## Salidas

### Formato de éxito

Para todos los endpoints:
- Respuesta JSON con la forma `{ data: ... }`.

Específicamente:
- `GET /api/profile`:
  - `200 { data: <perfil> }` si existe fila.
  - `200 { data: null }` si no existe fila.
- `POST /api/profile`:
  - `201 { data: <perfil> }` al insertar.
- `PATCH /api/profile`:
  - `200 { data: <perfil actualizado> }` al actualizar.

### Formato de error (consistente con repo)

- `401` sin sesión:
  - `{ error: { code: "UNAUTHORIZED", message: "..." } }`
- `503` sin configuración Supabase:
  - `{ error: { code: "SUPABASE_NOT_CONFIGURED", message: "..." } }`
- `400` validación Zod:
  - `{ error: { code: "VALIDATION_ERROR", message: "..." } }`
- `404` en `PATCH` si no existe fila:
  - `{ error: { code: "NOT_FOUND", message: "..." } }`
- `409` en `POST` si existe ya fila:
  - `{ error: { code: "CONFLICT", message: "..." } }`
- Otros errores:
  - `500` con `code = "INTERNAL_ERROR"`.

## Casos límite

- `PATCH` con body vacío `{}` → `400` con `VALIDATION_ERROR`.
- `POST`/`PATCH` con `equipment: []` o strings vacíos → `400`.
- `training_days_per_week` fuera de `1..7` → `400`.
- `POST` duplicado por concurrencia: puede devolver `409` o un error de unicidad; el handler debe normalizar a `409`.
- `PATCH` sobre usuario sin fila: `404`.

## UX / flujos

_N/A (api)._

## Modelo de datos

- Tabla: `public.profiles`
- Claves/políticas: 1:1 por `user_id` (PK y FK a `auth.users`) y RLS por `auth.uid()`.
- El handler no usa service role; opera como usuario autenticado (anon key + sesión).

## Integraciones

- `requireUser()` en `lib/auth/session.ts`.
- Validación con Zod usando el schema ya acordado:
  - `profileSchema` desde `lib/validation/schemas/profile.ts` (reexport en `lib/validation/schemas/index.ts`).
- Lectura/escritura en Supabase desde Route Handler vía `createClient` (server).

## Fuera de alcance

- Onboarding/UI (spec-005).
- Motor de plan / Gemini / LoadMuscle.
- Cambios en auth.
- Migraciones Supabase (spec-003).
- Uso de `SUPABASE_SERVICE_ROLE_KEY`.

## Criterios de aceptación

- [x] Existen Route Handlers para `GET`, `POST` y `PATCH` en el endpoint de perfil (`app/api/profile/route.ts`).
- [x] Todas las rutas llaman a `requireUser()`; sin sesión devuelve `401` con `code = "UNAUTHORIZED"`.
- [x] `GET` devuelve:
  - `200 { data: null }` si no existe fila
  - `200 { data: <perfil> }` si existe
- [x] `POST` valida con Zod (`profileSchema`) y:
  - inserta para `user_id = auth.uid()`
  - responde `201 { data: <perfil> }`
  - si ya existe fila: responde `409` (`code = "CONFLICT"`)
- [x] `PATCH` valida como parcial:
  - body vacío o sin campos → `400 VALIDATION_ERROR`
  - actualiza la fila del usuario autenticado
  - si no existe fila → `404 NOT_FOUND`
- [x] Los errores de validación devuelven `400` con formato `{ error: { code: "VALIDATION_ERROR", message: "..." } }`.
- [x] Tests Jest para los handler/contrato (sin E2E): casos happy + errores (401, 400, 404/409).
- [x] No se tocaron archivos fuera de las rutas de API, lib/schemas y tests necesarios para esta spec.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

1. Crear Route Handler `app/api/profile/route.ts` con `GET`/`POST`/`PATCH`.
2. Reusar `profileSchema` y crear el esquema de `PATCH` (parcial + al menos 1 campo).
3. Consultas Supabase (select/insert/update) usando `user.id` derivado de `requireUser()`.
4. Normalizar errores a los códigos definidos (401/400/404/409/503).
5. Añadir tests Jest para el contrato.
6. Actualizar la spec a `approved` solo tras revisión y conformidad con el contrato.

## Notas de implementación

- **Handlers:** `app/api/profile/route.ts` — `GET`/`POST`/`PATCH`; `requireUser()` + `createClient()` (server, anon key + sesión); sin service role.
- **Zod:** `profileSchema.strip()` (campos extra, incluido `user_id`, se ignoran; `user_id` siempre sale de `auth.uid()`). `profilePatchSchema` = parcial + al menos un campo; reexport en `lib/validation/schemas/index.ts`.
- **Errores:** `401 UNAUTHORIZED` / `503 SUPABASE_NOT_CONFIGURED` vía `HttpError` existente; `400 VALIDATION_ERROR`; `404 NOT_FOUND` en PATCH sin fila; `409 CONFLICT` si insert choca con PK (`23505` o mensaje de unicidad).
- **Tests:** `app/api/profile/route.test.ts` (contrato HTTP) y ampliación de `lib/validation/schemas/profile.test.ts`. Segunda pasada de calidad (2026-08-20): JSON inválido → 400; error Supabase en GET → 500; 409 por mensaje de unicidad; PATCH `equipment: []` → 400.
- **Desviaciones:** ninguna de alcance. Decisión de diseño (2026-08-20): opción B — strip de `user_id`/campos extra, no `strict()`.
- **Deuda:** Extraer `toErrorResponse` compartido con otros handlers y logs de error de Supabase quedan fuera de alcance (preguntar si se quieren).

