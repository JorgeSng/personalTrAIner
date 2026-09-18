# Índice de documentación — personalTrAIner

> Punto de entrada para desarrollo asistido por IA. Generado por escaneo brownfield (deep scan, 2026-09-18).

## Project Overview

- **Tipo:** monolito, 1 parte
- **Lenguaje:** TypeScript (strict)
- **Arquitectura:** Next.js App Router en capas — páginas server + Route Handlers finos + dominio en `lib/` + Supabase (Auth/Postgres/RLS)

## Quick Reference

- **Tech stack:** Next.js 16.3 · React 19 · TS · Tailwind 4 · Supabase · Gemini API · Zod · Jest+RTL · npm
- **Entry point:** `app/layout.tsx` + `app/page.tsx`; middleware en `proxy.ts`
- **Patrón arquitectónico:** monolito en capas, thin API handlers, RLS por `auth.uid()`
- **Estado del roadmap:** specs 001–012 `implemented`; 013 `weekly-iteration` pendiente
- **Deploy:** local; Vercel planeado cuando el MVP esté estable

## Documentación generada

- [Project Overview](./project-overview.md) — qué es, estado, funcionalidades, reglas de dominio
- [Architecture](./architecture.md) — stack, capas, flujos (auth/plan/sesión), decisiones y riesgos
- [Source Tree Analysis](./source-tree-analysis.md) — árbol anotado, puntos de entrada, convenciones
- [API Contracts](./api-contracts.md) — 7 endpoints: request/response, códigos de error
- [Data Models](./data-models.md) — 4 tablas, RLS, migraciones, schemas Zod
- [Component Inventory](./component-inventory.md) — 9 componentes, server/client, patrones UI
- [Development Guide](./development-guide.md) — setup, env, scripts, flujo SDD, debugging

## Documentación existente

- [README.md](../README.md) — setup rápido, tabla de API, verificación RLS manual
- [AGENTS.md](../AGENTS.md) — manifiesto de agente: flujo SDD, normas git, dominio de producto
- [ADR-001: Tech stack](./adr/001-tech-stack.md) — decisiones de stack (accepted)
- [Specs SDD](./specs/README.md) — roadmap + specs 001–012 (implemented) + plantilla
- [Reglas Cursor](../.cursor/rules/) — `sdd-core`, `dev-workflow`, `specs-format`, `api-conventions`

## Getting Started

```bash
cp .env.example .env.local   # rellenar NEXT_PUBLIC_SUPABASE_* (+ GEMINI_API_KEY opcional)
npm install && npm run dev   # → http://localhost:3000 (redirige a /login)
```

Antes de codear una feature: leer `AGENTS.md` + spec afectada en `docs/specs/`; feature nueva sin spec `approved` → skill `write-spec` primero. Gate de cierre: `npm run lint:ci && npm run typecheck && npm test`.

## Para flujos brownfield

- **Feature full-stack nueva** → spec primero (`write-spec`); referencia: [architecture.md](./architecture.md) + [api-contracts.md](./api-contracts.md) + [data-models.md](./data-models.md).
- **Solo UI** → [component-inventory.md](./component-inventory.md) + patrones de `components/`.
- **Solo API** → [api-contracts.md](./api-contracts.md) + convenciones de `lib/` (Zod, HttpError).
- **Cambio de modelo de datos** → nueva migración (nunca editar aplicadas) + spec `infra`.
