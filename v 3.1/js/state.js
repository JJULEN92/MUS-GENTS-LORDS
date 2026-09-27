    let state = {
      players: [],
      matches: [],
      logs: [],
      history: [],
      venues: [],
      seasons: [],
      activeSeasonId: null,
      activeSeason: "", // etiqueta visible; la identidad real es activeSeasonId
      currentUser: null,
      calculatedStandings: [],
      selectedProfilePlayer: '',
      isEditing: false,
      editingSeasonId: null
    };

    let autoRefreshEnabled = false;
    let autoRefreshTimer = null;
    let deferredInstallPrompt = null;
    let appBusy = false;
