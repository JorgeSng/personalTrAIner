# SPEC-005: onboarding-capture (captura de perfil)

| Campo | Valor |
|---|---|
| **Estado** | implemented |
| **Tipo** | feature |
| **Fecha** | 2026-08-20 |
| **Supersede** | — |
| **Depende de** | [SPEC-004](./004-profile-api.md) (implemented); [SPEC-002](./002-auth.md) (implemented) |

## Objetivo

Un usuario autenticado **sin fila** en `profiles` completa un formulario de onboarding y persiste el perfil **solo** vía `POST /api/profile` (spec-004). Tras éxito, entra en la home de producto. Medible: sin perfil no se queda en home; con perfil creado vía API, la app deja de forzar onboarding.

## Comportamiento esperado

1. **Gate de perfil:** usuario autenticado y `GET /api/profile` → `{ data: null }` → se le lleva a onboarding (no se muestra la home de producto como destino estable).
2. **Usuario autenticado con perfil** (`data` no null) que visita onboarding → redirect a home (`/`).
3. **Formulario de onboarding** captura los campos del contrato 004:
   - `experience_level`
   - `training_days_per_week`
   - `equipment` (≥ 1 ítem no vacío)
   - `injuries_notes` (opcional; puede omitirse o enviarse `null`)
4. Al enviar con datos válidos → `POST /api/profile` (cookies de sesión). Éxito `201` → redirect a `/`.
5. **Persistencia:** la UI **no** hace `insert`/`update` directo a Supabase sobre `profiles`; solo consume la API 004.
6. Errores de API visibles en UI (validación 400, conflicto 409, no configurado 503, red/500).
7. Sin sesión → sigue aplicando el gate de auth (spec-002): redirect a `/login`.
8. **No** implementa generación de plan, LoadMuscle ni edición posterior de perfil (PATCH) salvo lo mínimo del gate.

## Entradas

_N/A como contrato HTTP nuevo._ El formulario mapea al body de `POST /api/profile` (spec-004).

| Campo UI | Campo API | Reglas |
|---|---|---|
| Nivel de experiencia | `experience_level` | `beginner` \| `intermediate` \| `advanced` |
| Días/semana | `training_days_per_week` | entero 1–7 |
| Material | `equipment` | ≥ 1 string no vacío |
| Lesiones / notas | `injuries_notes` | opcional; vacío → omitir o `null` |

## Salidas

| Caso | Resultado UI |
|---|---|
| Sin perfil, autenticado | Pantalla onboarding usable |
| Submit OK (`201`) | Redirect a `/` |
| Validación local o `400` | Mensajes de error; permanece en onboarding |
| `409 CONFLICT` | Mensaje de conflicto; opción de ir a home o reintentar GET |
| `503` / error de red / `500` | Mensaje claro; no crash |
| Con perfil en `/onboarding` | Redirect a `/` |
| Sin sesión | Redirect `/login` (002) |

## Casos límite

- Doble submit → deshabilitar CTA en vuelo.
- `equipment` vacío o solo espacios → no llamar API; error de validación local (alineado Zod).
- Usuario crea perfil en otra pestaña → `409` al POST; UI no debe romper.
- Env Supabase ausente → mensaje de configuración (consistente con login).
- Login/signup exitoso sin perfil → destino onboarding (no home como fin del flujo).
- Usuario con perfil → login/signup → home (como hoy, sin pasar por onboarding).

## UX / flujos

Copy en **español**. Visual mínima Tailwind (como login), sin UI kit.

### Ruta: `/onboarding` (protegida) — **D1**

- Título + breve ayuda (“Cuéntanos cómo entrenas”).
- Campos del perfil (**una sola pantalla** — **D2**).
- CTA principal «Guardar y continuar».
- **Sin skip** (**D6**): hay que completar el perfil.
- Estados: idle, loading perfil (si aplica), submitting, error campo, error API.

### Flujo feliz

```
Login/signup OK
  → GET /api/profile
  → data null → /onboarding → POST /api/profile → /
  → data perfil → /
```

### Gate — **D4**

- Tras login/signup y al entrar a `/`: si autenticado y sin perfil → `/onboarding`.
- Extender la lógica de redirect de producto (p. ej. `resolvePageRedirect` + comprobación de perfil en server) para que `/` no sea destino estable sin perfil.

### Labels UI

| API | Label ES |
|---|---|
| `beginner` / `intermediate` / `advanced` | Principiante / Intermedio / Avanzado |
| `training_days_per_week` | Días de entrenamiento por semana |
| `equipment` | Material disponible |
| `injuries_notes` | Lesiones o limitaciones (opcional) |

### Material (`equipment`) — **D3**

- Checklist de **presets** cortos (MVP: Mancuernas, Barra/dominadas, Banco, Bandas, Peso corporal; labels ES en UI, values estables al API).
- Campo **Otro** + «Añadir» → chip eliminable.
- Al POST: unión de presets marcados + chips libres → `equipment: string[]` (≥ 1).

### Edición — **D5**

- Esta spec solo **alta** (`POST`). Sin pantalla de edición ni `PATCH`.
## Modelo de datos

Sin tablas nuevas. Usa `public.profiles` (003) vía API (004).

## Integraciones

- Auth/sesión: spec-002 (`getUser` / proxy / cookies).
- Perfil: `GET` + `POST` `/api/profile` (004).
- Zod cliente opcional: reutilizar `profileSchema` para validación local antes del POST.
- **No** Gemini, **no** LoadMuscle, **no** service role.

## Decisiones (cerradas 2026-08-20)

| ID | Decisión |
|---|---|
| **D1** | Ruta = `/onboarding` |
| **D2** | Una sola pantalla (sin wizard) |
| **D3** | Material = presets + tag libre («Otro») |
| **D4** | Gate con redirect server (`/` y post-login → onboarding si no hay perfil) |
| **D5** | Solo alta (`POST`); sin edición/`PATCH` en esta spec |
| **D6** | Sin skip: hay que completar el perfil |

## Fuera de alcance

- Cambios de contrato en `/api/profile` (004).
- Migraciones / RLS (003).
- Motor de plan / Gemini / LoadMuscle (006+).
- Pantalla de edición de perfil con PATCH (fuera; D5).
- Deploy Vercel.
- Dietas / calorías / campos fuera del MVP de 003.

## Criterios de aceptación

- [x] Existe pantalla de onboarding en `/onboarding`; protegida por auth.
- [x] Usuario autenticado **sin** perfil es redirigido a onboarding (no permanece en `/` como destino final).
- [x] Usuario **con** perfil que visita onboarding → redirect a `/`.
- [x] El formulario envía `POST /api/profile` con el shape de 004; **no** escribe en Supabase directo.
- [x] Submit OK → redirect a `/`; errores API/validación visibles.
- [x] Login/signup sin perfil termina en onboarding; con perfil, en `/`.
- [x] Tests Jest (+ RTL) del formulario y/o lógica de redirect/gate (sin E2E obligatorio).
- [x] No se tocaron archivos fuera de páginas/componentes/helpers de onboarding, ajustes mínimos de redirect auth, y tests/docs de esta spec.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

1. ~~Cerrar decisiones D1–D6~~ (hecho 2026-08-20).
2. ~~Añadir página + formulario onboarding (validación local + POST; material presets + Otro).~~
3. ~~Cablear gate post-login y en `/` (sin perfil → `/onboarding`).~~
4. ~~Redirect `/onboarding` → `/` si ya hay perfil.~~
5. ~~Tests Jest/RTL.~~
6. ~~Spec **approved** (2026-08-20).~~ Implementado 2026-08-20.

## Notas de implementación

- **Archivos principales:**
  - `app/onboarding/page.tsx` — ruta protegida + gate con perfil.
  - `components/onboarding/onboarding-form.tsx` — formulario (Zod local + `POST /api/profile`).
  - `lib/onboarding/*` — presets material, mensajes, destinos post-auth/gate, lectura de perfil para gate server.
  - `app/page.tsx` — redirect a `/onboarding` si autenticado sin perfil.
  - `components/auth/login-form.tsx` — tras login/signup, `GET /api/profile` y destino onboarding o `next`.
  - `lib/auth/paths.ts` — constante `ONBOARDING_PATH`.
- **Gate server:** la comprobación en `/` y `/onboarding` usa `getSessionProfile` (lectura Supabase RLS vía cliente server), no `insert`/`update`. La persistencia del formulario sigue solo por API 004.
- **Presets equipment (values API):** `dumbbells`, `bar_pullups`, `bench`, `bands`, `bodyweight`.
- **Desviaciones:** ninguna de alcance; el gate server no pasa por `fetch` interno a `/api/profile` (evita URL absoluta frágil en RSC).
- **Tests:** formulario RTL, páginas home/onboarding, helpers de destino/presets/perfil, login post-auth.
