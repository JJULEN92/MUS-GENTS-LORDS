# V3.2.9 — seasonbonus desplegable y verificable

El backend expone versión y permite GET `?action=getSeasonBonus`. El frontend obtiene el bonus por ese endpoint sin caché. Esto elimina el fallo silencioso cuando el despliegue `/exec` apunta a una versión antigua del Apps Script.
