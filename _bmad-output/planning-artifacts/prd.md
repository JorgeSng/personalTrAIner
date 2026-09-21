---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain-skipped', 'step-06-innovation-skipped', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
releaseMode: single-release
inputDocuments:
  - docs/project-overview.md
  - docs/architecture.md
  - docs/api-contracts.md
  - docs/data-models.md
  - docs/component-inventory.md
  - docs/development-guide.md
  - docs/specs/README.md
  - docs/adr/001-tech-stack.md
workflowType: 'prd'
classification:
  projectType: web_app
  domain: fitness-wellness (general)
  complexity: low
  projectContext: brownfield
scope: 'Solo trabajo pendiente: spec-013 weekly-iteration. Specs 001-012 y deploy Vercel = contexto.'
---

# Product Requirements Document - personalTrAIner

**Author:** Jorge
**Date:** 2026-09-21

## Executive Summary

personalTrAIner es una web app personal (un solo usuario) de entrenamiento con IA orientada a recomposición corporal. El MVP ya funciona en local: auth Supabase, onboarding con perfil (nivel, días/semana, material, lesiones), plan semanal generado con Gemini y validado con Zod, y registro de sesiones reales (peso × reps por ejercicio). Este PRD cubre el único trabajo pendiente del MVP: la **iteración semanal** (spec-013) — cerrar el ciclo *entrenar → registrar → analizar → ajustar*, de modo que la app analice el progreso real y adapte el plan de la semana siguiente sin intervención manual.

Usuario objetivo: el propio propietario, con **0 conocimiento deportivo** — no sabe programar sesiones ni progresiones y no quiere ajustar a mano.

### What Makes This Special

El producto no es el plan estático, sino el **ciclo semanal completo**. Frente a apps de plantillas: la app analiza los logs (peso × reps) y el perfil, y produce un plan adaptado para la semana siguiente. Insight central: el usuario aporta datos y esfuerzo; la IA aporta el conocimiento de programación que le falta. Momento de valor: abrir la app cada semana y encontrar el plan ya ajustado a lo conseguido.

## Project Classification

- **Tipo:** web_app (Next.js 16 App Router, SSR + Route Handlers)
- **Dominio:** fitness/wellness (clasificación `general`; no clínico — sin diagnóstico, sin dietas, sin datos médicos regulados)
- **Complejidad:** baja — 1 usuario, sin compliance, integraciones ya operativas (Supabase, Gemini)
- **Contexto:** brownfield — MVP funcional (specs 001–012 `implemented`); este PRD acota el alcance a la spec-013 (`weekly-iteration`). El deploy a Vercel queda fuera.

## Success Criteria

### User Success

- El usuario completa el ciclo semanal sin conocimiento deportivo: entrena, registra (peso × reps) y, con **una acción explícita suya**, obtiene el plan ajustado de la semana siguiente.
- La iteración nunca es automática: la app propone, el usuario decide cuándo generar la semana siguiente.
- El plan ajustado es entrenable de inmediato: respeta material y lesiones del perfil sin que el usuario tenga que corregir nada.

### Business Success (éxito personal)

- El MVP queda **completo**: el ciclo *entrenar → registrar → analizar → ajustar* funciona de principio a fin dentro de la app.
- Cero planificación manual: sin hojas de cálculo, sin decisiones de progresión por parte del usuario.
- El plan se mantiene útil con el material real; si el usuario actualiza su perfil, el siguiente plan se adapta.

### Technical Success

- Validación Zod del plan ajustado **igual de estricta** que la actual (`workoutPlanContentSchema`: días = `training_days_per_week`, descansos, contenido en español).
- **No se genera un plan nuevo si no hay logs de sesión nuevos** desde el plan activo actual (evita iteraciones vacías y planes duplicados).
- `loadmuscle_url` solo del catálogo curado; sin match → `null` («Técnica pendiente»). Nunca URLs inventadas.
- Gate de cierre existente en verde (`lint:ci` + `typecheck` + `test`, cobertura ≥75%) + tests del pipeline de iteración junto al código.

### Measurable Outcomes

- 1 acción del usuario → 1 plan nuevo `active`; el anterior pasa a `superseded` (≤1 activo, índice parcial existente).
- El plan ajustado supera Zod al primer intento o tras el reintento con hint correctivo (mismo comportamiento que la generación actual).
- 0 ejercicios con material no disponible; 0 URLs LoadMuscle fuera del catálogo.
- Sin logs nuevos → 0 regeneraciones (la acción no crea planes duplicados).

## Product Scope

### MVP - Minimum Viable Product

- **Spec-013 `weekly-iteration`:** ajustar el plan activo según los logs de sesión y el perfil del usuario, mediante acción explícita del usuario.
- Reutiliza el pipeline existente (Gemini → Zod → catálogo LoadMuscle → supersede+insert) enriquecido con el contexto de logs y progreso.

### Growth Features (Post-MVP)

- Historial de progreso con gráficas (evolución de cargas/volumen).
- Edición de perfil desde la UI (hoy solo se captura en onboarding).

### Vision (Future)

- Deploy a Vercel cuando el MVP local esté estable (fuera de este PRD).

## User Journeys

### J1 — Iteración semanal (camino feliz)

Lunes. Jorge termina su primera semana con el plan generado a partir de su perfil (p. ej. intermedio, 3 días, mancuernas + peso corporal, molestia lumbar anotada). Durante la semana registró sus 3 sesiones desde `/plan`: peso × reps por ejercicio. Entra a `/plan`, revisa la Semana 1 y pulsa la acción de iterar. La app recopila perfil + logs, pide a Gemini el plan de la Semana 2, lo valida con Zod y lo guarda como `active`; la Semana 1 pasa a `superseded`. Jorge ve la Semana 2 con cargas progresadas donde cumplió las reps, ajustes donde falló, descansos, contenido en español y enlaces de técnica LoadMuscle. No tomó ninguna decisión técnica: entrenar, registrar, iterar.

### J2 — Sin logs nuevos

Miércoles. Jorge entra a `/plan` sin haber registrado ninguna sesión esta semana y pulsa iterar. La app no llama a Gemini: muestra un mensaje claro (registra al menos una sesión antes de ajustar el plan) y el plan activo permanece intacto. Sin planes duplicados, sin estados corruptos.

### J3 — Semana incompleta (logs parciales)

Jorge solo registró 1 de sus 3 sesiones (viaje de trabajo). Pulsa iterar: la app permite la iteración con los logs disponibles y el ajuste resultante es más conservador (menos datos de progreso → progresión más cauta). La semana parcial queda en historial y la siguiente se genera a partir de lo que hay.

### J4 — Fallo de Gemini

Jorge pulsa iterar; Gemini no responde o devuelve un plan inválido tras el reintento con hint correctivo (502). La app muestra el error en español mapeado por `code`, el plan activo no se toca (el supersede solo ocurre tras validar el plan nuevo) y Jorge puede reintentar cuando quiera.

### Journey Requirements Summary

| Journey | FRs cubiertas |
|---|---|
| J1 — Camino feliz | FR1–FR5, FR9 |
| J2 — Sin logs nuevos | FR6, FR10 |
| J3 — Logs parciales | FR7 |
| J4 — Fallo de IA | FR10, FR11 |

Post-MVP anotado: J5 *material cambiado* (iteración respetando material actualizado) — requiere edición de perfil desde UI.

## Web App Specific Requirements

### Project-Type Overview

Web app personal híbrida con Next.js 16 App Router: páginas server-rendered (Server Components) + componentes client solo donde hay estado/interacción (formularios, botones). Ni SPA pura ni MPA clásico. Un solo despliegue sirve UI y API (Route Handlers).

### Browser Matrix

- Navegadores evergreen recientes: Chrome/Edge, Firefox, Safari (últimas 2 versiones).
- Desktop-first; móvil funcional mediante responsive básico con Tailwind, sin optimización específica.
- Sin navegadores legacy ni polyfills.

### Responsive Design

- Tailwind directo, sin design system formal (patrón actual del repo, coherente).
- Layout usable en desktop y móvil; sin breakpoints especiales para esta feature.

### Performance Targets

- Sin targets formales para MVP personal; ver NFR1–NFR2.
- Datos frescos en cada navegación (Server Components), sin caché agresiva.

### SEO Strategy

- No aplica: app tras login, sin páginas públicas indexables. Únicas superficies públicas: `/login` y `/api/health`.

### Accessibility Level

- Básica, manteniendo patrones existentes: `<label>` nativos, `role="status"`/`role="alert"` en mensajes, `aria-label` en formularios, `fieldset`/`legend` por ejercicio.
- Sin auditoría WCAG formal en MVP (1 usuario).

### Technical Architecture Considerations

- Monolito en capas: `proxy.ts` (sesión) → páginas server (gates auth + perfil) → Route Handlers finos (`requireUser` → Zod → `lib/` → `NextResponse`) → Supabase con RLS.
- La iteración semanal reutiliza el patrón API existente: `HttpError` con códigos estables, copys ES en `lib/*/messages.ts`, env solo vía `lib/config/env.ts`.
- Sin estado global cliente: cada formulario gestiona su `useState` local.

### Implementation Considerations

- Tests junto al archivo (`*.test.{ts,tsx}`, Jest + RTL), cobertura global ≥75%; tests del pipeline de iteración antes del código de producto.
- Flujo SDD: esta feature se implementará vía spec-013 en `docs/specs/` (spec antes de código).

## Project Scoping

### Strategy & Philosophy

**Approach:** Single release — la iteración semanal (spec-013) se entrega como una unidad completa sobre el MVP existente. Filosofía *problem-solving MVP*: cerrar el ciclo entrenar → registrar → analizar → ajustar con el mínimo código nuevo, reutilizando el pipeline de generación ya existente.
**Resource Requirements:** 1 desarrollador; stack actual (Next.js, Supabase, Gemini, Jest). Sin dependencias nuevas.

### Complete Feature Set

**Core User Journeys Supported:** J1 (camino feliz), J2 (bloqueo sin logs), J3 (logs parciales), J4 (fallo de IA).

**Must-Have Capabilities:**

1. Acción explícita en la UI (`/plan`) para generar la semana siguiente.
2. **Confirmación antes de regenerar** el plan (evitar iteraciones accidentales).
3. Bloqueo con copy claro si no hay logs de sesión nuevos desde el plan activo.
4. Iteración permitida con logs parciales; ajuste más conservador con menos datos.
5. Pipeline reutilizado (Gemini → Zod → catálogo LoadMuscle → supersede+insert) enriquecido con perfil + logs.
6. **Resumen en la UI de qué cambió** respecto a la semana anterior.
7. Errores con códigos estables mapeados a copys ES; el plan activo queda intacto si la IA falla.
8. Tests del pipeline de iteración antes del código de producto (cobertura ≥75%).

**Nice-to-Have Capabilities:**

- Ninguno pendiente: los dos propuestos (confirmación previa y resumen de cambios) se **incluyen en el MVP** por decisión del usuario.

### Risk Mitigation Strategy

**Technical Risks:** calidad del plan ajustado → prompt con reglas (material, lesiones, progresión según logs) + validación Zod estricta + reintento con hint correctivo (patrón specs 007/009). Carrera al activar plan → índice único parcial + retry existente.
**Market Risks:** N/A — app personal de un solo usuario; la validación es el uso real semanal.
**Resource Risks:** 1 dev; alcance acotado. Contingencia: si hiciera falta recortar, los candidatos serían la confirmación previa y el resumen de cambios — solo con confirmación explícita del usuario, nunca de forma silenciosa.

## Functional Requirements

### Iteración semanal (núcleo)

- **FR1:** El usuario puede iniciar la iteración semanal desde la pantalla del plan mediante una acción explícita, generando el plan de la semana siguiente.
- **FR2:** El sistema puede recopilar como contexto de la iteración el perfil del usuario (nivel, días, material, lesiones) y los logs de sesión registrados desde que el plan activo está vigente.
- **FR3:** El sistema puede generar el plan de la semana siguiente mediante IA, reutilizando el pipeline de generación existente (Gemini → Zod → catálogo LoadMuscle → supersede+insert).
- **FR4:** El sistema puede validar el plan ajustado con el mismo esquema estricto que la generación actual (nº de días = `training_days_per_week`, descansos, contenido en español, `loadmuscle_url` solo del catálogo curado).
- **FR5:** El sistema puede marcar el plan anterior como `superseded` y activar el nuevo al iterar, manteniendo como máximo un plan activo por usuario.

### Reglas de negocio y protecciones

- **FR6:** El sistema puede impedir la iteración cuando no existe ningún log de sesión nuevo desde el plan activo, informando al usuario de que registre sesiones primero.
- **FR7:** El sistema puede permitir la iteración con logs parciales (semana incompleta), produciendo un ajuste más conservador con menos datos.
- **FR8:** El sistema puede solicitar confirmación del usuario antes de regenerar el plan, para evitar iteraciones accidentales.

### Feedback y visibilidad

- **FR9:** El usuario puede ver en la UI un resumen de qué cambió en el plan nuevo respecto al anterior.
- **FR10:** El usuario puede ver mensajes de error en español cuando la iteración falla (IA no configurada, fallo de IA, plan inválido, sin logs nuevos).
- **FR11:** El usuario puede reintentar la iteración tras un fallo, manteniéndose el plan activo anterior intacto.

### Historial

- **FR12:** El sistema conserva cada plan iterado como `superseded` en el historial del usuario (comportamiento existente, reutilizado).

## Non-Functional Requirements

### Performance

- **NFR1:** Navegación y páginas server fluidas en local; sin targets numéricos formales para MVP personal.
- **NFR2:** La iteración semanal (llamada a Gemini) se trata como operación lenta aceptada: estado `submitting` con botón deshabilitado y feedback visible, sin timeout en cliente.

### Security

- **NFR3:** Toda ruta de iteración exige sesión (`requireUser`); la seguridad de datos sigue apoyada en RLS por `auth.uid()` y verificación de propiedad en `lib/` (sin service role).
- **NFR4:** Los errores internos no filtran detalles: códigos estables + mensajes genéricos (patrón existente).

### Reliability

- **NFR5:** Un fallo de IA (502/503) nunca deja la app sin plan ni corrompe el plan activo: el supersede solo ocurre tras validar el plan nuevo.
- **NFR6:** La operación supersede+insert mantiene la invariante de ≤1 plan activo por usuario (índice único parcial + retry existente).

### Accessibility

- **NFR7:** La UI de iteración mantiene los patrones accesibles existentes: `<label>` nativos, `role="status"`/`role="alert"`, `aria-label`, `fieldset`/`legend`.

### Integration

- **NFR8:** La integración con Gemini reutiliza los códigos de error estables (`GEMINI_NOT_CONFIGURED`, `GEMINI_REQUEST_FAILED`, `GEMINI_INVALID_PLAN`) y el reintento con hint correctivo; sin fallback a otro proveedor en este MVP.
- **NFR9:** Validación del plan ajustado idéntica a la generación actual (mismo esquema Zod y catálogo LoadMuscle curado; ver Success Criteria → Technical Success).
