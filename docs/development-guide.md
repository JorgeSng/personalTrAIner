# Guía de desarrollo — personalTrAIner

## Requisitos

- Node.js **20+**
- npm
- Proyecto Supabase (cloud) para auth + DB
- (Opcional) `GEMINI_API_KEY` para generar planes

## Primer arranque

```bash
cp .env.example .env.local
# Rellenar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (obligatorio)
# GEMINI_API_KEY opcional (sin ella, POST /api/plan/generate → 503)

npm install
npm run dev
```

→ http://localhost:3000 — sin sesión redirige a `/login`.

## Variables de entorno

| Var | Scope | Obligatoria | Descripción |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client+server | Sí | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client+server | Sí | Anon key (la seguridad la da RLS, no se usa service role) |
| `GEMINI_API_KEY` | solo server | No | API key de Gemini (aistudio.google.com/apikey) |

Lectura **solo** vía `lib/config/env.ts` (`getSupabasePublicEnv`, `getGeminiApiKey`) — no usar `process.env` disperso (regla `api-conventions`).

## Setup de Supabase (una vez)

1. Dashboard → **Authentication → URL configuration**: Site URL `http://localhost:3000`, Redirect URLs `http://localhost:3000/**`.
2. **Providers → Email**: desactivar *Confirm email* (la app no tiene UI de confirmación ni reset).
3. Crear usuario desde `/login` → **Crear cuenta**, o en Authentication → Users.
4. Aplicar migraciones en orden, copiando cada SQL al **SQL Editor**:
   1. `supabase/migrations/20260817140000_create_profiles.sql`
   2. `supabase/migrations/20260824120000_create_workout_plans.sql`
   3. `supabase/migrations/20260827120000_create_workout_sessions.sql`

Verificación RLS manual: queries en `README.md` (secciones «Verificar RLS»).

## Scripts npm

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir el build |
| `npm test` | Jest (unit + componentes) |
| `npm run test:ci` | Jest con cobertura (umbrales en `jest.config.mjs`) |
| `npm run test:watch` | Jest en watch |
| `npm run lint` | ESLint |
| `npm run lint:ci` | ESLint estricto (`--max-warnings=0`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | lint:ci + typecheck + test:ci (gate completo) |

## Flujo de trabajo (SDD)

Definido en `AGENTS.md` + `.cursor/rules/`:

```
Idea → Spec draft (docs/specs/NNN-*.md) → Revisión → approved → Implementar → implemented
```

1. **Feature nueva** → skill `write-spec` (o modo Plan). Sin spec `approved` no se codea.
2. **Implementar** → skill `implement-from-spec`: leer spec → tests primero → diff mínimo → resumen spec→cambio.
3. **Cerrar** → `update-spec` a `implemented` + notas de implementación.
4. Orden del roadmap: `docs/specs/README.md` (no adelantar specs futuras).

### Antes de cerrar cualquier tarea (gate)

1. Revisar diagnósticos del IDE en archivos tocados.
2. `npm run lint:ci` + `npm run typecheck` + `npm test`.
3. Si cambió código de producto → 2 pasadas de calidad (regla `dev-workflow`).
4. Proponer commit al usuario — **nunca** commitear/pushear sin OK explícito.

## Convenciones de código

- **Route Handlers**: `requireUser` → Zod parse → función `lib/` → `NextResponse`; errores con `HttpError` → `{error:{code,message}}`.
- **Lógica en `lib/`**, handlers finos. Alias `@/*` → raíz.
- **Validación Zod** en `lib/validation/schemas/` (barrel en `index.ts`).
- **Copys de usuario** en `lib/*/messages.ts` (español); mapeo `error.code` → mensaje.
- **Componentes**: server por defecto, `"use client"` solo si interactivo; Tailwind directo.
- **Tests**: `*.test.{ts,tsx}` junto al archivo; jsdom + jest-dom; cobertura global ≥75% líneas.
- **Migraciones**: nunca editar una aplicada — crear archivo nuevo `YYYYMMDDHHMMSS_*.sql` con tabla+CHECKs+RLS+GRANT+trigger `updated_at`.
- **LoadMuscle**: solo URLs del catálogo curado (`lib/plans/loadmuscle-catalog.ts`); nunca inventar slugs.

## Estructura de errores API

`HttpError(status, code, message)` — códigos estables (`UNAUTHORIZED`, `VALIDATION_ERROR`, `PROFILE_REQUIRED`, `GEMINI_*`, `SUPABASE_NOT_CONFIGURED`, `*_NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`). El cliente mapea `code` → copy ES.

## Debugging rápido

- `GET /api/health` → confirma `supabase`/`gemini` `configured`.
- ¿Redirects raros? → `proxy.ts` (auth) + `lib/onboarding/resolve-destination.ts` (gate de perfil).
- ¿401/503 en API? → sesión caducada o env vars; `lib/auth/session.ts`.
- ¿Plan inválido? → `lib/plans/parse-plan-content.ts` + logs de Gemini (`GEMINI_INVALID_PLAN` tras 1 reintento).
