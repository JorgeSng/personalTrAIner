# SPEC-012: session-log-ui (registrar sesión desde `/plan`)

| Campo | Valor |
|---|---|
| **Estado** | implemented |
| **Tipo** | feature |
| **Fecha** | 2026-08-28 |
| **Supersede** | — (capa UI del desglose session-log 010 → 011 → 012) |
| **Depende de** | [SPEC-011](./011-session-log-api.md) (**implemented**); [SPEC-008](./008-workout-plan-ui.md) (implemented — pantalla `/plan`); [SPEC-002](./002-auth.md) (implemented) |

## Objetivo

Un usuario autenticado **con perfil y plan activo** puede **registrar una sesión de entrenamiento** desde **`/plan`**: por cada día del plan, introducir peso × reps (y series hechas) por ejercicio y persistir vía **`POST /api/sessions`** (011). Medible: tras guardar válido aparece confirmación; los datos quedan en Supabase; la UI **no** escribe en tablas de sesión directo.

## Comportamiento esperado

1. Ruta **`/plan`** (008): sin cambios en auth/gate (sesión + perfil).
2. **Sin plan activo** → no se muestra UI de log (solo vacío + CTA generate existente).
3. **Con plan activo** → cada **día** del plan expone entrada «Registrar sesión» (**D1** / **D2**).
4. Al abrir el formulario de un día:
   - Se pre-cargan los ejercicios de ese `day_index` con `exercise_name` y `exercise_order` del plan (**D3**).
   - Campos editables por ejercicio: `sets_completed`, `weight_kg` (opcional; vacío = peso corporal → `null`), `reps` (texto libre, p. ej. `"10,10,8"`).
   - Campo de sesión: `performed_on` (fecha local, default **hoy** — **D4**), `notes` opcional.
5. **Submit** → `POST /api/sessions` con body alineado a `workoutSessionCreateSchema`:
   - `plan_id` = id del plan activo mostrado.
   - `day_index` = día del bloque.
   - Solo ejercicios **completados** (validación local: al menos 1 con `sets_completed` ≥ 1 y `reps` no vacío) (**D3**).
6. Éxito `201` → mensaje de confirmación en ES; formulario en estado éxito/cerrado; **`router.refresh()`** opcional si hace falta (**D6**). **No** redirect a otra ruta.
7. Errores API visibles en copy ES (`400`, `404 PLAN_NOT_FOUND`, `503`, red/`500`). CTA deshabilitado en vuelo.
8. **Persistencia solo vía API 011** — mismo patrón que 005/008: **no** `insert` directo a Supabase desde el browser (**D7**).
9. **No** listado/histórico de sesiones en MVP de esta spec (**D5**). **No** edición ni borrado (011 no expone PATCH/DELETE).

## Entradas

_N/A como contrato HTTP nuevo._ El formulario mapea al body de `POST /api/sessions` (011).

| Campo UI | Campo API | Reglas |
|---|---|---|
| (implícito) | `plan_id` | UUID del plan activo en pantalla |
| (implícito) | `day_index` | Del bloque día abierto |
| Fecha | `performed_on` | `YYYY-MM-DD`, default hoy (local) |
| Notas sesión | `notes` | opcional; vacío → `null` |
| Nombre ejercicio | `exercise_name` | Snapshot del plan (solo lectura en UI) |
| Orden | `exercise_order` | Índice en el día (0-based, del plan) |
| Series hechas | `sets_completed` | entero ≥ 1 si el ejercicio se incluye |
| Peso (kg) | `weight_kg` | number ≥ 0 o vacío → `null` |
| Reps | `reps` | string min 1 si el ejercicio se incluye |

## Salidas

| Caso | Resultado UI |
|---|---|
| Sin plan | Sin UI de log (comportamiento 008) |
| Abrir formulario día | Campos pre-cargados por ejercicio |
| Submit OK (`201`) | Mensaje éxito; formulario cerrado o reset |
| Validación local | Errores inline; no POST |
| `400 VALIDATION_ERROR` | Mensaje API o campo |
| `404 PLAN_NOT_FOUND` | Mensaje (plan regenerado/borrado) |
| `503` / red / `500` | Mensaje claro; no crash |
| Sin sesión | Redirect login (002) |
| Sin perfil | Redirect onboarding (005/008) |

## Casos límite

- Usuario abre varios formularios de día → permitido (MVP); cada panel es independiente (**D2** A).
- Submit con **0 ejercicios** completos → error local; no llamar API.
- Submit con **1+ ejercicios** parciales del día → válido (API exige min 1).
- `weight_kg` vacío → enviar `null` (peso corporal).
- `reps` con espacios solo → tratar como vacío / error local.
- Plan regenerado tras abrir formulario → POST puede devolver `404 PLAN_NOT_FOUND`; mostrar mensaje y sugerir recargar.
- Doble submit → CTA deshabilitado en vuelo.
- Fecha futura → **bloquear en UI** (**O3** A).

## UX / flujos

Copy en **español**. Visual mínima Tailwind (mismo lenguaje que `/plan` y onboarding: `max-w-*`, zinc, sin UI kit).

### Ruta: `/plan` (extendida)

- Por cada sección de día (`PlanDays` / equivalente): enlace o botón secundario **«Registrar sesión»**.
- Al activar: panel bajo el día con formulario (**D2**).
- Ayuda breve: «Indica series, peso (kg) y reps reales. Deja peso vacío si es a peso corporal.»
- Placeholder reps: p. ej. `10,10,8` o `8`.
- CTA primaria: **«Guardar sesión»**; secundaria: **«Cancelar»** (cierra panel sin POST).

### Flujo feliz

```
/plan (plan activo)
  → Día N → Registrar sesión
  → Rellenar ejercicios hechos (≥1)
  → Guardar sesión → POST /api/sessions → 201
  → Mensaje «Sesión guardada» → panel cerrado
```

### Estados UI (por día)

`idle` (botón visible) → `open` (formulario) → `submitting` → `success` | `error`

## Modelo de datos

Sin tablas nuevas. Consume API 011 y schema 010. `plan_id` del plan activo (`PlanRow.id`).

## Integraciones

- Auth 002; gate perfil 005/008 en `/plan`.
- Lectura del plan: Server Component existente (`getActivePlan`) — **D8**.
- Escritura: **solo** `POST /api/sessions` desde Client Component (**D7**).
- **No** Gemini, **no** LoadMuscle en el formulario de log.
- **No** cambios al contrato 011 salvo bugs bloqueantes.

## Decisiones

### Cerradas (specs anteriores)

| ID | Decisión | Origen |
|---|---|---|
| **C1** | Entrada de log **solo desde `/plan`** (sin rutas `/session` ni `/log`) | SPEC-010 D3 |
| **C2** | Granularidad por ejercicio; snapshot `exercise_name` | SPEC-010 D1–D2 |
| **C3** | Persistencia vía API; no Supabase directo desde UI | Patrón 005/008 |

### Cerradas (2026-08-28)

| ID | Decisión |
|---|---|
| **D1** | Botón **«Registrar sesión» por cada día** del plan |
| **D2** | **Panel expandible inline** bajo el día (no modal) |
| **D3** | Pre-cargar ejercicios del día; **submit solo completados** (≥ 1) |
| **D4** | `performed_on`: **default hoy** (fecha local), **editable** |
| **D5** | **Solo crear** en MVP; sin listado/histórico en `/plan` |
| **D6** | Tras `201`: **mensaje de éxito + cerrar panel** (sin redirect) |
| **D7** | Client island **`LogSessionForm`** en `components/plan/` |
| **D8** | Datos del plan vía **props desde RSC** (`plan.id`, día, ejercicios) |
| **O3** | **Bloquear fecha futura** en validación local UI |

## Fuera de alcance

- Cambios de schema/migración (010) o contrato API (011) salvo bugs.
- Listado, detalle o edición de sesiones guardadas (**D5** A).
- Weekly iteration (**013**).
- Gráficos, export, comparativas de progreso.
- Validar que `day_index` exista en `content.days` más allá de lo que ya muestra el plan.
- Dietas / calorías.
- i18n multi-idioma (solo ES).
- E2E Playwright obligatorio.

## Criterios de aceptación

- [x] En `/plan` con plan activo, cada día muestra entrada «Registrar sesión» (**D1**).
- [x] Formulario permite registrar peso × reps por ejercicio; al menos 1 ejercicio requerido; `weight_kg` vacío → peso corporal.
- [x] Submit llama **solo** a `POST /api/sessions` con `plan_id`, `day_index`, `performed_on`, `notes?`, `exercises[]` válidos.
- [x] Éxito `201` → feedback ES claro; error API/red visible; CTA deshabilitado en vuelo.
- [x] Sin plan activo → no hay UI de log. Auth/gate sin regresiones.
- [x] Tests Jest (+ RTL donde aplique): abrir form, validación local, submit mock 201/400, mensajes error.
- [x] No write directo a Supabase session tables desde el browser.
- [x] No se tocaron archivos fuera de `/plan`, `components/plan/` (o `components/session/`), `lib/` helpers de copy si hace falta, tests y docs de esta spec.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

1. ~~Confirmar decisiones D1–D8 y O3 → `approved`.~~ (hecho 2026-08-28)
2. Copy ES (`lib/sessions/messages.ts` o similar) para errores/éxito.
3. Componente Client `LogSessionForm` (+ tests RTL).
4. Integrar en `PlanDays` / `PlanPanel` con props desde `app/plan/page.tsx` (**D8**).
5. Tests de página/componente.
6. Spec → `implemented` + notas; seguir con **013** cuando corresponda.

## Notas de implementación

- Draft creado con `write-spec` 2026-08-28.
- **Aprobada** por el usuario 2026-08-28 (D1–D8, O3 = opción A en todas).
- **Implementada** 2026-08-28 (`implement-from-spec`).
- Archivos:
  - `components/plan/log-session-form.tsx` — Client island con estados idle/open/submitting/success; `fetch POST /api/sessions`.
  - `components/plan/plan-days.tsx` — integra `LogSessionForm` por día; recibe `planId` desde RSC.
  - `components/plan/plan-panel.tsx` — pasa `plan.id` a `PlanDays`.
  - `lib/sessions/messages.ts` — copy ES (éxito, errores, CTAs).
  - `lib/sessions/log-session-form-helpers.ts` — validación local, payload (`buildSessionCreatePayload`), fecha local.
  - Tests: `log-session-form.test.tsx`, `log-session-form-helpers.test.ts`, `messages.test.ts`; actualizados `plan-panel.test.tsx`, `app/plan/page.test.tsx`.
- Sin desviaciones de D1–D8 ni O3. No se usa `router.refresh()` tras `201` (no requerido por la spec).
- Sin deuda conocida in-scope.
