function renderControlCenter() {
  syncNowPlayingFromMusicState();
  const track = currentMusicTrack();
  const progress = musicProgressPercent();
  screen.classList.remove("light-context");
  view.innerHTML = `
    <section class="control-center ios-control-center">
      <div class="control-mosaic">
        <div class="control-connectivity control-glass">
          ${controlBubble("airplane", "A", "Mode avion", state.settings.airplane, "orange", "toggle-airplane")}
          ${controlBubble("wifi", "Wi", "Wi-Fi", state.settings.wifi, "blue", "toggle-wifi")}
          ${controlBubble("bluetooth", "Bt", "Bluetooth", state.settings.bluetooth, "blue", "toggle-bluetooth")}
          ${controlBubble("cellular", "5G", "Cellulaire", state.settings.cellular, "green", "toggle-cellular")}
        </div>
        <div class="control-media control-glass">
          <span class="control-cover" style="background:${escapeHtml(track.color)}">${escapeHtml(track.cover)}</span>
          <span class="control-track">
            <strong>${escapeHtml(track.title)}</strong>
            <small>${escapeHtml(track.artist)}</small>
            <i><b style="width:${progress}%"></b></i>
          </span>
          <span class="control-media-buttons">
            <button data-action="music-prev">&lt;</button>
            <button data-action="music-toggle">${state.musicState.isPlaying ? "II" : ">"}</button>
            <button data-action="music-next">&gt;</button>
          </span>
        </div>
        <div class="control-slider control-glass" data-slider="brightness">
          <span class="control-slider-fill brightness" style="height:${state.brightness}%"></span>
          <strong>Sun</strong>
        </div>
        <div class="control-slider control-glass" data-slider="volume">
          <span class="control-slider-fill volume" style="height:${Math.round(systemState.volume * 100)}%"></span>
          <strong>${systemState.volume <= 0.01 ? "Mute" : "Vol"}</strong>
        </div>
        <div class="control-quick-grid">
          ${quickControl("flash", "L", "Lampe")}
          ${quickControl("camera", "C", "Camera")}
          ${quickControl("calculator", "=", "Calcul")}
          ${quickControl("dark", "D", "Sombre", "toggle-dark", state.settings.darkMode)}
          ${quickControl("focus", "F", state.settings.focusMode || "Focus", "open-focus", state.settings.focus)}
          ${quickControl("screen", "S", "Recopie")}
        </div>
        ${state.focusPickerOpen ? focusPicker() : ""}
      </div>
    </section>
  `;
}

function controlTile(title, value) {
  return `<button class="control-tile" data-action="toggle-control"><strong>${title}</strong><span>${value}</span></button>`;
}

function controlBubble(id, icon, label, active, tone, action) {
  return `
    <button class="control-bubble ${active ? "active" : ""} ${tone}" data-action="${action}" data-control="${id}">
      <i>${escapeHtml(icon)}</i>
      <span>${escapeHtml(label)}</span>
    </button>
  `;
}

function quickControl(id, icon, label, action = "toggle-control", active = false) {
  const app = id === "camera" ? "camera" : id === "calculator" ? "calculator" : "";
  return `
    <button class="quick-control ${active ? "active" : ""}" ${app ? `data-app="${app}"` : `data-action="${action}"`} data-control="${id}">
      <i>${escapeHtml(icon)}</i>
      <span>${escapeHtml(label)}</span>
    </button>
  `;
}

function focusPicker() {
  return `
    <div class="focus-picker control-glass">
      ${["Ne pas deranger", "Travail", "Personnel", "Sommeil"].map(mode => `
        <button class="${state.settings.focusMode === mode ? "active" : ""}" data-action="set-focus" data-focus="${escapeHtml(mode)}">${escapeHtml(mode)}</button>
      `).join("")}
    </div>
  `;
}

function renderSwitcher() {
  screen.classList.remove("light-context");
  const openApps = [...state.openApps]
    .filter(item => apps.some(app => app.id === item.id))
    .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
  view.innerHTML = `
    <section class="switcher app-switcher">
      <div class="app-switcher-top">
        <span>Apps ouvertes</span>
        <button data-action="close-all-apps">Fermer toutes les apps</button>
      </div>
      ${openApps.length ? `
        <div class="app-switcher-track">
          ${openApps.map(renderSwitcherCard).join("")}
        </div>
      ` : `
        <div class="app-switcher-empty">
          <strong>Aucune app ouverte</strong>
          <span>Les apps fermees completement n'ont plus d'activite en arriere-plan.</span>
        </div>
      `}
    </section>
  `;
}

function renderSwitcherCard(item) {
  const app = apps.find(appItem => appItem.id === item.id);
  return `
    <article class="app-switcher-item" data-switcher-app="${escapeHtml(item.id)}">
      <button class="app-switcher-card" data-app="${escapeHtml(item.id)}">
        ${renderSwitcherPreview(item.id)}
      </button>
      <div class="app-switcher-caption">
        <span class="app-icon mini icon-${escapeHtml(item.id)}" style="background:${escapeHtml(app?.color || "#8e8e93")};color:${app?.darkText ? "#111827" : "white"}">${appSymbol(item.id)}</span>
        <strong>${escapeHtml(app?.name || item.name || item.id)}</strong>
        <button data-action="force-close-app" data-close-app="${escapeHtml(item.id)}">Fermer</button>
      </div>
    </article>
  `;
}

function renderSwitcherPreview(appId) {
  if (appId === "music") {
    const track = currentMusicTrack();
    return `
      <div class="switcher-preview music-preview">
        <span class="switcher-cover" style="background:${escapeHtml(track?.color || "#ff2d55")}">${escapeHtml(track?.cover || "M")}</span>
        <strong>${escapeHtml(state.musicState.isPlaying ? track?.title || "Musique" : "Musique")}</strong>
        <small>${escapeHtml(state.musicState.isPlaying ? track?.artist || "Pause" : "Arretee")}</small>
      </div>
    `;
  }
  if (appId === "racing") {
    return `
      <div class="switcher-preview racing-preview">
        <span class="switcher-cover">FR</span>
        <strong>FRITIX Racing</strong>
        <small>${escapeHtml(state.racing.status === "playing" ? `Score ${Math.floor(state.racing.score || 0)}` : "Pret a jouer")}</small>
      </div>
    `;
  }
  if (appId === "messages") return `<div class="switcher-preview list-preview"><strong>Messages</strong><span>Emma Laurent</span><span>Lucas Bernard</span><span>NOVA</span></div>`;
  if (appId === "phone") return `<div class="switcher-preview phone-preview"><strong>${callState.active ? callState.contactName || "Appel" : "Telephone"}</strong><small>${callState.active ? "Appel actif" : "Recents"}</small></div>`;
  if (appId === "clock") return `<div class="switcher-preview clock-preview"><strong>${escapeHtml(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }))}</strong><small>${escapeHtml(state.clock.tab || "Horloge")}</small></div>`;
  if (appId === "store") return `<div class="switcher-preview store-preview"><strong>App Store</strong><span>Aujourd'hui</span><span>Recherche</span></div>`;
  const app = apps.find(item => item.id === appId);
  return `<div class="switcher-preview generic-preview"><span class="app-icon icon-${escapeHtml(appId)}" style="background:${escapeHtml(app?.color || "#8e8e93")};color:${app?.darkText ? "#111827" : "white"}">${appSymbol(appId)}</span><strong>${escapeHtml(app?.name || appId)}</strong><small>${escapeHtml(appSnapshotLabel(appId))}</small></div>`;
}

function renderSpotlight() {
  screen.classList.remove("light-context");
  view.innerHTML = `<section class="spotlight"><input id="spotlight-input" placeholder="Rechercher" autofocus><div class="spotlight-section"><h3>Applications suggerees</h3><div class="suggested-apps">${apps.slice(0, 8).map(appIcon).join("")}</div></div><div class="spotlight-results" id="spotlight-results">${["NOVA Core","Notes recentes","Contact Fritix","Document prototype"].map(item => `<button class="result-row">${item}</button>`).join("")}</div></section>`;
  document.querySelector("#spotlight-input").focus();
}

function renderNotifications() {
  screen.classList.remove("light-context");
  const groups = state.notifications.reduce((map, item) => {
    if (!map[item.app]) map[item.app] = [];
    map[item.app].push(item);
    return map;
  }, {});
  view.innerHTML = `
    <section class="notification-center ios-notification-center">
      <header class="notification-center-header">
        <h2>Notifications</h2>
        <button data-action="home">OK</button>
      </header>
      <div class="notification-groups">
        ${Object.entries(groups).map(([appName, items]) => `
          <section class="notification-group">
            <h3>${escapeHtml(appName)}</h3>
            <div class="notification-group-stack">
              ${items.map(item => notification(item)).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    </section>
  `;
}
