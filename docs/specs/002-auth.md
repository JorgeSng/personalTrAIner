# SPEC-002: Auth (login, sesión, rutas protegidas)

| Campo | Valor |
|---|---|
| **Estado** | implemented |
| **Tipo** | feature |
| **Fecha** | 2026-08-14 |
| **Supersede** | — |
| **Depende de** | [SPEC-001](./001-project-scaffold.md) (implemented); [ADR-001](../adr/001-tech-stack.md) (accepted) |

## Objetivo

El usuario único de la app puede **iniciar sesión**, **mantener sesión** (cookies SSR de Supabase Auth) y **cerrar sesión**. Las rutas de producto (páginas y APIs salvo health) exigen sesión; sin ella se redirige o se responde 401.

Medible: con Supabase configurado, un usuario válido entra, recarga y sigue autenticado, cierra sesión y ya no accede a rutas protegidas.

## Comportamiento esperado

1. **Sin sesión** → no se muestra contenido de producto. Páginas protegidas redirigen a `/login` (con `?next=` relativo interno). APIs de producto responden **401** con `HttpError` (`UNAUTHORIZED`).
2. **Login correcto** (email + password) → Supabase emite sesión; se persiste en cookies vía `@supabase/ssr` (clientes ya en `lib/supabase/client.ts` y `lib/supabase/server.ts`). Redirect a `next` si es path relativo interno, si no a `/`.
3. **Signup** en la misma pantalla `/login` (CTA «Crear cuenta») → cuenta en `auth.users` + sesión + mismo redirect que login.
4. **Recarga / nueva pestaña** → la sesión sigue válida hasta expirar o logout.
5. **Logout** → `signOut` + cookies; redirect a `/login`. Un GET posterior a una ruta protegida no entra.
6. **Ya autenticado en `/login`** → redirect a `/` (no re-mostrar el formulario).
7. **`GET /api/health`** sigue **público**.
8. **`POST /api/plan/generate`** exige sesión; sin ella 401. No se cambia la lógica del stub Gemini.
9. **Sin env Supabase** → la UI de login no crashea; mensaje explícito. Login/signup no son usables hasta configurar env.
10. **Protección:** `proxy.ts` (convención Next.js 16; no `middleware.ts`) refresca cookies y redirige páginas; el servidor verifica con `getUser` / `requireUser()` (patrón `@supabase/ssr`).

## Entradas

Login y signup (mismo formulario, validado con Zod):

| Campo | Tipo | Reglas |
|---|---|---|
| `email` | string | Obligatorio; formato email |
| `password` | string | Obligatorio; mínimo 6 caracteres (límite por defecto de Supabase) |

Logout: acción autenticada (botón); sin body.

No se usa `SUPABASE_SERVICE_ROLE_KEY`. Auth va con anon key + cookies de usuario.

## Salidas

| Caso | Resultado |
|---|---|
| Login OK | Sesión en cookies; redirect a `next` (path relativo interno) o `/` |
| Signup OK | Cuenta creada; sesión en cookies; mismo redirect |
| Login/signup KO (Auth) | Permanece en login; mensaje genérico (no revelar si el email existe) |
| Validación KO | Mensaje de campo; no llamar a Supabase |
| Logout OK | Sin sesión; redirect a `/login` |
| Página protegida sin sesión | Redirect a `/login?next=<path relativo>` |
| API producto sin sesión | `401` `{ "error": { "code": "UNAUTHORIZED", "message": "..." } }` |
| API producto con sesión | Comportamiento actual del stub (no cambiar Gemini) |
| Health | `200` como hoy, sin exigir auth |

## Casos límite

- Credenciales inválidas o usuario inexistente → error genérico; no enumerar cuentas.
- Email/password vacíos o mal formados → error de validación local.
- Signup con email ya registrado → mensaje genérico (no enumerar).
- Proyecto Supabase inalcanzable / timeout → error de red visible; no crash.
- Env ausente → mensaje de configuración; no intentar `createClient` sin env (`isSupabaseConfigured` / `HttpError` `SUPABASE_NOT_CONFIGURED`).
- Sesión caducada → mismo tratamiento que sin sesión (redirect / 401). El proxy **refresca** tokens renovables.
- Usuario autenticado que pide `/login` → redirect a `/`.
- Doble submit → deshabilitar el botón en vuelo.
- `next` absoluto, protocolo o `//` → ignorar y usar `/` (anti open-redirect).
- Confirmación de email: **sin UI**. En local, desactivar «Confirm email» en el dashboard (documentado en README).

## UX / flujos

Visual mínima (Tailwind, sin UI kit). Copy en **español**.

### Pantalla login (`/login`) — pública

- Título + email + password.
- CTA principal «Entrar».
- CTA secundario «Crear cuenta» (misma pantalla, no wizard).
- Estados: idle, submitting, error de validación, error de Auth, error de env no configurado.

### Home autenticada (`/`) — protegida

- Shell mínima: «sesión iniciada» + email (o id de `auth.users`) + botón **Cerrar sesión**.
- Sustituye la landing del scaffold. No onboarding, no perfil, no generación de plan.

### Rutas

| Públicas | Protegidas |
|---|---|
| `/login`, `GET /api/health`, estáticos | `/` y el resto de páginas; `POST /api/plan/generate` y demás APIs de producto |

## Modelo de datos

No hay tablas de aplicación en esta spec.

- Identidad: `auth.users` (gestionado por Supabase Auth).
- Sesión: cookies HTTP (SSR); no localStorage como fuente de verdad en el servidor.
- **No** crear tabla `profiles` ni migraciones de perfil (spec-**003**).
- RLS: no hay tablas propias que proteger aún. README: las tablas futuras usarán `auth.uid()` (ADR-001).

## Integraciones

- **Supabase Auth** con los clientes existentes (`@supabase/ssr`, `@supabase/supabase-js`). Sin dependencias nuevas.
- Dashboard local (manual): Authentication → URL `http://localhost:3000`; desactivar Confirm email para el happy path local.
- Env: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`.env.example`). Sin service role.
- Gemini / LoadMuscle: no tocar.

## Decisiones cerradas

Aprobadas por el usuario (2026-08-14), pack recomendado:

| ID | Decisión |
|---|---|
| D1 | Email + password (no magic link) |
| D2 | Login + «Crear cuenta» en `/login` |
| D3 | `/` es la app (protegida); `/login` y health públicos |
| D4 | `proxy.ts` (Next.js 16) + `getUser` en server; `?next=` relativo interno. No usar `middleware.ts` (deprecado). |
| D5 | Sin UI de confirm email ni reset; README para local |
| D6 | `requireUser()` en APIs de producto; health público |
| D7 | Tests Jest con mocks (validación, 401, redirects); sin E2E |

## Fuera de alcance

- Onboarding y perfil de entrenamiento (specs **003–005**).
- Motor de plan, Gemini de verdad, enlaces LoadMuscle (spec-**006**).
- Registro de sesiones / peso × reps (spec-**007**) e iteración semanal (spec-**008**).
- Deploy Vercel y redirect URLs de producción.
- OAuth, MFA, magic link.
- UI de recuperar contraseña y de confirmar email.
- Tabla `profiles`, migraciones SQL, RLS sobre tablas de producto.
- Playwright / E2E.
- Dietas o calorías.
- Dependencias nuevas no justificadas. El stack actual (`@supabase/ssr`, Zod, Jest, Tailwind) debe bastar.

## Criterios de aceptación

- [x] Caso feliz: login con usuario válido → home autenticada; recarga mantiene sesión; logout → login y las protegidas ya no entran.
- [x] Signup desde `/login` crea cuenta y deja sesión iniciada.
- [x] Sin sesión: páginas protegidas redirigen a `/login?next=…`; `POST /api/plan/generate` responde 401; `GET /api/health` sigue 200.
- [x] Credenciales inválidas y validación de formulario cubiertas (mensaje genérico / errores de campo).
- [x] `next` no relativo interno se ignora (redirect a `/`).
- [x] Sin `NEXT_PUBLIC_SUPABASE_*`: login no crashea; mensaje de configuración.
- [x] Tests Jest: validación Zod, `requireUser` 401 vs sesión mock, redirects (mocks; no E2E).
- [x] No se implementó onboarding, plan, logs ni deploy.
- [x] No se añadieron tablas de perfil ni service role.
- [x] README: cómo crear el usuario (signup en UI o dashboard) y desactivar confirmación de email en local.
- [x] No se tocaron archivos fuera de auth / protección de rutas / docs de esta spec.
- [x] Intercepto de rutas en `proxy.ts` (`export async function proxy`), no en `middleware.ts`.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

Rama: `feat/spec-002-auth`. No ejecutar en `main`.

1. Helper de sesión server-side (`getUser` / `requireUser`) sobre `lib/supabase/server.ts`.
2. `proxy.ts`: refresh de cookies + redirect de páginas protegidas (`next` seguro). Función exportada `proxy`.
3. Página `/login` + validación Zod + signup.
4. Adaptar `app/page.tsx` a shell autenticada + logout.
5. Proteger `POST /api/plan/generate`; dejar health público.
6. Tests Jest del set D7.
7. README (usuario local, URLs de Auth, confirm email).

## Notas de implementación

- **2026-08-14:** Implementado en `feat/spec-002-auth`. Línea base Jest: 2 suites / 4 tests. Tras el cambio: 12 suites / 31 tests. `npm test`, `npm run lint`, `npx tsc --noEmit` y `npm run build` OK.
- Helpers: `lib/auth/session.ts` (`getUser` / `requireUser`) sobre el cliente de `lib/supabase/server.ts`; `sanitizeNextPath`; `resolvePageRedirect`.
- `proxy.ts` (Next.js 16) refresca cookies (`lib/supabase/middleware.ts`, helper SSR) y redirige páginas. APIs no se redirigen: 401 vía `requireUser`.
- UI: `/login` (Entrar + Crear cuenta), `/` shell autenticada + logout. Copy en español.
- `POST /api/plan/generate` exige sesión; `GET /api/health` público. Stub Gemini sin cambios de lógica.
- Tests Jest con mocks (Zod, sesión, redirects, formulario, 401, proxy). Tests de route handlers y `proxy.ts` en entorno `node`.
- `jest.config.mjs`: `moduleNameMapper` `@/` para que `jest.mock` resuelva alias.
- README: Site URL local, desactivar Confirm email, signup en UI o dashboard.
- **2026-08-14 (alcance):** D4 actualizado: `middleware.ts` deprecado en Next 16.3 → `proxy.ts` + `export async function proxy`. Misma lógica; se elimina `middleware.ts`.
- **2026-08-17:** Verificado en local por el usuario: signup, sesión, recarga, logout; usuario visible en Supabase Auth. Spec-002 dada por cerrada; siguiente spec activa del roadmap: 003.
- Sin tablas `profiles`, sin service role, sin onboarding/plan/deploy.
