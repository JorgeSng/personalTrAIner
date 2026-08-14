---
name: write-spec
description: Redacta o actualiza specs SDD en docs/specs/ a partir de una idea o requisito. Usar cuando el usuario pide una feature nueva, planificar antes de codear, crear spec, o no existe spec approved para la tarea.
---

# write-spec

## Cuándo usar

- Feature nueva sin spec.
- Usuario describe idea y hay que bajarla a documento.
- Cambio de alcance que invalida spec existente.

## Pasos

1. Revisar specs existentes en `docs/specs/` para evitar duplicados y asignar siguiente NNN.
2. Copiar estructura de `docs/specs/_template.md` → `docs/specs/NNN-nombre.md`.
3. Rellenar: problema, objetivo, in/out scope, requisitos, criterios de aceptación.
4. Dejar estado **`draft`**.
5. Presentar resumen al usuario y pedir aprobación explícita para pasar a **`approved`**.

## Reglas

- No implementar código en la misma sesión salvo que el usuario apruebe la spec y pida implementar.
- Stack técnico: si no hay ADR/spec previa, marcar como decisión pendiente en la spec.
- Perfil de usuario (material, lesiones, frecuencia): definir en spec de onboarding/datos, no hardcodear en AGENTS.md.
- Dominio fitness: incluir LoadMuscle si hay ejercicios; el plan debe consumir perfil persistido.

## Salida al usuario

- Path de la spec creada.
- Lista de decisiones abiertas (si las hay).
- Pregunta: «¿Apruebas la spec para implementar?»
