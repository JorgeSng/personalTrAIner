# personalTrAIner

Entrenador personal con IA para recomposición corporal — alcance personal.

Stack definido en [docs/adr/001-tech-stack.md](./docs/adr/001-tech-stack.md).

## Requisitos

- Node.js 20+
- npm

## Primer arranque

```bash
cp .env.example .env.local
# Rellenar NEXT_PUBLIC_SUPABASE_* (obligatorio para login). GEMINI_API_KEY opcional.

npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Sin sesión te redirige a `/login`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir build |
| `npm test` | Jest (unit + smoke) |
| `npm run lint` | ESLint |

## API (scaffold)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio e integraciones |
| POST | `/api/plan/generate` | Stub de generación de plan (mock sin `GEMINI_API_KEY`) |

## Autenticación (local)

Supabase Auth (email + password). Las tablas futuras usarán `auth.uid()` (RLS).

1. En [Supabase](https://supabase.com/dashboard) → **Authentication** → **URL configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`
2. **Providers** → Email: desactivar **Confirm email** para el happy path local (esta app no tiene UI de confirmación ni de reset).
3. Crear el usuario desde `/login` → **Crear cuenta**, o a mano en Authentication → Users.
4. Rellenar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`. No hace falta service role.

`GET /api/health` es público. El resto de páginas y `POST /api/plan/generate` exigen sesión.

## Variables de entorno

Ver [.env.example](./.env.example).

## Desarrollo (SDD)

| Recurso | Descripción |
|---|---|
| [AGENTS.md](./AGENTS.md) | Manifiesto del agente y flujo SDD |
| [docs/specs/](./docs/specs/) | Specs de features |
| [docs/adr/](./docs/adr/) | Decisiones de arquitectura |
| [.cursor/rules/](./.cursor/rules/) | Reglas Cursor |

### Flujo rápido

1. Idea → spec en `draft`
2. Revisión → `approved`
3. Implementar → `implemented`

## Deploy (futuro)

Cuando login + Supabase funcionen en local:

1. Proyecto en [Vercel](https://vercel.com) conectado al repo
2. Mismas env vars que `.env.local`
3. En Supabase Auth → URL redirects con dominio Vercel

## Repo

[github.com/JorgeSng/personalTrAIner](https://github.com/JorgeSng/personalTrAIner)
