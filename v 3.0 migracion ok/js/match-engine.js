    function calculateMatch(v1, v2, v3, season = "") {
      const vacas = [v1, v2, v3].filter(v => String(v || "").trim() !== "");
      let vacasA = 0, vacasB = 0, gamesA = 0, gamesB = 0;
      for (const v of vacas) {
        const parsed = parseVaca(v, season);
        if (!parsed.valid) return { valid: false, complete: false, error: parsed.error, vacasA: 0, vacasB: 0, gamesA: 0, gamesB: 0, winnerSide: "" };
        gamesA += parsed.a;
        gamesB += parsed.b;
        if (parsed.winner === "A") vacasA++;
        if (parsed.winner === "B") vacasB++;
      }
      const complete = vacasA === 2 || vacasB === 2;
      return {
        valid: true,
        complete,
        vacasA,
        vacasB,
        gamesA,
        gamesB,
        winnerSide: vacasA === 2 ? "A" : vacasB === 2 ? "B" : ""
      };
    }

    function isLegacySeason(season) {
      const s = String(season || "").trim();
      return s === "2024-2025";
    }

    function parseVaca(value, season = "") {
      let s = String(value ?? "").trim().replace("-", "").replace(" ", "");

      // Google Sheets puede convertir 03/02 en número 3/2.
      if (/^\d$/.test(s)) s = "0" + s;

      if (!/^\d{2}$/.test(s)) return { valid: false, error: "Formato inválido" };

      const a = Number(s[0]);
      const b = Number(s[1]);

      if (isLegacySeason(season)) {
        const validLegacyScores = (a === 2 && [0,1].includes(b)) || (b === 2 && [0,1].includes(a)) || (a === 0 && b === 0);
        if (!validLegacyScores) return { valid: false, error: "En 2024-2025 una vaca debe ser 20/21 o 02/12" };
        return { valid: true, a, b, winner: a === 2 ? "A" : b === 2 ? "B" : "", normalized: s };
      }

      const validScores = (a === 3 && [0,1,2].includes(b)) || (b === 3 && [0,1,2].includes(a));
      if (!validScores) return { valid: false, error: "Una vaca debe ser 30/31/32 o 03/13/23" };

      return { valid: true, a, b, winner: a === 3 ? "A" : "B", normalized: s };
    }

    function previewMatchResult() {
      const calc = calculateMatch(
        document.getElementById("vaca1").value,
        document.getElementById("vaca2").value,
        document.getElementById("vaca3").value
      );
      const preview = document.getElementById("matchPreview");
      const validation = document.getElementById("matchValidation");
      const teamA = [document.getElementById("teamA1").value, document.getElementById("teamA2").value].filter(Boolean).join(" / ") || "Pareja A";
      const teamB = [document.getElementById("teamB1").value, document.getElementById("teamB2").value].filter(Boolean).join(" / ") || "Pareja B";

      if (validation) {
        const playerValidation = validateSelectedPlayers(false);
        validation.innerHTML = playerValidation.ok
          ? '<span class="text-emerald-400">Jugadores correctos: 4 jugadores distintos.</span>'
          : `<span class="text-amber-400">${escapeHtml(playerValidation.message)}</span>`;
      }

      if (!calc.valid) {
        preview.innerHTML = '<span class="text-red-400 font-bold">Resultado inválido.</span> Usa 30, 31, 32, 03, 13 o 23.';
        return;
      }

      const winner = calc.winnerSide === "A" ? teamA : calc.winnerSide === "B" ? teamB : "Sin ganador todavía";
      const completion = calc.complete
        ? '<span class="text-emerald-400 font-bold">Partida completa</span>'
        : '<span class="text-amber-400 font-bold">Partida incompleta: debe acabar 2-0 o 2-1 en vacas</span>';

      preview.innerHTML = `Vacas: <b>${calc.vacasA}-${calc.vacasB}</b> · Juegos: <b>${calc.gamesA}-${calc.gamesB}</b> · Ganador: <span class="text-emerald-400 font-bold">${escapeHtml(winner)}</span><br>${completion}`;
    }

    function renderResultButtons() {
      const values = ["30", "31", "32", "03", "13", "23"];
      document.querySelectorAll(".resultButtons").forEach(container => {
        const target = container.dataset.target;
        container.innerHTML = values.map(v => `
          <button type="button" onclick="setVacaValue('${target}','${v}')" class="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 rounded-lg py-1.5 text-xs font-black transition-all">${v}</button>
        `).join("");
      });
    }

    function setVacaValue(target, value) {
      document.getElementById(target).value = value;
      previewMatchResult();
    }

    function validateSelectedPlayers(showAlert = true) {
      const teamA1 = document.getElementById("teamA1").value;
      const teamA2 = document.getElementById("teamA2").value;
      const teamB1 = document.getElementById("teamB1").value;
      const teamB2 = document.getElementById("teamB2").value;
      const allPlayers = [teamA1, teamA2, teamB1, teamB2];

      if (allPlayers.some(x => !x)) {
        const msg = "Selecciona los 4 jugadores.";
        if (showAlert) alert(msg);
        return { ok: false, message: msg };
      }

      if (new Set(allPlayers).size !== 4) {
        const msg = "No puede repetirse ningún jugador en la misma partida.";
        if (showAlert) alert(msg);
        return { ok: false, message: msg };
      }

      return { ok: true, message: "OK" };
    }

