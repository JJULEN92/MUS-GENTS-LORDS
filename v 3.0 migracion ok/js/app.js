    function toggleAutoRefresh() {
      autoRefreshEnabled = !autoRefreshEnabled;
      document.getElementById("autoRefreshBtn").textContent = autoRefreshEnabled ? "⏱️ Auto 5m: ON" : "⏱️ Auto: OFF";
      document.getElementById("autoRefreshBtn").className = autoRefreshEnabled
        ? "bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold"
        : "bg-red-900 hover:bg-red-800 px-4 py-2 rounded-lg text-sm font-bold";
    }

    function startAutoRefresh() {
      if (autoRefreshTimer) clearInterval(autoRefreshTimer);
      autoRefreshTimer = setInterval(() => {
        if (autoRefreshEnabled && !state.isEditing) {
          loadData();
        }
      }, 300000);
    }

    loadData();
    updateInstallButton();
    startAutoRefresh();
