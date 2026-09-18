# Inventario de componentes — personalTrAIner

9 componentes en `components/`, organizados por dominio. Convención: **Server Components** por defecto; `"use client"` solo donde hay estado, efectos o handlers de evento. Estilos con Tailwind (paleta `zinc`, acentos `amber`/`red`/`emerald` para estados). Copy en español, centralizado en `lib/*/messages.ts`.

## Por dominio

### `components/auth/`

| Componente | Tipo | Rol | Detalles |
|---|---|---|---|
| `LoginForm` | client | Login + signup email/password | Valida con `credentialsSchema` (Zod) antes de llamar a Supabase; tras auth consulta `GET /api/profile` para decidir destino (`/onboarding` vs `?next`); `router.replace` + `router.refresh` |
| `LogoutButton` | client | Cierra sesión | `supabase.auth.signOut()` → `/login` + refresh |
| `HomeShell` | server | Home post-login | Muestra email, enlace a `/plan`, `LogoutButton` |

### `components/onboarding/`

| Componente | Tipo | Rol | Detalles |
|---|---|---|---|
| `OnboardingForm` | client | Captura de perfil | Nivel (beginner/intermediate/advanced), días/sem 1–7, material via presets + items custom (chips), notas de lesiones; valida con `profileSchema`; POST `/api/profile`; maneja `409 CONFLICT` (perfil ya existe) |

### `components/plan/`

| Componente | Tipo | Rol | Detalles |
|---|---|---|---|
| `PlanPanel` | server | Panel del plan | Copy vacío (`PLAN_EMPTY_COPY`) o `week_label` + `PlanDays` |
| `PlanDays` | server | Lista de días/ejercicios | Por día: label o `Día N`, ejercicios con `sets × reps`, notas, descansos (`formatRestSeconds`), `ExerciseTechnique`, y `LogSessionForm` por día |
| `ExerciseTechnique` | server | Enlace de técnica | `Ver técnica` (target _blank, rel noopener) si `loadmuscle_url` https; si no, `Técnica pendiente` |
| `GeneratePlanCta` | client | Generar/regenerar plan | POST `/api/plan/generate` (body `{}`); label cambia según `hasPlan`; mapea `error.code` a copys (`planGenerateErrorMessage`); `router.refresh()` en 201 |
| `LogSessionForm` | client | Registrar sesión por día | Acordeón por día: fecha (≤hoy), notas, por ejercicio series/peso/reps; validación cliente con `buildSessionCreatePayload`; POST `/api/sessions`; estados success/error |

## Patrones observados

- **Sin librería de componentes**: HTML + Tailwind directo; formularios con `<label>` nativos y estados `submitting` para deshabilitar.
- **Manejo de errores de API en cliente**: parse `{error:{code,message}}` → función `*ErrorMessage(code)` en `lib/*/messages.ts` → copy en español. Errores de red → `*_NETWORK_ERROR`.
- **Props mínimas**: las páginas (server) resuelven datos y pasan valores primitivos (`plan`, `hasPlan`, `email`, `nextPath`); los clientes no fetchean salvo submits.
- **Accesibilidad básica**: `role="status"`/`role="alert"` en mensajes, `aria-label` en el form de sesión, `fieldset`/`legend` por ejercicio.
- **Sin design system formal**: repetición deliberada de clases Tailwind (botones `rounded-lg`/`rounded-xl`, inputs `border-zinc-300`); coherente pero sin tokens extraídos.

## No hay

- Componentes de routing/layout compartidos más allá de `RootLayout` (sin nav global, sin sidebar).
- Estado global cliente (sin Context/Redux/Zustand) — cada form gestiona su `useState` local.
- Tests E2E; cobertura = tests unitarios/de componente junto al archivo (`*.test.tsx` con RTL).
