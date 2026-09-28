    function showLoginScreen(force = false) {
      const screen = document.getElementById("loginScreen");
      if (!screen) return;
      if (force || !state.currentUser) screen.classList.remove("hidden");
    }

    function hideLoginScreen() {
      const screen = document.getElementById("loginScreen");
      if (screen) screen.classList.add("hidden");
    }

    function login() {
      const id = document.getElementById("loginPlayer")?.value || document.getElementById("loginScreenPlayer")?.value;
      const pass = document.getElementById("loginPassword")?.value || document.getElementById("loginScreenPassword")?.value;
      return performLogin(id, pass);
    }

    function loginFromScreen() {
      const id = document.getElementById("loginScreenPlayer").value;
      const pass = document.getElementById("loginScreenPassword").value;
      return performLogin(id, pass);
    }

    function performLogin(id, pass) {
      const player = state.players.find(p => String(p.id) === String(id));
      if (!player) return alert("Selecciona un jugador.");
      if (String(player.password || "") !== String(pass || "")) return alert("Clave incorrecta.");

      state.currentUser = player;
      localStorage.setItem("mus_current_user_id", player.id);
      localStorage.setItem("mus_current_user_name", player.name);

      hideLoginScreen();
      renderActiveUser();
      renderPlayers();
      renderAdminControls();
    }

    function logout() {
      state.currentUser = null;
      localStorage.removeItem("mus_current_user_id");
      localStorage.removeItem("mus_current_user_name");
      renderActiveUser();
      renderAdminControls();
      showLoginScreen(true);
    }

    function restoreLogin() {
      const id = localStorage.getItem("mus_current_user_id");
      if (!id) {
        showLoginScreen(true);
        return;
      }

      const player = state.players.find(p => String(p.id) === String(id));
      if (player) {
        state.currentUser = player;
        hideLoginScreen();
      } else {
        showLoginScreen(true);
      }
    }

    function renderActiveUser() {
      const label = state.currentUser
        ? `${state.currentUser.name} (${state.currentUser.role || "player"})`
        : "No identificado";

      const active = document.getElementById("activeUser");
      if (active) active.textContent = label;

      const header = document.getElementById("headerUser");
      if (header) header.textContent = label;
    }

    function renderActiveSeasonLabels() {
      const label = getActiveSeasonLabel();

      const rank = document.getElementById("activeSeasonLabelRank");
      if (rank) rank.textContent = label;

      const games = document.getElementById("activeSeasonLabelGames");
      if (games) games.textContent = label;
    }

    function requireLogin() {
      if (!state.currentUser) {
        alert("Debes identificarte primero.");
        return false;
      }
      return true;
    }

