# V3.1.6 · Puntuación Avatar

- Desde `seasonId >= 4`, un jugador marcado con Avatar pierde **0,1 puntos** en esa partida.
- La resta es individual: solo afecta al jugador o jugadores marcados con Avatar.
- Temporadas 1, 2 y 3 conservan exactamente la puntuación anterior.
- La regla se aplica únicamente sobre partidas confirmadas, igual que el resto de la clasificación.
- Los puntos finales se redondean a una décima para evitar decimales binarios de JavaScript.
