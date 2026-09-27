    function showTab(event, tab) {
      if (tab === "logs" && !isAdmin()) {
        alert("Solo el administrador puede acceder al Log.");
        return;
      }
      document.querySelectorAll(".tabContent").forEach(el => el.classList.add("hidden"));
      document.getElementById("tab-" + tab).classList.remove("hidden");
      document.querySelectorAll(".tabBtn").forEach(el => {
        el.classList.remove("bg-emerald-700");
        el.classList.add("bg-slate-800");
      });
      event.target.classList.add("bg-emerald-700");
      event.target.classList.remove("bg-slate-800");
    }


    function toggleTopPanel() {
      const panel = document.getElementById("topPanelActions");
      if (!panel) return;
      panel.classList.toggle("hidden");
      panel.classList.toggle("flex");
    }

    function setStatus(txt) {
      const now = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      document.getElementById("appStatus").textContent = `${txt} · ${now}`;
    }

    function normalizeName(name) {
      const n = String(name || "").trim();
      if (n.toLowerCase() === "chetin") return "Chete";
      return n;
    }

    function matchSeason(match) {
      return String(match?.Season || match?.season || "").trim();
    }

    function isActiveSeasonMatch(match) {
      if (!state.activeSeason) return true;
      return matchSeason(match) === state.activeSeason;
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }



    function exportBackupJson() {
      if (!isAdmin()) {
        alert("Solo el administrador puede descargar backups.");
        return;
      }

      const backup = {
        exportedAt: new Date().toISOString(),
        players: state.players,
        matches: state.matches,
        calculatedStandings: state.calculatedStandings,
        logs: state.logs
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "backup_torneo_mus_gents_lords_" + new Date().toISOString().slice(0,10) + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

