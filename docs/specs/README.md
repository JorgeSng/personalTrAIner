# Specs — Spec-Driven Development

Cada feature o cambio significativo vive aquí **antes** del código.

## Convención de nombres

```
NNN-nombre-corto-en-kebab-case.md
```

Ejemplos: `001-project-scaffold.md`, `002-auth.md`, `003-profile-schema.md`

## Roadmap MVP

Índice acordado. **No redactar** specs futuras hasta llegar a esa spec en orden. El archivo `NNN-*.md` se crea en `draft` con el skill `write-spec` al empezar esa tarea.

| NNN | Nombre previsto | Alcance (una frase) | Tipo | Depende de | Estado |
|---|---|---|---|---|---|
| 001 | [project-scaffold](./001-project-scaffold.md) | Next.js 16, Jest, stubs API, clientes Supabase/Gemini | infra | ADR-001 | **implemented** |
| 002 | [auth](./002-auth.md) | Login/logout, sesión, rutas protegidas (Supabase Auth) | feature | 001 | **implemented** |
| 003 | [profile-schema](./003-profile-schema.md) | Tabla `profiles`, migración SQL, RLS, esquema Zod (sin UI ni API) | infra | 002 | **implemented** |
| 004 | [profile-api](./004-profile-api.md) | Route Handlers perfil (`GET`/`POST`/`PATCH`), `requireUser`, Zod | api | 003 | **implemented** |
| 005 | [onboarding-capture](./005-onboarding-capture.md) | Flujo post-login, formulario, redirect sin perfil; consume API 004 | feature | 004 | **implemented** |
| 006 | [workout-plan-schema](./006-workout-plan-schema.md) | Tabla `workout_plans`, RLS, Zod del contenido del plan | infra | 005 | **implemented** |
| 007 | [workout-plan-api](./007-workout-plan-api.md) | Generar plan con Gemini, validar Zod, persistir; GET plan activo | api | 006 | **implemented** |
| 008 | [workout-plan-ui](./008-workout-plan-ui.md) | Pantalla `/plan`, generar/regenerar, enlaces LoadMuscle | feature | 007 | **draft** |
| 009 | session-log | Registrar peso × reps de una sesión | feature | 008 | pendiente |
| 010 | weekly-iteration | Ajustar el plan según logs y perfil | feature | 009 | pendiente |

**Histórico:**

- El bloque «onboarding + perfil» era una sola spec `003-onboarding-profile`. Desglosado en **003 + 004 + 005** (2026-08-17): datos → API → UI.
- El bloque «workout-plan-engine» era una sola fila 006. Desglosado en **006 + 007 + 008** (2026-08-21): schema → API/Gemini → UI. `session-log` y `weekly-iteration` pasan a **009** y **010**.

Fuera de este índice hasta que el MVP de plan funcione en local (006–008): deploy a Vercel (ver ADR-001).

**Siguiente trabajo:** revisar/aprobar spec-008 (`008-workout-plan-ui.md`) e implementarla cuando el usuario lo pida.

## Tamaño de una spec (cuándo dividir)

Preferir **varias specs pequeñas** en cadena antes que una spec grande con muchas capas mezcladas.

| Señal de que conviene dividir | Ejemplo en este repo |
|---|---|
| Mezcla **infra + feature + API** en un solo entregable | Antes: DB + API + onboarding en una spec → ahora **003 + 004 + 005**; plan → **006 + 007 + 008** |
| Más de **~8–10 criterios de aceptación** heterogéneos | Schema SQL + contrato REST + wizard UX en el mismo doc |
| Decisiones de diseño **independientes** | Campos/RLS (003/006) vs contrato HTTP (004/007) vs pantallas (005/008) |
| Quieres **mergear/revisar** por fases | PR migración → PR API → PR UI |

**Regla práctica:** una spec = **un resultado verificable** en una sesión de implementación razonable.

**Cadena acordada (perfil):**

| Capa | NNN | Entregable verificable |
|---|---|---|
| Datos | 003 | Existe `profiles` con RLS y Zod |
| API | 004 | `GET`/`POST`/`PATCH` perfil con auth y validación |
| UI | 005 | Usuario completa onboarding y persiste vía API |

**Cadena acordada (plan):**

| Capa | NNN | Entregable verificable |
|---|---|---|
| Datos | 006 | Existe `workout_plans` con RLS y Zod del `content` |
| API | 007 | Generar (Gemini) + persistir; `GET` plan activo |
| UI | 008 | Usuario ve/genera plan en `/plan` con enlaces LoadMuscle |

**Cómo dividir:**

1. Actualizar esta tabla en `README.md` (nuevas filas NNN, dependencias, tipos).
2. Anotar spec antigua → `superseded` + enlace a las nuevas (si existía draft).
3. Redactar **cada** spec con `write-spec`; no implementar hasta `approved` en la activa.
4. Respetar **orden de dependencias**: 003 → 004 → 005; 006 → 007 → 008.

**No dividir** en exceso: typos, un solo componente, o un fix acotado no necesitan spec nueva.

## Tipos de spec

| Tipo | Cuándo usar | Secciones clave |
|---|---|---|
| **feature** | Pantallas, flujos de usuario, lógica de producto | UX / flujos, Modelo de datos (si aplica) |
| **api** | Route Handlers, contratos request/response | Entradas, Salidas, Casos límite |
| **infra** | Scaffold, CI, config, migraciones, tooling | Comportamiento esperado, Fuera de alcance |

Todas llevan: Objetivo, Casos límite (si aplica), Fuera de alcance, Criterios de aceptación.

## Estados

| Estado | Significado |
|---|---|
| `draft` | En redacción; no implementar |
| `approved` | Lista para implementar |
| `implemented` | Código entregado según spec |
| `superseded` | Reemplazada por otra spec (indicar cuál) |

## Flujo

1. Copiar `_template.md` → `NNN-mi-feature.md`
2. Elegir **Tipo** y completar solo las secciones que aplican
3. Revisar con el usuario → pasar a `approved`
4. Implementar con skill `implement-from-spec`
5. Marcar `implemented` y rellenar «Notas de implementación»

## Qué requiere spec

- Features nuevas (pantallas, flujos, API, integración IA)
- Cambios de arquitectura o modelo de datos (o ADR si es decisión transversal)
- Integraciones externas
- Migraciones Supabase con RLS (spec **infra** dedicada)
- Route Handlers con contrato estable (spec **api** dedicada)

## Qué no requiere spec

- Typos, formato, deps menores
- Fixes acotados ya cubiertos por spec existente (actualizar esa spec)

## Plantilla

Ver [`_template.md`](./_template.md) — formato híbrido (producto + contrato API).

## Cadena perfil → plan (referencia rápida)

```
002 auth → 003 schema → 004 profile-api → 005 onboarding
  → 006 plan-schema → 007 plan-api → 008 plan-ui
  → 009 logs → 010 iteración
```

- **003:** columnas, migración, RLS, Zod — sin HTTP ni pantallas.
- **004:** contrato API; lee/escribe `profiles` con sesión.
- **005:** UX; **no** llama a Supabase directo para persistir (usa 004).
- **006:** tabla `workout_plans` + Zod del JSON del plan — sin HTTP ni pantallas.
- **007:** Gemini → Zod → persistir; `GET` plan activo; lee perfil (004/capa server).
- **008:** UX `/plan`; consume 007; enlaces LoadMuscle (URLs en JSON).
- **009+:** logs e iteración; no redefinir campos de perfil en AGENTS.md.
