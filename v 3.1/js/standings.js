    function calculateStandings() {
      const table = new Map();

      state.players.forEach(p => {
        table.set(p.name, {
          player: p.name, pj: 0, points: 0, vacasWon: 0, vacasLost: 0,
          jg: 0, jp: 0,
          penal: Number(p.penal || 0),
          avatar: Number(p.avatarCount || 0),
          sinAvatar: 0
        });
      });

      state.matches.filter(m =>
        effectiveStatus(m) === "confirmed" &&
        isActiveSeasonMatch(m)
      ).forEach(m => {
        const calc = calculateMatch(m.vaca1, m.vaca2, m.vaca3, matchSeasonId(m));
        const outcome = getMatchOutcome(m);
        if (!outcome.isResolved) return;

        const aPlayers = [normalizeName(m.teamA_player1 || m.teamA1), normalizeName(m.teamA_player2 || m.teamA2)].filter(Boolean);
        const bPlayers = [normalizeName(m.teamB_player1 || m.teamB1), normalizeName(m.teamB_player2 || m.teamB2)].filter(Boolean);

        [...aPlayers, ...bPlayers].forEach(name => {
          if (!table.has(name)) {
            table.set(name, { player: name, pj: 0, points: 0, vacasWon: 0, vacasLost: 0, jg: 0, jp: 0, penal: 0, avatar: 0, sinAvatar: 0 });
          }
        });

        aPlayers.forEach(name => {
          const r = table.get(name);
          r.pj += 1;
          r.vacasWon += calc.vacasA;
          r.vacasLost += calc.vacasB;
          r.jg += calc.gamesA;
          r.jp += calc.gamesB;
          if (outcome.winners.includes(name)) r.points += 3;
        });

        bPlayers.forEach(name => {
          const r = table.get(name);
          r.pj += 1;
          r.vacasWon += calc.vacasB;
          r.vacasLost += calc.vacasA;
          r.jg += calc.gamesB;
          r.jp += calc.gamesA;
          if (outcome.winners.includes(name)) r.points += 3;
        });

        // Avatares usados en la partida: solo cuentan en Avatar/Sin Avatar.
        // NO modifican puntos ni penalizaciones.
        getAvatarPlayersFromMatch(m).forEach(name => {
          const clean = normalizeName(name);
          if (!clean) return;

          if (!table.has(clean)) {
            table.set(clean, { player: clean, pj: 0, points: 0, vacasWon: 0, vacasLost: 0, jg: 0, jp: 0, penal: 0, avatar: 0, sinAvatar: 0 });
          }

          table.get(clean).avatar += 1;
        });

        // Penalización por falta/no presentación:
        // - al jugador marcado se le suma 1 penalización, que se resta al final;
        // - al resto de jugadores de la partida se les suma 1 punto.
        const faultPlayers = getFaultPlayersFromMatch(m);
        const faultSet = new Set(faultPlayers);

        faultPlayers.forEach(name => {
          const clean = normalizeName(name);
          if (!clean) return;

          if (!table.has(clean)) {
            table.set(clean, { player: clean, pj: 0, points: 0, vacasWon: 0, vacasLost: 0, jg: 0, jp: 0, penal: 0, avatar: 0, sinAvatar: 0 });
          }

          table.get(clean).penal += 1;
        });

        [...aPlayers, ...bPlayers]
          .filter(name => name && !faultSet.has(name))
          .forEach(name => {
            const r = table.get(name);
            if (r) r.points += faultPlayers.length;
          });
      });

      return [...table.values()].map(r => ({
        ...r,
        points: Number(r.points) - Number(r.penal || 0),
        sinAvatar: Math.max(0, Number(r.pj || 0) - Number(r.avatar || 0))
      })).sort((a,b) =>
        b.points - a.points ||
        b.jg - a.jg ||
        a.jp - b.jp ||
        a.penal - b.penal ||
        b.sinAvatar - a.sinAvatar ||
        a.player.localeCompare(b.player)
      );
    }

    function calculateAllTimeRanking() {
      const table = new Map();

      state.players.forEach(p => {
        table.set(p.name, {
          player: p.name,
          pj: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          penal: Number(p.penal || 0),
          avatar: Number(p.avatarCount || 0)
        });
      });

      state.matches.forEach(m => {
        if (effectiveStatus(m) !== "confirmed") return;

        const outcome = getMatchOutcome(m);
        if (!outcome.isResolved) return;

        outcome.participants.forEach(name => {
          if (!table.has(name)) {
            table.set(name, { player: name, pj: 0, wins: 0, losses: 0, winRate: 0, penal: 0, avatar: 0 });
          }
          table.get(name).pj += 1;
        });

        outcome.winners.forEach(name => {
          if (!table.has(name)) {
            table.set(name, { player: name, pj: 0, wins: 0, losses: 0, winRate: 0, penal: 0, avatar: 0 });
          }
          table.get(name).wins += 1;
        });

        outcome.losers.forEach(name => {
          if (!table.has(name)) {
            table.set(name, { player: name, pj: 0, wins: 0, losses: 0, winRate: 0, penal: 0, avatar: 0 });
          }
          table.get(name).losses += 1;
        });

        getAvatarPlayersFromMatch(m).forEach(name => {
          const clean = normalizeName(name);
          if (!clean) return;
          if (!table.has(clean)) {
            table.set(clean, { player: clean, pj: 0, wins: 0, losses: 0, winRate: 0, penal: 0, avatar: 0 });
          }
          table.get(clean).avatar += 1;
        });

        getFaultPlayersFromMatch(m).forEach(name => {
          const clean = normalizeName(name);
          if (!clean) return;
          if (!table.has(clean)) {
            table.set(clean, { player: clean, pj: 0, wins: 0, losses: 0, winRate: 0, penal: 0, avatar: 0 });
          }
          table.get(clean).penal += 1;
        });
      });

      return [...table.values()].map(r => ({
        ...r,
        winRate: (r.wins + r.losses) ? Math.round((r.wins / (r.wins + r.losses)) * 100) : 0
      })).sort((a,b) =>
        b.wins - a.wins ||
        b.winRate - a.winRate ||
        a.penal - b.penal ||
        b.avatar - a.avatar ||
        a.player.localeCompare(b.player)
      );
    }

    function renderStandings() {
      const allRows = state.calculatedStandings;
      const rows = allRows.slice(0, 8);
      const preferredRows = allRows.slice(8);

      document.getElementById("standingsBody").innerHTML = rows.map((r, i) => `
        <tr class="border-b border-slate-800 hover:bg-slate-800/40 ${
            i < 4
              ? 'bg-emerald-950/40'
              : i === 7
                ? 'bg-red-950/40'
                : ''
          }">
          <td class="p-2 font-bold ${
            i < 4
              ? 'text-emerald-300'
              : i === 7
                ? 'text-red-300'
                : ''
          }">${i+1}</td>
          <td class="p-2 font-bold">${renderPlayerMini(r.player)}</td>
          <td class="p-2 text-center">${r.pj}</td>
          <td class="p-2 text-center text-amber-400 font-black">${r.points}</td>
          <td class="p-2 text-center">${r.vacasWon}</td>
          <td class="p-2 text-center">${r.vacasLost}</td>
          <td class="p-2 text-center text-emerald-400">${r.jg}</td>
          <td class="p-2 text-center text-red-400">${r.jp}</td>
          <td class="p-2 text-center">${r.penal}</td>
          <td class="p-2 text-center">${r.avatar}</td>
          <td class="p-2 text-center">${r.sinAvatar}</td>
        </tr>
      `).join("") || `<tr><td colspan="11" class="p-4 text-slate-400">No hay clasificación calculada.</td></tr>`;

      const preferredBody = document.getElementById("preferredAvatarsBody");
      if (preferredBody) {
        preferredBody.innerHTML = preferredRows.map((r, idx) => `
          <tr class="border-b border-slate-800 hover:bg-slate-800/40">
            <td class="p-2 font-bold">${idx + 9}</td>
            <td class="p-2 font-bold">${renderPlayerMini(r.player)}</td>
            <td class="p-2 text-center">${r.pj}</td>
            <td class="p-2 text-center text-amber-400 font-black">${r.points}</td>
            <td class="p-2 text-center">${r.vacasWon}</td>
            <td class="p-2 text-center">${r.vacasLost}</td>
            <td class="p-2 text-center text-emerald-400">${r.jg}</td>
            <td class="p-2 text-center text-red-400">${r.jp}</td>
            <td class="p-2 text-center">${r.penal}</td>
            <td class="p-2 text-center">${r.avatar}</td>
          </tr>
        `).join("") || `<tr><td colspan="10" class="p-4 text-slate-400">No hay avatares preferentes.</td></tr>`;
      }

      const allTimeRows = calculateAllTimeRanking();
      const allTimeBody = document.getElementById("allTimeRankingBody");
      if (allTimeBody) {
        allTimeBody.innerHTML = allTimeRows.map((r, i) => `
          <tr class="border-b border-slate-800 hover:bg-slate-800/40">
            <td class="p-2 font-bold">${i+1}</td>
            <td class="p-2 font-bold">${renderPlayerMini(r.player)}</td>
            <td class="p-2 text-center">${r.pj}</td>
            <td class="p-2 text-center text-emerald-400 font-black">${r.wins}</td>
            <td class="p-2 text-center text-red-400">${r.losses}</td>
            <td class="p-2 text-center text-cyan-400 font-black">${r.winRate}%</td>
            <td class="p-2 text-center">${r.penal}</td>
            <td class="p-2 text-center">${r.avatar}</td>
          </tr>
        `).join("") || `<tr><td colspan="8" class="p-4 text-slate-400">No hay histórico calculado.</td></tr>`;
      }
    }



    function isAdmin() {
      return state.currentUser && (state.currentUser.role || "").toLowerCase() === "admin";
    }


    function renderAdminControls() {
      const show = isAdmin();

      const backupBtn = document.getElementById("backupBtn");
      if (backupBtn) backupBtn.classList.toggle("hidden", !show);

      const logsTabBtn = document.getElementById("logsTabBtn");
      if (logsTabBtn) logsTabBtn.classList.toggle("hidden", !show);

      if (!show) {
        const logsPanel = document.getElementById("tab-logs");
        if (logsPanel && !logsPanel.classList.contains("hidden")) {
          const firstTab = document.querySelector(".tabBtn:not(.hidden)");
          if (firstTab) showTab({ target: firstTab }, "standings");
        }
      }
    }

