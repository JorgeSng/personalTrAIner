# personalTrAIner

Entrenador personal con IA para recomposición corporal — alcance personal.

Stack definido en [docs/adr/001-tech-stack.md](./docs/adr/001-tech-stack.md).

## Requisitos

- Node.js 20+
- npm

## Primer arranque

```bash
cp .env.example .env.local
# Rellenar NEXT_PUBLIC_SUPABASE_* (obligatorio para login). GEMINI_API_KEY opcional.

npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Sin sesión te redirige a `/login`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir build |
| `npm test` | Jest (unit + smoke) |
| `npm run lint` | ESLint |

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio e integraciones |
| GET | `/api/plan` | Plan activo del usuario (`data: null` si aún no hay) |
| POST | `/api/plan/generate` | Genera plan con Gemini, valida Zod y persiste como `active` |

## Autenticación (local)

Supabase Auth (email + password). Las tablas futuras usarán `auth.uid()` (RLS).

1. En [Supabase](https://supabase.com/dashboard) → **Authentication** → **URL configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`
2. **Providers** → Email: desactivar **Confirm email** para el happy path local (esta app no tiene UI de confirmación ni de reset).
3. Crear el usuario desde `/login` → **Crear cuenta**, o a mano en Authentication → Users.
4. Rellenar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`. No hace falta service role.

`GET /api/health` es público. El resto de páginas y las APIs de producto (`/api/plan`, `/api/profile`, …) exigen sesión. Sin `GEMINI_API_KEY`, `POST /api/plan/generate` responde `503 GEMINI_NOT_CONFIGURED` (no hay stub de éxito).

## Perfil (SPEC-003)

Tabla `public.profiles` (1:1 con `auth.users`) con RLS por `auth.uid()`. Sin fila = usuario aún sin onboarding.

### Aplicar migración

1. Abre [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto → **SQL Editor**.
2. Copia y ejecuta el contenido de [`supabase/migrations/20260817140000_create_profiles.sql`](./supabase/migrations/20260817140000_create_profiles.sql).
3. Comprueba en **Table Editor** que existe `profiles` con las columnas del MVP.

Si el proyecto tiene desactivado «Automatically expose new tables», el `GRANT` de la migración es necesario para que la API vea la tabla.

### Verificar RLS (manual)

Con un usuario autenticado en la app (sesión activa en el navegador):

1. En **SQL Editor**, ejecuta como referencia (sustituye el UUID por tu `auth.users.id`):

```sql
-- Debe devolver 0 filas si aún no hay perfil (estado válido)
SELECT * FROM public.profiles WHERE user_id = auth.uid();
```

2. Desde la app o con el cliente Supabase autenticado (anon key + sesión), inserta tu fila:

```sql
INSERT INTO public.profiles (user_id, experience_level, training_days_per_week, equipment)
VALUES (
  auth.uid(),
  'beginner',
  3,
  ARRAY['dumbbells']
);
```

3. Comprueba que solo ves tu fila y que un segundo `INSERT` con el mismo `user_id` falla por PK.

No uses `SUPABASE_SERVICE_ROLE_KEY` para estas pruebas; la verificación debe reflejar el acceso real del cliente autenticado.

## Plan de entrenamiento (SPEC-006)

Tabla `public.workout_plans` (historial por usuario; como máximo un plan `active`). El JSON de `content` se valida en app con `workoutPlanContentSchema` (Zod). Sin filas = aún no se ha generado plan (UI en SPEC-008).

### Aplicar migración

1. Abre [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto → **SQL Editor**.
2. Copia y ejecuta el contenido de [`supabase/migrations/20260824120000_create_workout_plans.sql`](./supabase/migrations/20260824120000_create_workout_plans.sql) (después de haber aplicado la migración de `profiles`).
3. Comprueba en **Table Editor** que existe `workout_plans` con `status`, `week_label`, `content` y timestamps.

Si el proyecto tiene desactivado «Automatically expose new tables», el `GRANT` de la migración es necesario para que la API vea la tabla.

### Verificar RLS e índice activo (manual)

Con un usuario autenticado (sesión activa):

1. Comprueba que no hay filas (estado válido):

```sql
SELECT * FROM public.workout_plans WHERE user_id = auth.uid();
```

2. Inserta un plan activo (sustituye el JSON de ejemplo si hace falta):

```sql
INSERT INTO public.workout_plans (user_id, status, week_label, content)
VALUES (
  auth.uid(),
  'active',
  'Semana 1',
  '{"week_label":"Semana 1","days":[{"day_index":1,"exercises":[{"name":"Press banca","sets":3,"reps":"8-12"}]}]}'::jsonb
);
```

3. Un segundo `INSERT` con `status = 'active'` para el mismo usuario debe fallar por el índice único parcial. Marca el anterior como `superseded` antes de insertar otro activo (flujo de SPEC-007).

## Log de sesión (SPEC-010)

Tablas `public.workout_sessions` y `public.workout_session_exercises` (una fila por ejercicio hecho en la sesión). RLS por `auth.uid()` en la sesión; ejercicios vía `EXISTS` a sesión propia. Validación en app con `workoutSessionSchema` / `workoutSessionExerciseSchema` / `workoutSessionCreateSchema` (Zod). Sin filas = aún no se ha registrado sesión (API/UI en SPEC-011/012).

### Aplicar migración

1. Abre [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto → **SQL Editor**.
2. Copia y ejecuta el contenido de [`supabase/migrations/20260827120000_create_workout_sessions.sql`](./supabase/migrations/20260827120000_create_workout_sessions.sql) (después de haber aplicado la migración de `workout_plans`).
3. Comprueba en **Table Editor** que existen `workout_sessions` y `workout_session_exercises` con las columnas del MVP.

Si el proyecto tiene desactivado «Automatically expose new tables», el `GRANT` de la migración es necesario para que la API (011) vea las tablas.

### Verificar RLS (manual)

Con un usuario autenticado y al menos un plan propio (`workout_plans.id`):

1. Comprueba que no hay sesiones (estado válido):

```sql
SELECT * FROM public.workout_sessions WHERE user_id = auth.uid();
```

2. Inserta una sesión + un ejercicio (sustituye el UUID del plan):

```sql
INSERT INTO public.workout_sessions (user_id, plan_id, day_index, performed_on)
VALUES (auth.uid(), '<plan_id>', 1, CURRENT_DATE)
RETURNING id;

INSERT INTO public.workout_session_exercises (
  session_id, exercise_name, exercise_order, sets_completed, weight_kg, reps
)
VALUES (
  '<session_id>',
  'Press banca',
  0,
  3,
  60,
  '10,10,8'
);
```

3. Comprueba que solo ves tus filas. `weight_kg` puede ser `NULL` (peso corporal). No hay política `DELETE` en MVP.

## Generación de plan (SPEC-007)

Con sesión + perfil + `GEMINI_API_KEY`:

1. `POST /api/plan/generate` (body vacío o `{}`) genera el plan con Gemini, valida `workoutPlanContentSchema`, exige `days.length === training_days_per_week`, supersedea el `active` previo e inserta el nuevo.
2. `GET /api/plan` devuelve el plan `active` o `{ data: null }`.

Sin perfil → `404 PROFILE_REQUIRED`. Sin key → `503 GEMINI_NOT_CONFIGURED`. UI en SPEC-008.

## Variables de entorno

Ver [.env.example](./.env.example).

## Desarrollo (SDD)

| Recurso | Descripción |
|---|---|
| [AGENTS.md](./AGENTS.md) | Manifiesto del agente y flujo SDD |
| [docs/specs/](./docs/specs/) | Specs de features |
| [docs/adr/](./docs/adr/) | Decisiones de arquitectura |
| [.cursor/rules/](./.cursor/rules/) | Reglas Cursor |

### Flujo rápido

1. Idea → spec en `draft`
2. Revisión → `approved`
3. Implementar → `implemented`

## Deploy (futuro)

Cuando login + Supabase funcionen en local:

1. Proyecto en [Vercel](https://vercel.com) conectado al repo
2. Mismas env vars que `.env.local`
3. En Supabase Auth → URL redirects con dominio Vercel

## Repo

[github.com/JorgeSng/personalTrAIner](https://github.com/JorgeSng/personalTrAIner)
