---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - docs/architecture.md
---

# personalTrAIner - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for personalTrAIner, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

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

### NonFunctional Requirements

- **NFR1:** Navegación y páginas server fluidas en local; sin targets numéricos formales para MVP personal.
- **NFR2:** La iteración semanal (llamada a Gemini) se trata como operación lenta aceptada: estado `submitting` con botón deshabilitado y feedback visible, sin timeout en cliente.
- **NFR3:** Toda ruta de iteración exige sesión (`requireUser`); la seguridad de datos sigue apoyada en RLS por `auth.uid()` y verificación de propiedad en `lib/` (sin service role).
- **NFR4:** Los errores internos no filtran detalles: códigos estables + mensajes genéricos (patrón existente).
- **NFR5:** Un fallo de IA (502/503) nunca deja la app sin plan ni corrompe el plan activo: el supersede solo ocurre tras validar el plan nuevo.
- **NFR6:** La operación supersede+insert mantiene la invariante de ≤1 plan activo por usuario (índice único parcial + retry existente).
- **NFR7:** La UI de iteración mantiene los patrones accesibles existentes: `<label>` nativos, `role="status"`/`role="alert"`, `aria-label`, `fieldset`/`legend`.
- **NFR8:** La integración con Gemini reutiliza los códigos de error estables (`GEMINI_NOT_CONFIGURED`, `GEMINI_REQUEST_FAILED`, `GEMINI_INVALID_PLAN`) y el reintento con hint correctivo; sin fallback a otro proveedor en este MVP.
- **NFR9:** Validación del plan ajustado idéntica a la generación actual (mismo esquema Zod y catálogo LoadMuscle curado; ver Success Criteria → Technical Success).

### Additional Requirements

Requisitos técnicos extraídos de `docs/architecture.md` que impactan épicas y stories:

- **Contexto brownfield:** MVP funcional (specs 001–012 `implemented`); la spec-013 requiere solo **cambios aditivos** (auditoría de arquitectura 2026-09-21: resultado READY). No tocar `proxy.ts`, gates de perfil ni migraciones.
- **Superficie nueva estimada:** 1 route handler nuevo, 1–2 componentes en `components/plan/`, extensión en `lib/plans`/`lib/ai`.
- **Patrón API obligatorio:** Route Handlers finos con `requireUser → parse Zod → función lib → NextResponse`; errores vía `HttpError` → `{error:{code,message}}` con códigos estables mapeados a copys ES en `lib/*/messages.ts`; env solo vía `lib/config/env.ts`.
- **Regla de dominio LoadMuscle:** las `loadmuscle_url` solo salen del catálogo curado (`loadmuscle-catalog.ts`, ~40 ejercicios con aliases ES/EN); sin match → `null` («Técnica pendiente»). Nunca URLs inventadas.
- **Invariante de datos:** ≤1 plan activo por usuario (índice único parcial en `workout_plans` + retry una vez ante 409 CONFLICT).
- **Decisiones pendientes** (se resuelven en la spec-013, no bloquean la arquitectura):
  1. Shape del endpoint de iteración (nuevo vs extender `POST /api/plan/generate`).
  2. Código de error para «sin logs nuevos» (FR6), p. ej. `409 NO_NEW_SESSIONS`.
  3. Mecanismo del resumen de cambios (FR9): calculado en servidor vs cliente.
  4. Progresión de `week_label` («Semana N+1»).
- **Testing:** tests junto al archivo (`*.test.{ts,tsx}`, Jest + RTL), cobertura global ≥75%; tests del pipeline de iteración **antes** del código de producto.
- **Flujo SDD:** la feature se implementará vía spec-013 en `docs/specs/` (spec `approved` antes de código).
- **Sin dependencias nuevas** (stack actual: Next.js, Supabase, Gemini, Jest, Zod).
- **Sin estado global cliente:** cada formulario gestiona su `useState` local.
- **Starter template:** no aplica (proyecto brownfield con scaffold propio ya operativo).

### UX Design Requirements

No existe documento de UX (`*ux*.md`). Los requisitos de UX relevantes están capturados en los FRs/NFRs del PRD:

- Confirmación previa a regenerar (FR8).
- Resumen de cambios respecto a la semana anterior (FR9).
- Estado `submitting` con feedback visible en operación lenta (NFR2).
- Patrones accesibles existentes (NFR7).

### FR Coverage Map

| FR | Épica | Descripción |
|---|---|---|
| FR1 | Epic 1 | Acción explícita en `/plan` para generar la semana siguiente |
| FR2 | Epic 1 | Contexto de iteración: perfil + logs desde el plan activo |
| FR3 | Epic 1 | Generación IA reutilizando el pipeline existente |
| FR4 | Epic 1 | Validación Zod estricta idéntica a la generación actual |
| FR5 | Epic 1 | Supersede del plan anterior + activación del nuevo (≤1 activo) |
| FR6 | Epic 1 | Bloqueo de iteración sin logs nuevos, con copy claro |
| FR7 | Epic 1 | Iteración con logs parciales → ajuste más conservador |
| FR8 | Epic 1 | Confirmación del usuario antes de regenerar |
| FR9 | Epic 1 | Resumen en UI de qué cambió respecto a la semana anterior |
| FR10 | Epic 1 | Errores en español mapeados por `code` |
| FR11 | Epic 1 | Reintento tras fallo con plan activo intacto |
| FR12 | Epic 1 | Historial de planes `superseded` (reutilizado) |

## Epic List

### Epic 1: Iteración semanal — cerrar el ciclo *entrenar → registrar → analizar → ajustar*

Tras entrenar y registrar sus sesiones, el usuario pulsa una acción explícita en `/plan`, confirma, y obtiene el plan de la semana siguiente ajustado a su progreso real — sin decisiones técnicas, sin planes duplicados y sin perder el plan activo si la IA falla.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12

**Notas de implementación:**
- Reutiliza el pipeline existente (Gemini → Zod → catálogo LoadMuscle → supersede+insert) enriquecido con perfil + logs.
- Superficie: 1 route handler nuevo, 1–2 componentes en `components/plan/`, extensión en `lib/plans`/`lib/ai`. Sin tocar `proxy.ts`, gates ni migraciones.
- Decisiones pendientes (endpoint, código de error FR6, mecanismo del resumen FR9, `week_label`) se resuelven en la spec-013.
- Tests del pipeline de iteración antes del código de producto; cobertura ≥75%; sin dependencias nuevas.

## Epic 1: Iteración semanal — cerrar el ciclo *entrenar → registrar → analizar → ajustar*

Tras entrenar y registrar sus sesiones, el usuario pulsa una acción explícita en `/plan`, confirma, y obtiene el plan de la semana siguiente ajustado a su progreso real — sin decisiones técnicas, sin planes duplicados y sin perder el plan activo si la IA falla.

### Story 1.1: Contexto de logs y prompt de iteración

As a usuario de personalTrAIner,
I want que el sistema recopile mi perfil y los logs de sesión registrados desde que el plan activo está vigente,
So that el plan de la semana siguiente se ajuste a mi progreso real sin que yo tome decisiones técnicas.

**Acceptance Criteria:**

**Given** un plan activo vigente y sesiones registradas desde que está activo
**When** se prepara el contexto de iteración
**Then** el contexto incluye el perfil del usuario (nivel, `training_days_per_week`, material, lesiones) y los logs de sesión (peso × reps por ejercicio) posteriores a la creación del plan activo
**And** no se incluyen logs de sesiones anteriores al plan activo

**Given** una semana incompleta (menos sesiones registradas que `training_days_per_week`)
**When** se construye el prompt para Gemini
**Then** incluye la regla de progresión conservadora (menos datos de progreso → ajuste más cauto)

**Given** que no existe ningún log de sesión nuevo desde el plan activo
**When** se solicita el contexto de iteración
**Then** el sistema lo detecta y no construye prompt ni llama a Gemini (base del bloqueo de la Story 1.2)

**Given** el pipeline de iteración en `lib/plans`/`lib/ai`
**When** se implementa
**Then** existen tests unitarios (Jest, junto al archivo) del contexto, del prompt y de las reglas de progresión escritos antes del código de producto, manteniendo cobertura global ≥75%

### Story 1.2: Endpoint de iteración con protecciones

As a usuario de personalTrAIner,
I want un endpoint que genere el plan de la semana siguiente reutilizando el pipeline existente con todas las protecciones,
So that la iteración es segura: sin planes duplicados, sin corromper el plan activo y con errores claros.

**Acceptance Criteria:**

**Given** una sesión de usuario válida y logs nuevos desde el plan activo
**When** se llama al endpoint de iteración
**Then** genera el plan mediante el pipeline reutilizado (Gemini → Zod → catálogo LoadMuscle → supersede+insert) y responde `201` con el plan nuevo `active`

**Given** una llamada sin sesión válida
**When** se procesa la petición
**Then** `requireUser` la rechaza con error de autenticación antes de tocar datos

**Given** que no hay logs nuevos desde el plan activo
**When** se llama al endpoint
**Then** responde con error estable (código a decidir en spec-013, p. ej. `409 NO_NEW_SESSIONS`), no llama a Gemini y el plan activo permanece intacto

**Given** un plan nuevo validado correctamente
**When** se persiste
**Then** el plan anterior pasa a `superseded` y el nuevo a `active`, manteniendo ≤1 plan activo por usuario (índice único parcial + retry una vez ante conflicto)

**Given** un fallo de IA (sin key, error de red, plan inválido tras el reintento con hint correctivo)
**When** el endpoint responde
**Then** usa los códigos estables (`GEMINI_NOT_CONFIGURED`, `GEMINI_REQUEST_FAILED`, `GEMINI_INVALID_PLAN`) con mensaje genérico, sin filtrar detalles internos
**And** el supersede solo ocurre tras validar el plan nuevo, de modo que un fallo nunca deja la app sin plan ni corrompe el plan activo

**Given** el plan ajustado generado
**When** se valida
**Then** supera el mismo esquema Zod estricto que la generación actual: nº de días = `training_days_per_week`, descansos, contenido en español y `loadmuscle_url` solo del catálogo curado (sin match → `null`, nunca URLs inventadas)

**Given** la iteración completada
**When** se consulta el historial
**Then** el plan anterior queda conservado como `superseded` (comportamiento existente reutilizado)

### Story 1.3: UI — acción de iterar con confirmación y feedback

As a usuario de personalTrAIner,
I want una acción explícita en `/plan` que pida confirmación antes de regenerar y muestre el progreso mientras genera,
So that no itero por accidente y sé qué está pasando durante la operación lenta.

**Acceptance Criteria:**

**Given** un plan activo en la pantalla `/plan`
**When** el usuario pulsa la acción de iterar
**Then** se muestra una confirmación antes de regenerar el plan

**Given** la confirmación aceptada
**When** se lanza la iteración
**Then** el botón queda deshabilitado en estado `submitting` con feedback visible, sin timeout en cliente

**Given** un error del endpoint (IA no configurada, fallo de IA, plan inválido, sin logs nuevos)
**When** la UI recibe la respuesta
**Then** muestra el mensaje en español mapeado por `code` usando `role="status"`/`role="alert"` según corresponda

**Given** un fallo de la iteración
**When** el usuario reintenta
**Then** la acción vuelve a estar disponible y el plan activo anterior permanece intacto

**Given** una iteración exitosa
**When** el servidor responde con el plan nuevo
**Then** la UI muestra el plan nuevo `active` (Semana N+1) con datos frescos server-side, en español y con enlaces de técnica LoadMuscle del catálogo
**And** la UI mantiene los patrones accesibles existentes (`<label>` nativos, `aria-label`, `fieldset`/`legend` donde aplique)

### Story 1.4: Resumen de cambios entre semanas

As a usuario de personalTrAIner,
I want ver un resumen de qué cambió en el plan nuevo respecto al anterior,
So that entiendo los ajustes sin tener que comparar los dos planes a mano.

**Acceptance Criteria:**

**Given** una iteración semanal exitosa
**When** se muestra el plan nuevo en la UI
**Then** se presenta un resumen de los cambios respecto a la semana anterior (mecanismo calculado en servidor o cliente: decisión a fijar en la spec-013)

**Given** el resumen de cambios mostrado
**When** se revisa
**Then** es informativo y de solo lectura: no modifica planes ni estados

**Given** los patrones de accesibilidad existentes
**When** se renderiza el resumen
**Then** mantiene los patrones accesibles del repo (`role="status"`, jerarquía de encabezados coherente)
