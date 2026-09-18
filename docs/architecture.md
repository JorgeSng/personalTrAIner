# Arquitectura — personalTrAIner

## Resumen ejecutivo

App web **personal** (un solo usuario) de entrenamiento con IA para recomposición corporal. Monolito **Next.js 16 App Router + TypeScript** que sirve páginas (Server/Client Components) y API (Route Handlers). **Supabase** aporta Auth (email/password) y Postgres con RLS. **Gemini API** genera el plan semanal en JSON validado con **Zod**. Desarrollo con flujo **SDD** (spec antes de código) y tests **Jest + RTL** junto al código.

```
┌──────────┐    ┌────────────────────────────┐    ┌──────────────────┐
│ Browser  │───▶│ Next.js (dev local→Vercel) │───▶│ Supabase         │
│ (React)  │◀───│  app/ páginas + /api/*     │◀───│ Auth + Postgres  │
└──────────┘    └─────────────┬──────────────┘    │ RLS auth.uid()   │
                              │                   └──────────────────┘
                              ▼
                       ┌──────────────┐
                       │ Gemini API   │  → JSON plan → Zod → persist
                       │ Flash model  │
                       └──────────────┘
```

## Stack tecnológico

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Runtime | Node.js | 20+ LTS | ADR-001 |
| Framework | Next.js App Router | ^16.3.1 | SSR+API en un deploy; experiencia previa |
| Lenguaje | TypeScript | ^5.8.3, `strict` | Seguridad de tipos en contratos |
| UI | React | ^19.1.0 | Con Next |
| Estilos | Tailwind CSS | ^4.1.8 (`@tailwindcss/postcss`) | Ligero vs UI kit |
| DB/Auth | Supabase (`@supabase/supabase-js` ^2.49, `@supabase/ssr` ^0.6) | cloud | Auth+Postgres+RLS sin backend propio |
| IA | `@google/generative-ai` ^0.24.1 | gemini-3.6-flash | JSON mode + buen español + tier gratis |
| Validación | Zod | ^3.25.28 | Contratos en límites API + JSON de IA |
| Tests | Jest ^29 + RTL ^16 + jest-dom | jsdom | Decisión ADR-001 vs Vitest |
| Lint | ESLint ^9 flat (`eslint-config-next` core-web-vitals) | — | `--max-warnings=0` en CI local |
| PM | npm | — | ADR-001 |
| Deploy | Vercel (pendiente) | — | Hobby tier; tras MVP estable |

## Patrón arquitectónico

**Monolito en capas con thin handlers:**

1. **Edge/proxy** (`proxy.ts`): refresh de sesión Supabase en cookies + redirect a `/login?next=` para páginas sin sesión. No intercepta `/api/*` (el auth de API lo hace `requireUser`).
2. **Páginas** (`app/**/page.tsx`, Server Components): gate doble — sesión (`getUser`) → perfil (`hasSessionProfile` + `resolveProfileGateRedirect` → `/onboarding`). Cargan datos server-side y pasan props a componentes.
3. **Route Handlers** (`app/api/**`): patrón uniforme `requireUser → parse Zod → función lib → NextResponse`. Errores vía `HttpError` → `{error:{code,message}}`.
4. **Dominio** (`lib/**`): toda la lógica — clientes Supabase, gate de perfil, pipeline de plan (Gemini→Zod→catálogo LoadMuscle→persist), sesiones, schemas Zod.
5. **Datos** (Supabase Postgres): 4 tablas con RLS por `auth.uid()`; app siempre usa `anon key` + sesión del usuario (sin service role).

## Flujos clave

### Auth + gate de perfil

```
request → proxy.ts → updateSession (refresh cookie)
        → resolvePageRedirect: sin sesión y ruta≠/login → /login?next=<path>
página → getUser() → hasSessionProfile()
        → resolveProfileGateRedirect: sin perfil y ruta∈{/ , /plan} → /onboarding
                                      con perfil y ruta=/onboarding → /
```

Tras login, `LoginForm` consulta `GET /api/profile` para decidir destino (`resolvePostAuthDestination`: sin perfil → `/onboarding`; con perfil → `?next` sanitizado). `sanitizeNextPath` evita open redirects.

### Generación de plan (SPEC-007/009)

```
POST /api/plan/generate
  → requireUser
  → body vacío/{} (strict)
  → generateAndPersistPlan(userId)
      → loadProfile            → 404 PROFILE_REQUIRED si no hay
      → generateValidatedContent
          → generateWorkoutPlanJson (Gemini; 503 si falta key; 502 si falla/no-JSON)
          → parsePlanContent: coerce URLs → enrich catálogo → Zod → nº días = training_days_per_week
          → si inválido: 1 reintento con hint correctivo → 502 GEMINI_INVALID_PLAN
          → si faltan loadmuscle_url: 1 reintento pidiendo nombres del catálogo
      → supersedeActiveAndInsert (active→superseded; insert active)
          → 409 CONFLICT → retry una vez (índice único parcial)
  → 201 {data: PlanRow}
```

**Regla de dominio:** las `loadmuscle_url` solo salen del catálogo curado (`loadmuscle-catalog.ts`, ~40 ejercicios con aliases ES/EN). URLs de Gemini no curadas se sustituyen por match exacto de nombre o `null` («Técnica pendiente»). **Nunca se inventan URLs.**

### Registro de sesión (SPEC-011/012)

`LogSessionForm` (cliente) valida fecha no futura, ≥1 ejercicio con series+reps, peso ≥0 o vacío → `POST /api/sessions` → servidor verifica `plan_id` propio → insert sesión + ejercicios → `201 SessionDetail`.

## Arquitectura de datos

Ver [data-models.md](./data-models.md). Resumen: `profiles` (1:1 auth.users) → `workout_plans` (1:N, ≤1 active vía índice parcial) → `workout_sessions` (1:N, FK RESTRICT) → `workout_session_exercises` (1:N CASCADE, RLS por EXISTS al padre). Sin DELETE policies en MVP.

## Diseño API

Ver [api-contracts.md](./api-contracts.md). Convenciones (regla `api-conventions`): Zod en límites, `HttpError`, env solo vía `lib/config/env.ts`, errores con `code` estable que el cliente mapea a copys ES (`lib/*/messages.ts`).

## Componentes

Ver [component-inventory.md](./component-inventory.md). 9 componentes: Server Components para render (páginas, `PlanPanel`, `PlanDays`, `ExerciseTechnique`, `HomeShell`) y `"use client"` solo donde hay estado/efectos (formularios, botones).

## Desarrollo y testing

Ver [development-guide.md](./development-guide.md).

- **SDD obligatorio:** spec `approved` en `docs/specs/` antes de implementar (regla `sdd-core`). Roadmap: specs 001–012 implemented, 013 (weekly-iteration) pendiente.
- **Tests antes de código**; tests colocados junto al archivo.
- **Gate de cierre:** `npm run lint:ci` + `npm run typecheck` + `npm test` + revisar diagnósticos IDE.
- **Git:** ninguna operación mutable sin OK explícito del usuario.
- **Decisiones de diseño** (UX, datos, API, deps): consultar antes de elegir.

## Despliegue

Pendiente (ADR-001): Vercel cuando el MVP local esté estable. Requisitos ya documentados: env vars de `.env.example`, redirect URLs de Supabase Auth con dominio Vercel, migraciones aplicadas a mano en SQL Editor.

## Decisiones y riesgos

- **Auth obligatoria desde MVP** (no modo demo) — simplifica RLS y el modelo mental.
- **JSON del plan en jsonb** validado en app (Zod), no en SQL — flexibilidad para evolucionar el contenido.
- **Gemini sin fallback**: sin key → 503 explícito; plan inválido tras reintento → 502. Groq queda como alternativa documentada en ADR-001.
- **Migraciones manuales** (copy-paste en SQL Editor) — adecuado para 1 dev; riesgo de deriva si se olvida aplicar una.
- **Sin service role**: toda la seguridad recae en RLS + verificación de propiedad en `lib/` (defensa en profundidad, p. ej. `plan_id` propio antes de insertar sesión).
