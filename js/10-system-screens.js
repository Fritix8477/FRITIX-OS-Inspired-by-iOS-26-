function renderLock() {
  if (typeof dynamicIslandCloseFull === "function") dynamicIslandCloseFull();
  state.unlocked = false;
  state.currentApp = null;
  state.editMode = false;
  screen.classList.remove("edit-mode");
  screen.classList.remove("light-context");
  view.innerHTML = `
    <section class="lock ios-lock">
      <div class="lock-hero">
        <div class="lock-date" id="lock-date"></div>
        <h2 class="lock-time" id="lock-clock"></h2>
      </div>
      <div class="lock-widget-stack">
        ${lockMusicPlayer()}
        <div class="lock-widget-grid">
          <button class="ios-widget assistant-widget" data-app="nova">
            <span class="siri-orb"></span>
            <span><strong>NOVA</strong><small>pret</small></span>
          </button>
          <button class="ios-widget calendar-widget" data-app="calendar">
            <strong>17:30</strong>
            <span>Brief Design Premium</span>
            <small>Aujourd'hui</small>
          </button>
        </div>
      </div>
      <div class="lock-actions">
        <button class="round-action glass-icon" data-action="flash" aria-label="Lampe">⌁</button>
        <div class="unlock-hint">Swipe up</div>
        <button class="round-action glass-icon" data-action="camera" aria-label="Camera">◉</button>
      </div>
    </section>
  `;
  tickClock();
  const unread = state.notifications.find(item => item.unread);
  if (unread && state.lastIslandNotificationId !== unread.id && state.settings.notifications) {
    state.lastIslandNotificationId = unread.id;
    setTimeout(() => notifyViaIsland(unread), 360);
  }
}

function notification(item, compact = false) {
  const iconColor = item.darkIcon ? "#111827" : "white";
  return `
    <article class="notification ios-notification ${compact ? "compact" : ""}" data-notification="${escapeHtml(item.id)}" data-app="${escapeHtml(item.appId || "")}">
      <div class="notification-actions left"><button data-action="mark-notification">Lu</button></div>
      <div class="notification-body">
        <div class="notification-meta">
          <span class="notification-app">
            <i class="notification-icon" style="background:${escapeHtml(item.color)};color:${iconColor}">${escapeHtml(item.icon)}</i>
            <b>${escapeHtml(item.app)}</b>
          </span>
          <time>${escapeHtml(item.time)}</time>
        </div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.body)}</p>
      </div>
      <div class="notification-actions right"><button data-action="notification-options">Options</button><button data-action="clear-notification">Effacer</button></div>
    </article>
  `;
}

function notificationStack() {
  const unread = state.notifications.filter(item => item.unread);
  if (!unread.length) return "";
  const current = unread[0];
  const extra = unread.length - 1;
  return `
    <div class="notification-stack">
      ${notification(current, true)}
      ${extra > 0 ? `<button class="notification-count" data-action="notifications">+ ${extra} autres notifications</button>` : ""}
    </div>
  `;
}

function lockMusicPlayer() {
  return `
    <button class="ios-widget lock-music-player" data-app="music">
      <span class="lock-music-cover">N</span>
      <span class="lock-music-info">
        <strong>${escapeHtml(nowPlaying.title)}</strong>
        <small>${escapeHtml(nowPlaying.artist)}</small>
        <i class="lock-music-progress"><b></b></i>
        <span class="lock-music-controls">
          <em>‹‹</em><em>${nowPlaying.playing ? "❚❚" : "▶"}</em><em>››</em>
        </span>
      </span>
    </button>
  `;
}

function renderPasscode() {
  if (typeof dynamicIslandCloseFull === "function") dynamicIslandCloseFull();
  if (!state.settings.passcodeEnabled) {
    renderHome();
    return;
  }
  state.passcodeInput = "";
  state.passcodeError = false;
  state.faceIdStatus = state.settings.faceIdEnabled ? "scanning" : "passcode";
  screen.classList.remove("light-context");
  screen.classList.remove("unlocking");
  view.innerHTML = `
    <section class="passcode-screen ios-passcode ${state.settings.faceIdEnabled ? "face-scanning" : ""}">
      <div class="passcode-clock">
        <div class="lock-date" id="lock-date"></div>
        <h2 class="lock-time" id="lock-clock"></h2>
      </div>
      <div class="passcode-auth" id="passcode-auth">
        <div class="face-id-icon" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <strong id="passcode-title">${state.settings.faceIdEnabled ? "Face ID" : "Saisir le code"}</strong>
        <small id="passcode-message">${state.settings.faceIdEnabled ? "Detection du visage" : ""}</small>
        <div class="passcode-dots" id="passcode-dots">
          ${Array.from({ length: Number(state.settings.passcodeLength || 4) }, () => "<span></span>").join("")}
        </div>
      </div>
      <div class="passcode-keypad">
        ${["1","2 ABC","3 DEF","4 GHI","5 JKL","6 MNO","7 PQRS","8 TUV","9 WXYZ","","0 +",""].map(key => key ? `
          <button data-passcode="${key[0]}"><strong>${key[0]}</strong><small>${escapeHtml(key.slice(2))}</small></button>
        ` : `<span></span>`).join("")}
      </div>
      <div class="passcode-bottom">
        <button data-action="emergency">Urgence</button>
        <button data-passcode="del">Effacer</button>
      </div>
    </section>
  `;
  tickClock();
  if (state.settings.faceIdEnabled) setTimeout(simulateFaceId, 920);
}

function renderHome() {
  if (typeof dynamicIslandCloseFull === "function") dynamicIslandCloseFull();
  if (state.currentApp === "racing" && typeof pauseRacing === "function") pauseRacing(true);
  state.unlocked = true;
  state.currentApp = null;
  screen.classList.remove("light-context");
  screen.classList.toggle("edit-mode", state.editMode);
  normalizeHomeLayout();
  const homeApps = state.homeLayout.appOrder.filter(id => !state.homeLayout.hiddenApps.includes(id) && !state.homeLayout.dock.includes(id)).map(id => apps.find(app => app.id === id)).filter(Boolean);
  const dockApps = state.homeLayout.dock.map(id => apps.find(app => app.id === id)).filter(Boolean);
  const editingClass = state.editMode ? "editing" : "";
  const homeClass = `${editingClass} icons-${state.homeLayout.iconTheme} icons-${state.homeLayout.iconSize}`;
  view.innerHTML = `
    <section class="home ios-home ${homeClass}" style="--icon-tint:${escapeHtml(state.homeLayout.iconTint)}">
      ${state.editMode ? renderHomeEditBar() : `<div class="home-spacer"></div>`}
      ${state.homeLayout.page === "library" ? renderAppLibrary() : `
        <div class="home-widget-layer">${state.homeLayout.widgets.map(renderHomeWidget).join("")}</div>
        <div class="home-apps-area app-grid-wrapper" data-zone="home"><div class="apps-grid app-grid">${homeApps.map(app => appIcon(app, "home")).join("")}</div></div>
        <div class="page-dots"><span class="active"></span><button data-action="library-page"></button></div>
        <div class="dock" data-zone="dock">${dockApps.map(app => appIcon(app, "dock")).join("")}</div>
      `}
      ${state.homeLayout.widgetGalleryOpen ? renderWidgetGallery() : ""}
      ${state.homeLayout.customizeOpen ? renderIconCustomizer() : ""}
      ${state.homeLayout.confirm ? renderHomeConfirm() : ""}
    </section>
  `;
}

function normalizeHomeLayout() {
  state.homeLayout = { ...defaultHomeLayout(), ...(state.homeLayout || {}) };
  const allIds = apps.map(app => app.id);
  state.homeLayout.appOrder = [...new Set([...state.homeLayout.appOrder, ...allIds])].filter(id => allIds.includes(id));
  state.homeLayout.dock = [...new Set(state.homeLayout.dock)].filter(id => allIds.includes(id)).slice(0, 4);
  state.homeLayout.hiddenApps = [...new Set(state.homeLayout.hiddenApps)].filter(id => allIds.includes(id));
  if (!["home", "library"].includes(state.homeLayout.page)) state.homeLayout.page = "home";
}

function renderHomeEditBar() {
  return `
    <div class="home-edit-bar">
      <button data-action="open-widget-gallery">+</button>
      <button data-action="open-icon-customizer">Personnaliser</button>
      <button data-action="finish-home-edit">OK</button>
    </div>
  `;
}

function appIcon(app, zone = "home") {
  const fg = app.darkText ? "#111827" : "white";
  return `
    <button class="app-icon-wrap ${zone === "dock" ? "dock-icon-wrap" : ""}" draggable="${state.editMode ? "true" : "false"}" data-app="${app.id}" data-zone="${zone}">
      ${state.editMode ? `<span class="delete-dot" data-delete="${app.id}">-</span>` : ""}
      <span class="app-icon icon-${escapeHtml(app.id)}" style="background:${app.color};color:${fg}">${appSymbol(app.id)}</span>
      <span class="app-label">${escapeHtml(app.name)}</span>
    </button>
  `;
}

function renderHomeWidget(widget) {
  const labels = {
    weather: ["Meteo", "21°", "Ensoleille"],
    battery: ["Batterie", "100%", "iPhone"],
    calendar: ["Calendrier", "17:30", "Brief"],
    music: ["Musique", nowPlaying.title, nowPlaying.artist],
    messages: ["Messages", "Emma", "Tu es dispo ?"],
    clock: ["Horloge", new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), "Paris"],
    nova: ["NOVA", "Pret", "Assistant local"],
    photos: ["Photos", "Souvenirs", "8 elements"]
  };
  const data = labels[widget.type] || labels.nova;
  return `
    <button class="home-added-widget widget-${escapeHtml(widget.size || "small")}" draggable="${state.editMode ? "true" : "false"}" data-widget="${escapeHtml(widget.id)}">
      ${state.editMode ? `<span class="delete-dot" data-widget-delete="${escapeHtml(widget.id)}">-</span>` : ""}
      <small>${escapeHtml(data[0])}</small><strong>${escapeHtml(data[1])}</strong><span>${escapeHtml(data[2])}</span>
      ${state.editMode ? `<em data-action="cycle-widget-size" data-widget="${escapeHtml(widget.id)}">${escapeHtml(widget.size || "petit")}</em>` : ""}
    </button>
  `;
}

function renderAppLibrary() {
  const groups = [
    ["Suggestions", ["messages", "clock", "settings", "music"]],
    ["Social", ["messages", "phone", "mail"]],
    ["Utilitaires", ["clock", "calculator", "settings", "camera"]],
    ["Productivite", ["calendar", "notes", "mail", "nova"]],
    ["Divertissement", ["music", "photos", "store", "racing"]],
    ["Sante", ["health", "weather"]],
    ["Autres", apps.map(app => app.id)]
  ];
  return `
    <div class="app-library">
      <div class="library-head"><button data-action="home-page">‹</button><h1>Bibliotheque d'apps</h1></div>
      ${groups.map(group => `
        <section class="library-group">
          <h2>${escapeHtml(group[0])}</h2>
          <div>${[...new Set(group[1])].map(id => {
            const app = apps.find(item => item.id === id);
            if (!app) return "";
            return `<button data-action="library-add-app" data-app-id="${app.id}"><span class="app-icon mini icon-${escapeHtml(app.id)}" style="background:${app.color};color:${app.darkText ? "#111827" : "white"}">${appSymbol(app.id)}</span><strong>${escapeHtml(app.name)}</strong></button>`;
          }).join("")}</div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderWidgetGallery() {
  const widgets = ["weather", "battery", "calendar", "music", "messages", "clock", "nova", "photos"];
  return `
    <div class="home-sheet widget-gallery">
      <header><button data-action="close-home-panels">Fermer</button><strong>Widgets</strong></header>
      <label class="widget-search"><input placeholder="Rechercher"></label>
      <div class="widget-gallery-list">
        ${widgets.map(type => `
          <article>
            <div class="widget-preview">${renderHomeWidget({ id: `preview-${type}`, type, size: "medium" })}</div>
            <span>${escapeHtml(widgetName(type))}</span>
            <div><button data-action="add-widget" data-widget-type="${type}" data-widget-size="small">Petit</button><button data-action="add-widget" data-widget-type="${type}" data-widget-size="medium">Moyen</button><button data-action="add-widget" data-widget-type="${type}" data-widget-size="large">Grand</button></div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function widgetName(type) {
  return { weather: "Meteo", battery: "Batterie", calendar: "Calendrier", music: "Musique", messages: "Messages", clock: "Horloge", nova: "NOVA", photos: "Photos" }[type] || type;
}

function renderIconCustomizer() {
  const colors = ["#0a84ff", "#bf5af2", "#ff2d55", "#34c759", "#ff9f0a"];
  return `
    <div class="home-sheet icon-customizer">
      <header><button data-action="close-home-panels">Fermer</button><strong>Personnaliser</strong></header>
      <div class="custom-segments">
        ${["light", "dark", "auto", "tinted"].map(mode => `<button class="${state.homeLayout.iconTheme === mode ? "active" : ""}" data-action="set-icon-theme" data-theme="${mode}">${mode === "light" ? "Clair" : mode === "dark" ? "Sombre" : mode === "auto" ? "Automatique" : "Teinte"}</button>`).join("")}
      </div>
      <div class="tint-row">${colors.map(color => `<button style="background:${color}" data-action="set-icon-tint" data-color="${color}"></button>`).join("")}<input type="color" value="${escapeHtml(state.homeLayout.iconTint)}" data-action="set-icon-tint-input"></div>
      <div class="custom-segments">
        ${["small", "large"].map(size => `<button class="${state.homeLayout.iconSize === size ? "active" : ""}" data-action="set-icon-size" data-size="${size}">${size === "small" ? "Petite" : "Grande"}</button>`).join("")}
      </div>
    </div>
  `;
}

function renderHomeConfirm() {
  const targetName = state.homeLayout.confirm.name || "element";
  return `
    <div class="ios-confirm">
      <div>
        <strong>Supprimer "${escapeHtml(targetName)}" ?</strong>
        <button data-action="confirm-remove-home">Retirer de l'ecran d'accueil</button>
        <button data-action="cancel-home-confirm">Annuler</button>
      </div>
    </div>
  `;
}

function appSymbol(id) {
  const icons = {
    messages: `<svg viewBox="0 0 24 24"><path d="M4 11.5C4 7.9 7.6 5 12 5s8 2.9 8 6.5S16.4 18 12 18c-.8 0-1.6-.1-2.3-.3L5.8 20l1-3.2C5.1 15.6 4 13.7 4 11.5Z"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="3"/><path d="M5 9h14"/><text x="12" y="17" text-anchor="middle" font-size="7" font-weight="800">17</text></svg>`,
    photos: `<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3"/><circle cx="16.3" cy="10.5" r="3"/><circle cx="14.8" cy="15.5" r="3"/><circle cx="9.2" cy="15.5" r="3"/><circle cx="7.7" cy="10.5" r="3"/></svg>`,
    camera: `<svg viewBox="0 0 24 24"><path d="M7 8l1.5-2h7L17 8h1.5A2.5 2.5 0 0 1 21 10.5v6A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-6A2.5 2.5 0 0 1 5.5 8H7Z"/><circle cx="12" cy="13.5" r="3.4"/></svg>`,
    mail: `<svg viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12" rx="3"/><path d="M5 8l7 5 7-5"/></svg>`,
    notes: `<svg viewBox="0 0 24 24"><path d="M6 4h12v16H6z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
    clock: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3.5 2"/></svg>`,
    settings: `<svg viewBox="0 0 24 24"><path d="M12 8.2A3.8 3.8 0 1 0 12 15.8 3.8 3.8 0 0 0 12 8.2Z"/><path d="M12 3.5l1.4 2.1 2.5.2.7 2.4 2.1 1.4-1 2.4 1 2.4-2.1 1.4-.7 2.4-2.5.2L12 20.5l-1.4-2.1-2.5-.2-.7-2.4-2.1-1.4 1-2.4-1-2.4 2.1-1.4.7-2.4 2.5-.2L12 3.5Z"/></svg>`,
    store: `<svg viewBox="0 0 24 24"><path d="M7 18L12 6l5 12M9 14h6"/></svg>`,
    wallet: `<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="3"/><path d="M16 12h4v4h-4a2 2 0 0 1 0-4Z"/></svg>`,
    maps: `<svg viewBox="0 0 24 24"><path d="M8 5l8-2v16l-8 2-4-2V7l4-2Z"/><path d="M8 5v16M16 3v16"/></svg>`,
    health: `<svg viewBox="0 0 24 24"><path d="M12 20S5 15.8 5 10a3.7 3.7 0 0 1 6.5-2.4L12 8l.5-.4A3.7 3.7 0 0 1 19 10c0 5.8-7 10-7 10Z"/></svg>`,
    weather: `<svg viewBox="0 0 24 24"><circle cx="9" cy="10" r="4"/><path d="M8 17h9a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.4 2"/></svg>`,
    calculator: `<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0"/></svg>`,
    nova: `<svg viewBox="0 0 24 24"><path d="M12 3l2.2 6.2L21 12l-6.8 2.8L12 21l-2.2-6.2L3 12l6.8-2.8L12 3Z"/></svg>`,
    racing: `<svg viewBox="0 0 24 24"><path d="M7 16l1.2-5.2A3.5 3.5 0 0 1 11.6 8h.8a3.5 3.5 0 0 1 3.4 2.8L17 16"/><path d="M6 16h12v2.4A1.6 1.6 0 0 1 16.4 20H7.6A1.6 1.6 0 0 1 6 18.4V16Z"/><path d="M9 13h6M8 18h1.5M14.5 18H16M9.8 6h4.4"/></svg>`,
    music: `<svg viewBox="0 0 24 24"><path d="M15 5v10.5a3 3 0 1 1-2-2.8V7l7-1.5V4L15 5Z"/></svg>`,
    phone: `<svg viewBox="0 0 24 24"><path d="M7 4l3 4-2 2c1.5 3 3.4 4.8 6.4 6.2l1.9-2 3.7 3c-.5 2-1.8 3-3.8 3C10 20.2 3.8 14 3.8 7.8 3.8 5.7 5 4.5 7 4Z"/></svg>`,
    safari: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M14.8 9.2L13 13l-3.8 1.8L11 11l3.8-1.8Z"/></svg>`
  };
  return icons[id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/></svg>`;
}

function openApp(id) {
  if (typeof dynamicIslandCloseFull === "function") dynamicIslandCloseFull();
  if (state.currentApp === "racing" && id !== "racing" && typeof pauseRacing === "function") pauseRacing(true);
  if (typeof markAppOpen === "function") markAppOpen(id);
  state.currentApp = id;
  state.editMode = false;
  screen.classList.remove("edit-mode");
  screen.classList.add("light-context");
  state.lastApps = [id, ...state.lastApps.filter(item => item !== id)].slice(0, 4);
  save();
  const app = apps.find(item => item.id === id);
  const appModeClass = id === "phone" && (state.phoneCall || callState.active) ? " phone-call-mode" : id === "racing" ? " racing-app-mode" : "";
  view.innerHTML = `
    <section class="app-screen liquid-app${appModeClass}">
      <header class="app-header">
        <button data-action="home">&lt;</button>
        <h2>${escapeHtml(app?.name || id)}</h2>
      </header>
      <div class="app-content" id="app-content"></div>
    </section>
  `;
  const content = document.querySelector("#app-content");
  try {
    if (id === "phone" && callState.active) syncPhoneCallState();
    const renderers = {
      messages: typeof renderMessages === "function" ? renderMessages : null,
      notes: typeof renderNotes === "function" ? renderNotes : null,
      calculator: typeof renderCalculator === "function" ? renderCalculator : null,
      weather: typeof renderWeather === "function" ? renderWeather : null,
      photos: typeof renderPhotos === "function" ? renderPhotos : null,
      camera: typeof renderCamera === "function" ? renderCamera : null,
      settings: typeof renderSettings === "function" ? renderSettings : null,
      music: typeof renderMusic === "function" ? renderMusic : null,
      safari: typeof renderSafari === "function" ? renderSafari : null,
      phone: typeof renderPhone === "function" ? renderPhone : null,
      wallet: typeof renderWallet === "function" ? renderWallet : null,
      nova: typeof renderNova === "function" ? renderNova : null,
      calendar: typeof renderCalendar === "function" ? renderCalendar : null,
      mail: typeof renderMail === "function" ? renderMail : null,
      clock: typeof renderClock === "function" ? renderClock : null,
      store: typeof renderStore === "function" ? renderStore : null,
      maps: typeof renderMaps === "function" ? renderMaps : null,
      health: typeof renderHealth === "function" ? renderHealth : null,
      racing: typeof renderRacing === "function" ? renderRacing : null
    };
    if (renderers[id]) renderers[id](content);
    else renderGeneric(content, id);
  } catch (error) {
    content.innerHTML = `
      <section class="ios-app">
        <div class="ios-large-title"><h1>${escapeHtml(app?.name || id)}</h1></div>
        <div class="ios-list"><button class="ios-cell"><span class="ios-cell-main"><strong>Erreur d'affichage</strong><small>${escapeHtml(error.message)}</small></span></button></div>
      </section>
    `;
  }
}

