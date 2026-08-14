# Specs — Spec-Driven Development

Cada feature o cambio significativo vive aquí **antes** del código.

## Convención de nombres

```
NNN-nombre-corto-en-kebab-case.md
```

Ejemplos: `001-project-scaffold.md`, `002-auth-onboarding.md`, `003-api-plan-generate.md`

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
