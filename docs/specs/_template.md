# SPEC-NNN: Título breve

| Campo | Valor |
|---|---|
| **Estado** | draft |
| **Tipo** | feature \| api \| infra |
| **Fecha** | YYYY-MM-DD |
| **Supersede** | — |
| **Depende de** | — (ADR o spec previa, si aplica) |

## Objetivo

Qué debe conseguirse, en una o dos frases medibles.

## Comportamiento esperado

Qué ocurre en el caso normal (flujo de usuario, respuesta de sistema o contrato de API).

## Entradas

_Obligatorio si **Tipo = api**. Opcional en feature/infra._

Parámetros, body, headers, permisos, datos de formulario, etc.

## Salidas

_Obligatorio si **Tipo = api**. Opcional en feature/infra._

Respuesta correcta, códigos de error, formato JSON, estados UI.

## Casos límite

Errores, permisos, datos inválidos, idempotencia, concurrencia, modo degradado (sin API key, sin red).

## UX / flujos

_Obligatorio si **Tipo = feature**. Omitir o breve si **Tipo = api/infra**._

Pantallas, pasos, estados vacíos/carga/error.

## Modelo de datos

_Si aplica._

Entidades, campos, relaciones, migraciones Supabase.

## Integraciones

_Si aplica._

IA (Gemini), Supabase Auth, LoadMuscle (URLs), etc.

## Fuera de alcance

Qué no debe cambiarse ni implementarse en esta spec.

## Criterios de aceptación

- [ ] Caso feliz cubierto.
- [ ] Casos límite / errores cubiertos.
- [ ] Tests Jest creados o actualizados.
- [ ] No se tocaron archivos fuera del alcance.
- [ ] _(Opcional)_ PR enlaza a esta spec.

## Plan de implementación

_Opcional._ Orden sugerido de tareas.

## Notas de implementación

_Rellenar al pasar a `implemented`: archivos tocados, desviaciones, deuda técnica._
