    function renderMatches() {
      const rows = [...state.matches].filter(m => m.id).sort((a,b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
      document.getElementById("matchesBody").innerHTML = rows.map(m => {
        const calc = calculateMatch(m.vaca1, m.vaca2, m.vaca3, matchSeasonId(m));
        const teamA = [m.teamA_player1 || m.teamA1, m.teamA_player2 || m.teamA2].filter(Boolean).map(normalizeName).join(" / ");
        const teamB = [m.teamB_player1 || m.teamB1, m.teamB_player2 || m.teamB2].filter(Boolean).map(normalizeName).join(" / ");
        const vacasText = calc.valid ? `${calc.vacasA}-${calc.vacasB} (${[m.vaca1,m.vaca2,m.vaca3].filter(Boolean).join("/")})` : "Error";
        const gamesText = calc.valid ? `${calc.gamesA}-${calc.gamesB}` : "-";
        const manualWinner = getWinnerPlayersFromMatch(m).join(" / ");
      const winner = manualWinner || (calc.winnerSide === "A" ? teamA : calc.winnerSide === "B" ? teamB : "");
        return `
          <tr class="border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer" onclick='editMatch(${JSON.stringify(m).replaceAll("'", "&apos;")})'>
            <td class="p-2 font-bold">${escapeHtml(m.id)}</td>
            <td class="p-2 text-center">${escapeHtml(m.fecha)}</td>
            <td class="p-2 text-center">${escapeHtml(m.round)}</td>
            <td class="p-2">${renderPlayersFromText(teamA)}</td>
            <td class="p-2">${renderPlayersFromText(teamB)}</td>
            <td class="p-2 text-center font-mono">${escapeHtml(vacasText)}</td>
            <td class="p-2 text-center font-mono">${escapeHtml(gamesText)}</td>
            <td class="p-2 text-center text-emerald-400">${escapeHtml(winner)}</td>
            <td class="p-2 text-center">${escapeHtml(statusLabel(m))}</td>
          </tr>`;
      }).join("") || `<tr><td colspan="9" class="p-4 text-slate-400">No hay partidas cargadas todavía.</td></tr>`;
    }



    function ensureMatchFormInRounds() {
      const form = document.getElementById("matchForm");
      const roundsTab = document.getElementById("tab-rounds");
      const dashboard = document.getElementById("roundDashboard");
      if (!form || !roundsTab || !dashboard) return;
      if (!roundsTab.contains(form)) {
        roundsTab.insertBefore(form, dashboard);
      }
    }

    function setMatchFormResultMode() {
      ["matchId", "matchFecha", "matchRound"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.readOnly = true;
      });
      ["teamA1", "teamA2", "teamB1", "teamB2", "matchStatus"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = true;
      });
      const title = document.querySelector("#matchForm h3");
      if (title) title.textContent = "Meter / editar resultado";
    }

    function ensureSelectOption(selectId, value) {
      const el = document.getElementById(selectId);
      const safeValue = normalizeName(value || "");
      if (!el) return;
      if (!safeValue) {
        el.value = "";
        return;
      }
      const exists = Array.from(el.options || []).some(opt => normalizeName(opt.value) === safeValue || normalizeName(opt.textContent) === safeValue);
      if (!exists) {
        const opt = document.createElement("option");
        opt.value = safeValue;
        opt.textContent = safeValue;
        el.appendChild(opt);
      }
      el.value = safeValue;
    }

    function getAvatarPlayersFromMatch(m = {}) {
      const raw = m.avatarPlayers || m.avatarPlayer || m.avatarUsedBy || "";
      return String(raw)
        .split(/[;,|]/)
        .map(normalizeName)
        .filter(Boolean);
    }

    function populateAvatarFlagsFromMatch(m = {}) {
      const container = document.getElementById("matchAvatarFlags");
      if (!container) return;

      const players = [
        m.teamA_player1 || m.teamA1 || document.getElementById("teamA1")?.value || "",
        m.teamA_player2 || m.teamA2 || document.getElementById("teamA2")?.value || "",
        m.teamB_player1 || m.teamB1 || document.getElementById("teamB1")?.value || "",
        m.teamB_player2 || m.teamB2 || document.getElementById("teamB2")?.value || ""
      ].map(normalizeName).filter(Boolean);

      const selected = new Set(getAvatarPlayersFromMatch(m));
      container.innerHTML = players.map((p, idx) => `
        <label class="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm">
          <span class="font-bold text-slate-200">${escapeHtml(p)}</span>
          <span class="inline-flex items-center gap-2 text-xs text-slate-400">
            Avatar
            <input type="checkbox" class="avatarFlag w-5 h-5 accent-amber-500" data-player="${escapeHtml(p)}" ${selected.has(p) ? "checked" : ""} />
          </span>
        </label>
      `).join("") || `<div class="text-xs text-amber-300">Selecciona los 4 jugadores antes de marcar avatares.</div>`;
    }

    function getSelectedAvatarPlayers() {
      return Array.from(document.querySelectorAll("#matchAvatarFlags .avatarFlag:checked"))
        .map(cb => normalizeName(cb.dataset.player || ""))
        .filter(Boolean);
    }

    function getFaultPlayersFromMatch(m = {}) {
      const raw = m.faultPlayers || m.penaltyPlayers || m.noShowPlayers || "";
      return String(raw)
        .split(/[;,|]/)
        .map(normalizeName)
        .filter(Boolean);
    }

    function getWinnerPlayersFromMatch(m = {}) {
      const raw = String(m.winner || "").trim();
      const lower = raw.toLowerCase();

      if (!raw || lower === "empate" || lower === "sin resultado" || lower === "cancelada" || lower === "cancelado") {
        return [];
      }

      return raw
        .split(/[;,/|+]/)
        .map(normalizeName)
        .filter(Boolean);
    }

    function getMatchOutcome(m = {}) {
      const calc = calculateMatch(m.vaca1, m.vaca2, m.vaca3, matchSeasonId(m));
      const participants = matchPlayers(m);
      const manualWinners = getWinnerPlayersFromMatch(m);
      const faultPlayers = getFaultPlayersFromMatch(m);

      let winners = [];
      let losers = [];

      // Regla v2.1.3:
      // La columna winner es la fuente oficial si está rellena con jugadores.
      // Esto evita errores en temporadas legacy o partidas administrativas.
      if (manualWinners.length) {
        winners = manualWinners;
        losers = participants.filter(p => !manualWinners.includes(p));
      } else if (faultPlayers.length) {
        winners = participants.filter(p => !faultPlayers.includes(p));
        losers = faultPlayers;
      } else if (calc.valid && calc.complete && calc.winnerSide) {
        const teamA = [normalizeName(m.teamA_player1 || m.teamA1), normalizeName(m.teamA_player2 || m.teamA2)].filter(Boolean);
        const teamB = [normalizeName(m.teamB_player1 || m.teamB1), normalizeName(m.teamB_player2 || m.teamB2)].filter(Boolean);
        winners = calc.winnerSide === "A" ? teamA : teamB;
        losers = calc.winnerSide === "A" ? teamB : teamA;
      }

      return {
        calc,
        participants,
        winners,
        losers,
        faultPlayers,
        manualWinners,
        isResolved: winners.length > 0 || losers.length > 0
      };
    }

    function populateFaultFlagsFromMatch(m = {}) {
      const container = document.getElementById("matchFaultFlags");
      if (!container) return;

      const players = [
        m.teamA_player1 || m.teamA1 || document.getElementById("teamA1")?.value || "",
        m.teamA_player2 || m.teamA2 || document.getElementById("teamA2")?.value || "",
        m.teamB_player1 || m.teamB1 || document.getElementById("teamB1")?.value || "",
        m.teamB_player2 || m.teamB2 || document.getElementById("teamB2")?.value || ""
      ].map(normalizeName).filter(Boolean);

      const selected = new Set(getFaultPlayersFromMatch(m));
      container.innerHTML = players.map(p => `
        <label class="flex items-center justify-between gap-3 bg-slate-950 border border-red-900/70 rounded-xl px-3 py-2 text-sm">
          <span class="font-bold text-slate-200">${escapeHtml(p)}</span>
          <span class="inline-flex items-center gap-2 text-xs text-red-300">
            Falta
            <input type="checkbox" class="faultFlag w-5 h-5 accent-red-500" data-player="${escapeHtml(p)}" ${selected.has(p) ? "checked" : ""} />
          </span>
        </label>
      `).join("") || `<div class="text-xs text-amber-300">Selecciona los 4 jugadores antes de marcar faltas.</div>`;
    }

    function getSelectedFaultPlayers() {
      return Array.from(document.querySelectorAll("#matchFaultFlags .faultFlag:checked"))
        .map(cb => normalizeName(cb.dataset.player || ""))
        .filter(Boolean);
    }

    function openMatchForm() {
      alert("Las partidas se programan previamente. Desde aquí solo se introducen los resultados.");
    }

    function closeMatchForm() {
      const form = document.getElementById("matchForm");
      if (form) form.classList.add("hidden");
      state.isEditing = false;
      state.editingSeasonId = null;
      clearMatchForm();
    }

    function clearMatchForm() {
      ["matchId","matchFecha","matchRound","vaca1","vaca2","vaca3"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
      ["teamA1","teamA2","teamB1","teamB2"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
      const status = document.getElementById("matchStatus");
      if (status) status.value = "confirmed";
      const avatarFlags = document.getElementById("matchAvatarFlags");
      if (avatarFlags) avatarFlags.innerHTML = "";
      const faultFlags = document.getElementById("matchFaultFlags");
      if (faultFlags) faultFlags.innerHTML = "";
      previewMatchResult();
    }

    function editMatch(m) {
      if (isBusyGuard()) return;
      if (!requireLogin()) return;
      if (!canEditMatch(m)) return alert("Solo puedes editar partidas en las que participas.");
      ensureMatchFormInRounds();
      state.isEditing = true;
      state.editingSeasonId = matchSeasonId(m);
      document.getElementById("matchForm").classList.remove("hidden");
      renderResultButtons();
      setMatchFormResultMode();
      document.getElementById("matchId").value = m.id || "";
      document.getElementById("matchFecha").value = m.fecha || "";
      document.getElementById("matchRound").value = m.round || "";
      ensureSelectOption("teamA1", m.teamA_player1 || m.teamA1 || "");
      ensureSelectOption("teamA2", m.teamA_player2 || m.teamA2 || "");
      ensureSelectOption("teamB1", m.teamB_player1 || m.teamB1 || "");
      ensureSelectOption("teamB2", m.teamB_player2 || m.teamB2 || "");
      document.getElementById("vaca1").value = m.vaca1 || "";
      document.getElementById("vaca2").value = m.vaca2 || "";
      document.getElementById("vaca3").value = m.vaca3 || "";
      document.getElementById("matchStatus").value = m.status || "confirmed";
      populateAvatarFlagsFromMatch(m);
      populateFaultFlagsFromMatch(m);
      previewMatchResult();
      document.getElementById("matchForm").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function saveMatch() {
      if (isBusyGuard()) return;
      if (!requireLogin()) return;

      const editingId = document.getElementById("matchId").value.trim();
      const targetSeasonId = state.editingSeasonId ?? state.activeSeasonId;
      const existingMatch = findMatch(editingId, targetSeasonId);
      const targetSeason = getSeasonById(targetSeasonId);

      const calc = calculateMatch(
        document.getElementById("vaca1").value,
        document.getElementById("vaca2").value,
        document.getElementById("vaca3").value,
        targetSeasonId
      );

      if (!calc.valid) return alert("Resultado inválido. Usa 30, 31, 32, 03, 13 o 23.");
      if (!calc.complete) return alert("La partida no está completa. Debe terminar 2-0 o 2-1 en vacas.");

      const teamA1 = document.getElementById("teamA1").value;
      const teamA2 = document.getElementById("teamA2").value;
      const teamB1 = document.getElementById("teamB1").value;
      const teamB2 = document.getElementById("teamB2").value;

      if (!validateSelectedPlayers(true).ok) return;

      const teamA = `${teamA1}/${teamA2}`;
      const teamB = `${teamB1}/${teamB2}`;

      const payload = {
        seasonId: targetSeasonId,
        Season: targetSeason?.season || targetSeason?.label || "",
        id: editingId,
        fecha: document.getElementById("matchFecha").value.trim(),
        round: document.getElementById("matchRound").value.trim(),
        teamA_player1: teamA1,
        teamA_player2: teamA2,
        teamB_player1: teamB1,
        teamB_player2: teamB2,
        vaca1: document.getElementById("vaca1").value.trim(),
        vaca2: document.getElementById("vaca2").value.trim(),
        vaca3: document.getElementById("vaca3").value.trim(),
        vacasA: calc.vacasA,
        vacasB: calc.vacasB,
        gamesA: calc.gamesA,
        gamesB: calc.gamesB,
        winner: calc.winnerSide === "A" ? teamA : teamB,
        status: "pending",
        avatarPlayers: getSelectedAvatarPlayers().join(";"),
        avatarPlayer: getSelectedAvatarPlayers().join(";"),
        avatarUsedBy: getSelectedAvatarPlayers().join(";"),
        faultPlayers: getSelectedFaultPlayers().join(";"),
        penaltyPlayers: getSelectedFaultPlayers().join(";"),
        noShowPlayers: getSelectedFaultPlayers().join(";"),
        createdBy: state.currentUser.name,
        createdAt: new Date().toISOString(),
        updatedBy: state.currentUser.name,
        updatedAt: new Date().toISOString(),
        confirmedBy: "",
        confirmedAt: "",
        rejectedBy: "",
        rejectedAt: "",
        rejectionReason: ""
      };

      if (!payload.id || !payload.fecha || !payload.round) return alert("Faltan ID, fecha o jornada.");

      setStatus("Guardando partida...");
      setBusy(true, "Guardando resultado...");
      try {
        const res = await api("saveMatch", payload);
        if (!res.ok) throw new Error(res.error || "Error guardando");
        closeMatchForm();
        await loadData(true);
        alert("Partida guardada.");
      } catch (err) {
        console.error(err);
        alert("Error guardando partida: " + err.message);
        setStatus("Error guardando partida");
      } finally {
        setBusy(false);
      }
    }


    async function updateMatchStatus(matchId, seasonId, newStatus, extra = {}) {
      if (isBusyGuard()) return;
      if (!requireLogin()) return;
      const match = findMatch(matchId, seasonId);
      if (!match) return alert("Partida no encontrada.");
      if (newStatus === "confirmed" && !hasCompleteValidMatchResult(match)) return alert("No se puede confirmar una partida sin resultado completo.");

      const updated = {
        ...match,
        status: newStatus,
        updatedBy: state.currentUser.name,
        updatedAt: new Date().toISOString(),
        ...extra
      };

      setBusy(true, newStatus === "confirmed" ? "Confirmando resultado..." : newStatus === "rejected" ? "Rechazando resultado..." : "Actualizando partida...");
      try {
        const res = await api("saveMatch", updated);
        if (!res.ok) return alert("Error actualizando partida.");
        await loadData(true);
      } finally {
        setBusy(false);
      }
    }

    async function confirmMatch(matchId, seasonId) {
      const match = findMatch(matchId, seasonId);
      if (!match) return alert("Partida no encontrada.");
      if (!canConfirmMatch(match)) return alert("No puedes confirmar esta partida.");
      await updateMatchStatus(matchId, seasonId, "confirmed", {
        confirmedBy: state.currentUser.name,
        confirmedAt: new Date().toISOString()
      });
      alert("Resultado confirmado.");
    }

    async function rejectMatch(matchId, seasonId) {
      const match = findMatch(matchId, seasonId);
      if (!match) return alert("Partida no encontrada.");
      if (!canConfirmMatch(match)) return alert("No puedes rechazar esta partida.");
      const reason = prompt("Motivo del rechazo:", "Resultado incorrecto");
      if (reason === null) return;
      await updateMatchStatus(matchId, seasonId, "rejected", {
        rejectedBy: state.currentUser.name,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason
      });
      alert("Resultado rechazado.");
    }

