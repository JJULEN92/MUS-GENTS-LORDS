    function renderVenues() {
      const grid = document.getElementById("venuesGrid");
      if (!grid) return;

      const venues = state.venues || [];

      if (!venues.length) {
        grid.innerHTML = `<div class="text-slate-500 bg-slate-950 border border-slate-800 rounded-2xl p-5">No hay sedes configuradas o no se han recibido desde Google Sheets.</div>`;
        return;
      }

      grid.innerHTML = venues.map(v => `
        <div class="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden hover:border-amber-500/40 transition-all shadow-xl">
          <div class="h-44 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden">
            ${v.image ? `<img src="${escapeHtml(v.image)}" class="w-full h-full object-cover" onerror="this.style.display='none'" />`
            : `<div class="text-6xl">♠️</div>`}
          </div>

          <div class="p-5">
            <h3 class="text-base sm:text-xl font-black">${escapeHtml(v.name)}</h3>
            <div class="text-xs uppercase tracking-wider text-amber-400 font-bold mt-1">${escapeHtml(v.type || "Sede oficial")}</div>

            <p class="text-sm text-slate-300 mt-4 leading-relaxed">
              ${escapeHtml(v.description || "Sede oficial del circuito Gents & Lords.")}
            </p>

            ${v.address ? `<div class="mt-4 text-sm text-slate-400">📍 ${escapeHtml(v.address)}</div>` : ""}

            ${v.mapsUrl ? `
              <a href="${escapeHtml(v.mapsUrl)}" target="_blank"
                 class="mt-4 inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 px-4 py-2 rounded-xl font-black text-sm">
                🗺️ Abrir en Google Maps
              </a>` : ""}
          </div>
        </div>
      `).join("");
    }


