# SPEC-008: workout-plan-ui (pantalla plan + LoadMuscle)

| Campo | Valor |
|---|---|
| **Estado** | implemented |
| **Tipo** | feature |
| **Fecha** | 2026-08-25 |
| **Supersede** | — (sustituye el alcance UI del bloque histórico `workout-plan-engine`) |
| **Depende de** | [SPEC-007](./007-workout-plan-api.md) (**implemented**); [SPEC-005](./005-onboarding-capture.md) (implemented); [SPEC-002](./002-auth.md) (implemented) |

## Objetivo

Un usuario autenticado **con perfil** puede ver su plan activo en **`/plan`**, **generarlo o regenerarlo** solo vía API 007, y abrir enlaces **LoadMuscle** («Ver técnica») cuando el ejercicio traiga `loadmuscle_url`. Medible: sin plan se muestra vacío + CTA; tras generate exitoso se listan días y ejercicios; la UI no escribe en Supabase directo.

## Comportamiento esperado

1. Ruta **`/plan`** protegida por auth (002). Sin sesión → `/login?next=/plan`.
2. Sin perfil → gate de onboarding (005) **también** aplica a `/plan`: extender `resolveProfileGateRedirect` (y `PLAN_PATH`) para `/plan` → `/onboarding` (**D6**).
3. Al cargar `/plan`: Server Component llama `getActivePlan` (mismo dato que `GET /api/plan`); Client island solo para generate/regenerar (**D7**).
   - sin plan → estado vacío + CTA «Generar plan».
   - con plan → muestra `week_label`, días y ejercicios (`name`, `sets` × `reps`, `notes` si hay).
4. CTA «Generar plan» / «Regenerar plan» → `POST /api/plan/generate` con body `{}` (cookies de sesión). Éxito `201` → refrescar vista con el nuevo plan. Regenerar **sin** diálogo de confirmación (**D8**).
5. Si `loadmuscle_url` es https → enlace externo «Ver técnica» (`target="_blank"` + `rel="noopener noreferrer"`). Si ausente/`null` → texto discreto «Técnica pendiente» (**no** inventar URL).
6. Errores API visibles en copy ES (503 Gemini/config; 502; `PROFILE_REQUIRED`; red/500). 401 → flujo login ya cubierto por auth.
7. Deshabilitar CTA en vuelo (evitar doble submit). Loading visible mientras genera (puede tardar por Gemini).
8. Enlace de texto «Ver mi plan» desde la **home** (`HomeShell`) hacia `/plan` (**D9**).
9. **No** editar ejercicios a mano, **no** PATCH, **no** session log, **no** listar histórico `superseded`.

## Entradas

_N/A como contrato HTTP nuevo._ Consume datos de plan (007) y `POST /api/plan/generate` para writes.

## Salidas

| Caso | Resultado UI |
|---|---|
| Sin plan | Vacío + «Generar plan» |
| Con plan | Lista días → ejercicios |
| Generate OK | Vista actualizada con plan nuevo |
| Error API | Mensaje claro; no crash |
| URL LoadMuscle | Enlace «Ver técnica» |
| Sin URL | «Técnica pendiente» |
| Sin sesión | Redirect `/login` |
| Sin perfil | Redirect `/onboarding` |

## Casos límite

- Generate largo → loading en CTA; no doble POST.
- `503 GEMINI_NOT_CONFIGURED` → mensaje de configuración (ES).
- `502 GEMINI_INVALID_PLAN` / `GEMINI_REQUEST_FAILED` → mensaje de fallo de generación; plan anterior (si había) sigue visible tras error.
- Plan con mix de URLs válidas y null → solo enlazar las válidas.
- Usuario regenera → ve solo el nuevo activo (histórico no listado); sin confirmación previa.

## UX / flujos

Copy en **español**. Visual mínima Tailwind (mismo lenguaje que login/onboarding: `max-w-*`, tipografía zinc, sin UI kit).

### Ruta: `/plan` (protegida) — **D1**

- Eyebrow tipo «MVP personal · SDD».
- Título: «Tu plan».
- Si hay plan: subtítulo o heading secundario con `week_label`.
- Estados UI: `loading` (si aplica en client al regenerar), `empty`, `ready`, `error`, `submitting`.
- CTA primaria: «Generar plan» (vacío) o «Regenerar plan» (con plan).
- Listado: por cada día (`label` o «Día {day_index}») → ejercicios con sets × reps, notes, técnica.

### Flujo feliz

```
Home → /plan
  → plan null → Generar → POST /api/plan/generate → 201 → listado
  → plan activo → ver ejercicios → Ver técnica (LoadMuscle)
  → Regenerar (sin confirm) → POST generate → 201 → listado nuevo
```

### Home — **D5** / **D9**

- Enlace de texto «Ver mi plan» en `HomeShell` (ajuste mínimo, sin rediseñar la home).

## Modelo de datos

Sin tablas nuevas. Solo consume API 007 / schema 006 (`PlanRow` + `workoutPlanContentSchema`).

## Integraciones

- Auth 002; gate perfil 005 extendido a `/plan` (**D6**).
- Lectura inicial: `getActivePlan` en Server Component (**D7**); write solo vía `POST /api/plan/generate` (**D2**).
- LoadMuscle: solo hipervínculos; **no** embeber assets ni scrapear (**D3**).
- **No** Gemini desde el browser.

## Decisiones

### Cerradas

| ID | Decisión | Cuándo |
|---|---|---|
| **D1** | Ruta = `/plan` | roadmap 2026-08-21 |
| **D2** | Persistencia / generate solo vía API 007 (no write directo a Supabase desde UI) | roadmap 2026-08-21 |
| **D3** | LoadMuscle = enlace si hay URL https; si no, «Técnica pendiente» | roadmap 2026-08-21 |
| **D4** | Sin editor manual de ejercicios en MVP | roadmap 2026-08-21 |
| **D5** | Enlace a `/plan` desde home | roadmap 2026-08-21 |
| **D6** | Gate sin perfil: extender `resolveProfileGateRedirect` (+ `PLAN_PATH`) para `/plan` → `/onboarding` | aprobado 2026-08-25 (ex-O1 A) |
| **D7** | Carga: Server Component + `getActivePlan`; Client island solo para generate | aprobado 2026-08-25 (ex-O2 B) |
| **D8** | Regenerar al clic sin diálogo de confirmación | aprobado 2026-08-25 (ex-O3 A) |
| **D9** | Home: enlace de texto «Ver mi plan» | aprobado 2026-08-25 (ex-O4 A) |

## Fuera de alcance

- Cambios de contrato 007 o schema 006 (salvo bugs bloqueantes).
- Session log (010), weekly iteration (011).
- Edición de perfil desde `/plan`.
- Dietas / calorías.
- Catálogo LoadMuscle curado o scrapeo (pasa a **009**).
- Deploy Vercel.
- i18n multi-idioma (solo ES).

## Criterios de aceptación

- [x] Existe `/plan` protegida; sin sesión → login; sin perfil → onboarding.
- [x] Vacío + «Generar plan»; con plan muestra `week_label`, días y ejercicios.
- [x] Generate/regenerar solo vía `POST /api/plan/generate`; sin write directo a Supabase desde la UI.
- [x] Enlaces LoadMuscle solo cuando hay URL https; sin inventar URLs; si no, «Técnica pendiente».
- [x] Errores API/red visibles; CTA deshabilitado en vuelo con estado de carga.
- [x] Home enlaza a `/plan` con texto «Ver mi plan».
- [x] Tests Jest (+ RTL) de estados vacío / listado / error / técnica pendiente (sin E2E obligatorio).
- [x] No se tocaron archivos fuera de páginas/componentes de plan, gate/paths necesarios, enlace en home, tests y docs de esta spec.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

1. Extender gate de perfil (**D6**) + `PLAN_PATH` en paths.
2. Página `/plan` (RSC + `getActivePlan`) + Client island CTA (**D7**/**D8**).
3. Componentes de listado/ejercicios/LoadMuscle en `components/plan/`.
4. Enlace «Ver mi plan» en `HomeShell` (**D9**).
5. Tests RTL.
6. Spec → `implemented` + notas.

## Notas de implementación

- **Aprobada** por el usuario 2026-08-25 (O1→D6 A, O2→D7 B, O3→D8 A, O4→D9 A).
- **Implementada** 2026-08-25 (`implement-from-spec`).
- **Archivos:**
  - `lib/auth/paths.ts` — `PLAN_PATH`
  - `lib/onboarding/resolve-destination.ts` — gate `/plan` → onboarding (**D6**)
  - `app/plan/page.tsx` — RSC + `getActivePlan` + CTA island
  - `components/plan/` — `plan-panel`, `plan-days`, `exercise-technique`, `generate-plan-cta`
  - `lib/plans/messages.ts` — copy ES de errores generate
  - `components/auth/home-shell.tsx` — enlace «Ver mi plan» (**D9**)
  - Tests: `app/plan/page.test.tsx`, `components/plan/*.test.tsx`, `lib/plans/messages.test.ts`, gate/paths/home
- **Desviaciones:** ninguna. Lectura vía `getActivePlan` (no `fetch` a `GET /api/plan` desde el browser), conforme a **D7**.
- **Deuda / follow-ups:** PR opcional enlazando esta spec; calidad LoadMuscle/descansos/ES en **009**; session-log en **010**.
