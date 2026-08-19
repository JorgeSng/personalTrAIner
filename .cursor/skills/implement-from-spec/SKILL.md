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

1. **Leer la spec** completa + `AGENTS.md` **antes de tocar código**.
2. Listar criterios de aceptación; confirmar plan de archivos a tocar.
3. **Si falta una decisión** → preguntar al usuario; **no inventar**.
4. **Escribir o actualizar tests** (Jest) que cubran los criterios **antes** del código de producto.
5. Implementar **solo** in-scope hasta que esos tests pasen; diff mínimo.
6. Verificar cada criterio de aceptación.
7. Ejecutar `npm run lint:ci`, `npm run typecheck` y `npm test` para confirmar calidad; si fallan, corregir antes de continuar.
8. Invocar skill `update-spec` (o actualizar manualmente):
   - Estado → `implemented`
   - Rellenar «Notas de implementación» (archivos, desviaciones).
9. **Resumir** qué líneas o secciones de la spec cubre cada cambio.

## Reglas

- Lee la spec antes de tocar código.
- Si falta una decisión, pregunta antes de implementar; no inventes.
- Escribe o actualiza tests antes del código.
- No modifiques archivos fuera del alcance sin pedir confirmación.
- Al final, resume qué líneas de la spec cubre cada cambio.
- Desviación de la spec o del enfoque acordado → **consultar al usuario** antes de continuar; no sustituir por alternativas unilaterales.
- Desviación documentada → actualizar spec o notas con motivo.
- No añadir features no listadas en la spec.
- No `add`/`commit`/`push` ni otras operaciones git mutables sin OK explícito (`AGENTS.md`).

## Salida al usuario

- Qué se implementó vs spec.
- Criterios cumplidos / pendientes.
- Path de spec actualizada.
- Mapa **spec → cambio**: sección o líneas de la spec cubiertas por cada archivo/diff.
