# ADR-001: Stack tecnológico MVP personal

## Estado

**accepted** (2026-08-14)

## Contexto

- App web **personal** (recomposición corporal + IA).
- MVP: login, onboarding/perfil, plan generado, registro sesiones, iteración semanal, enlaces LoadMuscle.
- Un desarrollador; coste bajo; despliegue sencillo cuando toque.
- Experiencia previa con **Next.js App Router** y TypeScript.
- IA vía API externa (no licencia Cursor).
- Perfil de usuario en BD, no en config del repo.

## Decisiones confirmadas por el usuario

| Tema | Decisión |
|---|---|
| Tests | **Jest** + React Testing Library |
| Auth | **Supabase Auth desde MVP** (login obligatorio) |
| Package manager | **npm** |
| IA | **Google Gemini API** (ver recomendación abajo) |
| Deploy | **Vercel** como destino; desarrollo local primero (ver recomendación abajo) |

## Opciones consideradas

| Capa | Elegido | Alternativa descartada para MVP |
|---|---|---|
| Frontend | Next.js 16 App Router + React + TS | Vite SPA |
| Estilos | Tailwind CSS | MUI / UI kit pesado |
| API | Route Handlers Next | Express aparte |
| DB | Supabase (Postgres) | JSON local |
| Auth | Supabase Auth | Sin auth |
| IA | **Gemini API** | Groq (reserva si hace falta más velocidad) |
| Validación | Zod | JSON sin validar |
| Tests | **Jest** + RTL | Vitest |
| Deploy | **Vercel** (cuando MVP estable) | Solo local permanente |
| PM | **npm** | pnpm / yarn |

## Decisión final

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Browser    │────▶│  Next.js (local  │────▶│  Supabase   │
│  + Auth     │     │  → Vercel)       │     │  Auth + DB  │
└─────────────┘     └────────┬─────────┘     └─────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Gemini API      │
                    │  (plan JSON)     │
                    └──────────────────┘
```

### Detalle por capa

| Componente | Elección | Nota |
|---|---|---|
| Runtime | Node.js 20+ LTS | |
| Framework | Next.js 16 App Router | `app/` en raíz; actualizado desde 15.5 (2026-08-14) |
| Lenguaje | TypeScript | `strict: true` |
| UI | React + Tailwind CSS | |
| DB / Auth | `@supabase/supabase-js` + SSR helpers | RLS por `auth.uid()` |
| Auth UX MVP | Email + password o magic link (Supabase) | Flujo login antes de onboarding |
| IA | `@google/generative-ai` | Modelo Flash; JSON + Zod |
| Tests | **Jest** + `@testing-library/react` | Config compatible Next (next/jest) |
| Env | `.env.local` | `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_*`, secrets server |
| Lint | ESLint (Next default) + Prettier opcional | |
| PM | **npm** | |

### Por qué Gemini (y no Groq) para este MVP

- **Español** y planes largos estructurados: Gemini suele ir mejor en instrucciones complejas en castellano.
- **JSON mode / structured output**: encaja con validación Zod del plan de entrenamiento.
- **Tier gratis** generoso para **un solo usuario** (pocas generaciones/semana).
- **Groq** sigue siendo buena reserva si necesitas latencia mínima; se puede cambiar en un ADR futuro sin tocar el resto.

### Por qué Vercel (estrategia de deploy)

- Encaje nativo con Next.js; hobby tier gratis.
- **Recomendación**: fase scaffold y primeras specs **solo en local**; desplegar a Vercel cuando login + Supabase funcionen en dev (evita pelear env/build antes de tiempo).
- Supabase ya es cloud; la app en Vercel solo necesita las mismas env vars documentadas en `.env.example`.

### Flujo IA (MVP)

1. Perfil + logs del usuario autenticado → prompt con reglas.
2. Gemini → JSON validado con Zod.
3. Backend valida límites (material, lesiones del perfil).
4. Guardar plan en Supabase asociado a `user_id`.

### LoadMuscle

- Solo URLs en JSON; enlace «Ver técnica» en UI.

## Consecuencias

### Positivas

- Stack unificado; auth y datos en Supabase desde el día 1.
- Jest alineado con preferencia del autor.
- Gemini suficiente para uso personal.

### Riesgos

- Config Jest + Next requiere setup inicial cuidadoso (`next/jest`).
- Supabase Auth exige redirect URLs correctas al desplegar Vercel.

### Follow-up

1. Spec `001-project-scaffold.md` → bootstrap + Jest + Supabase clients.
2. Spec `002-auth-and-onboarding.md` → login + perfil inicial.
3. Spec `003-workout-plan-engine.md` → generación e iteración.

## Aprobación

- [x] Usuario confirma stack (2026-08-14)
- [x] Usuario confirma upgrade a **Next.js 16.3.x** (2026-08-14) — parches npm audit; ESLint flat config nativo
