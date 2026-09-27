    function getPlayerStats(matchesSource = null) {
      const stats = {};

      state.players.forEach(p => {
        stats[p.name] = {
          name: p.name,
          played: 0,
          wins: 0,
          losses: 0,
          gamesWon: 0,
          gamesLost: 0,
          vacasWon: 0,
          vacasLost: 0,
          streak: 0,
          lastResults: []
        };
      });

      const sourceMatches = matchesSource || state.matches;

      sourceMatches.forEach(m => {
        if (effectiveStatus(m) !== "confirmed") return;

        const outcome = getMatchOutcome(m);
        if (!outcome.isResolved) return;

        outcome.participants.forEach(player => {
          if (!stats[player]) return;
          stats[player].played++;
        });

        outcome.winners.forEach(player => {
          if (!stats[player]) return;
          stats[player].wins++;
          stats[player].lastResults.push("W");
        });

        outcome.losers.forEach(player => {
          if (!stats[player]) return;
          stats[player].losses++;
          stats[player].lastResults.push("L");
        });

        // Juegos/vacas solo son comparables dentro de partidas con resultado real calculable.
        if (outcome.calc.valid && outcome.calc.complete && outcome.calc.winnerSide) {
          const teamA = [m.teamA_player1 || m.teamA1, m.teamA_player2 || m.teamA2].filter(Boolean).map(normalizeName);
          const teamB = [m.teamB_player1 || m.teamB1, m.teamB_player2 || m.teamB2].filter(Boolean).map(normalizeName);

          teamA.forEach(player => {
            if (!stats[player]) return;
            stats[player].gamesWon += outcome.calc.gamesA;
            stats[player].gamesLost += outcome.calc.gamesB;
            stats[player].vacasWon += outcome.calc.vacasA;
            stats[player].vacasLost += outcome.calc.vacasB;
          });

          teamB.forEach(player => {
            if (!stats[player]) return;
            stats[player].gamesWon += outcome.calc.gamesB;
            stats[player].gamesLost += outcome.calc.gamesA;
            stats[player].vacasWon += outcome.calc.vacasB;
            stats[player].vacasLost += outcome.calc.vacasA;
          });
        }
      });

      Object.values(stats).forEach(s => {
        let streak = 0;
        for (let i = s.lastResults.length - 1; i >= 0; i--) {
          const r = s.lastResults[i];
          if (i === s.lastResults.length - 1) {
            streak = 1;
          } else if (r === s.lastResults[s.lastResults.length - 1]) {
            streak++;
          } else {
            break;
          }
        }
        s.streak = (s.lastResults[s.lastResults.length - 1] || "") + streak;
        s.winRate = (s.wins + s.losses) ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0;
      });

      return stats;
    }

    function renderSimpleTable(containerId, rows, columns) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = `
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-slate-400 border-b border-slate-800">
                ${columns.map(c => `<th class="text-left py-2">${c.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows.length ? rows.map(r => `
                <tr class="border-b border-slate-900 hover:bg-slate-900/50">
                  ${columns.map(c => `<td class="py-2">${r[c.key] ?? ""}</td>`).join("")}
                </tr>
              `).join("") : `<tr><td colspan="${columns.length}" class="py-3 text-slate-500">Sin datos suficientes.</td></tr>`}
            </tbody>
          </table>
        </div>
      `;
    }

    function renderStats() {
      const stats = Object.values(getPlayerStats());
      const seasonStats = Object.values(getPlayerStats(state.matches.filter(m => isActiveSeasonMatch(m))));

      const card = (title, value, subtitle, color) => `
        <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div class="text-xs uppercase tracking-wider text-slate-500 font-bold">${title}</div>
          <div class="text-2xl font-black ${color} mt-1">${value || "-"}</div>
          <div class="text-xs text-slate-400 mt-1">${subtitle || ""}</div>
        </div>
      `;

      const buildTopCards = (statsRows) => {
        const bestWin = [...statsRows].sort((a,b) => b.winRate - a.winRate)[0];
        const bestGames = [...statsRows].sort((a,b) => b.gamesWon - a.gamesWon)[0];
        const bestVacas = [...statsRows].sort((a,b) => b.vacasWon - a.vacasWon)[0];
        const mostWins = [...statsRows].sort((a,b) => b.wins - a.wins)[0];

        return (
          card("Más wins", mostWins?.name ? renderPlayerMini(mostWins.name, "w-8 h-8") : "-", `${mostWins?.wins || 0} wins`, "text-emerald-400") +
          card("Mejor win rate", bestWin?.name ? renderPlayerMini(bestWin.name, "w-8 h-8") : "-", `${bestWin?.winRate || 0}%`, "text-cyan-400") +
          card("Más juegos", bestGames?.name ? renderPlayerMini(bestGames.name, "w-8 h-8") : "-", `${bestGames?.gamesWon || 0} juegos`, "text-amber-400") +
          card("Más vacas", bestVacas?.name ? renderPlayerMini(bestVacas.name, "w-8 h-8") : "-", `${bestVacas?.vacasWon || 0} vacas`, "text-fuchsia-400")
        );
      };

      document.getElementById("topCards").innerHTML = buildTopCards(stats);

      const seasonLabel = document.getElementById("statsActiveSeasonLabel");
      if (seasonLabel) seasonLabel.textContent = getActiveSeasonLabel();

      const seasonCards = document.getElementById("topCardsSeason");
      if (seasonCards) seasonCards.innerHTML = buildTopCards(seasonStats);

      renderSimpleTable(
        "winRateTable",
        [...stats].sort((a,b) => b.winRate - a.winRate).map(s => ({
          jugador: renderPlayerMini(s.name, "w-6 h-6"),
          rate: s.winRate + "%",
          balance: `${s.wins}-${s.losses}`
        })),
        [
          { key: "jugador", label: "Jugador" },
          { key: "rate", label: "Win %" },
          { key: "balance", label: "Balance" }
        ]
      );

      renderSimpleTable(
        "streakTable",
        [...stats]
          .map(s => ({
            ...s,
            streakCount: parseInt((s.streak || "").slice(1) || 0),
            streakType: (s.streak || "").slice(0, 1)
          }))
          .filter(s => s.streakCount > 1)
          .sort((a,b) => b.streakCount - a.streakCount)
          .map(s => ({
            jugador: renderPlayerMini(s.name, "w-6 h-6"),
            racha: s.streakType === "W" ? `${s.streakCount} wins` : `${s.streakCount} loss`
          })),
        [
          { key: "jugador", label: "Jugador" },
          { key: "racha", label: "Racha" }
        ]
      );

      const pairs = {};
      state.matches.forEach(m => {
        if (effectiveStatus(m) !== "confirmed") return;

        const outcome = getMatchOutcome(m);
        if (!outcome.isResolved) return;

        const pairAPlayers = [normalizeName(m.teamA_player1 || m.teamA1), normalizeName(m.teamA_player2 || m.teamA2)].filter(Boolean);
        const pairBPlayers = [normalizeName(m.teamB_player1 || m.teamB1), normalizeName(m.teamB_player2 || m.teamB2)].filter(Boolean);

        const pairA = pairAPlayers.slice().sort().join(" + ");
        const pairB = pairBPlayers.slice().sort().join(" + ");

        [
          { pair: pairA, players: pairAPlayers },
          { pair: pairB, players: pairBPlayers }
        ].forEach(item => {
          if (!item.pair || item.players.length !== 2) return;

          pairs[item.pair] = pairs[item.pair] || { pair: item.pair, played: 0, wins: 0, losses: 0 };
          pairs[item.pair].played++;

          const bothWon = item.players.every(p => outcome.winners.includes(p));
          const bothLost = item.players.every(p => outcome.losers.includes(p));

          if (bothWon) pairs[item.pair].wins++;
          if (bothLost) pairs[item.pair].losses++;
        });
      });

      renderSimpleTable(
        "pairsTable",
        Object.values(pairs)
          .filter(p => p.wins > 1)
          .map(p => ({
            pareja: renderPlayersFromText(p.pair, /\s*\+\s*/),
            wins: p.wins,
            rate: p.played ? Math.round((p.wins/p.played)*100) + "%" : "0%"
          }))
          .sort((a,b) => b.wins - a.wins),
        [
          { key: "pareja", label: "Pareja" },
          { key: "wins", label: "Wins" },
          { key: "rate", label: "Rate" }
        ]
      );

      renderSimpleTable(
        "worstPairsTable",
        Object.values(pairs)
          .filter(p => p.losses > 1)
          .map(p => ({
            pareja: renderPlayersFromText(p.pair, /\s*\+\s*/),
            loss: p.losses,
            rate: p.played ? Math.round((p.losses/p.played)*100) + "%" : "0%"
          }))
          .sort((a,b) => b.loss - a.loss),
        [
          { key: "pareja", label: "Pareja" },
          { key: "loss", label: "Loss" },
          { key: "rate", label: "Rate loss" }
        ]
      );

      renderSimpleTable(
        "gamesWonTable",
        [...stats].sort((a,b) => b.gamesWon - a.gamesWon).map(s => ({
          jugador: renderPlayerMini(s.name, "w-6 h-6"),
          juegos: s.gamesWon,
          balance: s.gamesWon - s.gamesLost
        })),
        [
          { key: "jugador", label: "Jugador" },
          { key: "juegos", label: "JG" },
          { key: "balance", label: "Balance" }
        ]
      );
    

      renderSimpleTable(
        "gamesLostTable",
        [...stats]
          .sort((a,b) => b.gamesLost - a.gamesLost)
          .map(s => ({
            jugador: renderPlayerMini(s.name, "w-6 h-6"),
            juegos: s.gamesLost
          })),
        [
          { key: "jugador", label: "Jugador" },
          { key: "juegos", label: "JP" }
        ]
      );

}

