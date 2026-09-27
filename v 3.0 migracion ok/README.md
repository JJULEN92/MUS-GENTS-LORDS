# MUS GENTS & LORDS — V3.0 MODULAR BASELINE

Objetivo: modularizar V2 sin modificar producción ni introducir cambios funcionales deliberados.

## Principio de regresión
**Mismo input -> mismo output que V2.**

Los cuerpos de las funciones JavaScript se han trasladado desde V2 a módulos clásicos, manteniendo los nombres globales necesarios para los `onclick` existentes. La separación inicial es estructural, no una reescritura.

## Módulos
- `config.js`: URL exclusiva de Apps Script V3.
- `state.js`: estado global.
- `api.js`: busy guard y transporte API.
- `data.js`: carga, normalización y render global.
- `standings.js`: clasificación y all-time.
- `rounds.js`: permisos/estados de partida y dashboard de jornadas.
- `stats.js`: estadísticas.
- `players.js`: perfiles.
- `venues.js`: sedes.
- `history.js`: Hall of Fame.
- `logs.js`: log.
- `match-engine.js`: cálculo/parseo/validación de resultados.
- `auth.js`: login/sesión.
- `matches.js`: formulario, guardado, confirmación y rechazo.
- `ui.js`: navegación/utilidades/backup.
- `pwa.js`: instalación PWA.
- `app.js`: auto-refresh y arranque.

## Antes de ejecutar
Configuración V3 aplicada: Google Sheet y Apps Script V3 ya están conectados en `backend/Code.gs` y `js/config.js`.

## Fase siguiente (NO incluida)
Robustez, concurrencia, validación backend y rediseño del flujo de introducción/confirmación de resultados.
