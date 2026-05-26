# Sprint 16.1 FIX

Base: v0.16.0 estable.

Cambios:
- Corrige el bug por el que el botón Editar/Meter resultado no hacía nada desde Jornadas.
- Reutiliza el mismo matchForm, pero lo mueve a la pestaña Jornadas en tiempo de ejecución.
- Campos de partida, jugadores y estado quedan en solo lectura/bloqueados en modo resultado.
- Solo se edita resultado por vacas y avatar usado.
- Auto-refresh queda desactivado por defecto; si se activa, pasa a 5 minutos.
- No se tocan renderVenues(), renderHistory() ni renderPlayers().

Nota Sheet:
- Para guardar avatar en Sheets, añade una columna en matches llamada avatarPlayer o avatarUsedBy.
