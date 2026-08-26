# SPEC-009: workout-plan-quality (LoadMuscle + descansos + ES)

| Campo | Valor |
|---|---|
| **Estado** | implemented |
| **Tipo** | feature |
| **Fecha** | 2026-08-26 |
| **Supersede** | — |
| **Depende de** | [SPEC-008](./008-workout-plan-ui.md) (**implemented**); [SPEC-007](./007-workout-plan-api.md) (implemented); [SPEC-006](./006-workout-plan-schema.md) (implemented — se **extiende** Zod `content`) |

## Objetivo

Tras **generar o regenerar** el plan, el usuario ve en `/plan` contenido en **español**, **tiempos de descanso** entre series y entre ejercicios, y enlaces **«Ver técnica»** LoadMuscle cuando el ejercicio está en el **catálogo curado** (o trae una URL https LoadMuscle válida aceptada). Medible: regenerar → labels/nombres/notes en ES; cada ejercicio muestra descansos; ejercicios del catálogo dejan de mostrar solo «Técnica pendiente».

## Comportamiento esperado

1. **Idioma (ES):** el prompt de Gemini exige que todos los strings visibles del plan estén en español: `week_label`, `days[].label`, `exercises[].name`, `exercises[].notes`. `reps` usa formato neutro (`"8-10"`, `"10"`, `"8-10 por pierna"` en ES si hace falta contexto).
2. **Descansos:** cada ejercicio del JSON validado incluye:
   - `rest_between_sets_sec` (entero ≥ 0): segundos entre series.
   - `rest_after_exercise_sec` (entero ≥ 0): segundos de descanso **después** del ejercicio (antes del siguiente). En el **último** ejercicio del día puede ser `0`.
3. **LoadMuscle — híbrido ligero (D1):**
   - Existe un **catálogo curado en el repo** (TS/JSON versionado): nombres/aliases normalizados → URL `https` verificada (dominio LoadMuscle).
   - Tras la respuesta de Gemini y el coerce actual de URLs inválidas → `null` (007 D5):
     1. Si `loadmuscle_url` es https del dominio LoadMuscle permitido → se mantiene.
     2. Si no: match por **nombre normalizado** (y aliases) contra el catálogo → se asigna la URL del catálogo.
     3. Sin match → `null` («Técnica pendiente» en UI 008).
   - **No** scrapear ni inventar URLs fuera del catálogo / whitelist de dominio.
4. El enriquecimiento y los nuevos campos aplican solo en **`POST /api/plan/generate`** (planes antiguos se corrigen **regenerando**). Sin backfill automático al abrir `/plan`.
5. **UI `/plan`:** además de lo de 008, muestra por ejercicio copy en ES de los descansos (p. ej. «Descanso entre series: 90 s», «Descanso hasta el siguiente: 2 min» — formato legible minutos/segundos).
6. Sin cambios de auth, onboarding ni contrato HTTP de rutas (siguen `GET /api/plan` y `POST /api/plan/generate`).
7. Catálogo MVP: ejercicios comunes alineados al equipo típico del onboarding (p. ej. mancuernas / peso corporal); tamaño inicial suficiente para el happy path personal (orden de magnitud **≥ ~25–40** entradas con aliases ES/EN para match).

## Entradas

_N/A como contrato HTTP nuevo._ Sigue consumiendo perfil + `POST /api/plan/generate` (body `{}`).

## Salidas

| Caso | Resultado |
|---|---|
| Generate OK | Plan persistido con campos de descanso; strings ES; URLs rellenadas vía catálogo/whitelist cuando hay match |
| Ejercicio en catálogo | `loadmuscle_url` https → UI «Ver técnica» |
| Sin match LoadMuscle | `loadmuscle_url` null → «Técnica pendiente» |
| Plan previo (pre-009) | Sigue mostrándose; sin descansos/URLs nuevos hasta regenerar |
| UI | Descansos visibles en listado de ejercicios |

## Casos límite

- Gemini omite descansos o manda tipos inválidos → fallo de Zod / reintento correctivo existente (007); si sigue mal → `502 GEMINI_INVALID_PLAN` (no persistir inválido).
- Gemini inventa URL http o no-LoadMuscle → coerce/`null`, luego intento de match por nombre.
- Nombre en inglés en el JSON pero alias en catálogo → match por alias; idealmente el prompt ya pide ES.
- Último ejercicio del día con `rest_after_exercise_sec = 0` → UI puede ocultar «hasta el siguiente» o mostrar 0 según implementación (documentar en notas).
- Catálogo incompleto → algunos «Técnica pendiente» son aceptables; no bloquear el plan entero.
- Sin scrapeo; sin dependencias nuevas sin OK.

## UX / flujos

Copy de chrome de la app: **español** (ya 008). Contenido generado: **español**.

### `/plan` (extensión de 008)

- Por ejercicio, debajo de sets × reps (y notes si hay):
  - Descanso entre series.
  - Descanso hasta el siguiente ejercicio (si > 0, o siempre con copy clara).
- «Ver técnica» / «Técnica pendiente» sin cambio de reglas visuales (008).

### Flujo feliz

```
/plan → Regenerar → POST /api/plan/generate
  → Gemini (ES + descansos)
  → coerce URLs → enrich catálogo
  → Zod (schema extendido) → persist active
  → UI: labels ES + descansos + Ver técnica (si catálogo)
```

## Modelo de datos

Sin tablas nuevas. Extiende la forma Zod de `content` (006) en `workoutPlanContentSchema`:

| Campo | Tipo | Reglas |
|---|---|---|
| `exercises[].rest_between_sets_sec` | `number` int | ≥ 0; **requerido** en planes nuevos (009+) |
| `exercises[].rest_after_exercise_sec` | `number` int | ≥ 0; **requerido**; último del día puede ser `0` |

`loadmuscle_url` sigue https \| null (006/007).

**Catálogo (repo):** p. ej. `lib/plans/loadmuscle-catalog.ts` (o JSON importado) — entradas `{ names: string[], url: string }` con normalización (minúsculas, sin acentos opcionales, trim). No migración SQL.

**Planes legacy** en DB sin los campos nuevos: la UI debe degradar con gracia (no crash) hasta regenerar; la lectura GET no reescribe el JSON.

## Integraciones

- Gemini: prompt actualizado (idioma ES + campos de descanso + recordatorio de no inventar URLs LoadMuscle).
- Pipeline 007: paso de enrich post-coerce, pre-Zod final (o post-parse parcial según diseño mínimo).
- LoadMuscle: solo hipervínculos curados / whitelist; **no** embeber ni scrapear.
- UI 008: mostrar descansos.

## Decisiones

### Cerradas

| ID | Decisión | Cuándo |
|---|---|---|
| **D1** | LoadMuscle = híbrido ligero: whitelist URL LoadMuscle https **o** match catálogo por nombre; si no → `null` | aprobado 2026-08-26 |
| **D2** | Catálogo versionado en **repo** (no tabla Supabase) | aprobado 2026-08-26 |
| **D3** | Descansos en el JSON del ejercicio: `rest_between_sets_sec` + `rest_after_exercise_sec` | aprobado 2026-08-26 |
| **D4** | Enrich + schema nuevo solo en generate/regenerar (sin backfill al GET/`/plan`) | aprobado 2026-08-26 |
| **D5** | Contenido generado obligatorio en **español** vía prompt (+ criterio de aceptación) | aprobado 2026-08-26 |
| **D6** | Roadmap: esta spec = **009**; session-log → **010**; weekly-iteration → **011** | aprobado 2026-08-26 |

## Fuera de alcance

- Session log (**010**), weekly iteration (**011**).
- Scrapeo o catálogo online vivo de LoadMuscle.
- Edición manual de ejercicios / PATCH de plan.
- Backfill automático del plan `active` sin regenerar.
- Traducción automática post-hoc de planes ya guardados en inglés (salvo regenerar).
- i18n multi-idioma (solo ES).
- Deploy Vercel.
- Cambiar auth/onboarding.

## Criterios de aceptación

- [x] Extensión Zod: `rest_between_sets_sec` y `rest_after_exercise_sec` requeridos (≥ 0) en ejercicios; tests Zod actualizados.
- [x] Prompt Gemini exige contenido en español y los campos de descanso.
- [x] Pipeline generate: coerce URLs + enrich desde catálogo (D1); sin scrapeo; URLs inventadas fuera de whitelist/catálogo → `null`.
- [x] Catálogo en repo con entradas MVP suficientes y aliases para match ES/EN.
- [x] UI `/plan` muestra descansos en ES; «Ver técnica» cuando hay URL https tras enrich.
- [x] Plan legacy sin campos nuevos no rompe la UI; regenerar aplica 009.
- [x] Tests Jest: match/enrich catálogo; parse/Zod con fixture ES + descansos; RTL de listado con descansos (y técnica si URL).
- [x] No se tocaron archivos fuera de schema Zod plan, `lib/ai`/`lib/plans`, UI plan, tests y docs de esta spec (y roadmap).
- [x] Roadmap README: 009 = esta spec; 010 session-log; 011 weekly-iteration.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

1. Extender `workoutPlanContentSchema` + tests.
2. Catálogo LoadMuscle + función `enrichLoadmuscleUrls` (o equivalente) + tests de match.
3. Actualizar prompt Gemini (ES + descansos + no inventar URLs).
4. Enganchar enrich en `generate-and-persist` / `parse-plan-content` (orden: coerce → enrich → Zod).
5. UI: mostrar descansos en `components/plan/`.
6. Gate calidad + spec → `implemented` + notas.

## Notas de implementación

- Implementado 2026-08-26 con `implement-from-spec`.
- **Archivos:**
  - `lib/validation/schemas/workout-plan.ts` — `rest_between_sets_sec` / `rest_after_exercise_sec` requeridos.
  - `lib/plans/loadmuscle-catalog.ts` — catálogo curado (solo URLs verificadas) + aliases ES/EN; resolución **exacta** por nombre.
  - `lib/plans/enrich-loadmuscle-urls.ts` — D1: URL curada → keep; else match exacto catálogo; else `null`. Descarta slugs LoadMuscle no curados.
  - `lib/plans/format-rest-seconds.ts` — copy legible (`90 s`, `2 min`).
  - `lib/plans/parse-plan-content.ts` — orden coerce → enrich → Zod.
  - `lib/ai/gemini.ts` — ES + descansos + lista de nombres preferidos del catálogo.
  - `lib/plans/generate-and-persist.ts` — si tras enrich faltan URLs, reintento correctivo con nombres del catálogo (opción 3).
  - `components/plan/plan-days.tsx` — muestra descansos; degrada si faltan (legacy).
- **UX descanso:** si `rest_after_exercise_sec === 0` (p. ej. último del día), se **oculta** «Descanso hasta el siguiente».
- **Mejora post-MVP (2026-08-26):** cobertura LoadMuscle — aliases exactos + prompt/reintento con nombres del catálogo.
- **Corrección (2026-08-26):** se eliminaron slugs inventados que devolvían soft-404. El catálogo solo incluye URLs verificadas (`…: Exercise Guide | LoadMuscle`). Match **solo exacto** por alias; URLs `loadmuscle.com` no curadas se descartan. Preferible «Técnica pendiente» a un enlace incorrecto. Sin match flexible/best-effort.
- Roadmap README: 009 → implemented; 010/011 sin cambio de numeración.
