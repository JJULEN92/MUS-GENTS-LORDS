v2.1.2 PREPROD · Manual winners / faltas

Cambios:
- Resultado legacy de un solo dígito:
  2 => 02
  3 => 03
- Se elimina el concepto de empate en estadísticas.
- Si una partida no tiene resultado completo pero la columna winner está rellena:
  - los jugadores indicados en winner cuentan como ganadores;
  - los demás participantes cuentan como perdedores.
- Si no hay resultado y faultPlayers está relleno:
  - los jugadores en faultPlayers cuentan como perdedores;
  - los demás participantes cuentan como ganadores.
- Si faultPlayers incluye a los 4 jugadores:
  - pierden todos.
- Win % se calcula sobre wins / (wins + losses).
- Juegos y vacas solo se suman cuando hay resultado real calculable.
