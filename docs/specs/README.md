# Specs — Spec-Driven Development

Cada feature o cambio significativo vive aquí **antes** del código.

## Convención de nombres

```
NNN-nombre-corto-en-kebab-case.md
```

Ejemplos: `001-project-scaffold.md`, `002-auth.md`, `003-onboarding-profile.md`

## Roadmap MVP

Índice acordado (2026-08-14). **No redactar** specs futuras hasta llegar a esa spec. El archivo `NNN-*.md` se crea en `draft` con el skill `write-spec` al empezar esa tarea.

| NNN | Nombre previsto | Alcance (una frase) | Depende de | Estado |
|---|---|---|---|---|
| 001 | [project-scaffold](./001-project-scaffold.md) | Next.js 16, Jest, stubs API, clientes Supabase/Gemini | ADR-001 | **implemented** |
| 002 | auth | Login/logout, sesión, rutas protegidas (Supabase Auth) | 001 | pendiente (siguiente) |
| 003 | onboarding-profile | Captura y persistencia del perfil de entrenamiento | 002 | pendiente |
| 004 | workout-plan-engine | Generar plan con Gemini, guardar, enlaces LoadMuscle | 003 | pendiente |
| 005 | session-log | Registrar peso × reps de una sesión | 004 | pendiente |
| 006 | weekly-iteration | Ajustar el plan según logs y perfil | 005 | pendiente |

Fuera de este índice hasta que 002+003 funcionen en local: deploy a Vercel (ver ADR-001).

**Siguiente trabajo:** spec-002 (`002-auth.md`) — solo auth. No mezclar onboarding ni motor de plan.

## Tipos de spec

| Tipo | Cuándo usar | Secciones clave |
|---|---|---|
| **feature** | Pantallas, flujos de usuario, lógica de producto | UX / flujos, Modelo de datos |
| **api** | Route Handlers, contratos request/response | Entradas, Salidas, Casos límite |
| **infra** | Scaffold, CI, config, tooling | Comportamiento esperado, Fuera de alcance |

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

## Qué no requiere spec

- Typos, formato, deps menores
- Fixes acotados ya cubiertos por spec existente (actualizar esa spec)

## Plantilla

Ver [`_template.md`](./_template.md) — formato híbrido (producto + contrato API).
