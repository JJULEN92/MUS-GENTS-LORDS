# V3.1.7 — Avatar / cache busting

La lectura del avatar ya se hace desde `matches.avatarPlayers`.
El problema detectado era que `index.html` seguía solicitando los módulos JS con `?v=312`, por lo que el navegador podía reutilizar una versión anterior de `standings.js` aunque se hubiera subido V3.1.6.

Cambios:
- Todos los módulos JS pasan a `?v=317`.
- Service Worker pasa a cache `mus-gents-lords-v317` y recursos `?v=317`.
- No se modifica la regla: desde `seasonId >= 4`, cada nombre presente en `avatarPlayers` resta 0,1 puntos en esa partida.
