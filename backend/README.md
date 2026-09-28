# Backend V3

1. Crear/proporcionar el Google Sheet V3 independiente.
2. `SHEET_ID` ya está configurado para el Google Sheet V3.
3. Desplegar como Web App en un proyecto Apps Script V3 independiente.
4. Pegar la URL del despliegue en `js/config.js`.

**No usar ni el Sheet ID ni la URL de Apps Script de V2 PROD.**

La clasificación se calcula dinámicamente desde `matches`; no existe dependencia de una hoja `standings`. Las partidas se identifican por la clave compuesta `seasonId + id`.
