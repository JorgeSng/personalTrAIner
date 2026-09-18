# Resumen del proyecto — personalTrAIner

## Qué es

App web **personal** (un solo usuario) de entrenamiento con IA orientada a **recomposición corporal** (perder grasa + ganar músculo). El usuario hace login, completa un onboarding con su perfil de entrenamiento (nivel, días/semana, material, lesiones), genera un plan semanal con **Gemini**, y registra sesiones reales (peso × reps) por ejercicio. La referencia de técnica usa enlaces **LoadMuscle** de un catálogo curado.

## Estado actual

- **MVP funcional en local**: specs 001–012 `implemented` (scaffold, auth, perfil, onboarding, plan con Gemini, UI de plan, calidad LoadMuscle, log de sesiones).
- **Pendiente**: spec 013 `weekly-iteration` (ajustar el plan según logs) y deploy a Vercel.
- Roadmap completo: [`docs/specs/README.md`](./specs/README.md).

## Clasificación

| Atributo | Valor |
|---|---|
| Tipo de repo | **Monolito** (1 parte) |
| Tipo de proyecto | Web app (Next.js) |
| Lenguaje | TypeScript `strict` |
| Alcance | Personal (1 usuario), idioma español |
| Metodología | SDD — spec antes de código (`docs/specs/`) |

## Stack en una línea

**Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Supabase (Auth + Postgres + RLS) · Gemini API · Zod · Jest + RTL · npm · Vercel (pendiente)**

Detalle y justificación: [`docs/adr/001-tech-stack.md`](./adr/001-tech-stack.md) y [`architecture.md`](./architecture.md).

## Funcionalidades implementadas

- **Auth**: login/signup email+password (Supabase Auth), sesión por cookies (`proxy.ts` refresca), logout, redirect `?next` sanitizado.
- **Onboarding**: gate de perfil — sin fila en `profiles` → `/onboarding`; form con presets de material + custom.
- **Plan semanal**: `POST /api/plan/generate` → Gemini → Zod → supersede+insert; `/plan` muestra días, ejercicios, descansos, enlaces de técnica.
- **Log de sesiones**: formulario por día con series/peso/reps → `POST /api/sessions`; listado y detalle por API.
- **Calidad del plan**: catálogo curado ~40 ejercicios LoadMuscle, descansos obligatorios, contenido en español, reintentos con hints correctivos.

## Documentación generada

| Documento | Contenido |
|---|---|
| [architecture.md](./architecture.md) | Arquitectura completa: capas, flujos, decisiones, riesgos |
| [source-tree-analysis.md](./source-tree-analysis.md) | Árbol de código anotado + convenciones |
| [api-contracts.md](./api-contracts.md) | 7 endpoints: contratos request/response + errores |
| [data-models.md](./data-models.md) | 4 tablas, RLS, migraciones, schemas Zod |
| [component-inventory.md](./component-inventory.md) | 9 componentes, server vs client, patrones UI |
| [development-guide.md](./development-guide.md) | Setup, env, scripts, flujo SDD, debugging |

## Documentación existente (no generada)

| Documento | Contenido |
|---|---|
| [README.md](../README.md) | Setup, API resumen, verificación RLS manual |
| [AGENTS.md](../AGENTS.md) | Manifiesto de agente: SDD, normas git, dominio |
| [docs/adr/001-tech-stack.md](./adr/001-tech-stack.md) | Decisión de stack (accepted) |
| [docs/specs/](./specs/) | 12 specs implementadas + plantilla + roadmap |
| [.cursor/rules/](../.cursor/rules/) | sdd-core, dev-workflow, specs-format, api-conventions |

## Reglas de dominio (producto)

- El **perfil de usuario** (nivel, frecuencia, material, lesiones) vive en `profiles` — capturado en onboarding, nunca hardcodeado.
- Los planes respetan el perfil: equipo disponible, notas de lesiones, `days.length === training_days_per_week`.
- `loadmuscle_url`: solo URLs https del catálogo curado; sin match → `null` («Técnica pendiente»). **No inventar URLs.**
- Sin conteo de calorías ni dietas (fuera de alcance del MVP).
- Seguridad: RLS por `auth.uid()` en todas las tablas + verificación de propiedad en `lib/`. Sin service role.
