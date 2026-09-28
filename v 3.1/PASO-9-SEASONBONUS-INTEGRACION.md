# V3.2.6 — SeasonBonus integración

- `getData()` expone `seasonBonus` y alias `seasonbonus`.
- Nuevo endpoint `getSeasonBonus` como fallback explícito.
- `applyDataPayload()` centraliza el recorrido API -> state.
- Test de integración: payload estilo Apps Script -> state -> standings, con Alvaro perdiendo una partida y conservando +3 de bonus.
- Regresión: 31 PASS / 0 FAIL.
