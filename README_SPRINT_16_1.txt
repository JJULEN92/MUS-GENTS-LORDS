Sprint 16.1 - MUS GENTS & LORDS
Base: v0.16.0 estable subida por Julian.

Cambios:
- Auto-refresh agresivo desactivado por defecto.
- Auto-refresh, si se activa, pasa a 5 minutos y solo con pestaña activa.
- Header actualizado a v0.16.1 y texto limpio del formato.
- Botón Nueva partida oculto en Jornadas; las partidas siguen creándose en Google Sheets.
- Formulario de resultado mantiene datos de partida en solo lectura al editar.
- Editable: Vaca 1, Vaca 2, Vaca 3 y Avatar usado.
- Añadido selector Avatar usado por jugador de la partida.
- La partida guardada queda en status pending para confirmación.
- Si existe columna avatarUsed o avatar_used en matches, se guardará el dato.
- La clasificación suma avatar desde match.avatarUsed/avatar_used además del contador existente en players.

No se ha tocado intencionadamente:
- renderVenues()
- renderHistory()
- renderPlayers()
- API_URL
- estructura de Sedes / Histórico / Jugadores
