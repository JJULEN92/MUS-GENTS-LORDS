    function isIosDevice() {
      const ua = window.navigator.userAgent || "";
      const platform = window.navigator.platform || "";
      const iOS = /iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
      return iOS;
    }

    function isAndroidDevice() {
      return /Android/i.test(window.navigator.userAgent || "");
    }

    function isStandaloneMode() {
      return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    }

    function updateInstallButton() {
      const btn = document.getElementById("installBtn");
      if (!btn) return;

      if (isStandaloneMode()) {
        btn.classList.add("hidden");
        return;
      }

      if (isIosDevice()) {
        btn.textContent = "📲 Instalar en iPhone";
        btn.classList.remove("hidden");
        return;
      }

      if (deferredInstallPrompt) {
        btn.textContent = isAndroidDevice() ? "📲 Instalar en Android" : "📲 Instalar";
        btn.classList.remove("hidden");
        return;
      }

      btn.classList.add("hidden");
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      updateInstallButton();
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      updateInstallButton();
    });

    function closeIosInstallModal() {
      const modal = document.getElementById("iosInstallModal");
      if (modal) modal.classList.add("hidden");
    }

    async function installApp() {
      if (isStandaloneMode()) {
        alert("La app ya está instalada.");
        updateInstallButton();
        return;
      }

      if (isIosDevice()) {
        const modal = document.getElementById("iosInstallModal");
        if (modal) modal.classList.remove("hidden");
        return;
      }

      if (!deferredInstallPrompt) {
        alert("Si no aparece instalación automática, usa el menú del navegador: Añadir a pantalla de inicio.");
        return;
      }

      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      updateInstallButton();
    }

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(console.error);
      });
    }

