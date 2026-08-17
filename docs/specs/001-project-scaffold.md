# SPEC-001: Project scaffold

| Campo | Valor |
|---|---|
| **Estado** | implemented |
| **Tipo** | infra |
| **Fecha** | 2026-08-14 |
| **Supersede** | — |
| **Depende de** | [ADR-001: Stack tecnológico](../adr/001-tech-stack.md) — **accepted** |

## Objetivo

Bootstrap del repo: Next.js ejecutable en local, Jest configurado, clientes Supabase listos para Auth, variables de entorno documentadas y stubs mínimos de API.

## Comportamiento esperado

- `npm install` → dependencias instaladas sin errores.
- `npm run dev` → app en `localhost` con página inicial mínima.
- `npm test` → al menos un test smoke pasa.
- `npm run build` → build exitoso (modo degradado si faltan API keys reales).
- Sin `.env.local` → app arranca; clientes Supabase/Gemini fallan con mensaje claro, no crash silencioso.

## Entradas

_N/A (spec de infra)._

## Salidas

_N/A (spec de infra)._

## Casos límite

- Variables de entorno ausentes o inválidas → errores explícitos en runtime de API; UI no rompe en landing.
- Proyecto en carpeta con `docs/` y `.cursor/` preexistentes → integrar sin borrar SDD.
- Jest en entorno Next (App Router) → usar `next/jest`, no config legacy incompatible.

## Estructura de carpetas

```
app/
  api/
    health/route.ts
    plan/generate/route.ts   # stub
  layout.tsx
  page.tsx
lib/
  supabase/
    client.ts
    server.ts
  ai/
    gemini.ts                # mock hasta tener GEMINI_API_KEY
  validation/
    schemas/
components/
docs/                        # existente — no mover
```

## Integraciones

- **Supabase**: `@supabase/supabase-js` + helpers server/browser (Auth preparado, sin flujo login completo).
- **Gemini**: wrapper en `lib/ai/gemini.ts` con mock si no hay key.
- **ADR-001**: Next.js, Tailwind, TypeScript strict, npm, Jest.

## Fuera de alcance

- Pantallas login/onboarding (spec 002).
- Tablas Supabase de perfil/plan (specs **003+**).
- Deploy a Vercel (documentar en README; ejecutar cuando el usuario lo pida).
- E2E (Playwright).
- Validación Zod de planes de entrenamiento (spec **006+**); esquema de perfil en spec **003**, API en **004**.

## Criterios de aceptación

- [x] Caso feliz: dev, test y build funcionan en local.
- [x] Casos límite: comportamiento graceful sin env completo.
- [x] Tests Jest: al menos un smoke test.
- [x] `.env.example` documentado (`NEXT_PUBLIC_SUPABASE_*`, `GEMINI_API_KEY`, etc.).
- [x] No se borraron ni movieron `docs/`, `AGENTS.md`, `.cursor/`.
- [x] ADR-001 referenciado en README.

## Plan de implementación

1. `create-next-app` con App Router, TS, Tailwind, ESLint.
2. Jest + RTL (`next/jest`) + smoke test.
3. `lib/supabase/*` + `.env.example`.
4. Route handlers `health` y `plan/generate` (stub).
5. Actualizar README (comandos npm, env, deploy futuro Vercel).

## Notas de implementación

- Scaffold manual (no `create-next-app` en raíz: nombre npm `personalTrAIner` con mayúsculas inválido). `package.json` → `personaltrainer`.
- Next.js 15.5, React 19, Tailwind 4, Jest 29 con `jest.config.mjs` + `next/jest`.
- Añadidos: `lib/config/env.ts`, `lib/errors/http-error.ts`, stubs API, 4 tests (page + env).
- `api-conventions.mdc` actualizado con paths reales.
- Verificado: `npm test`, `npm run build`, `npm run lint` OK sin `.env.local`.
- **2026-08-14:** Upgrade Next.js **15.5.23 → 16.3.1** + `eslint-config-next` 16; `npm audit` 0 vulnerabilidades; ESLint sin FlatCompat.
