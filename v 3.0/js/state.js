    let state = {
      players: [],
      matches: [],
      logs: [],
      history: [],
      venues: [],
      seasons: [],
      activeSeason: "",
      currentUser: null,
      calculatedStandings: [],
      selectedProfilePlayer: '',
      isEditing: false
    };

    let autoRefreshEnabled = false;
    let autoRefreshTimer = null;
    let deferredInstallPrompt = null;
    let appBusy = false;
