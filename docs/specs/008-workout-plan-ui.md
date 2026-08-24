# SPEC-008: workout-plan-ui (pantalla plan + LoadMuscle)

| Campo | Valor |
|---|---|
| **Estado** | draft |
| **Tipo** | feature |
| **Fecha** | 2026-08-21 |
| **Supersede** | — (sustituye el alcance UI del bloque histórico `workout-plan-engine`) |
| **Depende de** | [SPEC-007](./007-workout-plan-api.md) (draft → must be **implemented** antes de implementar esta); [SPEC-005](./005-onboarding-capture.md) (implemented); [SPEC-002](./002-auth.md) (implemented) |

## Objetivo

Un usuario autenticado **con perfil** puede ver su plan activo en **`/plan`**, **generarlo o regenerarlo** solo vía API 007, y abrir enlaces **LoadMuscle** («Ver técnica») cuando el ejercicio traiga `loadmuscle_url`. Medible: sin plan se muestra vacío + CTA; tras generate exitoso se listan días y ejercicios; la UI no escribe en Supabase directo.

## Comportamiento esperado

1. Ruta **`/plan`** protegida por auth (002). Sin sesión → `/login`.
2. Sin perfil → el gate de 005 sigue mandando a onboarding (no se bypassa desde `/plan`).
3. Al cargar `/plan`: `GET /api/plan`.
   - `data: null` → estado vacío + CTA «Generar plan».
   - `data` presente → muestra `week_label`, días y ejercicios (sets × reps, notes si hay).
4. CTA «Generar plan» / «Regenerar» → `POST /api/plan/generate` (cookies de sesión). Éxito → refrescar vista con el nuevo plan.
5. Si `loadmuscle_url` es https → enlace externo «Ver técnica» (`target="_blank"` + `rel="noopener noreferrer"`). Si ausente/`null` → texto discreto tipo «Técnica pendiente» (sin inventar URL).
6. Errores API visibles (401→login ya cubierto; 503 Gemini/config; 502; precondición perfil; red).
7. Deshabilitar CTA en vuelo (evitar doble submit).
8. Enlace a `/plan` desde la **home** (ajuste mínimo al shell actual).
9. **No** editar ejercicios a mano, **no** PATCH, **no** session log.

## Entradas

_N/A como contrato HTTP nuevo._ Consume `GET /api/plan` y `POST /api/plan/generate` (007).

## Salidas

| Caso | Resultado UI |
|---|---|
| Sin plan | Vacío + «Generar plan» |
| Con plan | Lista días → ejercicios |
| Generate OK | Vista actualizada con plan nuevo |
| Error API | Mensaje claro; no crash |
| URL LoadMuscle | Enlace «Ver técnica» |
| Sin URL | «Técnica pendiente» (o equivalente ES) |
| Sin sesión | Redirect `/login` |

## Casos límite

- Generate largo → loading en CTA; no doble POST.
- 503 sin Gemini → mensaje de configuración (copy ES).
- Plan con mix de URLs válidas y null → solo enlazar las válidas.
- Usuario regenera → ve el nuevo plan (histórico no listado en MVP).

## UX / flujos

Copy en **español**. Visual mínima Tailwind (como login/onboarding).

### Ruta: `/plan` (protegida)

- Título (p. ej. «Tu plan») + `week_label` si hay plan.
- Estados: loading, vacío, listo, error, submitting.
- CTA primaria: «Generar plan» o «Regenerar plan».

### Flujo feliz

```
Home → /plan
  → GET /api/plan → null → Generar → POST generate → 201 → listado
  → GET /api/plan → plan → ver ejercicios → Ver técnica (LoadMuscle)
```

### Home

- Añadir enlace/navegación mínima a `/plan` (sin rediseñar la home).

## Modelo de datos

Sin tablas nuevas. Solo consume API 007 / schema 006.

## Integraciones

- Auth 002; gate perfil 005.
- Plan: GET/POST 007.
- LoadMuscle: solo hipervínculos; **no** embeber assets ni scrapear.
- **No** Gemini desde el browser (solo vía API).

## Decisiones (cerradas 2026-08-21)

| ID | Decisión |
|---|---|
| **D1** | Ruta = `/plan` |
| **D2** | Persistencia solo vía API 007 |
| **D3** | LoadMuscle = enlace si hay URL; si no, pendiente |
| **D4** | Sin editor manual de ejercicios en MVP |
| **D5** | Enlace a `/plan` desde home |

## Fuera de alcance

- Cambios de contrato 007 o schema 006 (salvo bugs bloqueantes).
- Session log (009), weekly iteration (010).
- Dietas / calorías.
- Catálogo LoadMuscle curado.
- Deploy Vercel.

## Criterios de aceptación

- [ ] Existe `/plan` protegida; sin sesión → login.
- [ ] Vacío + generar; con plan muestra días/ejercicios.
- [ ] Generate/regenerar solo vía `POST /api/plan/generate`; sin write directo a Supabase.
- [ ] Enlaces LoadMuscle solo cuando hay URL https; sin inventar URLs.
- [ ] Errores API/red visibles; CTA deshabilitado en vuelo.
- [ ] Home enlaza a `/plan`.
- [ ] Tests Jest (+ RTL) de estados vacíos/listado/error (sin E2E obligatorio).
- [ ] No se tocaron archivos fuera de páginas/componentes de plan, enlace en home, tests y docs de esta spec.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

1. Spec-007 **implemented**.
2. Página `/plan` + componentes de listado/CTA.
3. Enlace desde home.
4. Tests RTL.
5. Spec → `implemented`.

## Notas de implementación

_Rellenar al pasar a `implemented`._
