    async function loadData(skipBusyGuard = false) {
      if (!skipBusyGuard && isBusyGuard()) return;
      if (!skipBusyGuard) setBusy(true, "Actualizando datos...");
      setStatus("Cargando datos...");
      try {
        const data = await api("getData");
        if (!data.ok) throw new Error(data.error || "Error desconocido");
        state.players = normalizePlayers(data.players || []);
        restoreLogin();
        state.matches = data.matches || [];
        state.logs = data.logs || [];
        state.history = normalizeHistory(data.history || []);
        state.venues = normalizeVenues(data.venues || []);
        state.seasons = normalizeSeasons(data.seasons || []);
        state.activeSeasonId = getActiveSeasonId();
        state.activeSeason = getActiveSeasonLabel();
        renderAll();
        setStatus("Datos actualizados");
      } catch (err) {
        console.error(err);
        setStatus("Error cargando datos: " + err.message);
      } finally {
        if (!skipBusyGuard) setBusy(false);
      }
    }


    function normalizeHistory(history) {
      return (history || []).filter(h => h.season || h.category || h.winners).map(h => ({
        season: h.season || "",
        category: h.category || "",
        winners: h.winners || "",
        notes: h.notes || ""
      }));
    }

    function normalizeVenues(venues) {
      return (venues || []).filter(v => v.name).map(v => ({
        name: v.name || "",
        type: v.type || "",
        address: v.address || "",
        mapsUrl: v.mapsUrl || "",
        description: v.description || "",
        image: v.image || ""
      }));
    }

    function normalizeSeasons(seasons) {
      return (seasons || []).map(s => {
        const rawId = s.seasonId ?? s.SeasonId ?? s.SEASONID ?? s.id ?? s.ID ?? "";
        const season = s.season ?? s.Season ?? s.SEASON ?? s.temporada ?? s.Temporada ?? "";
        const active = s.active ?? s.Active ?? s.ACTIVE ?? s.activa ?? s.Activa ?? s.ACTIVA ?? "";
        const label = s.label ?? s.Label ?? s.LABEL ?? s.nombre ?? s.Nombre ?? season;
        const seasonId = Number(rawId);

        return {
          seasonId: Number.isFinite(seasonId) ? seasonId : null,
          season: String(season || "").trim(),
          active: String(active || "").trim(),
          label: String(label || season || "").trim()
        };
      }).filter(s => s.seasonId !== null);
    }

    function getActiveSeasonId() {
      const active = (state.seasons || []).find(s => {
        const value = String(s.active || "").trim().toLowerCase();
        return value === "si" || value === "sí" || value === "yes" || value === "true" || value === "1";
      });
      return active?.seasonId ?? null;
    }

    function getSeasonById(seasonId) {
      const id = Number(seasonId);
      return (state.seasons || []).find(s => s.seasonId === id) || null;
    }

    function getActiveSeasonLabel() {
      const active = getSeasonById(state.activeSeasonId);
      return active?.label || active?.season || "Todas las temporadas";
    }

    function normalizePlayers(players) {
      return players.filter(p => p.id !== "" && p.name).map(p => {
        const rawAvatar = p.avatar || "";
        const rawPhoto = p.photoUrl || p.photo || p.image || "";
        const avatarLooksNumeric = rawAvatar !== "" && !isNaN(Number(rawAvatar));
        return {
          ...p,
          id: String(p.id),
          name: normalizeName(p.name),
          role: p.role || "player",
          penal: Number(p.penal || 0),
          avatarCount: avatarLooksNumeric ? Number(rawAvatar || 0) : Number(p.avatarCount || p.avatar_used || p.flagav || 0),
          avatar: avatarLooksNumeric ? rawPhoto : rawAvatar,
          description: p.description || p.descripcion || p.bio || "",
          flagav: Number(p.flagav || 0),
          flagpen: Number(p.flagpen || 0),
          flagpa: Number(p.flagpa || 0),
          flagwin: Number(p.flagwin || 0),
          flagfinal: Number(p.flagfinal || 0),
          flagcm: Number(p.flagcm || 0),
          flagsf: Number(p.flagsf || 0)
        };
      });
    }

    function renderAll() {
      renderLoginPlayers();
      renderPlayerSelects();
      state.calculatedStandings = calculateStandings();
      renderStandings();
      renderRoundDashboard();
      renderStats();
      renderPendingPanel();
      renderMatches();
      renderPlayers();
      renderVenues();
      renderHistory();
      renderLogs();
      renderActiveUser();
      renderActiveSeasonLabels();
      renderAdminControls();
    }

    function renderLoginPlayers() {
      const options = '<option value="">Selecciona jugador</option>' + state.players.map(p =>
        `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.role === "admin" ? " 👑" : ""}</option>`
      ).join("");

      const oldSelect = document.getElementById("loginPlayer");
      if (oldSelect) {
        const current = oldSelect.value;
        oldSelect.innerHTML = options;
        oldSelect.value = current;
      }

      const screenSelect = document.getElementById("loginScreenPlayer");
      if (screenSelect) {
        const current = screenSelect.value;
        screenSelect.innerHTML = options;
        screenSelect.value = current;
      }
    }

    function renderPlayerSelects() {
      const options = '<option value="">Jugador</option>' + state.players.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join("");
      document.querySelectorAll(".playerSelect").forEach(sel => {
        const current = sel.value;
        sel.innerHTML = options;
        sel.value = current;
      });
    }

