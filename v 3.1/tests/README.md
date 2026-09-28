# Tests automáticos V3

Ejecutar desde la raíz del proyecto:

```bash
node tests/run-tests.js
```

La suite no escribe en Google Sheets ni llama al backend. Carga directamente los módulos reales de producción y prueba cálculo de partidas, clasificación, bonus, avatares, temporadas, permisos, desempates y auto-confirmación.

Regla de entrega: una versión no debe considerarse candidata estable si esta suite devuelve algún FAIL.
