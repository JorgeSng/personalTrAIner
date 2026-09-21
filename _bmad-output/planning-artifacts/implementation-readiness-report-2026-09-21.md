---
stepsCompleted: ['step-01-document-discovery', 'step-02-prd-analysis', 'step-03-epic-coverage-validation', 'step-04-ux-alignment', 'step-05-epic-quality-review', 'step-06-final-assessment']
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - docs/architecture.md
  - docs/adr/001-tech-stack.md
documentsPending:
  - epics-and-stories (workflow pendiente)
  - ux-design (opcional, no existe)
workflowType: 'implementation-readiness'
---

# Implementation Readiness Assessment Report

**Date:** 2026-09-21
**Project:** personalTrAIner

## Document Inventory

| Tipo | Documento | Estado | Decisión |
|---|---|---|---|
| PRD | `_bmad-output/planning-artifacts/prd.md` (whole, 15,1 KB, 2026-09-21) | Encontrado | Usar para assessment |
| Architecture | `docs/architecture.md` + `docs/adr/001-tech-stack.md` (brownfield, 2026-09-18) | Fuera de planning-artifacts | Usar como documento de arquitectura (confirmado por el usuario) |
| Epics & Stories | — | No existe | Pendiente: se creará con `bmad-create-epics-and-stories` tras este assessment |
| UX Design | — | No existe | App con UI pero sin spec UX formal; se anota como hueco |

Sin duplicados (no coexisten versiones whole + sharded de ningún documento).

## PRD Analysis

### Functional Requirements

- **FR1:** El usuario puede iniciar la iteración semanal desde la pantalla del plan mediante una acción explícita, generando el plan de la semana siguiente.
- **FR2:** El sistema puede recopilar como contexto de la iteración el perfil del usuario (nivel, días, material, lesiones) y los logs de sesión registrados desde que el plan activo está vigente.
- **FR3:** El sistema puede generar el plan de la semana siguiente mediante IA, reutilizando el pipeline de generación existente (Gemini → Zod → catálogo LoadMuscle → supersede+insert).
- **FR4:** El sistema puede validar el plan ajustado con el mismo esquema estricto que la generación actual (nº de días = `training_days_per_week`, descansos, contenido en español, `loadmuscle_url` solo del catálogo curado).
- **FR5:** El sistema puede marcar el plan anterior como `superseded` y activar el nuevo al iterar, manteniendo como máximo un plan activo por usuario.
- **FR6:** El sistema puede impedir la iteración cuando no existe ningún log de sesión nuevo desde el plan activo, informando al usuario de que registre sesiones primero.
- **FR7:** El sistema puede permitir la iteración con logs parciales (semana incompleta), produciendo un ajuste más conservador con menos datos.
- **FR8:** El sistema puede solicitar confirmación del usuario antes de regenerar el plan, para evitar iteraciones accidentales.
- **FR9:** El usuario puede ver en la UI un resumen de qué cambió en el plan nuevo respecto al anterior.
- **FR10:** El usuario puede ver mensajes de error en español cuando la iteración falla (IA no configurada, fallo de IA, plan inválido, sin logs nuevos).
- **FR11:** El usuario puede reintentar la iteración tras un fallo, manteniéndose el plan activo anterior intacto.
- **FR12:** El sistema conserva cada plan iterado como `superseded` en el historial del usuario (comportamiento existente, reutilizado).

Total FRs: 12

### Non-Functional Requirements

- **NFR1:** Navegación y páginas server fluidas en local; sin targets numéricos formales para MVP personal.
- **NFR2:** La iteración semanal (llamada a Gemini) se trata como operación lenta aceptada: estado `submitting` con botón deshabilitado y feedback visible, sin timeout en cliente.
- **NFR3:** Toda ruta de iteración exige sesión (`requireUser`); seguridad de datos apoyada en RLS por `auth.uid()` y verificación de propiedad en `lib/` (sin service role).
- **NFR4:** Los errores internos no filtran detalles: códigos estables + mensajes genéricos (patrón existente).
- **NFR5:** Un fallo de IA (502/503) nunca deja la app sin plan ni corrompe el plan activo: el supersede solo ocurre tras validar el plan nuevo.
- **NFR6:** La operación supersede+insert mantiene la invariante de ≤1 plan activo por usuario (índice único parcial + retry existente).
- **NFR7:** La UI de iteración mantiene los patrones accesibles existentes: `<label>` nativos, `role="status"`/`role="alert"`, `aria-label`, `fieldset`/`legend`.
- **NFR8:** Integración con Gemini reutiliza códigos de error estables (`GEMINI_NOT_CONFIGURED`, `GEMINI_REQUEST_FAILED`, `GEMINI_INVALID_PLAN`) y reintento con hint correctivo; sin fallback a otro proveedor.
- **NFR9:** Validación del plan ajustado idéntica a la generación actual (mismo esquema Zod y catálogo LoadMuscle curado).

Total NFRs: 9

### Additional Requirements

- **Alcance:** solo spec-013 `weekly-iteration`; specs 001–012 y deploy Vercel = contexto (no requisitos).
- **Reglas de negocio:** iteración nunca automática (acción explícita del usuario); confirmación previa a regenerar; iteración permitida con logs parciales (ajuste conservador).
- **Implementación:** flujo SDD — la feature se materializará como spec-013 en `docs/specs/` (spec antes de código); tests del pipeline antes del código de producto; cobertura ≥75%.
- **Integración:** reutiliza pipeline Gemini → Zod → catálogo LoadMuscle → supersede+insert; códigos de error estables mapeados a copys ES.

### PRD Completeness Assessment

- **Densidad y trazabilidad:** altas — FRs numerados y testables, tabla Journey → FR, criterios medibles (Measurable Outcomes).
- **Claridad de alcance:** excelente — brownfield con perímetro explícito (solo spec-013; Vercel y specs 001–012 fuera).
- **Huecos detectados:** (1) no existe spec UX formal para la UI de iteración (FR8 confirmación y FR9 resumen de cambios necesitarán decisiones de diseño en la spec-013); (2) la regla "logs nuevos desde el plan activo" no define aún el criterio exacto de comparación (p. ej. `created_at` de sesión > `created_at` del plan activo) — decisión a tomar en la spec-013.

## Epic Coverage Validation

### Coverage Matrix

El documento de épicas e historias **no existe** (pendiente — confirmado por el usuario). No hay mapa de cobertura FR que extraer.

| FR | PRD Requirement (resumen) | Epic Coverage | Status |
|---|---|---|---|
| FR1 | Iniciar iteración semanal con acción explícita | **NOT FOUND** | ❌ MISSING (epics pendientes) |
| FR2 | Recopilar perfil + logs como contexto | **NOT FOUND** | ❌ MISSING (epics pendientes) |
| FR3 | Generar plan semana siguiente con IA (pipeline existente) | **NOT FOUND** | ❌ MISSING (epics pendientes) |
| FR4 | Validación Zod estricta del plan ajustado | **NOT FOUND** | ❌ MISSING (epics pendientes) |
| FR5 | Supersede + ≤1 plan activo por usuario | **NOT FOUND** | ❌ MISSING (epics pendientes) |
| FR6 | Bloqueo sin logs nuevos + copy claro | **NOT FOUND** | ❌ MISSING (epics pendientes) |
| FR7 | Iteración con logs parciales permitida | **NOT FOUND** | ❌ MISSING (epics pendientes) |
| FR8 | Confirmación antes de regenerar | **NOT FOUND** | ❌ MISSING (epics pendientes) |
| FR9 | Resumen UI de qué cambió | **NOT FOUND** | ❌ MISSING (epics pendientes) |
| FR10 | Errores en español por `code` | **NOT FOUND** | ❌ MISSING (epics pendientes) |
| FR11 | Reintento tras fallo, plan intacto | **NOT FOUND** | ❌ MISSING (epics pendientes) |
| FR12 | Historial de planes `superseded` | **NOT FOUND** | ❌ MISSING (epics pendientes) |

### Missing Requirements

Los 12 FRs carecen de cobertura en épicas — **estado esperado**: el documento de épicas se creará con `bmad-create-epics-and-stories` inmediatamente después de este assessment; esta sección establece la línea base de trazabilidad (0%) contra la que se validará el documento de épicas cuando exista.

### Coverage Statistics

- Total PRD FRs: 12
- FRs covered in epics: 0
- Coverage percentage: 0% (esperado — épicas pendientes de crear)

## UX Alignment Assessment

### UX Document Status

**No encontrado** — no existe `_bmad-output/planning-artifacts/*ux*.md` ni versión sharded.

### UX implícito

Sí, la UX está implícita y es necesaria:

- El PRD es de una **aplicación user-facing** (web app con pantalla `/plan`, formularios, botones).
- El PRD define capacidades de UI sin especificar su diseño: **FR8** (confirmación antes de regenerar — patrón de interacción por definir) y **FR9** (resumen de qué cambió — formato/ubicación por definir).
- El repo ya tiene patrones UI establecidos (component inventory: 9 componentes, Tailwind directo, copys ES en `lib/*/messages.ts`) que sirven de base.

### Alignment Issues

- UX ↔ PRD: sin spec UX, no se puede validar alineación formal. Los journeys del PRD (J1–J4) describen el flujo a alto nivel pero no definen interacciones concretas (¿modal de confirmación?, ¿dónde aparece el resumen de cambios?, ¿acordeón como `LogSessionForm`?).
- UX ↔ Architecture: la arquitectura brownfield existente soporta los patrones UI necesarios (Server Components + client forms, `role="status"`/`role="alert"`); sin componentes nuevos sin soporte arquitectónico.

### Warnings

- ⚠️ **UX document missing pero implícita:** la app tiene UI y el PRD define requisitos de interacción (FR8, FR9) sin spec UX formal. Mitigación acordada: las decisiones de UX se tomarán en la spec-013 (`write-spec`) antes de implementar, siguiendo el flujo SDD del repo. No bloquea la creación de épicas; sí conviene resolverlo antes de implementar las historias de UI.

## Epic Quality Review

**No evaluable** — el documento de épicas e historias no existe todavía (pendiente, confirmado por el usuario). No hay estructura, historias, criterios de aceptación ni dependencias que validar.

**Nota para el workflow de épicas:** cuando se cree el documento, aplicar los estándares de esta revisión — épicas con valor de usuario (no hitos técnicos), independencia entre épicas, sin dependencias hacia adelante, tablas creadas solo cuando se necesitan, criterios de aceptación BDD testables y trazabilidad a FRs. Dado el alcance (una feature, spec-013), se prevé una estructura pequeña: 1 épica con 2–4 historias (API de iteración, UI de iteración con confirmación + resumen de cambios, tests del pipeline) o su equivalente según el desglose que acuerde el usuario.

## Summary and Recommendations

### Overall Readiness Status

**READY para crear épicas** · **NOT READY para implementación** (faltan épicas/historias y decisiones de UX de la spec-013).

### Critical Issues Requiring Immediate Action

Ninguno bloqueante. Pendientes documentados:

1. **Documento de épicas inexistente** — esperado: es el siguiente workflow (cobertura FR actual: 0%).
2. **Spec UX ausente para UI de iteración** — FR8 (confirmación) y FR9 (resumen de cambios) requieren decisiones de interacción; se resolverán en la spec-013.
3. **Criterio de "logs nuevos" sin definir** — la regla de bloqueo (FR6) necesita un criterio exacto de comparación (p. ej. `created_at` de sesión > `created_at` del plan activo); decisión de la spec-013.

### Recommended Next Steps

1. Crear épicas e historias con `bmad-create-epics-and-stories` usando este PRD como entrada (objetivo original del usuario).
2. Redactar la spec-013 (`write-spec`) resolviendo las 2 decisiones de diseño abiertas antes de implementar.
3. Implementar spec-013 con `implement-from-spec` cuando esté `approved` (flujo SDD del repo).

### Final Note

This assessment identified 2 gaps (epics pendientes, UX sin formalizar) across 4 categories evaluadas (documentos, PRD, cobertura de épicas, UX). Ningún defecto del PRD: denso, trazable y con alcance explícito. Los hallazgos alimentan el workflow de épicas y la spec-013.

**Assessor:** Devin (PM facilitator) · **Date:** 2026-09-21

