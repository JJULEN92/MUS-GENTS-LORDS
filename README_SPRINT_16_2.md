# Sprint 16.2

Base: Sprint 16.1 FIX.

Cambios:
- Corrige que los jugadores salían vacíos al editar desde Jornadas.
- Inserta opciones de jugador si el valor de la partida no existe exactamente en el selector.
- Sustituye selector único de avatar por checkboxes bajo cada jugador.
- Permite varios jugadores con avatar.
- Guarda `avatarPlayers`, `avatarPlayer` y `avatarUsedBy` como lista separada por `;`.
- Muestra avatar en la tarjeta de jornada cuando existe.
- Cache/versionado actualizado a 0162.

Columna recomendada en `matches`:
- `avatarPlayers`

Compatibilidad:
- Si ya tienes `avatarPlayer` o `avatarUsedBy`, también se rellena por compatibilidad.
