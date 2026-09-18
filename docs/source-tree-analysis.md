# Análisis del árbol de código — personalTrAIner

Monolito Next.js 16 (App Router) en la raíz del repo. Una sola parte.

## Árbol anotado

```
personalTrAIner/
├── app/                          # App Router: páginas + Route Handlers
│   ├── layout.tsx                # Root layout (fuentes Geist, lang="es", metadata)
│   ├── globals.css               # Tailwind 4 (import)
│   ├── page.tsx                  # GET / — home; gate: sesión + perfil → HomeShell
│   ├── login/page.tsx            # /login — LoginForm (signup+login email/password)
│   ├── onboarding/page.tsx       # /onboarding — captura de perfil (gate inverso)
│   ├── plan/page.tsx             # /plan — plan activo + generar/regenerar + log sesión
│   └── api/                      # Route Handlers (todos con requireUser salvo health)
│       ├── health/route.ts       # GET — estado servicio + integraciones (público)
│       ├── plan/route.ts         # GET — plan activo
│       ├── plan/generate/route.ts# POST — genera plan con Gemini + persiste
│       ├── profile/route.ts      # GET/POST/PATCH — perfil
│       ├── sessions/route.ts     # GET/POST — lista y crea logs de sesión
│       └── sessions/[id]/route.ts# GET — detalle sesión + ejercicios
│
├── components/                   # Componentes React (cliente salvo PlanPanel/PlanDays)
│   ├── auth/
│   │   ├── login-form.tsx        # "use client" — email+password, signIn/signUp, redirect post-auth
│   │   ├── logout-button.tsx     # "use client" — signOut → /login
│   │   └── home-shell.tsx        # Server — saludo + enlace a /plan + logout
│   ├── onboarding/
│   │   └── onboarding-form.tsx   # "use client" — nivel, días/sem, material (presets+custom), lesiones
│   └── plan/
│       ├── plan-panel.tsx        # Server — panel del plan o copy vacío
│       ├── plan-days.tsx         # Server — días, ejercicios, descansos, técnica + LogSessionForm
│       ├── exercise-technique.tsx# Server — enlace "Ver técnica" LoadMuscle o "Técnica pendiente"
│       ├── generate-plan-cta.tsx # "use client" — POST /api/plan/generate + refresh
│       └── log-session-form.tsx  # "use client" — form peso×reps por ejercicio → POST /api/sessions
│
├── lib/                          # Dominio e infraestructura (server)
│   ├── ai/
│   │   └── gemini.ts             # Prompt + llamada Gemini (gemini-3.6-flash), parse JSON
│   ├── auth/
│   │   ├── session.ts            # getUser / requireUser (HttpError 401/503)
│   │   ├── paths.ts              # Constantes de rutas + resolvePageRedirect
│   │   ├── safe-next.ts          # Sanitiza ?next= contra open redirects
│   │   └── messages.ts           # Copys de error auth
│   ├── config/
│   │   └── env.ts                # Lectura centralizada de env (Zod) — único punto a process.env
│   ├── errors/
│   │   └── http-error.ts         # HttpError + isHttpError
│   ├── onboarding/
│   │   ├── equipment-presets.ts  # Presets de material + buildEquipmentList
│   │   ├── get-session-profile.ts# getSessionProfile / hasSessionProfile (gate)
│   │   ├── resolve-destination.ts# Destino post-auth + gate de perfil por ruta
│   │   └── messages.ts           # Copys onboarding
│   ├── plans/
│   │   ├── generate-and-persist.ts # Orquesta: perfil → Gemini → Zod → supersede+insert (retry)
│   │   ├── get-active-plan.ts    # SELECT plan status='active'
│   │   ├── parse-plan-content.ts # coerce → enrich → Zod → check nº días
│   │   ├── loadmuscle-catalog.ts # Catálogo curado ~40 ejercicios → URL LoadMuscle
│   │   ├── coerce-loadmuscle-urls.ts # URLs no-https → null (pre-proceso)
│   │   ├── enrich-loadmuscle-urls.ts # Match por nombre/alias → URL curada
│   │   ├── format-rest-seconds.ts# "90 s" / "2 min"
│   │   ├── messages.ts           # Copys plan + mapeo code→mensaje
│   │   └── types.ts              # PlanRow, PlanStatus, PlanGenerationProfile
│   ├── sessions/
│   │   ├── create-session.ts     # Verifica plan propio → insert sesión + ejercicios
│   │   ├── list-sessions.ts      # Lista con filtros plan_id/limit
│   │   ├── get-session-by-id.ts  # Detalle + ejercicios ordenados
│   │   ├── map-session.ts        # Row → tipos de dominio (weight_kg numeric→number)
│   │   ├── log-session-form-helpers.ts # Payload del form + validaciones cliente
│   │   ├── messages.ts           # Copys sesión + mapeo code→mensaje
│   │   └── types.ts              # SessionSummary, SessionExercise, SessionDetail
│   ├── supabase/
│   │   ├── client.ts             # Browser client (@supabase/ssr)
│   │   ├── server.ts             # Server client con cookies (async)
│   │   └── middleware.ts         # updateSession — refresh de cookies en proxy
│   └── validation/schemas/
│       ├── auth.ts               # credentialsSchema (email, password≥6)
│       ├── profile.ts            # profileSchema / profilePatchSchema
│       ├── workout-plan.ts       # workoutPlanContentSchema (JSON del plan)
│       ├── workout-session.ts    # session + exercise + create + listQuery
│       └── index.ts              # Barrel de exports
│
├── supabase/
│   └── migrations/               # SQL aplicado a mano vía SQL Editor
│       ├── 20260817140000_create_profiles.sql
│       ├── 20260824120000_create_workout_plans.sql
│       └── 20260827120000_create_workout_sessions.sql  # + session_exercises
│
├── docs/
│   ├── adr/001-tech-stack.md     # ADR del stack (accepted)
│   ├── specs/                    # Specs SDD NNN-*.md (001–012 implemented, 013 pendiente)
│   │   ├── _template.md
│   │   └── README.md             # Índice/roadmap + reglas de división
│   └── *.md                      # ← documentación generada por este escaneo
│
├── proxy.ts                      # Middleware Next (entry): refresh sesión + redirect login
├── jest.config.mjs               # next/jest, jsdom, coverage ≥75% líneas
├── jest.setup.ts                 # @testing-library/jest-dom
├── eslint.config.mjs             # Flat config eslint-config-next core-web-vitals
├── next.config.ts                # Vacío (defaults)
├── postcss.config.mjs            # @tailwindcss/postcss
├── tsconfig.json                 # strict, bundler, paths @/* → ./*
├── package.json                  # npm scripts + deps
├── .env.example                  # NEXT_PUBLIC_SUPABASE_* + GEMINI_API_KEY
├── AGENTS.md                     # Manifiesto agente: SDD, git, dominio, normas
├── README.md                     # Setup, API, migraciones, verificación RLS
├── .cursor/rules/                # sdd-core, dev-workflow, specs-format, api-conventions
├── .cursor/skills/               # write-spec, implement-from-spec, update-spec
├── .agents/skills/               # Skills BMAD instaladas
└── _bmad/, _bmad-output/         # Framework BMAD + artefactos de planificación
```

## Puntos de entrada

| Tipo | Archivo | Nota |
|---|---|---|
| Edge/middleware | `proxy.ts` | Matcher: todo salvo `_next/static`, `_next/image`, favicon e imágenes. Refresca sesión y redirige a `/login?next=` |
| Página home | `app/page.tsx` | Gate doble: sesión → perfil |
| API pública | `app/api/health/route.ts` | Único endpoint sin auth |
| Cliente Supabase | `lib/supabase/{client,server,middleware}.ts` | Tres fábricas según contexto |

## Carpetas críticas (convención del repo)

- `app/api/**` — Route Handlers; patrón fijo `requireUser → Zod → lib → toErrorResponse`.
- `lib/**` — Toda la lógica de dominio; los handlers son thin wrappers. Regla: env solo vía `lib/config/env.ts`.
- `components/**` — `"use client"` solo donde hay interactividad; el resto son Server Components.
- `supabase/migrations/**` — inmutable una vez aplicada; nueva migración para cambios.
- `docs/specs/**` — una spec por feature, `NNN-kebab.md`, estados `draft→approved→implemented`.

## Tests

41 archivos `*.test.{ts,tsx}` colocados **junto al código** (mismo directorio). Entorno jsdom + `jest.setup.ts` (jest-dom). Cobertura mínima global: 75% líneas/statements, 70% funciones, 60% ramas. Excluidos de cobertura: `lib/supabase/**`, `lib/ai/**`, `app/layout.tsx`.

## Notas de estructura

- Alias `@/*` → raíz del repo (no `src/`).
- Sin carpeta `public/` (no hay assets estáticos).
- `components/.gitkeep` — la carpeta existe aunque todos los componentes están en subcarpetas por dominio.
- Sin CI/CD configurado (`.github/` no existe); deploy previsto en Vercel cuando el MVP esté estable.
- `coverage/`, `.next/`, `.swc/` son artefactos generados (gitignored).
