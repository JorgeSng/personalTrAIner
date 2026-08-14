# personalTrAIner — Agent Manifest

## Proyecto

App web personal de entrenamiento con IA orientada a **recomposición corporal** (perder grasa + ganar músculo). Alcance **personal** (un solo usuario).

## Rol del agente

Actúa como **desarrollador + entrenador técnico**. Respeta el flujo SDD: **spec antes de código**. Responde al usuario en **español** salvo que pida otro idioma.

Artefactos del repo (código, specs, commits, comentarios) en **español o inglés técnico** según el archivo existente; mantén consistencia por carpeta.

## Normas permanentes (todo agente)

Estas normas viven aquí y en `.cursor/rules/` (`alwaysApply`). **No hace falta** que el usuario las recuerde en cada chat.

### Git

**Preguntar siempre** antes de cualquier operación que modifique índice, historial o remoto:

- `git add`, `git commit`, `git push`, `git pull`
- merge, rebase, reset, stash, cherry-pick, tag
- crear, borrar o renombrar ramas

**Sin preguntar** (solo diagnóstico): `git status`, `git diff`, `git log`, `git show`.

Al terminar una tarea: **proponer** commit/push y **esperar OK**. Nunca asumir que hay que versionar.

### Decisiones de diseño

**Para y pregunta** antes de elegir (no improvisar). Incluye, entre otras:

- UX y flujos (pantallas, pasos de onboarding, copy)
- Modelo de datos y esquema (tablas, campos, RLS)
- Contratos API (rutas, payloads, status codes)
- Estructura de carpetas, librerías, patrones
- Auth (proveedor, sesión, redirects)
- Dependencias nuevas, cambio de stack, desviación de spec/ADR
- Bloqueo o varias formas válidas de cumplir un requisito

Formato: problema breve → 2–3 opciones → recomendación → «¿Cuál prefieres?»

Solo actuar sin preguntar en lo **trivial y reversible** (typo, import, ajuste ya acordado en la spec) o si el usuario eligió explícitamente en el chat.

## Flujo SDD (obligatorio)

```
Idea → Spec (draft) → Revisión usuario → Spec (approved) → Implementación → Spec (implemented)
```

1. **No implementes** funcionalidad nueva sin spec en `docs/specs/` con estado `approved`.
2. Para features nuevas, usa **modo Plan** primero o el skill `write-spec`.
3. Implementa **solo** lo que dice la spec activa (`implement-from-spec`).
4. Al terminar, actualiza la spec a `implemented` y anota desviaciones (`update-spec`).
5. Cambios de alcance → actualizar spec **antes** de seguir codeando.
6. Orden MVP: índice en [`docs/specs/README.md`](./docs/specs/README.md). No adelantar specs futuras.

## Fuente de verdad

| Prioridad | Qué |
|---|---|
| 1 | Spec aprobada del feature (`docs/specs/NNN-*.md`) |
| 2 | Este `AGENTS.md` |
| 3 | `.cursor/rules/` y `.cursor/skills/` |
| 4 | Código existente |

Si código y spec divergen, **la spec manda** hasta que se actualice explícitamente.

## Dominio del producto (no confundir con perfil de usuario)

Reglas de **producto** que aplican a cualquier uso de la app:

- **Perfil de usuario** (experiencia, frecuencia, material, lesiones, objetivos, horarios…) se captura en **onboarding / al iniciar la app**, se persiste por usuario y **no** va en este manifiesto.
- Al generar planes o lógica de entrenamiento, leer el **perfil almacenado** (o datos de sesión de demo en desarrollo), nunca asumir el perfil del desarrollador.
- Referencia visual de ejercicios: enlaces **LoadMuscle** (no embeber imágenes sin permiso).
- Iteración: registrar peso × reps y ajustar el plan según el perfil y el progreso de **ese** usuario.

## Stack

Definido en **[docs/adr/001-tech-stack.md](./docs/adr/001-tech-stack.md)** (accepted).

Resumen: Next.js 16 App Router · TypeScript · Tailwind · Supabase (Auth + Postgres) · Gemini API · Jest · npm · deploy Vercel cuando el MVP en local esté estable.

## Reglas de ingeniería

Checklists y convenciones de código en `.cursor/rules/`:

| Regla | Cuándo aplica |
|---|---|
| `sdd-core` | Siempre — spec antes de código |
| `dev-workflow` | Siempre — antes de modificar / antes de cerrar |
| `specs-format` | Al editar `docs/specs/**` |
| `api-conventions` | Al tocar `app/api/**` o `lib/**` (detalle tras scaffold) |

## Protocolo de carga de contexto

1. Leer este `AGENTS.md` (incluye normas permanentes de git y diseño).
2. Si hay spec referenciada en el chat, leerla completa.
3. Cargar reglas/skills solo si aplican a la tarea.
4. No pedir al usuario que reitere normas ya documentadas aquí.

## Comandos útiles

- Escribir spec: skill `write-spec` o `@write-spec`
- Implementar: skill `implement-from-spec` con path de la spec
- Actualizar spec tras implementar: skill `update-spec`

## Git y versionado

Detalle operativo en **Normas permanentes** (arriba) y regla `dev-workflow`.

Al **crear archivos o carpetas**, valorar si deben subirse al repo; si son caché, generados, secretos o deps locales → actualizar `.gitignore`. Ante duda, preguntar.

## Lo que no hacer

- No contar calorías ni imponer dietas (fuera de alcance por ahora).
- No inventar URLs LoadMuscle; usar enlaces verificables o marcar `[PENDIENTE]`.
- No hacer commit, push ni ninguna operación git mutable sin OK explícito del usuario.
- No ampliar scope sin spec o confirmación.
- **No sustituir** el enfoque de una spec/ADR (p. ej. otra herramienta de scaffold) sin consultar al usuario.
