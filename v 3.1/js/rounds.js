    function matchPlayers(m) {
      return [
        normalizeName(m.teamA_player1 || m.teamA1 || ""),
        normalizeName(m.teamA_player2 || m.teamA2 || ""),
        normalizeName(m.teamB_player1 || m.teamB1 || ""),
        normalizeName(m.teamB_player2 || m.teamB2 || "")
      ].filter(Boolean);
    }

    function userIsInMatch(m) {
      if (!state.currentUser) return false;
      return matchPlayers(m).includes(normalizeName(state.currentUser.name));
    }

    function canEditMatch(m) {
      if (!state.currentUser) return false;
      if (isAdmin()) return true;
      if (!m || !m.id) return true;
      return userIsInMatch(m);
    }

    function canConfirmMatch(m) {
      if (!state.currentUser) return false;
      if (isAdmin()) return true;
      if (!userIsInMatch(m)) return false;

      const current = normalizeName(state.currentUser.name);
      const author = normalizeName(m.createdBy || m.updatedBy || "");

      if (!author) return true;
      if (current === author) return false;

      const teamA = [
        normalizeName(m.teamA_player1 || m.teamA1 || ""),
        normalizeName(m.teamA_player2 || m.teamA2 || "")
      ].filter(Boolean);

      const teamB = [
        normalizeName(m.teamB_player1 || m.teamB1 || ""),
        normalizeName(m.teamB_player2 || m.teamB2 || "")
      ].filter(Boolean);

      const authorInA = teamA.includes(author);
      const authorInB = teamB.includes(author);

      // Si el autor está en una pareja, solo puede confirmar alguien de la pareja contraria.
      if (authorInA) return teamB.includes(current);
      if (authorInB) return teamA.includes(current);

      // Si por datos antiguos no sabemos de qué pareja era el autor, basta con que sea participante distinto.
      return true;
    }

    function hoursSince(dateValue) {
      if (!dateValue) return 999999;
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return 999999;
      return (Date.now() - d.getTime()) / 36e5;
    }

    function hasAnyMatchResult(m) {
      return [m.vaca1, m.vaca2, m.vaca3].some(v => String(v || "").trim() !== "");
    }

    function hasCompleteValidMatchResult(m) {
      const calc = calculateMatch(m.vaca1, m.vaca2, m.vaca3, matchSeasonId(m));
      return calc.valid && calc.complete;
    }

    function isAutoConfirmed(m) {
      return (m.status || "") === "pending" && hasCompleteValidMatchResult(m) && hoursSince(m.createdAt || m.updatedAt) >= 24;
    }

    function effectiveStatus(m) {
      const rawStatus = (m.status || "").toLowerCase();

      if (rawStatus === "cancelled") return "cancelled";
      if (rawStatus === "rejected") return "rejected";

      const hasManualResolution =
        getWinnerPlayersFromMatch(m).length > 0 ||
        getFaultPlayersFromMatch(m).length > 0;

      // Si se borran las vacas en Excel, la partida vuelve a Pendiente,
      // salvo que tenga resolución administrativa explícita por winner/faultPlayers.
      if (!hasAnyMatchResult(m) && !hasManualResolution) return "pending";

      // Una partida confirmada puede estar resuelta por resultado o por decisión administrativa.
      if (rawStatus === "confirmed") {
        return (hasCompleteValidMatchResult(m) || hasManualResolution) ? "confirmed" : "pending";
      }

      if (isAutoConfirmed(m)) return "confirmed";

      return "pending";
    }

    function statusLabel(m) {
      const status = effectiveStatus(m);
      if (status === "confirmed" && (m.status || "") === "pending") return "Confirmada auto 24h";
      if (status === "confirmed") return "Confirmada";
      if (status === "pending" && hasAnyMatchResult(m) && !hasCompleteValidMatchResult(m)) return "Resultado incompleto";
      if (status === "pending" && hasCompleteValidMatchResult(m)) return "Pendiente de confirmación";
      if (status === "pending") return "Pendiente";
      if (status === "rejected") return "Rechazada";
      if (status === "cancelled") return "Cancelada";
      return status;
    }

    function renderPendingPanel() {
      const panel = document.getElementById("pendingPanel");
      const txt = document.getElementById("pendingPanelText");
      if (!panel || !txt) return;

      const pending = state.matches.filter(m => m.id && effectiveStatus(m) === "pending" && hasCompleteValidMatchResult(m));
      if (!pending.length) {
        panel.classList.add("hidden");
        return;
      }

      panel.classList.remove("hidden");
      txt.textContent = `${pending.length} partida(s) pendiente(s). Si no se rechazan o confirman, se aceptan automáticamente a las 24 horas.`;
    }

    function showPendingMatches() {
      const btn = Array.from(document.querySelectorAll(".tabBtn")).find(b => b.textContent.includes("Jornadas"));
      if (btn) showTab({ target: btn }, "rounds");
      setTimeout(() => {
        const filter = document.getElementById("roundFilter");
        if (filter) filter.value = "all";
        renderRoundDashboard(true);
      }, 50);
    }

    function getMatchMeta(m) {
      const calc = calculateMatch(m.vaca1, m.vaca2, m.vaca3, matchSeasonId(m));
      const teamA = [m.teamA_player1 || m.teamA1, m.teamA_player2 || m.teamA2].filter(Boolean).map(normalizeName).join(" / ");
      const teamB = [m.teamB_player1 || m.teamB1, m.teamB_player2 || m.teamB2].filter(Boolean).map(normalizeName).join(" / ");
      const manualWinner = getWinnerPlayersFromMatch(m).join(" / ");
      const winner = manualWinner || (calc.winnerSide === "A" ? teamA : calc.winnerSide === "B" ? teamB : "");
      let stateLabel = statusLabel(m);
      let stateClass = "bg-amber-500/10 text-amber-300 border-amber-500/30";

      if (effectiveStatus(m) === "cancelled" || effectiveStatus(m) === "rejected") {
        stateClass = "bg-red-500/10 text-red-300 border-red-500/30";
      } else if (!calc.valid) {
        stateLabel = "Error";
        stateClass = "bg-red-500/10 text-red-300 border-red-500/30";
      } else if (effectiveStatus(m) === "confirmed") {
        stateClass = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      } else if (effectiveStatus(m) === "pending") {
        stateClass = "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
      } else if (!calc.complete && [m.vaca1,m.vaca2,m.vaca3].some(Boolean)) {
        stateLabel = "Incompleta";
        stateClass = "bg-orange-500/10 text-orange-300 border-orange-500/30";
      }
      return { calc, teamA, teamB, winner, stateLabel, stateClass };
    }


    function renderMatchActionButtons(m) {
      const status = effectiveStatus(m);
      const buttons = [];

      if (canEditMatch(m) && status !== "confirmed" && status !== "cancelled") {
        buttons.push(`<button onclick='event.stopPropagation(); editMatch(${JSON.stringify(m).replaceAll("'", "&apos;")})' class="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-bold">✏️ Meter resultado</button>`);
      }

      if (effectiveStatus(m) === "pending" && hasCompleteValidMatchResult(m) && canConfirmMatch(m)) {
        buttons.push(`<button onclick='event.stopPropagation(); confirmMatch("${escapeHtml(m.id)}", ${matchSeasonId(m)})' class="bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 rounded-lg font-bold">✅ Confirmar</button>`);
        buttons.push(`<button onclick='event.stopPropagation(); rejectMatch("${escapeHtml(m.id)}", ${matchSeasonId(m)})' class="bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded-lg font-bold">❌ Rechazar</button>`);
      }

      if (!buttons.length) {
        return `<span class="text-slate-500">Sin acciones disponibles</span>`;
      }

      return buttons.join("");
    }

    function renderRoundDashboard() {
      const filterEl = document.getElementById("roundFilter");
      if (!filterEl) return;

      const allMatches = state.matches.filter(m =>
        m.id && isActiveSeasonMatch(m)
      );
      const rounds = [...new Set(allMatches.filter(m => m.round).map(m => String(m.round)))].sort((a,b) => Number(a)-Number(b));
      const current = filterEl.value || "all";
      filterEl.innerHTML = '<option value="all">Todas las jornadas</option>' + rounds.map(r => `<option value="${escapeHtml(r)}">Jornada ${escapeHtml(r)}</option>`).join("");
      filterEl.value = rounds.includes(current) ? current : "all";

      const matches = allMatches.filter(m => filterEl.value === "all" || String(m.round) === String(filterEl.value));
      const summary = { total: matches.length, confirmed: 0, pending: 0, errors: 0 };
      matches.forEach(m => {
        const meta = getMatchMeta(m);
        if (effectiveStatus(m) === "confirmed") summary.confirmed++;
        else if (["Error","Cancelada","Rechazada"].includes(meta.stateLabel)) summary.errors++;
        else summary.pending++;
      });

      document.getElementById("roundSummaryCards").innerHTML = `
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm">
          <span><b class="text-slate-400 uppercase tracking-wide">Matches</b> <strong class="text-white">${summary.total}</strong></span>
          <span><b class="text-slate-400 uppercase tracking-wide">Done</b> <strong class="text-emerald-400">${summary.confirmed}</strong></span>
          <span><b class="text-slate-400 uppercase tracking-wide">Pending</b> <strong class="text-amber-400">${summary.pending}</strong></span>
          <span><b class="text-slate-400 uppercase tracking-wide">Issues</b> <strong class="text-red-400">${summary.errors}</strong></span>
        </div>
      `;

      const isFinished = (m) => effectiveStatus(m) === "confirmed";
      const isOpen = (m) => !isFinished(m);
      const hasAnyResult = (m) => [m.vaca1, m.vaca2, m.vaca3].some(Boolean);
      const roundNumber = (m) => Number(m.round || 999999);

      const openMatches = matches.filter(isOpen).sort((a,b) => roundNumber(a) - roundNumber(b) || String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
      const confirmedMatches = matches.filter(isFinished).sort((a,b) => roundNumber(b) - roundNumber(a) || String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));

      const nextRoundNumber = openMatches.length ? roundNumber(openMatches[0]) : null;
      const nextMatches = nextRoundNumber === null ? [] : openMatches.filter(m => roundNumber(m) === nextRoundNumber);
      const followingMatches = nextRoundNumber === null ? [] : openMatches.filter(m => roundNumber(m) !== nextRoundNumber);

      function renderMatchCard(m) {
        const meta = getMatchMeta(m);
        const vacas = meta.calc.valid ? `${meta.calc.vacasA}-${meta.calc.vacasB}` : "Error";
        const juegos = meta.calc.valid ? `${meta.calc.gamesA}-${meta.calc.gamesB}` : "-";
        const results = [m.vaca1,m.vaca2,m.vaca3].filter(Boolean).join("/") || "Sin resultado";
        const editable = effectiveStatus(m) !== "confirmed" && effectiveStatus(m) !== "cancelled" && canEditMatch(m);
        const clickAttr = editable ? `onclick='editMatch(${JSON.stringify(m).replaceAll("'", "&apos;")})'` : "";
        const cursorClass = editable ? "cursor-pointer hover:border-amber-500/50" : "cursor-default opacity-95";
        return `<div ${clickAttr} class="${cursorClass} bg-slate-900 border border-slate-800 rounded-xl p-4 transition-all">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="font-black">${escapeHtml(m.id)} · ${escapeHtml(m.fecha || "")}</div>
            <span class="text-[10px] px-2 py-1 border rounded-full font-bold ${meta.stateClass}">${meta.stateLabel}</span>
          </div>
          <div class="text-sm text-slate-300 flex items-center gap-2"><b class="text-emerald-400">A</b> <span>${renderTeamMiniFromMatch(m, "A", "w-7 h-7")}</span></div>
          <div class="text-sm text-slate-300 flex items-center gap-2"><b class="text-cyan-400">B</b> <span>${renderTeamMiniFromMatch(m, "B", "w-7 h-7")}</span></div>
          <div class="text-xs text-slate-400 mt-2">Resultado: <b>${escapeHtml(results)}</b> · Vacas: <b>${vacas}</b> · Juegos: <b>${juegos}</b></div>
          <div class="text-xs text-emerald-300 mt-1">Ganador: ${escapeHtml(meta.winner || "-")}</div>
          ${getAvatarPlayersFromMatch(m).length ? `<div class="text-xs text-amber-300 mt-1">🧞 Avatar: ${escapeHtml(getAvatarPlayersFromMatch(m).join(" / "))}</div>` : ""}
          ${getFaultPlayersFromMatch(m).length ? `<div class="text-xs text-red-300 mt-1">⚠️ Falta: ${escapeHtml(getFaultPlayersFromMatch(m).join(" / "))}</div>` : ""}
          <div class="mt-3 flex flex-wrap gap-2">
            ${renderMatchActionButtons(m)}
          </div>
        </div>`;
      }

      function groupByRound(list) {
        const grouped = {};
        list.forEach(m => {
          const r = String(m.round || "Sin jornada");
          grouped[r] = grouped[r] || [];
          grouped[r].push(m);
        });
        return grouped;
      }

      function renderRoundGroup(title, list, subtitle = "", order = "asc") {
        if (!list.length) return "";
        const grouped = groupByRound(list);
        const keys = Object.keys(grouped).sort((a,b) => order === "desc" ? Number(b)-Number(a) : Number(a)-Number(b));
        return `<div class="space-y-4">
          <div>
            <h3 class="font-black text-xl">${title}</h3>
            ${subtitle ? `<p class="text-xs text-slate-400 mt-1">${subtitle}</p>` : ""}
          </div>
          ${keys.map(round => `<div class="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <h4 class="font-black text-lg mb-3">Jornada ${escapeHtml(round)}</h4>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
              ${grouped[round].map(renderMatchCard).join("")}
            </div>
          </div>`).join("")}
        </div>`;
      }

      let html = "";
      html += renderRoundGroup("🔥 Próxima jornada", nextMatches, "Primera jornada con partidas pendientes o sin resultado.");
      html += renderRoundGroup("⏭️ Siguientes jornadas", followingMatches, "Partidas futuras pendientes.");
      html += renderRoundGroup("✅ Jornadas terminadas", confirmedMatches, "Confirmed, al final de la vista.", "desc");

      document.getElementById("roundDashboard").innerHTML = html || `<div class="text-slate-400 bg-slate-950 rounded-xl p-4">No hay partidas para mostrar.</div>`;
    }


