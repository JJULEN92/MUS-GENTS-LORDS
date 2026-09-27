    document.querySelectorAll(".field").forEach(el => {
      el.className = "bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full";
    });


    function setBusy(isBusy, message = "Procesando...") {
      appBusy = isBusy;

      const overlay = document.getElementById("busyOverlay");
      const text = document.getElementById("busyOverlayText");

      if (text) text.textContent = message;
      if (overlay) overlay.classList.toggle("hidden", !isBusy);

      document.querySelectorAll("button, select, input, textarea").forEach(el => {
        if (el.id === "busyOverlayText") return;
        if (isBusy) {
          if (!el.dataset.prevDisabled) el.dataset.prevDisabled = el.disabled ? "1" : "0";
          el.disabled = true;
          el.classList.add("opacity-60", "pointer-events-none");
        } else {
          if (el.dataset.prevDisabled === "0") el.disabled = false;
          if (el.dataset.prevDisabled === "1") el.disabled = true;
          delete el.dataset.prevDisabled;
          el.classList.remove("opacity-60", "pointer-events-none");
        }
      });
    }

    function isBusyGuard() {
      if (appBusy) return true;
      return false;
    }


    async function api(action, payload = {}) {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action, ...payload })
      });
      const txt = await res.text();
      try {
        return JSON.parse(txt);
      } catch (e) {
        throw new Error("Respuesta no JSON del backend: " + txt.slice(0, 200));
      }
    }
