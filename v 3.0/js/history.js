    function historyKey(category) {
      const c = String(category || "").toLowerCase();
      if (c.includes("puto")) return "puto";
      if (c.includes("ganador") || c.includes("champion") || c.includes("winner")) return "ganadores";
      if (c.includes("final")) return "finalistas";
      if (c.includes("cuchara")) return "cuchara";
      return "otros";
    }

    function playerAvatarByName(name) {
      const clean = normalizeName(String(name || "").split("/")[0].trim());
      const player = state.players.find(p => normalizeName(p.name) === clean);
      return player?.avatar || "assets/logo.png?v=0154";
    }

    function renderWinnerAvatars(winners, colorClass = "border-amber-400") {
      const names = String(winners || "")
        .split("/")
        .map(x => normalizeName(x.trim()))
        .filter(Boolean);

      if (!names.length) return "";

      return `
        <div class="flex justify-center ${names.length > 1 ? "-space-x-3" : ""} mb-2">
          ${names.map((name, idx) => `
            <img src="${escapeHtml(playerAvatarByName(name))}"
                 onerror="this.src='assets/logo.png?v=0154'"
                 class="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover bg-white p-1 border-2 ${colorClass} shadow-xl" />
          `).join("")}
        </div>
      `;
    }


    function renderPlayerMini(name, size = "w-7 h-7") {
      const clean = normalizeName(name || "");
      if (!clean) return "";
      return `
        <span class="inline-flex items-center gap-2 align-middle">
          <img src="${escapeHtml(playerAvatarByName(clean))}"
               onerror="this.src='assets/logo.png?v=0154'"
               class="${size} rounded-full object-cover bg-white p-[1px] border border-slate-600 shadow-sm" />
          <span>${escapeHtml(clean)}</span>
        </span>
      `;
    }

    function renderPlayersInline(names, size = "w-7 h-7") {
      return (names || [])
        .map(n => normalizeName(n || ""))
        .filter(Boolean)
        .map(n => renderPlayerMini(n, size))
        .join('<span class="text-slate-500 mx-1">/</span>');
    }

    function renderTeamMiniFromMatch(m, side, size = "w-7 h-7") {
      const names = side === "A"
        ? [m.teamA_player1 || m.teamA1 || "", m.teamA_player2 || m.teamA2 || ""]
        : [m.teamB_player1 || m.teamB1 || "", m.teamB_player2 || m.teamB2 || ""];
      return renderPlayersInline(names, size) || "-";
    }

    function renderPlayersFromText(text, separatorRegex = /\s*[+/]\s*/) {
      return String(text || "")
        .split(separatorRegex)
        .map(x => normalizeName(x.trim()))
        .filter(Boolean)
        .map(n => renderPlayerMini(n, "w-6 h-6"))
        .join('<span class="text-slate-500 mx-1">/</span>') || "-";
    }


    function renderHofCell(item, icon, colorClass) {
      if (!item) {
        return `
          <div class="flex flex-col items-center justify-center text-center min-h-[96px] opacity-35">
            <div class="text-4xl mb-2">${icon}</div>
            <div class="text-sm text-slate-500 font-bold">Sin dato</div>
          </div>
        `;
      }

      return `
        <div class="flex flex-col items-center justify-center text-center min-h-[96px]">
          ${renderWinnerAvatars(item.winners, colorClass)}
          <div class="text-base sm:text-xl font-black text-white leading-tight">${escapeHtml(item.winners || "-")}</div>
        </div>
      `;
    }

    function renderHistory() {
      const grid = document.getElementById("historyGrid");
      if (!grid) return;

      const history = state.history || [];

      if (!history.length) {
        grid.innerHTML = `<div class="text-slate-500 bg-slate-950 border border-slate-800 rounded-2xl p-5">No hay histórico configurado.</div>`;
        return;
      }

      const grouped = {};
      history.forEach(h => {
        const season = h.season || "Sin temporada";
        grouped[season] = grouped[season] || {};
        grouped[season][historyKey(h.category)] = h;
      });

      const seasons = Object.keys(grouped).sort((a, b) => String(b).localeCompare(String(a)));

      function hofAwardCard(row, key, icon, title, borderClass) {
        return `
          <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
            <div class="text-3xl mb-2">${icon}</div>
            <div class="text-xs uppercase tracking-wider text-slate-500 font-black">${title}</div>
            <div class="mt-3">${renderHofCell(row[key], icon, borderClass)}</div>
          </div>
        `;
      }

      grid.innerHTML = `
        <div class="space-y-4">
          ${seasons.map((season, idx) => {
            const row = grouped[season];
            const isCurrent = idx === 0 ? "Actual" : "Histórica";
            return `
              <div class="bg-slate-950/70 border border-slate-700/70 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-sm">
                <div class="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <div class="text-2xl sm:text-3xl font-black text-amber-300">${escapeHtml(season)}</div>
                    <div class="text-xs text-slate-400 mt-1">Temporada ${isCurrent}</div>
                  </div>
                  <div class="text-3xl">🏛️</div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  ${hofAwardCard(row, "puto", "🥇", "Puto Amo", "border-yellow-400")}
                  ${hofAwardCard(row, "ganadores", "🏆", "Winners", "border-emerald-400")}
                  ${hofAwardCard(row, "finalistas", "👏", "Finalists", "border-cyan-400")}
                  ${hofAwardCard(row, "cuchara", "🥄", "Wooden Spoon", "border-orange-400")}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }


