---
name: implement-from-spec
description: Implementa código siguiendo una spec approved en docs/specs/. Usar cuando el usuario pide implementar, construir, o desarrollar una feature y ya existe spec con estado approved.
---

# implement-from-spec

## Precondiciones

- Spec en `docs/specs/` con estado **`approved`** (path conocido o indicado por el usuario).
- Si solo hay `draft` → parar y pedir aprobación.
- Si la spec indica una herramienta o enfoque y hay **bloqueo u alternativas** → presentar opciones al usuario y **esperar OK** antes de desviarse (ver `AGENTS.md`).

## Pasos

1. Leer la spec completa + `AGENTS.md`.
2. Listar criterios de aceptación; confirmar plan de archivos a tocar.
3. Implementar **solo** in-scope; diff mínimo.
4. Verificar cada criterio de aceptación.
5. Invocar skill `update-spec` (o actualizar manualmente):
   - Estado → `implemented`
   - Rellenar «Notas de implementación» (archivos, desviaciones).

## Reglas

- Desviación de la spec o del enfoque acordado → **consultar al usuario** antes de continuar; no sustituir por alternativas unilaterales.
- Desviación documentada → actualizar spec o notas con motivo.
- No añadir features no listadas en la spec.
- No `add`/`commit`/`push` ni otras operaciones git mutables sin OK explícito (`AGENTS.md`).
- Decisiones de diseño no resueltas en la spec → preguntar; no elegir por cuenta propia.

## Salida al usuario

- Qué se implementó vs spec.
- Criterios cumplidos / pendientes.
- Path de spec actualizada.
