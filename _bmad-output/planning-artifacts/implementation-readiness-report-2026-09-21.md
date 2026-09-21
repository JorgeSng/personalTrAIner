---
stepsCompleted: ['step-01-document-discovery', 'step-02-prd-analysis', 'step-03-epic-coverage-validation', 'step-04-ux-alignment', 'step-05-epic-quality-review', 'step-06-final-assessment']
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - docs/architecture.md
  - _bmad-output/planning-artifacts/epics.md
documentsPending: []
workflowType: 'implementation-readiness'
---

# Implementation Readiness Assessment Report

**Date:** 2026-09-21
**Project:** personalTrAIner

## Document Inventory

| Tipo | Documento | Estado | Decisión |
|---|---|---|---|
| PRD | `_bmad-output/planning-artifacts/prd.md` (whole, 15,1 KB, 2026-09-21) | Encontrado | Usar para assessment |
| Architecture | `docs/architecture.md` vía symlink `_bmad-output/planning-artifacts/architecture.md` (auditado, ver AGENTS.md) | Encontrado | Usar para assessment |
| Epics & Stories | `_bmad-output/planning-artifacts/epics.md` (whole, 14,5 KB, 2026-09-21 17:19) | Encontrado | Usar para assessment |
| UX Design | — | No existe | Hueco anotado; app con UI pero sin spec UX formal |

Sin duplicados (no coexisten versiones whole + sharded de ningún documento).

Nota: este informe sobrescribe el assessment de hoy 14:03, que quedó obsoleto al generarse antes de que existiera `epics.md`.

## PRD Analysis

### Functional Requirements

FR1: El usuario puede iniciar la iteración semanal desde la pantalla del plan mediante una acción explícita, generando el plan de la semana siguiente.
FR2: El sistema puede recopilar como contexto de la iteración el perfil del usuario (nivel, días, material, lesiones) y los logs de sesión registrados desde que el plan activo está vigente.
FR3: El sistema puede generar el plan de la semana siguiente mediante IA, reutilizando el pipeline de generación existente (Gemini → Zod → catálogo LoadMuscle → supersede+insert).
FR4: El sistema puede validar el plan ajustado con el mismo esquema estricto que la generación actual (nº de días = `training_days_per_week`, descansos, contenido en español, `loadmuscle_url` solo del catálogo curado).
FR5: El sistema puede marcar el plan anterior como `superseded` y activar el nuevo al iterar, manteniendo como máximo un plan activo por usuario.
FR6: El sistema puede impedir la iteración cuando no existe ningún log de sesión nuevo desde el plan activo, informando al usuario de que registre sesiones primero.
FR7: El sistema puede permitir la iteración con logs parciales (semana incompleta), produciendo un ajuste más conservador con menos datos.
FR8: El sistema puede solicitar confirmación del usuario antes de regenerar el plan, para evitar iteraciones accidentales.
FR9: El usuario puede ver en la UI un resumen de qué cambió en el plan nuevo respecto al anterior.
FR10: El usuario puede ver mensajes de error en español cuando la iteración falla (IA no configurada, fallo de IA, plan inválido, sin logs nuevos).
FR11: El usuario puede reintentar la iteración tras un fallo, manteniéndose el plan activo anterior intacto.
FR12: El sistema conserva cada plan iterado como `superseded` en el historial del usuario (comportamiento existente, reutilizado).

Total FRs: 12

### Non-Functional Requirements

NFR1: Navegación y páginas server fluidas en local; sin targets numéricos formales para MVP personal.
NFR2: La iteración semanal (llamada a Gemini) se trata como operación lenta aceptada: estado `submitting` con botón deshabilitado y feedback visible, sin timeout en cliente.
NFR3: Toda ruta de iteración exige sesión (`requireUser`); la seguridad de datos sigue apoyada en RLS por `auth.uid()` y verificación de propiedad en `lib/` (sin service role).
NFR4: Los errores internos no filtran detalles: códigos estables + mensajes genéricos (patrón existente).
NFR5: Un fallo de IA (502/503) nunca deja la app sin plan ni corrompe el plan activo: el supersede solo ocurre tras validar el plan nuevo.
NFR6: La operación supersede+insert mantiene la invariante de ≤1 plan activo por usuario (índice único parcial + retry existente).
NFR7: La UI de iteración mantiene los patrones accesibles existentes: `<label>` nativos, `role="status"`/`role="alert"`, `aria-label`, `fieldset`/`legend`.
NFR8: La integración con Gemini reutiliza los códigos de error estables (`GEMINI_NOT_CONFIGURED`, `GEMINI_REQUEST_FAILED`, `GEMINI_INVALID_PLAN`) y el reintento con hint correctivo; sin fallback a otro proveedor en este MVP.
NFR9: Validación del plan ajustado idéntica a la generación actual (mismo esquema Zod y catálogo LoadMuscle curado).

Total NFRs: 9

### Additional Requirements

- **Alcance acotado (brownfield):** solo spec-013 `weekly-iteration`; specs 001–012 y deploy Vercel = contexto, fuera de alcance.
- **Reutilización obligatoria:** pipeline existente Gemini → Zod → catálogo LoadMuscle → supersede+insert; patrón API existente (`HttpError` con códigos estables, copys ES en `lib/*/messages.ts`, env vía `lib/config/env.ts`).
- **Sin dependencias nuevas** ni fallback a otro proveedor de IA en este MVP.
- **Tests antes del código de producto** (Jest + RTL, cobertura global ≥75%); tests del pipeline de iteración junto al código.
- **Flujo SDD:** la feature se implementará vía spec-013 en `docs/specs/` (spec antes de código).
- **UX/UI:** acción explícita en `/plan` + confirmación previa + resumen de cambios; desktop-first con responsive básico Tailwind; accesibilidad con patrones existentes (`label`, `role="status"/"alert"`, `aria-label`, `fieldset`/`legend`).
- **Browser matrix:** evergreen recientes (Chrome/Edge, Firefox, Safari, últimas 2 versiones); sin legacy ni polyfills.
- **SEO:** no aplica (app tras login; superficies públicas solo `/login` y `/api/health`).
- **Journeys con mapeo explícito:** J1→FR1–FR5, FR9; J2→FR6, FR10; J3→FR7; J4→FR10, FR11. J5 (material cambiado) anotado post-MVP.
- **Riesgos con mitigación:** calidad del plan → prompt con reglas + Zod estricto + reintento con hint; carrera al activar → índice único parcial + retry.

### PRD Completeness Assessment

- **Estructura:** completa y bien organizada — 12 FRs numerados con texto completo y agrupados por tema, 9 NFRs categorizados (performance, security, reliability, accessibility, integration), success criteria medibles y 4 journeys con trazabilidad a FRs.
- **Claridad:** alta. Cada FR es accionable y verificable; las protecciones de negocio (FR6, FR8) y las invariantes técnicas (≤1 plan activo, supersede solo tras validación) están explícitas.
- **Coherencia con el repo:** el PRD es brownfield y referencia patrones existentes con nombres reales (`workoutPlanContentSchema`, `requireUser`, `lib/config/env.ts`), lo que facilita la validación contra el código.
- **Huecos menores:** no se detectan FRs ambiguos ni sin dueño. El alcance post-MVP está separado correctamente (gráficas de progreso, edición de perfil, J5).
- **Conclusión:** PRD listo para servir de base de trazabilidad contra épicas/stories.

## Epic Coverage Validation

### Coverage Matrix

| FR | Requisito PRD (resumen) | Cobertura en épicas | Estado |
|---|---|---|---|
| FR1 | Acción explícita en `/plan` para generar la semana siguiente | Epic 1 → Story 1.3 (acción explícita en `/plan`) | ✓ Covered |
| FR2 | Contexto de iteración: perfil + logs desde el plan activo | Epic 1 → Story 1.1 (contexto de logs y prompt) | ✓ Covered |
| FR3 | Generación IA reutilizando pipeline existente | Epic 1 → Story 1.2 (pipeline reutilizado) + Story 1.1 (prompt) | ✓ Covered |
| FR4 | Validación Zod estricta idéntica a la generación actual | Epic 1 → Story 1.2 (AC: mismo esquema Zod, días, descansos, español, catálogo) | ✓ Covered |
| FR5 | Supersede del plan anterior + ≤1 plan activo | Epic 1 → Story 1.2 (supersede+insert, índice único parcial + retry) | ✓ Covered |
| FR6 | Bloqueo de iteración sin logs nuevos | Epic 1 → Story 1.1 (detección, AC 3) + Story 1.2 (error estable, no llama a Gemini) + Story 1.3 (copy en UI) | ✓ Covered |
| FR7 | Logs parciales → ajuste más conservador | Epic 1 → Story 1.1 (AC: regla de progresión conservadora en prompt) | ✓ Covered |
| FR8 | Confirmación del usuario antes de regenerar | Epic 1 → Story 1.3 (AC: confirmación antes de regenerar) | ✓ Covered |
| FR9 | Resumen en UI de qué cambió | Epic 1 → Story 1.4 (dedicada al resumen de cambios) | ✓ Covered |
| FR10 | Errores en español mapeados por `code` | Epic 1 → Story 1.2 (códigos estables) + Story 1.3 (mapeo por `code` en UI) | ✓ Covered |
| FR11 | Reintento tras fallo con plan activo intacto | Epic 1 → Story 1.3 (AC: reintento disponible, plan intacto) + Story 1.2 | ✓ Covered |
| FR12 | Historial de planes `superseded` (reutilizado) | Epic 1 → Story 1.2 (AC: historial conserva `superseded`) | ✓ Covered |

FRs en épicas pero NO en PRD: ninguno (el inventario de épicas replica exactamente FR1–FR12 del PRD).

### Missing Requirements

Ninguno. Los 12 FRs del PRD tienen ruta de implementación trazable en Epic 1.

Observaciones de trazabilidad (sin ser huecos de cobertura):

- El FR Coverage Map de `epics.md` mapeaba a nivel de épica; tras la higiene aplicada el 2026-09-21 incluye columna de story (asignación verificada contra los Accept Criteria de cada story).
- La Story 1.1 declara explícitamente su dependencia con la 1.2 (detección de «sin logs nuevos» como base del bloqueo).
- Las decisiones de diseño marcadas como pendientes (shape del endpoint, código de error FR6, mecanismo del resumen FR9, `week_label`) quedan aplazadas a la spec-013 — coherente con el flujo SDD del repo, pero habrá que consultarlas al usuario al redactar la spec.

### Coverage Statistics

- Total PRD FRs: 12
- FRs cubiertos en épicas: 12
- Porcentaje de cobertura: 100%

## UX Alignment Assessment

### UX Document Status

**No encontrado.** No existe `*ux*.md` en `_bmad-output/planning-artifacts/` ni en el resto del repo (verificado con búsqueda global en el paso 1).

### ¿UX implícita? Sí

- El PRD menciona interfaz de usuario de forma explícita y extensa: acción de iterar en `/plan` (FR1), confirmación previa (FR8), resumen de cambios (FR9), estado `submitting` con feedback (NFR2), patrones accesibles (NFR7).
- Componentes web implícitos: Next.js 16 App Router con Server Components + client components; superficie nueva estimada de 1–2 componentes en `components/plan/`.
- Aplicación user-facing: sí (aunque de un solo usuario).

### Alineación UX ↔ PRD

Los requisitos de UX relevantes están capturados en el PRD sin necesidad de documento UX formal:

| Requisito UX | Dónde vive | Cobertura en épicas |
|---|---|---|
| Confirmación antes de regenerar | FR8 | Story 1.3 (AC: confirmación) |
| Resumen de cambios entre semanas | FR9 | Story 1.4 (dedicada) |
| Feedback en operación lenta | NFR2 | Story 1.3 (AC: `submitting`, botón deshabilitado) |
| Accesibilidad (labels, roles, fieldset) | NFR7 | Stories 1.3 y 1.4 (ACs explícitos) |

El PRD cubre además browser matrix, responsive, nivel de accesibilidad y SEO en su sección «Web App Specific Requirements».

### Alineación UX ↔ Arquitectura

`docs/architecture.md` (auditada 2026-09-21, resultado **READY**) soporta explícitamente las necesidades de UI:

- Cobertura declarada de 12 FRs + 9 NFRs, incluidos los patrones UI accesibles.
- Estructura prevista: 1 route handler nuevo, 1–2 componentes en `components/plan/`, extensión en `lib/plans`/`lib/ai` — sin tocar `proxy.ts`, gates ni migraciones.
- Convención de errores con `code` estable mapeado a copys ES (`lib/*/messages.ts`), que la UI consume (Story 1.3).

### Alignment Issues

Ninguna incoherencia detectada entre PRD, épicas y arquitectura. Los 4 FRs con contenido UX (FR8, FR9, FR10, FR11) tienen soporte declarado en arquitectura y ACs en las stories 1.3/1.4.

### Warnings

- **WARNING (bajo, aceptado):** no existe spec UX formal pese a que la feature añade UI (acción de iterar, confirmación, resumen de cambios). Mitigado porque: (1) los requisitos UX están capturados como FRs/NFRs del PRD, (2) la app reutiliza patrones UI existentes del repo (Tailwind directo, sin design system formal), y (3) es una app personal de un solo usuario. Si en el futuro se añaden flujos UX nuevos (p. ej. edición de perfil desde UI, post-MVP), convendría crear la spec UX con `bmad-create-ux-design`.

## Epic Quality Review

Estructura evaluada: **1 épica, 4 stories** (1.1 Contexto de logs y prompt · 1.2 Endpoint con protecciones · 1.3 UI de iterar · 1.4 Resumen de cambios).

### A. User Value Focus (épica)

- **Título:** «Iteración semanal — cerrar el ciclo entrenar → registrar → analizar → ajustar» — centrado en el usuario y su ciclo, no en un hito técnico. ✓
- **Goal:** describe outcome de usuario («obtiene el plan de la semana siguiente ajustado a su progreso real — sin decisiones técnicas, sin planes duplicados y sin perder el plan activo si la IA falla»). ✓
- **Value proposition:** el beneficio es perceptible con la épica sola: el ciclo semanal completo funciona de principio a fin. ✓

Sin red flags: no hay épicas de tipo «Setup Database», «API Development» ni «Infrastructure Setup».

### B. Epic Independence

- Una sola épica → la independencia entre épicas se cumple por construcción (no existe Epic 2 que requiera Epic 3, ni dependencias circulares). ✓

### Story Quality Assessment

**Story 1.1 — Contexto de logs y prompt de iteración**
- Valor de usuario: claro en el «So that» (ajuste al progreso real sin decisiones técnicas).
- ACs: Given/When/Then correctos y testeables; cubre camino feliz, semana incompleta (FR7), detección de «sin logs nuevos» (base de FR6) y tests previos al código.
- Nota: la referencia a la Story 1.2 es solo informativa (declara que la detección es «base del bloqueo» de 1.2); 1.1 no depende de trabajo futuro. Sin dependencia hacia delante. ✓

**Story 1.2 — Endpoint de iteración con protecciones**
- Valor: iteración segura (sin duplicados, sin corromper plan activo, errores claros).
- ACs: 7 bloques Given/When/Then que cubren camino feliz (201 + plan `active`), auth (`requireUser`), bloqueo sin logs (FR6), supersede con invariante ≤1 activo + retry, códigos de error estables sin filtrar detalles, validación Zod idéntica (FR4) y conservación en historial (FR12). Completo, específico y testeable, incluidos escenarios de error. ✓
- Dependencias: usa salida de 1.1 (permitido: N puede usar N−1). Sin referencias hacia adelante. ✓

**Story 1.3 — UI: acción de iterar con confirmación y feedback**
- Valor de usuario claro; ACs cubren confirmación (FR8), estado `submitting` (NFR2), errores mapeados por `code` (FR10), reintento con plan intacto (FR11), render del plan nuevo con datos frescos y patrones accesibles (NFR7). ✓
- Dependencia: usa salida de 1.1 y 1.2. Correcta (hacia atrás). ✓

**Story 1.4 — Resumen de cambios entre semanas**
- Valor de usuario: entender los ajustes sin comparar a mano (FR9). ACs: resumen tras iteración exitosa, solo lectura, accesibilidad. Testeable. ✓
- La decisión servidor vs cliente queda aplazada a la spec-013 de forma explícita — el AC sigue siendo verificable con cualquiera de las dos opciones. ✓

### Dependency Analysis

- **Dentro de la épica:** cadena 1.1 → 1.2 → 1.3 / 1.4, todas las dependencias apuntan hacia atrás. Ninguna story requiere una story futura. ✓
- **Creación de tablas:** no aplica — la arquitectura prohíbe migraciones en esta feature (cambios aditivos sobre el esquema existente); no se crean tablas nuevas. ✓

### Special Implementation Checks

- **Starter template:** no aplica (brownfield con scaffold propio) — coherente con arquitectura. ✓
- **Brownfield:** la épica declara puntos de integración con lo existente (pipeline Gemini→Zod→catálogo→supersede+insert, patrón API, componentes existentes) y explícitamente no requiere stories de migración (sin tocar `proxy.ts`, gates ni migraciones). ✓

### Best Practices Compliance Checklist — Epic 1

- [x] Epic delivers user value (ciclo semanal completo, no hito técnico)
- [x] Epic can function independently (única épica; no requiere trabajo futuro)
- [x] Stories appropriately sized (4 stories con reparto lógico: contexto → endpoint → UI → resumen)
- [x] No forward dependencies
- [x] Database tables created when needed (N/A: sin migraciones)
- [x] Clear acceptance criteria (Given/When/Then en las 4 stories)
- [x] Traceability to FRs maintained (FR Coverage Map + FRs covered por épica)

### Quality Findings

**🔴 Critical Violations:** ninguna.

**🟠 Major Issues:** ninguna.

**🟡 Minor Concerns:**

1. **Story 1.1 es una story de cimiento:** su valor de usuario solo se materializa al completarse 1.2/1.3. Aceptable en una épica única brownfield entregada como unidad, pero es el punto donde un slicing vertical alternativo (endpoint mínimo end-to-end primero) habría dado valor visible antes. Informativo, no requiere acción.
2. **Story 1.2 formulada en términos de sistema** («I want un endpoint…») en lugar de capacidad de usuario. El «So that» compensa con valor de usuario claro. Cosmético.
3. **FR Coverage Map a nivel de épica:** el mapa de `epics.md` asigna los 12 FRs a «Epic 1» sin desglosar por story; la trazabilidad fina se deduce de los ACs (verificado en Epic Coverage Validation). Cosmético.
4. **Duplicación de la descripción de la épica:** el título + goal de Epic 1 aparecen dos veces (en `## Epic List` y en la sección detallada `## Epic 1`). Inofensivo, pero puede confundir al mantener el documento.

### Recomendaciones

- Ningún cambio bloqueante para pasar a implementación.
- Opcional (higiene de documento): eliminar la duplicación del bloque descriptivo de Epic 1 entre «Epic List» y la sección detallada, y añadir la columna de story al FR Coverage Map cuando se revise el documento.

## Summary and Recommendations

### Overall Readiness Status

**READY** — PRD, Arquitectura y Épicas/Stories están completos y alineados. La cobertura de requisitos es del 100% (12/12 FRs trazables a Epic 1) y los 9 NFRs tienen soporte declarado en la arquitectura (auditada READY el 2026-09-21). No hay issues críticos ni mayores.

Resumen por dimensión:

| Dimensión | Resultado | Detalle |
|---|---|---|
| Inventario de documentos | ✓ Completo | PRD, Arquitectura (vía symlink auditado) y Épicas encontrados; sin duplicados; UX inexistente (warning mitigado) |
| Análisis del PRD | ✓ Completo | 12 FRs + 9 NFRs con texto completo, success criteria medibles, journeys J1–J4 mapeados a FRs |
| Cobertura FR → Épicas | ✓ 100% | 12/12 FRs cubiertos en Epic 1; ningún FR huérfano ni requisito fantasma |
| Alineación UX | ✓ Con warning | Sin spec UX formal; requisitos UX capturados en FRs/NFRs y soportados por arquitectura auditada |
| Calidad de épicas | ✓ Con observaciones | 1 épica, 4 stories; dependencias correctas (sin forward dependencies); 4 hallazgos menores, todos cosméticos o informativos |

### Critical Issues Requiring Immediate Action

Ninguno.

### Recommended Next Steps

1. **Redactar la spec-013 (`weekly-iteration`)** vía skill `write-spec` (flujo SDD del repo). Durante la redacción, **consultar al usuario las 4 decisiones de diseño pendientes** que épicas y arquitectura dejan abiertas: (a) shape del endpoint de iteración (nuevo vs extender `POST /api/plan/generate`), (b) código de error para «sin logs nuevos» (FR6, p. ej. `409 NO_NEW_SESSIONS`), (c) mecanismo del resumen de cambios (FR9, servidor vs cliente), (d) progresión de `week_label`.
2. **Implementar con `implement-from-spec`** solo cuando la spec-013 esté `approved`, con tests del pipeline de iteración antes del código de producto (cobertura global ≥75%) y gate de cierre en verde (`lint:ci` + `typecheck` + `test`).
3. **Higiene de `epics.md` — aplicada (2026-09-21):** eliminada la duplicación de la descripción de Epic 1 (quedaba en «Epic List» y en la sección detallada; ahora solo en la detallada) y añadida la columna de story al FR Coverage Map.
4. **Opcional — spec UX:** solo si se añaden flujos UX nuevos post-MVP (p. ej. edición de perfil desde UI), crearla con `bmad-create-ux-design`. Para spec-013, los requisitos UX ya capturados en FRs/NFRs son suficientes.

### Final Note

This assessment identified 4 issues across 1 category (all minor/cosmetic: story de cimiento, formulación de Story 1.2, mapa FR a nivel de épica, descripción duplicada de Epic 1) y 1 warning aceptado (sin spec UX formal, mitigado por captura en FRs/NFRs y patrones UI existentes). No hay issues críticos ni mayores: los artefactos están alineados y la trazabilidad es completa. Puedes proceder a la Fase 4 (spec-013 → implementación) tal cual, o aplicar primero la higiene de documento opcional.

**Assessor:** Implementation Readiness workflow (BMAD) — rol PM de traceabilidad
**Date:** 2026-09-21
