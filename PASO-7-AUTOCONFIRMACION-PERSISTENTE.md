# V3.2.3 — Auto-confirmación persistente 24 h

- Una partida `pending` con resultado completo y válido que supera 24 horas desde `createdAt` se confirma al siguiente `getData`.
- La confirmación deja de ser solo visual: se escribe en `matches`.
- Se guarda `status=confirmed`, `confirmedBy=AUTO-24H`, `confirmedAt`, `updatedBy=AUTO-24H` y `updatedAt`.
- `createdBy` y `createdAt` no se modifican.
- La persistencia usa la clave `(seasonId, id)`.
- Admin y confirmación/rechazo manual mantienen su comportamiento.

Nota: no se añade un trigger horario en Apps Script. La consolidación se produce cuando un usuario abre/actualiza la aplicación después de cumplirse las 24 horas. Desde ese momento queda persistida en Sheets para todos los dispositivos.
