---
name: update-spec
description: Actualiza el estado y contenido de una spec tras implementación, cambio de alcance o revisión. Usar después de implementar, cuando la spec queda obsoleta, o al marcar approved/implemented/superseded.
---

# update-spec

## Cuándo usar

- Tras implementar (`implemented`).
- Usuario aprueba draft → `approved`.
- Alcance cambió → editar secciones + historial en notas.
- Spec reemplazada → antigua `superseded`, nueva spec enlazada.

## Transiciones de estado

| De | A | Requisito |
|---|---|---|
| draft | approved | Confirmación explícita del usuario |
| approved | implemented | Código entregado; notas de implementación |
| * | superseded | Nueva spec indicada en campo Supersede |

## Qué actualizar

1. Tabla de metadatos (Estado, Fecha si cambió).
2. Criterios de aceptación: marcar `[x]` los cumplidos.
3. **Notas de implementación**: archivos, desviaciones, deuda, follow-ups.

## Reglas

- No borrar specs históricas.
- Mantener coherencia con código actual.
