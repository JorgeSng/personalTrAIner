---
name: write-spec
description: Redacta o actualiza specs SDD en docs/specs/ a partir de una idea o requisito. Usar cuando el usuario pide una feature nueva, planificar antes de codear, crear spec, o no existe spec approved para la tarea.
---

# write-spec

## Cuándo usar

- Feature nueva sin spec.
- Usuario describe idea y hay que bajarla a documento.
- Cambio de alcance que invalida spec existente.
- Una spec **draft** crece demasiado → proponer **desglose** (ver abajo) y actualizar `docs/specs/README.md`.

## Pasos

1. Revisar specs existentes en `docs/specs/` y el **roadmap** en `docs/specs/README.md` (orden NNN, dependencias).
2. Valorar **tamaño**: si mezcla infra + UI + API o muchas decisiones independientes → **dividir** en varias specs antes de redactar (consultar al usuario).
3. Copiar estructura de `docs/specs/_template.md` → `docs/specs/NNN-nombre.md`.
4. Rellenar: objetivo, in/out scope, requisitos, criterios de aceptación (solo lo de **esta** spec).
5. Dejar estado **`draft`**.
6. Actualizar tabla del roadmap en `README.md` si añadiste o reordenaste NNN.
7. Presentar resumen al usuario y pedir aprobación explícita para pasar a **`approved`**.

## Cuándo dividir en specs más pequeñas

Consultar al usuario si aplica alguno:

- Infra (migración, RLS) + API + feature (pantallas) en el mismo doc.
- Más de ~8–10 criterios de aceptación de naturaleza distinta.
- Varias decisiones de diseño ortogonales (modelo de datos vs contrato HTTP vs UX).

**Ejemplo acordado (perfil — 3 specs):**

| NNN | Spec | Tipo | Alcance |
|---|---|---|---|
| 003 | profile-schema | infra | Tabla, RLS, Zod — sin UI ni API |
| 004 | profile-api | api | `GET`/`POST`/`PATCH` perfil, `requireUser`, Zod |
| 005 | onboarding-capture | feature | Formulario, redirect, consume API 004 |

Orden: **003 → 004 → 005**. Tras dividir: spec antigua → `superseded` con enlace a las nuevas; no borrar historial.

## Reglas

- No implementar código en la misma sesión salvo que el usuario apruebe la spec y pida implementar.
- **Decisiones de diseño** (UX, modelo de datos, API, carpetas, libs, auth): no elegir en silencio. Listarlas como abiertas, recomendar y esperar OK.
- Stack técnico: si no hay ADR/spec previa, marcar como decisión pendiente en la spec.
- Perfil de usuario (material, lesiones, frecuencia): definir en specs **003–005**, no hardcodear en AGENTS.md.
- Dominio fitness: LoadMuscle en specs de **plan** (006+); el perfil solo prepara datos.
- Git: no `add`/`commit`/`push` sin OK explícito (`AGENTS.md`).

## Salida al usuario

- Path de la spec creada (o plan de desglose si aún no se redacta).
- Lista de decisiones abiertas (si las hay).
- Pregunta: «¿Apruebas la spec para implementar?»
