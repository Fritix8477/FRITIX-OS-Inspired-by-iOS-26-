function renderMessages(content) {
  const query = (state.messageSearch || "").toLowerCase();
  const conversations = sortedConversations().filter(item => {
    const haystack = `${item.contactName} ${item.contactNumber || ""} ${item.lastMessage || ""} ${item.messages.map(message => message.content).join(" ")}`.toLowerCase();
    return !query || haystack.includes(query);
  });
  content.innerHTML = `
    <section class="ios-app messages-app ios26-messages">
      <div class="messages-title-row"><h1>Messages</h1><button data-action="new-message">+</button></div>
      <label class="messages-search"><input id="messages-search" value="${escapeHtml(state.messageSearch || "")}" placeholder="Rechercher"></label>
      ${conversations.length ? `
        <div class="messages-list">
          ${conversations.map(item => renderConversationRow(item)).join("")}
        </div>
      ` : `
        <div class="messages-empty"><strong>Aucune conversation</strong><button data-action="new-message">Nouveau message</button></div>
      `}
    </section>
  `;
}

function sortedConversations() {
  return [...state.conversations].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
  });
}

function renderConversationRow(item) {
  return `
    <div class="message-row-wrap" data-conversation="${escapeHtml(item.id)}">
      <div class="conversation-actions"><button data-action="pin-conversation" data-chat="${escapeHtml(item.id)}">${item.pinned ? "Retirer" : "Epingler"}</button><button data-action="mute-conversation" data-chat="${escapeHtml(item.id)}">${item.muted ? "Alertes" : "Masquer"}</button><button class="danger" data-action="delete-conversation" data-chat="${escapeHtml(item.id)}">Supprimer</button></div>
      <button class="message-thread-row" data-action="open-conversation" data-chat="${escapeHtml(item.id)}">
        <span class="message-avatar" style="${avatarStyle(item.id)}">${escapeHtml(item.contactAvatar || item.contactName[0] || "?")}</span>
        <span class="message-row-main">
          <span><strong>${escapeHtml(item.contactName)}</strong><time>${messageTime(item.lastMessageAt)}</time></span>
          <small>${item.muted ? "Silence - " : ""}${escapeHtml(item.lastMessage || "")}</small>
        </span>
        ${item.unreadCount ? `<b class="message-unread">${item.unreadCount}</b>` : `<em>›</em>`}
      </button>
    </div>
  `;
}

function renderSettings(content) {
  content.innerHTML = `
    <div class="ios-settings">
      <h1>Reglages</h1>
      <label class="ios-settings-search"><span>Rechercher</span></label>
      <button class="ios-settings-profile" data-settings="profile">
        <span class="settings-avatar">N</span>
        <span><strong>Fritix</strong><small>iPhone local - Apple ID, iCloud, medias</small></span>
      </button>
      <div class="ios-settings-group">
        ${settingsRow("airplane", "Mode Avion", state.settings.airplane ? "Active" : "", "airplane", true)}
        ${settingsRow("wifi", "Wi-Fi", state.settings.wifi ? "LocalNet" : "Non", "wifi")}
        ${settingsRow("bluetooth", "Bluetooth", state.settings.bluetooth ? "Active" : "Non", "bluetooth")}
        ${settingsRow("cellular", "Donnees cellulaires", state.settings.cellular ? "5G" : "Non", "cellular")}
      </div>
      <div class="ios-settings-group">
        ${settingsRow("notifications", "Notifications", "", "notifications")}
        ${settingsRow("sound", "Sons et vibrations", state.settings.sound ? "" : "Silence", "sound")}
        ${settingsRow("focus", "Concentration", state.settings.focusMode || "", "focus")}
        ${settingsRow("screen-time", "Temps d'ecran", "", "screen-time")}
      </div>
      <div class="ios-settings-group">
        ${settingsRow("general", "General", "", "general")}
        ${settingsRow("control-center", "Centre de controle", "", "control-center")}
        ${settingsRow("display", "Luminosite et affichage", "", "display")}
        ${settingsRow("wallpaper", "Fond d'ecran", state.settings.wallpaper, "wallpaper")}
        ${settingsRow("passcode", "Face ID et code", state.settings.faceIdEnabled ? "Face ID" : "Code", "passcode")}
        ${settingsRow("siri", "Siri / NOVA", "", "siri")}
        ${settingsRow("battery", "Batterie", "100%", "battery")}
        ${settingsRow("privacy", "Confidentialite", "", "privacy")}
      </div>
    </div>
  `;
}

function settingsRow(id, title, detail, icon, toggle = false) {
  const checked = id === "airplane" ? state.settings.airplane : Boolean(state.settings[id]);
  return `
    <button class="settings-row" data-settings="${id}">
      <i class="settings-icon settings-icon-${escapeHtml(icon)}">${settingsIcon(icon)}</i>
      <span class="settings-title">${escapeHtml(title)}</span>
      ${detail ? `<span class="settings-detail-text">${escapeHtml(detail)}</span>` : ""}
      ${toggle ? `<span class="settings-switch ${checked ? "on" : ""}"></span>` : `<em>›</em>`}
    </button>
  `;
}

function settingsIcon(icon) {
  const icons = {
    airplane: "A",
    wifi: "Wi",
    bluetooth: "B",
    cellular: "5G",
    notifications: "N",
    sound: "S",
    focus: "F",
    "screen-time": "T",
    general: "G",
    "control-center": "C",
    display: "L",
    wallpaper: "W",
    passcode: "ID",
    siri: "AI",
    battery: "B",
    privacy: "P"
  };
  return icons[icon] || "";
}

function renderConversation(content, id = "lucas") {
  const conversation = findConversation(id);
  if (!conversation) {
    renderMessages(content);
    return;
  }
  state.activeConversationId = conversation.id;
  conversation.unreadCount = 0;
  markConversationNotificationsRead(conversation.id);
  save();
  content.innerHTML = `
    <section class="ios-app chat-screen imessage-screen">
      <header class="imessage-header">
        <button class="imessage-back" data-action="messages-root">&lt;</button>
        <div class="imessage-contact-title">
          <span class="message-avatar small" style="${avatarStyle(conversation.id)}">${escapeHtml(conversation.contactAvatar || conversation.contactName[0])}</span>
          <strong>${escapeHtml(conversation.contactName)}</strong>
        </div>
        <div class="imessage-header-actions">
          <button data-action="message-call" data-chat="${escapeHtml(conversation.id)}">Tel</button>
          <button data-action="message-info">i</button>
        </div>
      </header>
      <div class="chat-thread">
        <div class="message-date-separator">${messageFullDate(conversation.messages[0]?.createdAt)}</div>
        ${conversation.messages.map(message => renderMessageBubble(message)).join("")}
        ${lastOwnMessage(conversation) ? `<div class="message-status">${escapeHtml(lastOwnMessage(conversation).status === "read" ? "Lu" : "Distribue")}</div>` : ""}
      </div>
      <div class="message-menu ${state.messageActionId ? "show" : ""}" id="message-menu">
        <button data-action="copy-message">Copier</button>
        <button data-action="react-message">❤️</button>
        <button data-action="delete-message">Supprimer</button>
      </div>
      <div class="imessage-compose">
        <button data-action="message-plus">+</button>
        <input id="message-input" value="${escapeHtml(state.composerDraft || "")}" placeholder="iMessage">
        <button class="imessage-send ${state.composerDraft ? "ready" : ""}" data-action="send-message">&uarr;</button>
      </div>
    </section>
  `;
}

function renderNewMessage(content) {
  content.innerHTML = `
    <section class="ios-app chat-screen new-message-screen">
      <header class="imessage-header">
        <button data-action="messages-root">&lt;</button>
        <strong>Nouveau message</strong>
      </header>
      <div class="new-message-form">
        <label><span>A :</span><input id="new-message-recipient" value="${escapeHtml(state.composerRecipient || "")}" placeholder="Nom ou numero"></label>
        <div class="contact-suggestions">
          ${state.conversations.slice(0, 5).map(item => `<button data-action="pick-recipient" data-recipient="${escapeHtml(item.contactName)}">${escapeHtml(item.contactName)}</button>`).join("")}
        </div>
      </div>
      <div class="imessage-compose">
        <button data-action="message-plus">+</button>
        <input id="new-message-body" value="${escapeHtml(state.composerDraft || "")}" placeholder="iMessage">
        <button class="imessage-send ${state.composerDraft ? "ready" : ""}" data-action="send-new-message">&uarr;</button>
      </div>
    </section>
  `;
}

function renderMessageBubble(message) {
  const own = message.sender === "me";
  return `
    <div class="message-line ${own ? "sent" : "received"}">
      <button class="imessage-bubble ${own ? "sent" : "received"}" data-action="message-menu" data-message="${escapeHtml(message.id)}">
        ${message.reaction ? `<span class="bubble-reaction">${escapeHtml(message.reaction)}</span>` : ""}
        ${escapeHtml(message.content)}
      </button>
    </div>
  `;
}

function findConversation(id) {
  return state.conversations.find(item => item.id === id);
}

function lastOwnMessage(conversation) {
  return [...conversation.messages].reverse().find(message => message.sender === "me");
}

function messageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { weekday: "short" });
}

function messageFullDate(value) {
  if (!value) return "Aujourd'hui";
  return new Date(value).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function avatarStyle(seed = "") {
  const gradients = [
    ["#0a84ff", "#64d2ff"],
    ["#34c759", "#30d158"],
    ["#ff2d55", "#ff9f0a"],
    ["#5856d6", "#bf5af2"],
    ["#ff9f0a", "#ffd60a"],
    ["#5e5ce6", "#64d2ff"]
  ];
  const index = Math.abs(String(seed).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % gradients.length;
  return `--avatar-a:${gradients[index][0]};--avatar-b:${gradients[index][1]};`;
}

function renderCalendar(content) {
  const days = Array.from({ length: 35 }, (_, index) => index + 1);
  content.innerHTML = `
    <section class="ios-app calendar-app">
      <div class="ios-large-title"><h1>Juin 2026</h1><button>+</button></div>
      <div class="calendar-week">${["L", "M", "M", "J", "V", "S", "D"].map(day => `<span>${day}</span>`).join("")}</div>
      <div class="month-grid">
        ${days.map(day => `<button class="${day === 17 ? "today" : ""}">${day <= 30 ? day : ""}</button>`).join("")}
      </div>
      <h2>Aujourd'hui</h2>
      <div class="ios-list">
        <button class="ios-cell"><span class="event-dot"></span><span class="ios-cell-main"><strong>17:30 - Brief design premium</strong><small>Studio Fritix</small></span></button>
        <button class="ios-cell"><span class="event-dot purple"></span><span class="ios-cell-main"><strong>20:00 - Test utilisateur</strong><small>Prototype iPhone</small></span></button>
      </div>
    </section>
  `;
}

function renderNotes(content) {
  const notes = [
    { id: "main", title: "Idees interface", date: "Aujourd'hui", body: state.notes.split("\n")[0] || "Nouvelle note" },
    { id: "design", title: "Checklist iOS", date: "Hier", body: "Accueil, Reglages, Dynamic Island" },
    { id: "nova", title: "NOVA", date: "Lundi", body: "Commandes scan, status, shield" }
  ];
  content.innerHTML = `
    <section class="ios-app notes-app">
      <div class="ios-large-title"><h1>Notes</h1><button data-action="new-note">+</button></div>
      <label class="ios-search">Rechercher</label>
      <h2>iCloud</h2>
      <div class="ios-list">
        ${notes.map(note => `
          <button class="ios-cell note-cell" data-action="open-note" data-note="${note.id}">
            <span class="ios-cell-main"><strong>${escapeHtml(note.title)}</strong><small>${escapeHtml(note.date)} - ${escapeHtml(note.body)}</small></span><em>›</em>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderNoteEditor(content) {
  content.innerHTML = `
    <section class="ios-app note-editor">
      <button class="ios-back-inline" data-app="notes">&lt; Notes</button>
      <textarea id="notes-area">${escapeHtml(state.notes)}</textarea>
      <button class="ios-primary" data-action="save-notes">Termine</button>
    </section>
  `;
}

function renderCalculator(content) {
  content.innerHTML = `
    <section class="calculator iphone-calculator">
      <div class="calc-display">
        <div class="calc-expression">${escapeHtml(state.calc)}</div>
        <div class="calc-result">${escapeHtml(state.calc || "0")}</div>
      </div>
      <div class="calc-keys">
        ${["AC","+/-","%","/","7","8","9","*","4","5","6","-","1","2","3","+","0",".","DEL","="].map(key => {
          const cls = ["+","-","*","/","="].includes(key) ? "op" : (["AC","+/-","%","DEL"].includes(key) ? "dark" : "");
          return `<button class="${cls}" data-calc="${key}">${key === "*" ? "x" : key}</button>`;
        }).join("")}
      </div>
    </section>
  `;
}

function renderWeather(content) {
  content.innerHTML = `
    <section class="ios-app weather-app">
      <div class="weather-hero"><small>Paris</small><strong>24°</strong><span>Clair</span></div>
      <div class="weather-glass"><h3>Prevision horaire</h3><div class="hourly">${["Maint.", "18h", "19h", "20h", "21h"].map((h, i) => `<span><b>${h}</b><em>${24 - i}°</em></span>`).join("")}</div></div>
      <div class="weather-glass"><h3>7 jours</h3>${["Sam. 25°", "Dim. 23°", "Lun. 22°", "Mar. 24°", "Mer. 26°"].map(row => `<p>${row}</p>`).join("")}</div>
    </section>
  `;
}

function renderPhotos(content) {
  const photos = state.photos.concat(["#dbeafe", "#fce7f3", "#dcfce7", "#fef3c7"]);
  content.innerHTML = `
    <section class="ios-app photos-app">
      <div class="ios-large-title"><h1>Bibliotheque</h1><button>•••</button></div>
      <div class="photo-grid ios-photo-grid">${photos.map((color, index) => `<button class="photo-cell" style="background:${color}" data-action="open-photo" data-photo="${index}"></button>`).join("")}</div>
      <nav class="ios-tabbar">${["Bibliotheque", "Albums", "Pour vous", "Recherche"].map((tab, i) => `<button class="${i === 0 ? "active" : ""}">${tab}</button>`).join("")}</nav>
    </section>
  `;
}

function renderPhotoViewer(content, index = 0) {
  const color = state.photos[index] || "#0a84ff";
  content.innerHTML = `<section class="photo-viewer"><button data-app="photos">Fermer</button><div style="background:${color}"></div></section>`;
}

function renderCamera(content) {
  const camera = state.camera || defaultCameraState();
  state.camera = { ...defaultCameraState(), ...camera };
  const latest = [
    ...(state.camera.photos || []).map(item => ({ ...item, kind: "photo" })),
    ...(state.camera.videos || []).map(item => ({ ...item, kind: "video" }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  const mode = state.camera.mode || "photo";
  const isVideo = mode === "video" || mode === "slow";
  const modes = [
    ["slow", "Ralenti"],
    ["video", "Video"],
    ["photo", "Photo"],
    ["portrait", "Portrait"],
    ["pano", "Panorama"]
  ];
  if (!state.camera.permission) {
    content.innerHTML = `
      <section class="camera-app iphone-camera camera-permission">
        <div class="camera-permission-card">
          <span class="camera-permission-icon">◉</span>
          <h1>Autoriser l'acces a la camera</h1>
          <p>FRITIX OS utilise une camera simulee locale pour prendre des photos et videos dans le telephone.</p>
          <button data-action="camera-allow">Autoriser</button>
        </div>
      </section>
    `;
    return;
  }
  if (state.camera.galleryOpen) {
    const medias = [
      ...(state.camera.photos || []).map(item => ({ ...item, kind: "photo" })),
      ...(state.camera.videos || []).map(item => ({ ...item, kind: "video" }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    content.innerHTML = `
      <section class="camera-app iphone-camera camera-gallery-screen">
        <header class="camera-gallery-header">
          <button data-action="camera-gallery-close">&lt;</button>
          <span><strong>Recents</strong><small>${medias.length} element${medias.length > 1 ? "s" : ""}</small></span>
        </header>
        <div class="camera-gallery-grid">
          ${medias.length ? medias.map(item => `
            <button class="camera-gallery-item ${item.kind}" style="${cameraMediaStyle(item)}">
              ${item.kind === "video" ? `<span>${escapeHtml(formatCameraDuration(item.duration || 0))}</span>` : ""}
            </button>
          `).join("") : `<div class="camera-empty-gallery"><strong>Aucun media</strong><small>Les photos et videos prises ici apparaitront dans cette galerie.</small></div>`}
        </div>
      </section>
    `;
    return;
  }
  content.innerHTML = `
    <section class="camera-app iphone-camera mode-${escapeHtml(mode)} ${state.camera.captureFlash ? "capturing" : ""}">
      <div class="camera-preview">
        <div class="camera-live-scene ${state.camera.facing === "front" ? "front" : "back"}">
          <span class="camera-focus-ring"></span>
          ${mode === "portrait" ? `<span class="portrait-label">Portrait</span>` : ""}
          ${mode === "pano" ? `<div class="pano-guide"><i></i><span>Deplacez lentement l'iPhone</span></div>` : ""}
          ${state.camera.recording ? `<div class="camera-rec-badge"><b></b><span>REC</span><time id="camera-rec-time">${formatCameraDuration(state.camera.recordingElapsed || 0)}</time></div>` : ""}
        </div>
      </div>
      <div class="camera-top-controls">
        <button class="${state.camera.flash ? "active" : ""}" data-action="camera-flash" aria-label="Flash">⚡</button>
        <button class="${state.camera.live ? "active" : ""}" data-action="camera-live" aria-label="Live Photo">◎</button>
        <button data-action="camera-quick" aria-label="Reglages rapides">⌃</button>
      </div>
      <div class="camera-bottom-panel">
        <div class="camera-modes" id="camera-modes">
          ${modes.map(([id, label]) => `<button class="${id === mode ? "active" : ""}" data-action="camera-mode" data-mode="${id}">${label}</button>`).join("")}
        </div>
        <div class="camera-main-controls">
          <button class="mini-gallery ${latest ? "" : "empty"}" style="${latest ? cameraMediaStyle(latest) : ""}" data-action="camera-gallery" aria-label="Galerie recente">${latest?.kind === "video" ? "▶" : ""}</button>
          <button class="camera-shutter ${isVideo ? "video" : ""} ${state.camera.recording ? "recording" : ""}" data-action="${isVideo ? "camera-video-toggle" : "camera-capture"}" aria-label="${isVideo ? "Enregistrer" : "Prendre une photo"}"></button>
          <button class="camera-switch" data-action="camera-switch" aria-label="Changer camera">↻</button>
        </div>
      </div>
    </section>
  `;
}

function cameraMediaStyle(item = {}) {
  const background = item.color || "#334155";
  return `background:${escapeHtml(background)}`;
}

function renderMail(content) {
  const mails = [
    ["Apple Design", "Liquid Glass update", "Voici les derniers ajustements...", "09:41", true],
    ["Fritix", "Prototype iPhone", "La page Reglages est prete.", "Hier", false],
    ["Support", "Rapport local", "Aucune erreur detectee.", "Lun.", false]
  ];
  content.innerHTML = `
    <section class="ios-app mail-app">
      <div class="ios-large-title"><h1>Mail</h1><button>✎</button></div>
      <label class="ios-search">Rechercher</label>
      <div class="ios-list">${mails.map((mail, index) => `
        <button class="ios-cell mail-cell" data-action="open-mail" data-mail="${index}">
          <span class="ios-cell-main"><strong>${mail[0]}</strong><small>${mail[1]} - ${mail[2]}</small></span>
          <span class="ios-cell-side"><time>${mail[3]}</time>${mail[4] ? "<b></b>" : ""}</span>
        </button>
      `).join("")}</div>
    </section>
  `;
}

function renderMailDetail(content, index = 0) {
  content.innerHTML = `
    <section class="ios-app mail-detail">
      <button class="ios-back-inline" data-app="mail">&lt; Mail</button>
      <h1>Liquid Glass update</h1>
      <div class="ios-list mail-body"><p><strong>Apple Design</strong><br>Voici une interface plus proche des apps iPhone modernes, avec listes, navigation et transitions propres.</p></div>
      <button class="ios-primary">Repondre</button>
    </section>
  `;
}

function renderClock(content) {
  const tab = state.clock.tab || "world";
  content.innerHTML = `
    <section class="ios-app clock-app ios26-clock">
      ${state.clock.editingAlarmId ? renderAlarmEditor() : `
        <div class="clock-title-row"><h1>${clockTabTitle(tab)}</h1>${tab === "world" || tab === "alarms" ? `<button data-action="${tab === "world" ? "clock-add-city" : "clock-add-alarm"}">+</button>` : ""}</div>
        <div class="clock-pane">${renderClockPane(tab)}</div>
        ${renderClockTabbar(tab)}
      `}
    </section>
  `;
}

function clockTabTitle(tab) {
  return { world: "Horloge", alarms: "Alarmes", stopwatch: "Chronometre", timers: "Minuteurs" }[tab] || "Horloge";
}

function renderClockPane(tab) {
  if (tab === "alarms") return renderAlarmsPane();
  if (tab === "stopwatch") return renderStopwatchPane();
  if (tab === "timers") return renderTimersPane();
  return renderWorldClockPane();
}

function renderClockTabbar(tab) {
  const tabs = [
    ["world", "Horloge mondiale", "◎"],
    ["alarms", "Alarmes", "◴"],
    ["stopwatch", "Chronometre", "⏱"],
    ["timers", "Minuteurs", "⏲"]
  ];
  return `
    <nav class="clock-tabbar">
      ${tabs.map(item => `<button class="${tab === item[0] ? "active" : ""}" data-action="clock-tab" data-tab="${item[0]}"><span>${item[2]}</span><small>${item[1]}</small></button>`).join("")}
    </nav>
  `;
}

function renderWorldClockPane() {
  const cities = [
    ["Paris", 0],
    ["Londres", -1],
    ["New York", -6],
    ["Tokyo", 7],
    ["Los Angeles", -9]
  ];
  return `
    <div class="clock-list">
      ${cities.map(city => `
        <button class="world-clock-row">
          <span><strong>${city[0]}</strong><small>Aujourd'hui, ${city[1] >= 0 ? "+" : ""}${city[1]}H</small></span>
          <time>${cityTime(city[1])}</time>
        </button>
      `).join("")}
    </div>
  `;
}

function renderAlarmsPane() {
  return `
    <div class="clock-list alarm-list">
      ${state.clock.alarms.map(alarm => `
        <button class="alarm-row" data-action="clock-edit-alarm" data-alarm="${alarm.id}">
          <span class="alarm-time">${escapeHtml(alarm.time)}</span>
          <span class="alarm-meta"><strong>${escapeHtml(alarm.label)}</strong><small>${escapeHtml(alarm.repeat)}</small></span>
          <span class="ios-switch ${alarm.enabled ? "on" : ""}" data-action="clock-toggle-alarm" data-alarm="${alarm.id}"><i></i></span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderAlarmEditor() {
  const alarm = state.clock.alarms.find(item => item.id === state.clock.editingAlarmId) || state.clock.alarms[0];
  return `
    <div class="clock-editor">
      <header><button data-action="clock-close-editor">Annuler</button><strong>Modifier l'alarme</strong><button data-action="clock-save-alarm">OK</button></header>
      <div class="alarm-time-picker">
        <input id="alarm-edit-time" type="time" value="${escapeHtml(alarm.time)}">
      </div>
      <div class="clock-list inset">
        ${clockEditInput("Nom", "alarm-edit-label", alarm.label)}
        ${clockEditInput("Repeter", "alarm-edit-repeat", alarm.repeat)}
        ${clockEditInput("Sonnerie", "alarm-edit-sound", alarm.sound)}
        ${clockEditInput("Vibration", "alarm-edit-vibration", alarm.vibration)}
      </div>
      <button class="clock-delete" data-action="clock-delete-alarm">Supprimer l'alarme</button>
    </div>
  `;
}

function clockEditInput(label, id, value) {
  return `<label class="clock-edit-line"><span>${label}</span><input id="${id}" value="${escapeHtml(value || "")}"></label>`;
}

function renderStopwatchPane() {
  return `
    <div class="stopwatch-pane">
      <div class="clock-display" id="stopwatch-display">${formatStopwatch(clockStopwatchMs())}</div>
      <div class="clock-round-actions">
        <button class="muted" data-action="${state.clock.stopwatch.running ? "clock-lap" : "clock-reset-stopwatch"}">${state.clock.stopwatch.running ? "Tour" : "Reinitialiser"}</button>
        <button class="${state.clock.stopwatch.running ? "pause" : "start"}" data-action="clock-toggle-stopwatch">${state.clock.stopwatch.running ? "Pause" : "Demarrer"}</button>
      </div>
      <div class="lap-list">
        ${state.clock.stopwatch.laps.map((lap, index) => `<div><span>Tour ${state.clock.stopwatch.laps.length - index}</span><time>${formatStopwatch(lap)}</time></div>`).join("")}
      </div>
    </div>
  `;
}

function renderTimersPane() {
  const timer = state.clock.timer;
  return `
    <div class="timer-pane">
      <div class="timer-picker ${timer.running ? "disabled" : ""}">
        ${timerUnit("timer-hours", Math.floor(timer.duration / 3600), 23, "h")}
        ${timerUnit("timer-minutes", Math.floor(timer.duration / 60) % 60, 59, "min")}
        ${timerUnit("timer-seconds", timer.duration % 60, 59, "s")}
      </div>
      <div class="clock-display timer-display" id="timer-display">${formatTimer(clockTimerRemaining())}</div>
      <div class="clock-round-actions">
        <button class="muted" data-action="clock-cancel-timer">Annuler</button>
        <button class="${timer.running ? "pause" : "start"}" data-action="clock-toggle-timer">${timer.running ? "Pause" : "Demarrer"}</button>
      </div>
      <div class="clock-list inset"><button class="timer-sound-row"><span>Sonnerie</span><strong>${escapeHtml(timer.label || "Radar")}</strong></button></div>
    </div>
  `;
}

function timerUnit(id, value, max, label) {
  return `<label><input id="${id}" type="number" min="0" max="${max}" value="${String(value).padStart(2, "0")}"><span>${label}</span></label>`;
}

function cityTime(offset) {
  const date = new Date(Date.now() + offset * 3600000);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function clockStopwatchMs() {
  const watch = state.clock.stopwatch;
  return watch.elapsed + (watch.running && watch.startedAt ? Date.now() - watch.startedAt : 0);
}

function clockTimerRemaining() {
  const timer = state.clock.timer;
  if (!timer.running || !timer.endsAt) return timer.remaining;
  return Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
}

function formatStopwatch(ms) {
  const total = Math.max(0, Math.floor(ms / 10));
  const centiseconds = total % 100;
  const seconds = Math.floor(total / 100) % 60;
  const minutes = Math.floor(total / 6000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(centiseconds).padStart(2, "0")}`;
}

function formatTimer(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function renderStore(content) {
  normalizeAppStoreState();
  if (state.appStore.profileOpen) {
    content.innerHTML = renderStoreProfile();
    return;
  }
  if (state.appStore.selectedAppId) {
    content.innerHTML = renderStoreDetail(state.appStore.selectedAppId);
    return;
  }
  const tab = state.appStore.tab || "today";
  content.innerHTML = `
    <section class="ios-app store-app appstore26">
      <header class="store-top"><h1>${storeTabTitle(tab)}</h1><button data-action="store-profile">N</button></header>
      <div class="store-scroll">${renderStoreTab(tab)}</div>
      ${renderStoreTabs(tab)}
    </section>
  `;
}

function storeCatalog() {
  return [
    { id: "phone", name: "Telephone", developer: "Apple", category: "Utilitaires", description: "Appels, favoris, contacts et messagerie vocale.", rating: "4,8", version: "26.0", size: "Systeme", color: "#34c759", kind: "app", update: false },
    { id: "messages", name: "Messages", developer: "Apple", category: "Social", description: "iMessage, SMS, conversations et notifications.", rating: "4,9", version: "26.0", size: "Systeme", color: "#30d158", kind: "app", update: false },
    { id: "photos", name: "Photos", developer: "Apple", category: "Photo et video", description: "Bibliotheque, albums, souvenirs et recherche.", rating: "4,8", version: "26.0", size: "Systeme", color: "#bf5af2", kind: "app", update: false },
    { id: "camera", name: "Camera", developer: "Apple", category: "Photo et video", description: "Capture photo, video et portrait.", rating: "4,7", version: "26.0", size: "Systeme", color: "#8e8e93", kind: "app", update: false },
    { id: "calendar", name: "Calendrier", developer: "Apple", category: "Productivite", description: "Mois, evenements, rappels et planning du jour.", rating: "4,7", version: "26.0", size: "Systeme", color: "#ffffff", kind: "app", update: false },
    { id: "mail", name: "Mail", developer: "Apple", category: "Productivite", description: "Boite mail, recherche et redaction rapide.", rating: "4,5", version: "26.0", size: "Systeme", color: "#0a84ff", kind: "app", update: false },
    { id: "notes", name: "Notes", developer: "Apple", category: "Productivite", description: "Notes, dossiers et edition locale.", rating: "4,8", version: "26.0", size: "Systeme", color: "#ffd60a", kind: "app", update: false },
    { id: "clock", name: "Horloge", developer: "Apple", category: "Utilitaires", description: "Alarmes, chronometre, minuteurs et horloge mondiale.", rating: "4,8", version: "26.0", size: "Systeme", color: "#111827", kind: "app", update: false },
    { id: "settings", name: "Reglages", developer: "Apple", category: "Utilitaires", description: "Configuration systeme, affichage, batterie et confidentialite.", rating: "4,7", version: "26.0", size: "Systeme", color: "#8e8e93", kind: "app", update: false },
    { id: "store", name: "App Store", developer: "Apple", category: "Utilitaires", description: "Decouvrez, installez et gerez vos apps.", rating: "4,8", version: "26.0", size: "Systeme", color: "#0a84ff", kind: "app", update: false },
    { id: "wallet", name: "Wallet", developer: "Apple", category: "Finance", description: "Cartes, transactions et historique local.", rating: "4,6", version: "26.0", size: "Systeme", color: "#111827", kind: "app", update: false },
    { id: "maps", name: "Plans", developer: "Apple", category: "Navigation", description: "Carte, lieux, recherche et itineraire simule.", rating: "4,6", version: "26.0", size: "Systeme", color: "#5ac8fa", kind: "app", update: false },
    { id: "health", name: "Sante", developer: "Apple", category: "Sante", description: "Resume quotidien, sommeil, pas et activite.", rating: "4,7", version: "26.0", size: "Systeme", color: "#ffffff", kind: "app", update: false },
    { id: "weather", name: "Meteo", developer: "Apple", category: "Meteo", description: "Temperature, previsions horaires et semaine.", rating: "4,6", version: "26.0", size: "Systeme", color: "#0a84ff", kind: "app", update: false },
    { id: "calculator", name: "Calculatrice", developer: "Apple", category: "Utilitaires", description: "Calculatrice iPhone simple et rapide.", rating: "4,6", version: "26.0", size: "Systeme", color: "#ff9f0a", kind: "app", update: false },
    { id: "nova", name: "NOVA", developer: "Fritix Labs", category: "Productivite", description: "Assistant local premium integre au telephone.", rating: "4,9", version: "2.0", size: "Systeme", color: "#ff9f0a", kind: "app", update: true },
    { id: "music", name: "Musique", developer: "Apple", category: "Divertissement", description: "Bibliotheque, lecteur et controle audio.", rating: "4,8", version: "26.0", size: "Systeme", color: "#ff2d55", kind: "app", update: false },
    { id: "safari", name: "Safari", developer: "Apple", category: "Utilitaires", description: "Navigation web locale et pages integrees.", rating: "4,7", version: "26.0", size: "Systeme", color: "#0a84ff", kind: "app", update: false },
    { id: "racing", name: "FRITIX Racing", developer: "FRITIX", category: "Jeu", description: "Mini-jeu tactile de voiture avec score, obstacles et App Switcher.", rating: "4,9", version: "1.0", size: "Systeme", color: "#ff375f", kind: "game", update: false }
  ];
}

function normalizeAppStoreState() {
  state.appStore = { ...defaultAppStoreState(), ...(state.appStore || {}) };
  const validIds = storeCatalog().map(app => app.id);
  const before = JSON.stringify({
    installedApps: state.appStore.installedApps,
    recentDownloads: state.appStore.recentDownloads,
    downloads: state.appStore.downloads,
    selectedAppId: state.appStore.selectedAppId
  });
  state.appStore.installedApps = (state.appStore.installedApps || []).filter(id => validIds.includes(id));
  if (!state.appStore.installedApps.includes("racing")) state.appStore.installedApps.push("racing");
  state.appStore.recentDownloads = (state.appStore.recentDownloads || []).filter(id => validIds.includes(id));
  Object.keys(state.appStore.downloads || {}).forEach(id => {
    if (!validIds.includes(id)) delete state.appStore.downloads[id];
  });
  if (state.appStore.selectedAppId && !validIds.includes(state.appStore.selectedAppId)) state.appStore.selectedAppId = "";
  const after = JSON.stringify({
    installedApps: state.appStore.installedApps,
    recentDownloads: state.appStore.recentDownloads,
    downloads: state.appStore.downloads,
    selectedAppId: state.appStore.selectedAppId
  });
  if (before !== after) save();
}

function storeTabTitle(tab) {
  return { today: "Aujourd'hui", games: "Jeux", apps: "Apps", arcade: "Arcade", search: "Recherche" }[tab] || "Aujourd'hui";
}

function renderStoreTabs(active) {
  const tabs = [["today", "Aujourd'hui", "▣"], ["games", "Jeux", "◆"], ["apps", "Apps", "□"], ["arcade", "Arcade", "◌"], ["search", "Recherche", "⌕"]];
  return `<nav class="store-tabbar">${tabs.map(tab => `<button class="${active === tab[0] ? "active" : ""}" data-action="store-tab" data-tab="${tab[0]}"><span>${tab[2]}</span>${tab[1]}</button>`).join("")}</nav>`;
}

function renderStoreTab(tab) {
  if (tab === "games") return renderStoreList(storeCatalog().filter(app => app.kind === "game"), "Top jeux");
  if (tab === "apps") return `${renderStoreUpdates()}${renderStoreList(storeCatalog().filter(app => app.kind === "app"), "Apps essentielles")}`;
  if (tab === "arcade") return renderStoreArcade();
  if (tab === "search") return renderStoreSearch();
  return renderStoreToday();
}

function renderStoreToday() {
  const featured = storeCatalog()[0];
  return `
    <button class="store-hero" data-action="store-detail" data-store-app="${featured.id}">
      <small>APP DU JOUR</small><strong>${featured.name}</strong><span>${featured.description}</span>
    </button>
    <button class="store-hero secondary" data-action="store-detail" data-store-app="music">
      <small>SELECTION FRITIX OS</small><strong>Musique</strong><span>Lecteur Apple Music synchronise avec la Dynamic Island.</span>
    </button>
    ${renderStoreList(storeCatalog().slice(1, 6), "Apps fonctionnelles")}
  `;
}

function renderStoreList(items, title) {
  return `<section class="store-section"><h2>${title}</h2><div class="store-list">${items.length ? items.map(renderStoreRow).join("") : `<div class="store-empty">Aucune app fonctionnelle disponible dans cette section.</div>`}</div></section>`;
}

function renderStoreRow(app) {
  return `
    <article class="store-row">
      <button class="store-row-main" data-action="store-detail" data-store-app="${app.id}">
        <span class="store-app-icon" style="background:${app.color}">${storeInitial(app.name)}</span>
        <span><strong>${app.name}</strong><small>${app.category} - ${app.rating} ★</small><em>${app.description}</em></span>
      </button>
      ${renderStoreButton(app)}
    </article>
  `;
}

function renderStoreButton(app) {
  const download = state.appStore.downloads[app.id];
  const installed = state.appStore.installedApps.includes(app.id);
  if (download?.status === "downloading") return `<button class="store-get progress" data-action="store-install" data-store-app="${app.id}"><i style="--p:${download.progress || 0}%"></i></button>`;
  if (installed) return `<button class="store-get" data-action="store-open" data-store-app="${app.id}">Ouvrir</button>`;
  return `<button class="store-get" data-action="store-install" data-store-app="${app.id}">Obtenir</button>`;
}

function renderStoreUpdates() {
  const updates = storeCatalog().filter(app => app.update && state.appStore.installedApps.includes(app.id));
  if (!updates.length) return "";
  return `<section class="store-section updates"><h2>Mises a jour disponibles</h2>${updates.map(app => `<article class="store-update"><span class="store-app-icon" style="background:${app.color}">${storeInitial(app.name)}</span><span><strong>${app.name}</strong><small>Version ${app.version}</small></span><button data-action="store-update" data-store-app="${app.id}">Mettre a jour</button></article>`).join("")}</section>`;
}

function renderStoreArcade() {
  return `<div class="arcade-banner"><small>FRITIX STORE</small><strong>Section reservee aux apps jouables.</strong><span>Les apps sans vraie interface ont ete retirees du catalogue.</span></div>${renderStoreList(storeCatalog().filter(app => app.kind === "arcade" || app.kind === "game"), "Apps jouables")}`;
}

function renderStoreSearch() {
  const query = (state.appStore.query || "").toLowerCase();
  const results = storeCatalog().filter(app => !query || `${app.name} ${app.category} ${app.description}`.toLowerCase().includes(query));
  return `<label class="store-search"><input id="store-search-input" value="${escapeHtml(state.appStore.query || "")}" placeholder="Jeux, apps, histoires"></label>${renderStoreList(results, query ? "Resultats" : "Decouvrir")}`;
}

function renderStoreDetail(id) {
  const app = storeCatalog().find(item => item.id === id) || storeCatalog()[0];
  return `
    <section class="ios-app store-app appstore26 detail">
      <header class="store-detail-top"><button data-action="store-back">&lt;</button><button data-action="store-profile">N</button></header>
      <div class="store-detail-scroll">
        <section class="store-detail-head"><span class="store-app-icon large" style="background:${app.color}">${storeInitial(app.name)}</span><span><h1>${app.name}</h1><small>${app.developer}</small>${renderStoreButton(app)}</span></section>
        <div class="store-metrics"><span><strong>${app.rating}</strong><small>Note</small></span><span><strong>${app.version}</strong><small>Version</small></span><span><strong>${app.size}</strong><small>Taille</small></span></div>
        <div class="store-screens">${[1,2,3].map(i => `<span style="background:linear-gradient(145deg, ${app.color}, #111827)"><b>${app.name}</b><em>Capture ${i}</em></span>`).join("")}</div>
        <section class="store-description"><h2>Description</h2><p>${app.description} Interface fluide, integration locale et experience inspiree d'iOS.</p></section>
        <div class="store-detail-actions"><button data-action="store-add-home" data-store-app="${app.id}">Ajouter a l'accueil</button><button data-action="store-uninstall" data-store-app="${app.id}">Desinstaller</button></div>
      </div>
    </section>
  `;
}

function renderStoreProfile() {
  const installed = state.appStore.installedApps.map(id => storeCatalog().find(app => app.id === id)).filter(Boolean);
  return `<section class="ios-app store-app appstore26 detail"><header class="store-detail-top"><button data-action="store-back">&lt;</button></header><div class="store-profile"><span class="profile-avatar">N</span><h1>Fritix</h1><small>Compte App Store local</small><h2>Apps installees</h2>${installed.map(renderStoreRow).join("")}<h2>Telechargements recents</h2>${(state.appStore.recentDownloads || []).slice(0, 4).map(id => `<p>${escapeHtml(storeCatalog().find(app => app.id === id)?.name || id)}</p>`).join("") || "<p>Aucun telechargement recent</p>"}</div></section>`;
}

function storeInitial(name) {
  return escapeHtml(name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase());
}

function renderWallet(content) {
  content.innerHTML = `
    <section class="ios-app wallet-app">
      <div class="ios-large-title"><h1>Wallet</h1><button>+</button></div>
      <button class="wallet-card-main" data-action="wallet-card"><strong>Local Card</strong><span>**** 2026</span></button>
      <h2>Dernieres operations</h2>
      <div class="ios-list">${["Apple Store - 29,99 €", "Cafe - 4,20 €", "Metro - 2,10 €"].map(row => `<button class="ios-cell"><span class="wallet-dot"></span><span class="ios-cell-main"><strong>${row}</strong><small>Aujourd'hui</small></span></button>`).join("")}</div>
    </section>
  `;
}

function renderMaps(content) {
  content.innerHTML = `
    <section class="maps-app">
      <div class="map-canvas"><span class="map-user"></span><button class="zoom-in">+</button><button class="zoom-out">-</button></div>
      <div class="map-sheet"><label class="ios-search">Rechercher un lieu</label><div class="ios-list"><button class="ios-cell"><span class="ios-cell-main"><strong>Maison</strong><small>12 min</small></span></button><button class="ios-cell"><span class="ios-cell-main"><strong>Studio Fritix</strong><small>28 min</small></span></button></div></div>
    </section>
  `;
}

function renderHealth(content) {
  content.innerHTML = `
    <section class="ios-app health-app">
      <div class="ios-large-title"><h1>Resume</h1><button>♡</button></div>
      <div class="health-grid">
        ${[["Pas", "8 240"], ["Sommeil", "7h42"], ["Cardiaque", "68 bpm"], ["Activite", "72%"]].map(item => `<div class="health-card"><span>${item[0]}</span><strong>${item[1]}</strong><i></i></div>`).join("")}
      </div>
    </section>
  `;
}

function renderMusicLegacy(content) {
  content.innerHTML = `
    <section class="ios-app music-app">
      <div class="ios-large-title"><h1>Musique</h1><button>•••</button></div>
      <div class="music-library">${musicTracks.map((track, index) => `<button class="ios-cell" data-action="music-select" data-track="${index}"><span class="music-thumb">N</span><span class="ios-cell-main"><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)}</small></span></button>`).join("")}</div>
      <div class="music-now">
        <span class="music-cover-large">N</span><strong>${escapeHtml(nowPlaying.title)}</strong><small>${escapeHtml(nowPlaying.artist)}</small>
        <i class="lock-music-progress"><b></b></i>
        <div class="music-controls"><button data-action="music-prev">&lt;</button><button data-action="music-toggle">${nowPlaying.playing ? "II" : ">"}</button><button data-action="music-next">&gt;</button></div>
      </div>
    </section>
  `;
}

function renderMusic(content) {
  syncNowPlayingFromMusicState();
  content.innerHTML = state.musicState.playerOpen ? renderMusicPlayer() : renderMusicShell();
}

function renderMusicShell() {
  const tab = state.musicState.tab || "home";
  return `
    <section class="ios-app music-app apple-music">
      <div class="music-scroll">
        ${renderMusicTabContent(tab)}
      </div>
      ${renderMusicMiniPlayer()}
      ${renderMusicTabs(tab)}
    </section>
  `;
}

function renderMusicTabContent(tab) {
  if (tab === "explore") return renderMusicExplore();
  if (tab === "library") return renderMusicLibrary();
  if (tab === "radio") return renderMusicRadio();
  if (tab === "search") return renderMusicSearch();
  return renderMusicHome();
}

function renderMusicHome() {
  const recent = musicTracks.slice(0, 4);
  const forYou = [musicTracks[4], musicTracks[2], musicTracks[5]].filter(Boolean);
  return `
    <header class="music-header"><h1>Musique</h1><button class="music-profile">N</button></header>
    <section class="music-section">
      <span class="music-kicker">RECEMMENT ECOUTE</span>
      <div class="music-card-row">${recent.map(renderMusicAlbumCard).join("")}</div>
    </section>
    <section class="music-section">
      <h2>Pour vous</h2>
      <button class="music-feature-card" data-action="music-select" data-track="${escapeHtml(forYou[0]?.id || musicTracks[0].id)}">
        <span class="music-feature-art" style="background:${escapeHtml(forYou[0]?.color || musicTracks[0].color)}">${escapeHtml(forYou[0]?.cover || "M")}</span>
        <span><small>NOUVELLE SELECTION</small><strong>${escapeHtml(forYou[0]?.title || musicTracks[0].title)}</strong><em>${escapeHtml(forYou[0]?.artist || musicTracks[0].artist)}</em></span>
      </button>
      <div class="music-list">${forYou.map(renderMusicTrackRow).join("")}</div>
    </section>
  `;
}

function renderMusicExplore() {
  return `
    <header class="music-header"><h1>Explorer</h1></header>
    <section class="music-section">
      <div class="music-hero-banner"><small>APPLE MUSIC</small><strong>Nouveautes premium</strong><span>Albums, playlists et radios selectionnes.</span></div>
      <h2>Tendances</h2>
      <div class="music-list">${musicTracks.slice(1).map(renderMusicTrackRow).join("")}</div>
    </section>
  `;
}

function renderMusicLibrary() {
  const rows = [
    ["Playlists", "12 listes"],
    ["Artistes", "24 artistes"],
    ["Albums", "18 albums"],
    ["Morceaux", `${musicTracks.length} titres`],
    ["Telecharge", "Disponible hors ligne"]
  ];
  return `
    <header class="music-header"><h1>Bibliotheque</h1><button class="music-edit">Modifier</button></header>
    <div class="music-library-list">${rows.map(row => `<button class="ios-cell music-library-cell"><span class="music-lib-icon">${escapeHtml(row[0].slice(0, 1))}</span><span class="ios-cell-main"><strong>${escapeHtml(row[0])}</strong><small>${escapeHtml(row[1])}</small></span><em>&gt;</em></button>`).join("")}</div>
    <section class="music-section"><h2>Ajouts recents</h2><div class="music-list">${musicTracks.map(renderMusicTrackRow).join("")}</div></section>
  `;
}

function renderMusicRadio() {
  return `
    <header class="music-header"><h1>Radio</h1></header>
    <section class="music-section">
      <div class="music-radio-card"><small>EN DIRECT</small><strong>Apple Music 1</strong><span>Interviews, nouveautes et mix locaux.</span><button data-action="music-select" data-track="${escapeHtml(musicTracks[1].id)}">Ecouter</button></div>
      <div class="music-radio-grid">${["Hits", "Chill", "Pop", "Focus"].map(label => `<button class="music-radio-tile">${escapeHtml(label)}</button>`).join("")}</div>
    </section>
  `;
}

function renderMusicSearch() {
  const query = (state.musicState.search || "").toLowerCase();
  const list = query ? musicTracks.filter(track => `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(query)) : musicTracks;
  return `
    <header class="music-header"><h1>Recherche</h1></header>
    <label class="music-search"><input id="music-search-input" value="${escapeHtml(state.musicState.search || "")}" placeholder="Artistes, titres, paroles"></label>
    <section class="music-section">
      <h2>${query ? "Resultats" : "Top recherches"}</h2>
      <div class="music-list">${list.map(renderMusicTrackRow).join("") || `<p class="music-empty">Aucun resultat</p>`}</div>
    </section>
  `;
}

function renderMusicMiniPlayer() {
  const track = currentMusicTrack();
  return `
    <button class="music-mini-player" data-action="music-open-player">
      <span class="music-mini-cover" style="background:${escapeHtml(track.color)}">${escapeHtml(track.cover)}</span>
      <span><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)}</small></span>
      <em data-action="music-toggle">${state.musicState.isPlaying ? "II" : ">"}</em>
    </button>
  `;
}

function renderMusicTabs(active) {
  const tabs = [
    ["home", "Accueil", "M"],
    ["explore", "Explorer", "E"],
    ["library", "Bibliotheque", "B"],
    ["radio", "Radio", "R"],
    ["search", "Recherche", "S"]
  ];
  return `<nav class="music-tabbar">${tabs.map(tab => `<button class="${active === tab[0] ? "active" : ""}" data-action="music-tab" data-tab="${tab[0]}"><i>${tab[2]}</i><span>${tab[1]}</span></button>`).join("")}</nav>`;
}

function renderMusicAlbumCard(track) {
  return `
    <button class="music-album-card" data-action="music-select" data-track="${escapeHtml(track.id)}">
      <span class="music-cover" style="background:${escapeHtml(track.color)}">${escapeHtml(track.cover)}</span>
      <strong>${escapeHtml(track.title)}</strong>
      <small>${escapeHtml(track.artist)}</small>
    </button>
  `;
}

function renderMusicTrackRow(track) {
  return `
    <button class="music-track-row" data-action="music-select" data-track="${escapeHtml(track.id)}">
      <span class="music-row-cover" style="background:${escapeHtml(track.color)}">${escapeHtml(track.cover)}</span>
      <span><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)} - ${escapeHtml(track.album)}</small></span>
      <em>${formatMusicTime(track.duration)}</em>
    </button>
  `;
}

function renderMusicPlayer() {
  const track = currentMusicTrack();
  const progress = musicProgressPercent();
  return `
    <section class="music-player-full" style="--music-color:${escapeHtml(track.color)}">
      <button class="music-player-close" data-action="music-close-player">v</button>
      <span class="music-player-label">Musique</span>
      <div class="music-player-art" style="background:${escapeHtml(track.color)}">${escapeHtml(track.cover)}</div>
      <div class="music-player-meta"><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)}</small></div>
      <div class="music-progress-wrap">
        <input id="music-seek-input" type="range" min="0" max="${track.duration}" value="${Math.floor(state.musicState.currentTime)}">
        <span><em>${formatMusicTime(state.musicState.currentTime)}</em><em>-${formatMusicTime(track.duration - state.musicState.currentTime)}</em></span>
      </div>
      <div class="music-player-controls">
        <button data-action="music-prev">&lt;</button>
        <button class="primary" data-action="music-toggle">${state.musicState.isPlaying ? "II" : ">"}</button>
        <button data-action="music-next">&gt;</button>
      </div>
      <div class="music-volume-row">
        <span>-</span><input id="music-volume-input" type="range" min="0" max="1" step="0.01" value="${state.musicState.volume}"><span>+</span>
      </div>
      <div class="music-player-actions"><button>Paroles</button><button>AirPlay</button><button>File</button></div>
      <i class="music-player-progress" style="width:${progress}%"></i>
    </section>
  `;
}

function renderSafari(content) {
  content.innerHTML = `
    <section class="ios-app safari-app">
      <div class="safari-page">
        <h1>local.demo</h1>
        <p>Page locale ouverte. Aucun reseau externe n'est utilise.</p>
        <div class="ios-list">
          <button class="ios-cell"><span class="ios-cell-main"><strong>NOVA Docs</strong><small>Interface iPhone locale</small></span></button>
          <button class="ios-cell"><span class="ios-cell-main"><strong>Fritix Store</strong><small>Prototype web embarque</small></span></button>
        </div>
      </div>
      <div class="safari-bar"><button>&lt;</button><input id="url-input" value="https://local.demo"><button data-action="go-url">Go</button></div>
    </section>
  `;
}

function renderRacing(content) {
  const game = state.racing;
  const best = Math.max(Number(game.bestScore || 0), Number(localStorage.getItem("fritixRacingBest") || 0));
  game.bestScore = best;
  const isPlaying = game.status === "playing";
  const isPaused = game.status === "paused";
  const isOver = game.status === "gameover";
  content.innerHTML = `
    <section class="racing-app">
      <div class="racing-hud">
        <span><small>Score</small><strong id="racing-score">${Math.floor(game.score || 0)}</strong></span>
        <span><small>Record</small><strong>${Math.floor(best)}</strong></span>
      </div>
      <div class="racing-road" id="racing-road">
        <span class="road-line one"></span>
        <span class="road-line two"></span>
        <div class="racing-car player lane-${game.lane || 1}" id="racing-player"><i></i></div>
        <div class="racing-obstacles" id="racing-obstacles">${renderRacingObstacles()}</div>
      </div>
      ${!isPlaying ? `
        <div class="racing-menu">
          <span class="racing-logo">FR</span>
          <h1>${isOver ? "Game Over" : "FRITIX Racing"}</h1>
          <p>${isOver ? `Score : ${Math.floor(game.score || 0)}` : isPaused ? "Continuer ?" : "Evite les obstacles et tiens le plus longtemps possible."}</p>
          <button data-action="${isOver ? "racing-restart" : isPaused ? "racing-resume" : "racing-start"}">${isOver ? "Rejouer" : isPaused ? "Continuer" : "Jouer"}</button>
          <button class="ghost" data-action="racing-best">Meilleur score : ${Math.floor(best)}</button>
        </div>
      ` : ""}
      <div class="racing-controls">
        <button data-action="racing-left" data-racing-control="-1" aria-label="Gauche">&lt;</button>
        <button data-action="racing-right" data-racing-control="1" aria-label="Droite">&gt;</button>
      </div>
    </section>
  `;
  if (isPlaying) startRacingLoop();
}

function renderRacingObstacles() {
  return (state.racing.obstacles || []).map(item => `
    <span class="racing-obstacle ${escapeHtml(item.type)} lane-${item.lane}" style="transform:translateY(${item.y}px)">
      ${item.type === "cone" ? "!" : item.type === "truck" ? "T" : item.type === "barrier" ? "=" : ""}
    </span>
  `).join("");
}

function renderPhone(content) {
  if (callState.active) syncPhoneCallState();
  const contacts = phoneContacts();
  const activeContact = contacts.find(contact => contact.id === state.phoneContact);
  if (state.phoneCall) {
    content.innerHTML = state.phoneCall.status === "ringing" ? renderIncomingCall() : renderActiveCall();
    return;
  }
  if (activeContact) {
    content.innerHTML = renderPhoneContact(activeContact);
    return;
  }
  const tab = state.phoneTab || "recents";
  content.innerHTML = `
    <section class="ios-app phone-app iphone-phone">
      <div class="phone-title-row">
        <h1>${phoneTabTitle(tab)}</h1>
        <button class="phone-plus" data-action="phone-new-contact">+</button>
      </div>
      ${tab !== "keypad" ? `<label class="ios-search phone-search"><input id="phone-search" value="${escapeHtml(state.phoneSearch || "")}" placeholder="Rechercher"></label>` : ""}
      <div class="phone-body phone-body-${escapeHtml(tab)}">
        ${renderPhoneTab(tab)}
      </div>
      ${renderPhoneTabs(tab)}
    </section>
  `;
}

function phoneContacts() {
  return [
    { id: "alice", name: "Alice Martin", number: "+33 6 12 45 78 90", mail: "alice@icloud.com", letter: "A", favorite: true, note: "Design review" },
    { id: "alex", name: "Alex Moreau", number: "+33 7 23 88 41 10", mail: "alex@icloud.com", letter: "A", favorite: false, note: "Equipe produit" },
    { id: "benjamin", name: "Benjamin Leroy", number: "+33 6 84 12 90 22", mail: "benjamin@icloud.com", letter: "B", favorite: true, note: "Prioritaire" },
    { id: "claire", name: "Claire Dubois", number: "+33 6 55 20 17 30", mail: "claire@icloud.com", letter: "C", favorite: false, note: "Contact studio" },
    { id: "emma", name: "Emma Laurent", number: "+33 7 42 17 08 63", mail: "emma@icloud.com", letter: "E", favorite: true, note: "Maquettes" },
    { id: "lucas", name: "Lucas Bernard", number: "+33 6 19 42 11 08", mail: "lucas@icloud.com", letter: "L", favorite: true, note: "Appels frequents" },
    { id: "Fritix", name: "Fritix", number: "+33 6 00 00 00 01", mail: "Fritix@icloud.com", letter: "N", favorite: false, note: "iPhone local" }
  ];
}

function phoneRecents() {
  return [
    { id: "lucas", name: "Lucas Bernard", number: "+33 6 19 42 11 08", type: "Mobile", time: "Aujourd'hui 19:42", missed: false, outgoing: false },
    { id: "emma", name: "Emma Laurent", number: "+33 7 42 17 08 63", type: "FaceTime audio", time: "Aujourd'hui 17:08", missed: true, outgoing: false },
    { id: "benjamin", name: "Benjamin Leroy", number: "+33 6 84 12 90 22", type: "Mobile", time: "Hier", missed: false, outgoing: true },
    { id: "claire", name: "Claire Dubois", number: "+33 6 55 20 17 30", type: "Mobile", time: "Lundi", missed: false, outgoing: false },
    { id: "unknown", name: "+33 1 82 88 10 24", number: "+33 1 82 88 10 24", type: "Inconnu", time: "Dimanche", missed: true, outgoing: false }
  ];
}

function phoneVoicemails() {
  return [
    { id: "lucas", name: "Lucas Bernard", date: "Aujourd'hui", duration: "0:28", text: "Rappelle-moi quand tu peux." },
    { id: "emma", name: "Emma Laurent", date: "Hier", duration: "1:04", text: "J'ai laisse le brief final." },
    { id: "support", name: "Support", date: "Lundi", duration: "0:16", text: "Ticket ferme avec succes." }
  ];
}

function phoneTabTitle(tab) {
  return { favorites: "Favoris", recents: "Recents", contacts: "Contacts", keypad: "Clavier", voicemail: "Messagerie" }[tab] || "Telephone";
}

function renderPhoneTabs(active) {
  const tabs = [
    ["favorites", "Favoris", "★"],
    ["recents", "Recents", "◷"],
    ["contacts", "Contacts", "●"],
    ["keypad", "Clavier", "⌘"],
    ["voicemail", "Messagerie", "✉"]
  ];
  return `<nav class="phone-tabbar">${tabs.map(([id, label, icon]) => `<button class="${active === id ? "active" : ""}" data-action="phone-tab" data-tab="${id}"><span>${icon}</span>${label}</button>`).join("")}</nav>`;
}

function renderPhoneTab(tab) {
  if (tab === "favorites") return renderPhoneFavorites();
  if (tab === "contacts") return renderPhoneContacts();
  if (tab === "keypad") return renderPhoneKeypad();
  if (tab === "voicemail") return renderPhoneVoicemail();
  return renderPhoneRecents();
}

function filteredPhoneContacts() {
  const query = (state.phoneSearch || "").toLowerCase();
  return phoneContacts().filter(contact => !query || contact.name.toLowerCase().includes(query) || contact.number.includes(query));
}

function renderPhoneFavorites() {
  const favorites = filteredPhoneContacts().filter(contact => contact.favorite);
  return `<div class="phone-favorites">${favorites.map(contact => `
    <button class="phone-favorite-card" data-action="phone-open-contact" data-contact="${contact.id}">
      <span class="phone-avatar">${contact.name[0]}</span>
      <strong>${escapeHtml(contact.name.split(" ")[0])}</strong>
      <small>mobile</small>
      <em data-action="phone-call" data-contact="${contact.id}">Appeler</em>
    </button>
  `).join("")}</div>`;
}

function renderPhoneRecents() {
  const query = (state.phoneSearch || "").toLowerCase();
  const rows = phoneRecents().filter(call => !query || call.name.toLowerCase().includes(query) || call.number.includes(query));
  return `<div class="phone-list">${rows.map(call => `
    <button class="phone-row ${call.missed ? "missed" : ""}" data-action="phone-call" data-contact="${call.id}" data-number="${escapeHtml(call.number)}" data-name="${escapeHtml(call.name)}">
      <span class="phone-avatar">${escapeHtml(call.name[0])}</span>
      <span class="phone-row-main"><strong>${escapeHtml(call.name)}</strong><small>${call.outgoing ? "↗ " : ""}${escapeHtml(call.type)} • ${escapeHtml(call.time)}</small></span>
      <span class="phone-info" data-action="phone-open-contact" data-contact="${call.id}">i</span>
    </button>
  `).join("")}</div>`;
}

function renderPhoneContacts() {
  const contacts = filteredPhoneContacts().sort((a, b) => a.name.localeCompare(b.name));
  let currentLetter = "";
  return `<div class="phone-list contact-list">${contacts.map(contact => {
    const heading = contact.letter !== currentLetter ? `<h3>${contact.letter}</h3>` : "";
    currentLetter = contact.letter;
    return `${heading}<button class="phone-row contact-row" data-action="phone-open-contact" data-contact="${contact.id}">
      <span class="phone-avatar">${contact.name[0]}</span>
      <span class="phone-row-main"><strong>${escapeHtml(contact.name)}</strong><small>${escapeHtml(contact.number)}</small></span>
    </button>`;
  }).join("")}</div>`;
}

function renderPhoneKeypad() {
  return `
    <div class="phone-dial-display" id="dial-number">${escapeHtml(state.phoneDial || "")}</div>
    <div class="iphone-dialer">
      ${["1","2 ABC","3 DEF","4 GHI","5 JKL","6 MNO","7 PQRS","8 TUV","9 WXYZ","*","0 +","#"].map(key => {
        const [digit, ...letters] = key.split(" ");
        return `<button data-dial="${digit}"><strong>${digit}</strong><small>${letters.join(" ")}</small></button>`;
      }).join("")}
    </div>
    <div class="phone-call-row">
      <button class="phone-call-button" data-action="phone-call-number">☎</button>
      <button class="phone-delete" data-action="phone-delete">⌫</button>
    </div>
  `;
}

function renderPhoneVoicemail() {
  return `<div class="phone-list voicemail-list">${phoneVoicemails().map(item => `
    <button class="phone-row voicemail-row" data-action="voicemail-play">
      <span class="phone-play">▶</span>
      <span class="phone-row-main"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.date)} • ${escapeHtml(item.duration)} — ${escapeHtml(item.text)}</small></span>
      <span class="phone-info">i</span>
    </button>
  `).join("")}</div>`;
}

function renderPhoneContact(contact) {
  return `
    <section class="ios-app phone-app iphone-phone contact-detail">
      <button class="ios-back-inline" data-action="phone-back">&lt; Contacts</button>
      <div class="phone-contact-hero">
        <span class="phone-avatar huge">${contact.name[0]}</span>
        <h1>${escapeHtml(contact.name)}</h1>
        <p>${escapeHtml(contact.number)}</p>
      </div>
      <div class="contact-actions">
        <button data-action="phone-call" data-contact="${contact.id}">☎<span>appeler</span></button>
        <button data-app="messages">✉<span>message</span></button>
        <button data-action="phone-facetime">▣<span>FaceTime</span></button>
        <button data-action="phone-mail">@<span>email</span></button>
      </div>
      <div class="phone-list contact-notes">
        <button class="phone-row"><span class="phone-row-main"><strong>mobile</strong><small>${escapeHtml(contact.number)}</small></span></button>
        <button class="phone-row"><span class="phone-row-main"><strong>Notes</strong><small>${escapeHtml(contact.note)}</small></span></button>
        <button class="phone-row"><span class="phone-row-main"><strong>Historique</strong><small>Dernier appel aujourd'hui</small></span></button>
        <button class="phone-row"><span class="phone-row-main"><strong>Favoris</strong><small>${contact.favorite ? "Ajoute aux favoris" : "Ajouter aux favoris"}</small></span></button>
      </div>
    </section>
  `;
}

function renderIncomingCall() {
  const call = state.phoneCall;
  return `
    <section class="phone-call-screen incoming-call">
      <div class="call-backdrop"><span>${escapeHtml(call.name[0] || "?")}</span></div>
      <div class="call-identity call-identity-incoming">
        <span class="call-photo">${escapeHtml(call.name[0] || "?")}</span>
        <h1>${escapeHtml(call.name)}</h1>
        <p>${escapeHtml(call.number || "mobile")}</p>
        <small>appel entrant</small>
      </div>
      <div class="incoming-actions">
        <button class="decline" data-action="phone-decline"><strong>x</strong><span>Refuser</span></button>
        <button class="accept" data-action="phone-answer"><strong>Tel</strong><span>Repondre</span></button>
      </div>
    </section>
  `;
}

function renderActiveCall() {
  const call = state.phoneCall;
  const connected = call.status === "connected" && call.startedAt;
  const elapsed = connected ? formatCallDuration(Date.now() - call.startedAt) : "Appel...";
  const controls = [
    ["Muet", "M"],
    ["Clavier", "#"],
    ["Haut-parleur", "S"],
    ["Ajouter", "+"],
    ["FaceTime", "F"],
    ["Contacts", "C"]
  ];
  return `
    <section class="phone-call-screen active-call">
      <div class="call-backdrop"><span>${escapeHtml(call.name[0] || "?")}</span></div>
      <div class="call-identity">
        <span class="call-photo">${escapeHtml(call.name[0] || "?")}</span>
        <h1>${escapeHtml(call.name)}</h1>
        <p id="active-call-duration" class="${connected ? "" : "calling"}">${elapsed}</p>
      </div>
      <div class="call-controls">
        ${controls.map(([label, icon]) => `<button class="${label === "Clavier" && call.showKeypad ? "active" : ""}" data-action="${label === "Clavier" ? "phone-call-keypad" : "phone-call-control"}"><strong>${icon}</strong><span>${label}</span></button>`).join("")}
      </div>
      ${call.showKeypad ? `<div class="in-call-keypad">${["1","2","3","4","5","6","7","8","9","*","0","#"].map(key => `<button data-dial="${key}">${key}</button>`).join("")}</div>` : ""}
      <button class="hangup" data-action="phone-end"><span>x</span></button>
    </section>
  `;
}

function renderNova(content) {
  content.innerHTML = `
    <section class="ios-app nova-app">
      <div class="nova-orb"></div>
      <h1>NOVA</h1>
      <div class="nova-suggestions">${["scan", "status", "shield"].map(cmd => `<button data-action="nova-fill" data-command="${cmd}">${cmd}</button>`).join("")}</div>
      <div class="ios-compose"><input id="nova-input" placeholder="Commande"><button data-action="nova-command">↑</button></div>
      <div class="ios-list nova-history"><p id="nova-output">En attente.</p></div>
    </section>
  `;
}

function renderGeneric(content, id) {
  const app = apps.find(item => item.id === id);
  content.innerHTML = `<section class="ios-app"><div class="ios-large-title"><h1>${escapeHtml(app?.name || id)}</h1></div><div class="ios-list"><button class="ios-cell"><span class="ios-cell-main"><strong>App locale</strong><small>Interface iOS en simulation</small></span></button></div></section>`;
}
