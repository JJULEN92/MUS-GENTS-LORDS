# V3.2.8 — Season bonus fuente autoritativa + DIF Pozo

- `loadData()` consulta siempre `getSeasonBonus` después de `getData`.
- La respuesta específica de `seasonbonus` reemplaza el array recibido en `getData`.
- Si esa llamada falla, se conserva el valor recibido en `getData` como fallback.
- Corregida la fila del Pozo de avatares para incluir DIF antes de JG.
- No cambia ninguna regla deportiva.
