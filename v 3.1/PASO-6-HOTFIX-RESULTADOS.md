# V3.2.2 — Hotfix resultados

- `saveMatch` ya no vacía columnas no incluidas en una actualización: mezcla el payload con la fila existente usando la clave `(seasonId, id)`.
- La previsualización de una partida editada usa `editingSeasonId`; para una partida nueva usa `activeSeasonId`.
- Sin cambios en reglas de puntuación, permisos ni interfaz.
