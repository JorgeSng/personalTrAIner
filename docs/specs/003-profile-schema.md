# SPEC-003: Profile schema (tabla, RLS, Zod)

| Campo | Valor |
|---|---|
| **Estado** | approved |
| **Tipo** | infra |
| **Fecha** | 2026-08-17 |
| **Supersede** | — (bloque histórico `003-onboarding-profile`, no llegó a existir como archivo) |
| **Depende de** | [SPEC-002](./002-auth.md) (implemented); [ADR-001](../adr/001-tech-stack.md) (accepted) |

## Objetivo

Existir en Supabase una tabla **`public.profiles`** (1:1 con `auth.users`) con **RLS** por `auth.uid()`, más un **esquema Zod** en el repo que refleje los campos acordados. Medible: migración aplicable sin error; un usuario autenticado solo puede leer/escribir su fila vía cliente Supabase con anon key + sesión (verificación manual o script documentado).

Esta spec entrega **solo la capa de datos**. Sin Route Handlers (spec-004) ni pantallas (spec-005).

## Comportamiento esperado

1. Tras aplicar la migración en el proyecto Supabase del usuario, existe `public.profiles` con las columnas de **Modelo de datos**.
2. **RLS activado** en `profiles`. Sin políticas válidas → ningún acceso vía API de datos.
3. Políticas mínimas para rol **`authenticated`**:
   - `SELECT` filas donde `user_id = auth.uid()`
   - `INSERT` solo si `user_id = auth.uid()`
   - `UPDATE` filas donde `user_id = auth.uid()`
   - **Sin política `DELETE`** (MVP).
4. **`GRANT`** explícito a `authenticated` sobre `profiles` (necesario si «Automatically expose new tables» está desactivado en el proyecto).
5. En el repo: archivo SQL en `supabase/migrations/` + `profileSchema` / tipos Zod en `lib/validation/schemas/` + tests Jest del Zod (sin E2E).
6. Trigger **`BEFORE UPDATE`** mantiene `updated_at`.
7. **No** cambia auth (002), **no** añade rutas HTTP, **no** cambia la home actual.

## Entradas

_N/A (spec infra). La migración SQL es el artefacto de entrada al aplicar en Supabase._

## Salidas

_N/A (spec infra)._

## Casos límite

- Usuario sin fila en `profiles` → no error de esquema; ausencia de fila es estado válido (onboarding en spec-005).
- Intento de `INSERT` con `user_id` ≠ `auth.uid()` → rechazado por RLS.
- Intento de leer/actualizar fila ajena → cero filas / error de permiso según cliente.
- Segundo `INSERT` para el mismo `user_id` → fallo por PK/unicidad (1:1).
- Migración ya aplicada → no editar el mismo archivo; nueva migración incremental (convención api-conventions).
- Proyecto sin «expose new tables» → sin `GRANT`, la API no ve la tabla aunque RLS exista.
- `equipment` array vacío → rechazado en Zod (spec-003); validación DB opcional con `CHECK (cardinality(equipment) > 0)`.

## UX / flujos

_N/A (spec infra). Sin pantallas ni redirects en esta spec._

## Modelo de datos

### Relación

```
auth.users (1) ────── (0..1) public.profiles
     id          PK/FK   user_id
```

- **`user_id`**: UUID, **PRIMARY KEY**, `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` (un perfil por usuario; sin columna `id` aparte).

### Columnas (MVP acordado)

| Campo | Tipo SQL | Obligatorio | Reglas |
|---|---|---|---|
| `user_id` | `uuid` | sí | PK; FK → `auth.users(id)` |
| `experience_level` | `text` | sí | Valores: `beginner`, `intermediate`, `advanced` (+ `CHECK` en DB) |
| `training_days_per_week` | `smallint` | sí | Entero 1–7 (+ `CHECK` en DB) |
| `equipment` | `text[]` | sí | Al menos un elemento no vacío |
| `injuries_notes` | `text` | no | Texto libre; nullable |
| `created_at` | `timestamptz` | sí | Default `now()` |
| `updated_at` | `timestamptz` | sí | Default `now()`; trigger `BEFORE UPDATE` |

**Fuera del MVP de campos:** edad, peso, sexo, horarios, objetivo explícito, fotos, dietas.

### RLS

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### GRANT (si no auto-expose)

```sql
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
```

### Zod (repo)

- Archivo: `lib/validation/schemas/profile.ts` (export vía `lib/validation/schemas/index.ts`).
- `experienceLevelSchema`: `z.enum(["beginner", "intermediate", "advanced"])`.
- `trainingDaysPerWeek`: `z.number().int().min(1).max(7)`.
- `equipment`: `z.array(z.string().min(1)).min(1)`.
- `injuriesNotes`: `z.string().optional()` o nullable.
- Spec-004 reutilizará este schema; no duplicar validación.

### Migración (repo)

- Ruta: `supabase/migrations/YYYYMMDDHHMMSS_create_profiles.sql`.
- README: instrucción para aplicar en SQL Editor (primera vez) o Supabase CLI si se adopta después.

## Integraciones

- **Supabase Postgres** + **Auth** (`auth.uid()` en políticas).
- Clientes existentes (`lib/supabase/server.ts`, `client.ts`) — solo para verificación manual; sin código de producto nuevo salvo Zod + SQL.
- Sin Gemini, LoadMuscle, service role.

## Decisiones cerradas

Aprobadas por el usuario (2026-08-17), **pack A**:

| ID | Decisión |
|---|---|
| D1 | Pack mínimo: `experience_level`, `training_days_per_week`, `equipment`, `injuries_notes` (opcional) |
| D2 | `user_id` como PRIMARY KEY (sin columna `id` aparte) |
| D3 | `equipment` como `text[]` |
| D4 | Migración SQL versionada en `supabase/migrations/` |
| D5 | Trigger `BEFORE UPDATE` para `updated_at` |
| D6 | Sin política DELETE; cascade al borrar `auth.users` |

## Fuera de alcance

- Route Handlers perfil (spec-**004**).
- Onboarding, formularios, redirects (spec-**005**).
- Motor de plan, tablas `workout_plans`, logs (spec-**006+**).
- LoadMuscle, Gemini.
- `SUPABASE_SERVICE_ROLE_KEY`.
- Cambios en auth / `proxy.ts` (salvo doc).
- Pantallas o copy de UI.
- Seed de datos de demo en SQL.

## Criterios de aceptación

- [ ] Migración SQL aplicable crea `public.profiles` con columnas del MVP acordado.
- [ ] RLS habilitado; políticas SELECT/INSERT/UPDATE own-row para `authenticated`; sin DELETE.
- [ ] `GRANT SELECT, INSERT, UPDATE` para `authenticated` documentado/aplicado.
- [ ] PK = `user_id`; FK a `auth.users` con `ON DELETE CASCADE`.
- [ ] CHECK en DB para `experience_level` y `training_days_per_week` (recomendado).
- [ ] Trigger `updated_at` en UPDATE.
- [ ] Esquema Zod en `lib/validation/schemas/profile.ts` alineado con columnas.
- [ ] Tests Jest del Zod (enums, 1–7 días, equipment no vacío, injuries opcional).
- [ ] README: cómo aplicar la migración en Supabase local.
- [ ] Verificación documentada: usuario autenticado inserta/lee su fila; no lee filas ajenas.
- [ ] No se implementaron rutas `/api/profile` ni UI de onboarding.
- [ ] No se tocaron archivos fuera de migración, Zod, tests, docs de esta spec.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

Rama sugerida: `feat/spec-003-profile-schema`. **No ejecutar hasta que el usuario pida implementar.**

1. Redactar migración SQL (tabla + CHECK + RLS + GRANT + trigger `updated_at`).
2. Aplicar en proyecto Supabase del desarrollador; comprobar en Table Editor + prueba RLS.
3. Añadir `profileSchema` Zod + tests.
4. Actualizar README (apply migration).
5. Spec-004 (`profile-api`) puede redactarse en draft usando campos fijados aquí.

## Notas de implementación

_Rellenar al pasar a `implemented`._
