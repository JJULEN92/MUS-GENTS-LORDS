    function renderLogs() {
      const logsBody = document.getElementById("logsBody");
      if (!logsBody) return;

      if (!isAdmin()) {
        logsBody.innerHTML = `<tr><td colspan="4" class="p-4 text-slate-400">Solo administrador.</td></tr>`;
        return;
      }

      const rows = [...state.logs].reverse().slice(0, 50);
      logsBody.innerHTML = rows.map(l => `
        <tr class="border-b border-slate-800">
          <td class="p-2 text-xs">${escapeHtml(l.timestamp)}</td>
          <td class="p-2">${escapeHtml(l.user)}</td>
          <td class="p-2">${escapeHtml(l.action)}</td>
          <td class="p-2 text-xs text-slate-400 max-w-xl truncate">${escapeHtml(l.details)}</td>
        </tr>
      `).join("") || `<tr><td colspan="4" class="p-4 text-slate-400">Sin cambios registrados.</td></tr>`;
    }

