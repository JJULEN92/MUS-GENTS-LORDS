    async function saveMyProfile() {
      if (!state.currentUser) return alert("Debes iniciar sesión.");

      const player = state.players.find(p => normalizeName(p.name) === normalizeName(state.currentUser.name));
      if (!player) return alert("Jugador no encontrado.");

      player.avatar = document.getElementById("profileAvatar").value.trim();
      player.description = document.getElementById("profileDescription").value.trim();

      const res = await api("savePlayer", player);

      if (res.ok) {
        await loadData();
        alert("Perfil actualizado.");
      } else {
        alert("Error guardando perfil.");
      }
    }


    function renderPlayerFlags(player) {
      const defs = [
        { key: "flagav", icon: "🧞", title: "Avatar" },
        { key: "flagpen", icon: "⚠️", title: "Penalización" },
        { key: "flagpa", icon: "🥇", title: "Puto Amo" },
        { key: "flagwin", icon: "🏆", title: "Winner" },
        { key: "flagfinal", icon: "👏", title: "Finalista" },
        { key: "flagcm", icon: "🥄", title: "Cuchara de madera" },
        { key: "flagsf", icon: "🏛️", title: "Fundador" }
      ];
      return defs.map(d => {
        const count = Number(player[d.key] || 0);
        if (!count || count < 1) return "";
        return `<span class="player-badge" title="${d.title}">${d.icon.repeat(Math.min(count, 12))}</span>`;
      }).join("");
    }



    function calculateRivalInsights(playerName) {
      const name = normalizeName(playerName || "");
      const rivals = {};

      state.matches.forEach(m => {
        if (effectiveStatus(m) !== "confirmed") return;

        const outcome = typeof getMatchOutcome === "function"
          ? getMatchOutcome(m)
          : null;

        if (!outcome || !outcome.isResolved) return;
        if (!outcome.participants.includes(name)) return;

        const won = outcome.winners.includes(name);
        const lost = outcome.losers.includes(name);

        const mySide = won
          ? outcome.winners
          : lost
            ? outcome.losers
            : [];

        const rivalSide = outcome.participants.filter(p => !mySide.includes(p));

        rivalSide.forEach(rival => {
          rivals[rival] = rivals[rival] || {
            rival,
            winsAgainst: 0,
            lossesAgainst: 0
          };

          if (won) rivals[rival].winsAgainst++;
          if (lost) rivals[rival].lossesAgainst++;
        });
      });

      const rows = Object.values(rivals);

      return {
        nemesis: [...rows].sort((a,b) => b.lossesAgainst - a.lossesAgainst || b.winsAgainst - a.winsAgainst)[0] || null,
        victim: [...rows].sort((a,b) => b.winsAgainst - a.winsAgainst || b.lossesAgainst - a.lossesAgainst)[0] || null
      };
    }


    function getDetailedPlayerStats(playerName) {
      const name = normalizeName(playerName);
      const stats = {
        name,
        played: 0,
        wins: 0,
        losses: 0,
        gamesWon: 0,
        gamesLost: 0,
        vacasWon: 0,
        vacasLost: 0,
        points: 0,
        partners: {},
        rivals: {},
        matches: []
      };

      state.matches.forEach(m => {
        const meta = getMatchMeta(m);
        if (!meta.calc.valid || !meta.calc.complete || effectiveStatus(m) !== "confirmed") return;

        const teamA = [normalizeName(m.teamA_player1 || m.teamA1), normalizeName(m.teamA_player2 || m.teamA2)].filter(Boolean);
        const teamB = [normalizeName(m.teamB_player1 || m.teamB1), normalizeName(m.teamB_player2 || m.teamB2)].filter(Boolean);

        const inA = teamA.includes(name);
        const inB = teamB.includes(name);
        if (!inA && !inB) return;

        const ownTeam = inA ? teamA : teamB;
        const rivals = inA ? teamB : teamA;
        const partner = ownTeam.find(p => p !== name) || "";
        const playerWon = (inA && meta.calc.winnerSide === "A") || (inB && meta.calc.winnerSide === "B");

        const ownGames = inA ? meta.calc.gamesA : meta.calc.gamesB;
        const oppGames = inA ? meta.calc.gamesB : meta.calc.gamesA;
        const ownVacas = inA ? meta.calc.vacasA : meta.calc.vacasB;
        const oppVacas = inA ? meta.calc.vacasB : meta.calc.vacasA;

        stats.played++;
        stats.gamesWon += ownGames;
        stats.gamesLost += oppGames;
        stats.vacasWon += ownVacas;
        stats.vacasLost += oppVacas;

        if (playerWon) {
          stats.wins++;
          stats.points += 3;
        } else {
          stats.losses++;
        }

        if (partner) {
          stats.partners[partner] = stats.partners[partner] || { name: partner, played: 0, wins: 0, losses: 0 };
          stats.partners[partner].played++;
          playerWon ? stats.partners[partner].wins++ : stats.partners[partner].losses++;
        }

        rivals.forEach(rival => {
          stats.rivals[rival] = stats.rivals[rival] || { name: rival, played: 0, wins: 0, losses: 0 };
          stats.rivals[rival].played++;
          playerWon ? stats.rivals[rival].wins++ : stats.rivals[rival].losses++;
        });

        stats.matches.push({
          id: m.id,
          round: m.round,
          fecha: m.fecha,
          partner,
          rivals: rivals.join(" / "),
          result: playerWon ? "Win" : "Loss",
          vacas: `${ownVacas}-${oppVacas}`,
          games: `${ownGames}-${oppGames}`
        });
      });

      stats.winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
      stats.gameBalance = stats.gamesWon - stats.gamesLost;
      stats.vacaBalance = stats.vacasWon - stats.vacasLost;

      const partnerList = Object.values(stats.partners);
      const rivalList = Object.values(stats.rivals);

      stats.worstPartner = partnerList.sort((a,b) => b.losses - a.losses || b.played - a.played)[0] || null;
      stats.bestPartner = partnerList.sort((a,b) => b.wins - a.wins || b.played - a.played)[0] || null;
      stats.bestRival = rivalList.sort((a,b) => b.wins - a.wins || b.played - a.played)[0] || null;
      stats.worstRival = rivalList.sort((a,b) => b.losses - a.losses || b.played - a.played)[0] || null;

      return stats;
    }

    function selectProfilePlayer(playerName) {
      state.selectedProfilePlayer = playerName;
      renderPlayers();
    }

    function renderStatPill(label, value, cls = "text-white") {
      return `<div class="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">${label}</div>
        <div class="text-base sm:text-xl font-black ${cls}">${value}</div>
      </div>`;
    }

    function renderMiniTable(rows, cols) {
      if (!rows.length) return `<div class="text-sm text-slate-500">Sin datos todavía.</div>`;
      return `<div class="overflow-x-auto"><table class="w-full text-sm">
        <thead><tr class="text-slate-400 border-b border-slate-800">${cols.map(c => `<th class="text-left py-2">${c.label}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(r => `<tr class="border-b border-slate-900">${cols.map(c => `<td class="py-2">${r[c.key] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></div>`;
    }

    function renderPlayers() {
      const avatarInput = document.getElementById("profileAvatar");
      const descInput = document.getElementById("profileDescription");
      const profileSelect = document.getElementById("profilePlayerSelect");

      if (state.currentUser && avatarInput && descInput) {
        const me = state.players.find(p => normalizeName(p.name) === normalizeName(state.currentUser.name));
        if (me) {
          avatarInput.value = me.avatar || "";
          descInput.value = me.description || "";
        }
      }

      if (profileSelect) {
        const current = state.selectedProfilePlayer || (state.currentUser ? state.currentUser.name : (state.players[0]?.name || ""));
        profileSelect.innerHTML = state.players.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join("");
        profileSelect.value = current;
        state.selectedProfilePlayer = current;
      }

      const selected = state.players.find(p => normalizeName(p.name) === normalizeName(state.selectedProfilePlayer)) || state.players[0];
      const featured = document.getElementById("playerFeaturedCard");

      if (featured && selected) {
        const st = getDetailedPlayerStats(selected.name);
        const rivalInsights = calculateRivalInsights(selected.name);
        const img = selected.avatar || "assets/logo.png?v=0132";
        const flags = renderPlayerFlags(selected);
        const recentMatches = st.matches.slice(-5).reverse();

        featured.innerHTML = `
          <div class="bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div class="xl:col-span-4">
                <div class="flex flex-col items-center text-center">
                  <img src="${escapeHtml(img)}" onerror="this.src='assets/logo.png?v=0132'"
                       class="w-44 h-44 rounded-3xl object-contain bg-white p-2 border-2 border-amber-400/60 shadow-xl" />
                  <h3 class="text-3xl font-black mt-4">${escapeHtml(selected.name)}</h3>
                  <div class="text-xs uppercase tracking-wider text-slate-500 font-bold">${escapeHtml(selected.role || "player")}</div>
                  <div class="flex flex-wrap justify-center gap-2 mt-4">${flags || '<span class="text-xs text-slate-600">Sin insignias todavía</span>'}</div>
                </div>
                <div class="mt-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 leading-relaxed">
                  ${escapeHtml(selected.description || "Jugador oficial del circuito Gents & Lords.")}
                </div>
              </div>

              <div class="xl:col-span-8 space-y-5">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  ${renderStatPill("Partidas", st.played, "text-white")}
                  ${renderStatPill("Balance", `${st.wins}-${st.losses}`, "text-emerald-400")}
                  ${renderStatPill("Win rate", `${st.winRate}%`, "text-cyan-400")}
                  ${renderStatPill("Puntos", st.points, "text-amber-400")}
                  ${renderStatPill("Juegos", `${st.gamesWon}-${st.gamesLost}`, "text-emerald-300")}
                  ${renderStatPill("Balance JG", st.gameBalance, st.gameBalance >= 0 ? "text-emerald-400" : "text-red-400")}
                  ${renderStatPill("Vacas", `${st.vacasWon}-${st.vacasLost}`, "text-fuchsia-300")}
                  ${renderStatPill("Balance V", st.vacaBalance, st.vacaBalance >= 0 ? "text-emerald-400" : "text-red-400")}
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <div class="text-xs uppercase text-slate-500 font-bold">Best mate</div>
                    <div class="text-lg font-black text-emerald-300 mt-1">${st.bestPartner ? renderPlayerMini(st.bestPartner.name, "w-6 h-6") : "-"}</div>
                    <div class="text-xs text-slate-400">${st.bestPartner ? `${st.bestPartner.wins} wins juntos` : "Sin datos"}</div>
                  </div>

                  <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <div class="text-xs uppercase text-slate-500 font-bold">Worst mate</div>
                    <div class="text-lg font-black text-red-300 mt-1">${st.worstPartner ? renderPlayerMini(st.worstPartner.name, "w-6 h-6") : "-"}</div>
                    <div class="text-xs text-slate-400">${st.worstPartner ? `${st.worstPartner.losses} losses juntos` : "Sin datos"}</div>
                  </div>

                  <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <div class="text-xs uppercase text-slate-500 font-bold">Victim</div>
                    <div class="text-lg font-black text-amber-300 mt-1">${rivalInsights.victim ? renderPlayerMini(rivalInsights.victim.rival, "w-6 h-6") : "-"}</div>
                    <div class="text-xs text-slate-400">${rivalInsights.victim ? `${rivalInsights.victim.winsAgainst} wins vs him` : "Sin datos"}</div>
                  </div>

                  <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <div class="text-xs uppercase text-slate-500 font-bold">Nemesis</div>
                    <div class="text-lg font-black text-red-300 mt-1">${rivalInsights.nemesis ? renderPlayerMini(rivalInsights.nemesis.rival, "w-6 h-6") : "-"}</div>
                    <div class="text-xs text-slate-400">${rivalInsights.nemesis ? `${rivalInsights.nemesis.lossesAgainst} losses vs him` : "Sin datos"}</div>
                  </div>
                </div>
              </div>
                </div>

                <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <h4 class="font-black mb-3">📜 Últimas partidas</h4>
                  ${renderMiniTable(recentMatches.map(r => ({...r, partner: renderPlayerMini(r.partner, "w-6 h-6"), rivals: renderPlayersFromText(r.rivals)})), [
                    {key:"fecha", label:"Fecha"},
                    {key:"partner", label:"Compañero"},
                    {key:"rivals", label:"Rivales"},
                    {key:"result", label:"Resultado"},
                    {key:"vacas", label:"Vacas"},
                    {key:"games", label:"Juegos"}
                  ])}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      const grid = document.getElementById("playersGrid");
      if (!grid) return;

      grid.innerHTML = state.players.map(p => {
        const st = getDetailedPlayerStats(p.name);
        const img = p.avatar || "assets/logo.png?v=0132";
        const desc = p.description || "Jugador oficial del circuito Gents & Lords.";
        const flags = renderPlayerFlags(p);
        return `
          <div onclick="selectProfilePlayer('${escapeHtml(p.name)}')" class="cursor-pointer bg-slate-950/95 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition-all">
            <div class="flex items-center gap-4">
              <img src="${escapeHtml(img)}"
                   onerror="this.src='assets/logo.png?v=0132'"
                   class="w-20 h-20 rounded-2xl object-contain border border-slate-700 bg-white p-1" />
              <div>
                <div class="text-base sm:text-xl font-black">${escapeHtml(p.name || "-")}</div>
                <div class="text-xs uppercase tracking-wider text-slate-500 font-bold">${escapeHtml(p.role || "player")}</div>
                <div class="text-xs text-slate-400 mt-1">${st.wins}-${st.losses} · ${st.winRate}% win</div>
              </div>
            </div>
            <div class="mt-4 text-sm text-slate-300 min-h-[60px] leading-relaxed">
              ${escapeHtml(desc)}
            </div>
            <div class="mt-4 flex flex-wrap gap-2">${flags || '<span class="text-xs text-slate-600">Sin insignias todavía</span>'}</div>
          </div>
        `;
      }).join("") || `<p class="text-slate-400">No hay jugadores cargados.</p>`;
    }


