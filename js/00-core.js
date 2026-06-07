const view = document.querySelector("#view");
const screen = document.querySelector("#screen");
const island = document.querySelector("#dynamic-island");
const statusTime = document.querySelector("#status-time");
const homeIndicator = document.querySelector("#home-indicator");
const wallpaper = document.querySelector(".wallpaper");
const sideVolumeUp = document.querySelector("#side-volume-up");
const sideVolumeDown = document.querySelector("#side-volume-down");
const sidePower = document.querySelector("#side-power");
const hardwareOverlay = document.querySelector("#hardware-overlay");

const storedDb = readStoredDatabase();
const savedSystemVolume = parseFloat(localStorage.getItem("systemVolume") || "");
const storedSettings = storedDb.settings || JSON.parse(localStorage.getItem("emu_settings") || "{}");
const initialVolumeRaw = Number.isFinite(savedSystemVolume) ? savedSystemVolume : Number(storedSettings.volume ?? 70);
const systemState = {
  volume: normalizeUnitValue(initialVolumeRaw, 0.7),
  brightness: normalizeUnitValue(Number(storedSettings.brightness ?? 80), 0.8)
};

const state = {
  unlocked: false,
  currentApp: null,
  editMode: false,
  phoneTab: storedDb.phoneTab || localStorage.getItem("emu_phone_tab") || "recents",
  phoneDial: "",
  phoneContact: "",
  phoneSearch: "",
  phoneCall: null,
  clock: storedDb.clock || JSON.parse(localStorage.getItem("emu_clock") || "null") || defaultClockState(),
  racing: storedDb.racing || JSON.parse(localStorage.getItem("emu_racing") || "null") || defaultRacingState(),
  homeLayout: storedDb.homeLayout || JSON.parse(localStorage.getItem("emu_home_layout") || "null") || defaultHomeLayout(),
  appStore: storedDb.appStore || JSON.parse(localStorage.getItem("emu_app_store") || "null") || defaultAppStoreState(),
  musicState: storedDb.musicState || JSON.parse(localStorage.getItem("emu_music_state") || "null") || defaultMusicState(),
  camera: storedDb.camera || JSON.parse(localStorage.getItem("emu_camera") || "null") || defaultCameraState(),
  notes: storedDb.notes || localStorage.getItem("emu_notes") || "Idees:\n- Booster le design\n- Tester Spotlight\n- Faire une vraie app mobile locale",
  messages: storedDb.messages || JSON.parse(localStorage.getItem("emu_messages") || "[]"),
  conversations: storedDb.conversations || JSON.parse(localStorage.getItem("emu_conversations") || "[]"),
  openApps: storedDb.openApps || JSON.parse(localStorage.getItem("emu_open_apps") || "[]"),
  activeConversationId: "",
  messageSearch: "",
  composerDraft: "",
  composerRecipient: "",
  messageActionId: "",
  autoReply: storedDb.autoReply ?? JSON.parse(localStorage.getItem("emu_auto_reply") || "true"),
  photos: storedDb.photos || JSON.parse(localStorage.getItem("emu_photos") || "[]"),
  lastApps: storedDb.lastApps || JSON.parse(localStorage.getItem("emu_last_apps") || '["messages","notes","nova","safari"]'),
  settings: storedDb.settings || JSON.parse(localStorage.getItem("emu_settings") || "{}"),
  notifications: storedDb.notifications || JSON.parse(localStorage.getItem("emu_notifications") || "[]"),
  passcodeInput: "",
  passcodeError: false,
  faceIdStatus: "idle",
  calc: "",
  brightness: Math.round(systemState.brightness * 100),
  volume: Math.round(systemState.volume * 100),
  musicIndex: Number(storedSettings.musicIndex ?? 0)
};

state.settings = {
  passcode: "1234",
  passcodeEnabled: true,
  passcodeLength: 4,
  faceIdEnabled: true,
  autoLock: "Immediatement",
  wifi: true,
  bluetooth: true,
  cellular: true,
  airplane: false,
  notifications: true,
  sound: true,
  focus: false,
  focusMode: "",
  darkMode: false,
  reduceMotion: false,
  wallpaper: "Default",
  wallpaperUrl: "",
  wallpaperFit: "cover",
  brightness: state.brightness,
  volume: state.volume,
  musicIndex: state.musicIndex,
  ...state.settings
};

systemState.brightness = normalizeUnitValue(Number(state.settings.brightness ?? state.brightness), systemState.brightness);
systemState.volume = normalizeUnitValue(Number(localStorage.getItem("systemVolume") || state.settings.volume || state.volume), systemState.volume);
state.brightness = Math.round(systemState.brightness * 100);
state.volume = Math.round(systemState.volume * 100);
state.musicIndex = Number(state.settings.musicIndex);
state.settings.passcodeLength = [4, 6].includes(Number(state.settings.passcodeLength)) ? Number(state.settings.passcodeLength) : 4;
if (!new RegExp(`^\\d{${state.settings.passcodeLength}}$`).test(String(state.settings.passcode || ""))) {
  state.settings.passcode = state.settings.passcodeLength === 6 ? "123456" : "1234";
}
if (!["Default", "iOS Blue", "iOS Purple", "iOS Dark", "iOS Light", "VisionOS"].includes(state.settings.wallpaper)) {
  state.settings.wallpaper = "Default";
}

if (!state.messages.length) {
  state.messages = [
    { from: "NOVA", body: "Interface premium chargee." },
    { from: "Mission Control", body: "2 objectifs ouverts." },
    { from: "Systeme", body: "Gestes, widgets et centre de controle actifs." }
  ];
}

if (!state.photos.length) {
  state.photos = ["#0a84ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff2d55", "#111827", "#5ac8fa", "#ffd60a"];
}

state.camera = { ...defaultCameraState(), ...(state.camera || {}) };
state.camera.photos = Array.isArray(state.camera.photos) ? state.camera.photos : [];
state.camera.videos = Array.isArray(state.camera.videos) ? state.camera.videos : [];

if (!state.conversations.length) {
  state.conversations = defaultConversations();
}

if (!state.notifications.length) {
  state.notifications = [
    { id: "n1", app: "Messages", appId: "messages", icon: "M", color: "#30d158", title: "Lucas", body: "Tu es dispo ce soir ?", time: "maintenant", unread: true, kind: "message" },
    { id: "n2", app: "Messages", appId: "messages", icon: "M", color: "#30d158", title: "Emma", body: "J'ai envoye la maquette finale.", time: "2 min", unread: true, kind: "message" },
    { id: "n3", app: "Calendrier", appId: "calendar", icon: "17", color: "#ffffff", darkIcon: true, title: "17:30", body: "Brief Design Premium", time: "8 min", unread: true, kind: "default" },
    { id: "n4", app: "NOVA", appId: "nova", icon: "AI", color: "#ff9f0a", title: "Assistant", body: "Analyse locale terminee.", time: "12 min", unread: true, kind: "default" },
    { id: "n5", app: "Discord", appId: "messages", icon: "D", color: "#5865f2", title: "Staff", body: "Support pret pour la demo.", time: "18 min", unread: true, kind: "default" }
  ];
}

const musicTracks = defaultMusicTracks();
state.musicState = normalizeMusicState(state.musicState);
const nowPlaying = {
  ...currentMusicTrack(),
  playing: state.musicState.isPlaying
};

const dynamicIslandState = {
  mode: "compact",
  currentActivity: null,
  queue: [],
  expanded: false,
  locked: false,
  timer: null,
  priorities: {
    call: 100,
    navigation: 80,
    music: 60,
    racing: 55,
    camera: 50,
    timer: 40,
    notification: 20
  }
};

const callState = {
  active: false,
  contactName: null,
  number: null,
  duration: 0,
  status: "idle",
  minimized: false,
  startedAt: null,
  showKeypad: false,
  timer: null,
  previousApp: null
};

let cameraRecordingTimer = null;

const apps = [
  { id: "phone", name: "Telephone", icon: "T", color: "#34c759", dock: true },
  { id: "messages", name: "Messages", icon: "M", color: "#30d158", dock: true },
  { id: "safari", name: "Safari", icon: "S", color: "#0a84ff", dock: true },
  { id: "music", name: "Musique", icon: "Mu", color: "#ff2d55", dock: true },
  { id: "camera", name: "Camera", icon: "C", color: "#8e8e93" },
  { id: "photos", name: "Photos", icon: "P", color: "#bf5af2" },
  { id: "calendar", name: "Calendrier", icon: "17", color: "#ffffff", darkText: true },
  { id: "clock", name: "Horloge", icon: "H", color: "#111827" },
  { id: "settings", name: "Reglages", icon: "S", color: "#8e8e93" },
  { id: "maps", name: "Plans", icon: ">", color: "#5ac8fa" },
  { id: "store", name: "App Store", icon: "A", color: "#0a84ff" },
  { id: "mail", name: "Mail", icon: "@", color: "#0a84ff" },
  { id: "notes", name: "Notes", icon: "N", color: "#ffd60a", darkText: true },
  { id: "reminders", name: "Rappels", icon: "R", color: "#ffffff", darkText: true },
  { id: "wallet", name: "Wallet", icon: "W", color: "#111827" },
  { id: "health", name: "Sante", icon: "+", color: "#ffffff", darkText: true },
  { id: "weather", name: "Meteo", icon: "W", color: "#0a84ff" },
  { id: "calculator", name: "Calcul", icon: "=", color: "#ff9f0a" },
  { id: "nova", name: "NOVA", icon: "AI", color: "#ff9f0a" },
  { id: "racing", name: "FRITIX Racing", icon: "R", color: "#ff375f" }
];

function readStoredDatabase() {
  try {
    return JSON.parse(localStorage.getItem("emu_bdd") || "{}");
  } catch {
    return {};
  }
}

function normalizeUnitValue(value, fallback = 0.7) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  if (number > 1) return Math.max(0, Math.min(1, number / 100));
  return Math.max(0, Math.min(1, number));
}

function defaultClockState() {
  return {
    tab: "world",
    editingAlarmId: "",
    alarms: [
      { id: "alarm-0730", time: "07:30", label: "Reveil", repeat: "Lun. Mar. Mer. Jeu. Ven.", sound: "Radar", vibration: "Standard", enabled: true },
      { id: "alarm-0845", time: "08:45", label: "Studio", repeat: "Tous les jours", sound: "Ondes", vibration: "Legere", enabled: true },
      { id: "alarm-1800", time: "18:00", label: "Brief", repeat: "Jamais", sound: "Carillon", vibration: "Aucune", enabled: false }
    ],
    stopwatch: { running: false, elapsed: 0, startedAt: null, laps: [] },
    timer: { running: false, duration: 300, remaining: 300, startedAt: null, endsAt: null, label: "Radar" }
  };
}

function defaultHomeLayout() {
  return {
    page: "home",
    appOrder: ["messages", "calendar", "photos", "camera", "mail", "notes", "clock", "settings", "store", "wallet", "maps", "health", "weather", "calculator", "nova", "music", "racing"],
    dock: ["phone", "messages", "safari", "music"],
    hiddenApps: [],
    widgets: [],
    iconTheme: "light",
    iconTint: "#0a84ff",
    iconSize: "small",
    widgetGalleryOpen: false,
    customizeOpen: false,
    confirm: null
  };
}

function defaultRacingState() {
  return {
    status: "menu",
    score: 0,
    bestScore: Number(localStorage.getItem("fritixRacingBest") || 0),
    lane: 1,
    obstacles: [],
    speed: 2.8,
    spawnEvery: 980,
    lastSpawn: 0,
    lastTick: 0,
    pausedByExit: false
  };
}

function defaultCameraState() {
  return {
    mode: "photo",
    facing: "back",
    flash: false,
    live: true,
    permission: true,
    galleryOpen: false,
    captureFlash: false,
    recording: false,
    recordingStartedAt: null,
    recordingElapsed: 0,
    photos: [],
    videos: []
  };
}

function defaultAppStoreState() {
  return {
    tab: "today",
    query: "",
    selectedAppId: "",
    profileOpen: false,
    installedApps: ["phone", "messages", "photos", "camera", "calendar", "mail", "notes", "clock", "settings", "store", "wallet", "maps", "health", "weather", "calculator", "nova", "music", "safari", "racing"],
    downloads: {},
    recentDownloads: []
  };
}

function defaultMusicTracks() {
  return [
    { id: "blinding-lights", title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: 200, cover: "BL", color: "#b91c3c", audioUrl: "" },
    { id: "nova-theme", title: "NOVA Theme", artist: "Synthwave local", album: "Local Sessions", duration: 186, cover: "NV", color: "#7c3aed", audioUrl: "" },
    { id: "midnight-city", title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", duration: 244, cover: "MC", color: "#2563eb", audioUrl: "" },
    { id: "golden-hour", title: "Golden Hour", artist: "JVKE", album: "This Is What It Feels Like", duration: 209, cover: "GH", color: "#d97706", audioUrl: "" },
    { id: "levitating", title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", duration: 203, cover: "LV", color: "#db2777", audioUrl: "" },
    { id: "night-drive", title: "Night Drive", artist: "Apple Park", album: "Cupertino Nights", duration: 221, cover: "ND", color: "#0f766e", audioUrl: "" }
  ];
}

function defaultMusicState() {
  const tracks = defaultMusicTracks();
  return {
    isPlaying: false,
    currentTrack: tracks[0].id,
    currentTime: 0,
    duration: tracks[0].duration,
    queue: tracks.map(track => track.id),
    volume: 0.7,
    repeat: false,
    shuffle: false,
    tab: "home",
    search: "",
    playerOpen: false
  };
}

function normalizeMusicState(value = {}) {
  const fallback = defaultMusicState();
  const merged = { ...fallback, ...(value || {}) };
  const ids = musicTracks.map(track => track.id);
  merged.queue = Array.isArray(merged.queue) && merged.queue.length ? merged.queue.filter(id => ids.includes(id)) : fallback.queue;
  if (!merged.queue.length) merged.queue = fallback.queue;
  if (!ids.includes(merged.currentTrack)) merged.currentTrack = merged.queue[0] || fallback.currentTrack;
  const track = musicTracks.find(item => item.id === merged.currentTrack) || musicTracks[0];
  merged.duration = Number(merged.duration || track.duration);
  merged.currentTime = Math.max(0, Math.min(Number(merged.currentTime || 0), merged.duration));
  merged.volume = Math.max(0, Math.min(1, Number(merged.volume ?? fallback.volume)));
  merged.isPlaying = Boolean(merged.isPlaying);
  merged.repeat = Boolean(merged.repeat);
  merged.shuffle = Boolean(merged.shuffle);
  merged.tab = ["home", "explore", "library", "radio", "search"].includes(merged.tab) ? merged.tab : "home";
  merged.search = String(merged.search || "");
  merged.playerOpen = Boolean(merged.playerOpen);
  return merged;
}

function currentMusicTrack() {
  return musicTracks.find(track => track.id === state.musicState?.currentTrack) || musicTracks[0];
}

function syncNowPlayingFromMusicState() {
  const track = currentMusicTrack();
  nowPlaying.id = track.id;
  nowPlaying.title = track.title;
  nowPlaying.artist = track.artist;
  nowPlaying.album = track.album;
  nowPlaying.duration = track.duration;
  nowPlaying.cover = track.cover;
  nowPlaying.color = track.color;
  nowPlaying.playing = Boolean(state.musicState.isPlaying);
  state.musicIndex = musicTracks.findIndex(item => item.id === track.id);
  if (state.musicIndex < 0) state.musicIndex = 0;
  state.musicState.duration = track.duration;
}

function defaultConversations() {
  const now = Date.now();
  return [
    {
      id: "emma",
      contactId: "emma",
      contactName: "Emma Laurent",
      contactNumber: "+33 7 42 17 08 63",
      contactAvatar: "E",
      lastMessage: "J'ai envoye la maquette finale.",
      lastMessageAt: new Date(now - 12 * 60 * 1000).toISOString(),
      unreadCount: 1,
      pinned: false,
      muted: false,
      messages: [
        { id: "m-emma-1", sender: "them", content: "Tu es dispo ce soir ?", createdAt: new Date(now - 18 * 60 * 1000).toISOString(), status: "read" },
        { id: "m-emma-2", sender: "me", content: "Oui, je finalise l'interface Messages.", createdAt: new Date(now - 15 * 60 * 1000).toISOString(), status: "read" },
        { id: "m-emma-3", sender: "them", content: "J'ai envoye la maquette finale.", createdAt: new Date(now - 12 * 60 * 1000).toISOString(), status: "delivered" }
      ]
    },
    {
      id: "lucas",
      contactId: "lucas",
      contactName: "Lucas Bernard",
      contactNumber: "+33 6 19 42 11 08",
      contactAvatar: "L",
      lastMessage: "Tu es dispo ce soir ?",
      lastMessageAt: new Date(now - 42 * 60 * 1000).toISOString(),
      unreadCount: 2,
      pinned: true,
      muted: false,
      messages: [
        { id: "m-lucas-1", sender: "them", content: "Tu es dispo ce soir ?", createdAt: new Date(now - 42 * 60 * 1000).toISOString(), status: "delivered" },
        { id: "m-lucas-2", sender: "them", content: "On peut tester l'app iPhone ?", createdAt: new Date(now - 40 * 60 * 1000).toISOString(), status: "delivered" }
      ]
    },
    {
      id: "nova",
      contactId: "nova",
      contactName: "NOVA",
      contactNumber: "assistant.local",
      contactAvatar: "N",
      lastMessage: "Analyse locale terminee.",
      lastMessageAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
      pinned: false,
      muted: true,
      messages: [
        { id: "m-nova-1", sender: "them", content: "Analyse locale terminee.", createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(), status: "read" },
        { id: "m-nova-2", sender: "me", content: "Garde les donnees en BDD JSON.", createdAt: new Date(now - 90 * 60 * 1000).toISOString(), status: "read" }
      ]
    }
  ];
}

function databaseSnapshot() {
  state.brightness = Math.round(systemState.brightness * 100);
  state.volume = Math.round(systemState.volume * 100);
  state.settings.brightness = state.brightness;
  state.settings.volume = state.volume;
  state.settings.musicIndex = state.musicIndex;
  state.settings.musicPlaying = state.musicState.isPlaying;
  state.musicState.volume = Number(systemState.volume.toFixed(2));
  syncNowPlayingFromMusicState();
  return {
    schema: 1,
    updatedAt: new Date().toISOString(),
    settings: state.settings,
    notes: state.notes,
    messages: state.messages,
    conversations: state.conversations,
    autoReply: state.autoReply,
    photos: state.photos,
    notifications: state.notifications,
    clock: state.clock,
    racing: state.racing,
    camera: state.camera,
    homeLayout: state.homeLayout,
    appStore: state.appStore,
    lastApps: state.lastApps,
    openApps: state.openApps,
    phoneTab: state.phoneTab,
    phoneDraft: state.phoneDial || "",
    musicState: state.musicState,
    musicLibrary: {
      tracks: musicTracks
    },
    music: {
      index: state.musicIndex,
      title: nowPlaying.title,
      artist: nowPlaying.artist,
      playing: state.musicState.isPlaying
    }
  };
}

function applyDatabaseSnapshot(data) {
  if (!data || typeof data !== "object") return;
  if (data.settings) state.settings = { ...state.settings, ...data.settings };
  if (Array.isArray(data.messages)) state.messages = data.messages;
  if (Array.isArray(data.conversations)) state.conversations = data.conversations;
  if (typeof data.autoReply === "boolean") state.autoReply = data.autoReply;
  if (Array.isArray(data.photos)) state.photos = data.photos;
  if (Array.isArray(data.notifications)) state.notifications = data.notifications;
  if (data.clock && typeof data.clock === "object") state.clock = { ...defaultClockState(), ...data.clock };
  if (data.racing && typeof data.racing === "object") state.racing = { ...defaultRacingState(), ...data.racing };
  if (data.camera && typeof data.camera === "object") state.camera = { ...defaultCameraState(), ...data.camera };
  if (data.homeLayout && typeof data.homeLayout === "object") state.homeLayout = { ...defaultHomeLayout(), ...data.homeLayout };
  if (data.appStore && typeof data.appStore === "object") state.appStore = { ...defaultAppStoreState(), ...data.appStore };
  if (Array.isArray(data.lastApps)) state.lastApps = data.lastApps;
  if (Array.isArray(data.openApps)) state.openApps = data.openApps;
  if (typeof data.notes === "string") state.notes = data.notes;
  if (typeof data.phoneTab === "string") state.phoneTab = data.phoneTab;
  state.brightness = Number(state.settings.brightness ?? state.brightness);
  systemState.brightness = normalizeUnitValue(state.brightness, systemState.brightness);
  systemState.volume = normalizeUnitValue(Number(localStorage.getItem("systemVolume") || state.settings.volume || state.volume), systemState.volume);
  state.brightness = Math.round(systemState.brightness * 100);
  state.volume = Math.round(systemState.volume * 100);
  state.musicIndex = Number(state.settings.musicIndex ?? state.musicIndex);
  if (data.musicState && typeof data.musicState === "object") {
    state.musicState = normalizeMusicState(data.musicState);
  } else {
    const track = musicTracks[state.musicIndex % musicTracks.length] || musicTracks[0];
    state.musicState = normalizeMusicState({
      currentTrack: track.id,
      currentTime: 0,
      isPlaying: data.music?.playing ?? state.settings.musicPlaying ?? state.musicState.isPlaying,
      volume: systemState.volume
    });
  }
  syncNowPlayingFromMusicState();
}

async function initDatabase() {
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) throw new Error("bdd indisponible");
    const data = await response.json();
    if (!data.updatedAt) {
      save();
      return;
    }
    applyDatabaseSnapshot(data);
    save();
  } catch {
    save();
  }
}

function syncDatabaseFile(snapshot) {
  if (!window.location.protocol.startsWith("http")) return;
  fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot)
  }).catch(() => {});
}

function save() {
  const snapshot = databaseSnapshot();
  localStorage.setItem("emu_notes", state.notes);
  localStorage.setItem("emu_messages", JSON.stringify(state.messages));
  localStorage.setItem("emu_conversations", JSON.stringify(state.conversations));
  localStorage.setItem("emu_auto_reply", JSON.stringify(state.autoReply));
  localStorage.setItem("emu_photos", JSON.stringify(state.photos));
  localStorage.setItem("emu_last_apps", JSON.stringify(state.lastApps));
  localStorage.setItem("emu_settings", JSON.stringify(state.settings));
  localStorage.setItem("emu_notifications", JSON.stringify(state.notifications));
  localStorage.setItem("emu_clock", JSON.stringify(state.clock));
  localStorage.setItem("emu_racing", JSON.stringify(state.racing));
  localStorage.setItem("emu_camera", JSON.stringify(state.camera));
  localStorage.setItem("emu_home_layout", JSON.stringify(state.homeLayout));
  localStorage.setItem("emu_app_store", JSON.stringify(state.appStore));
  localStorage.setItem("emu_music_state", JSON.stringify(state.musicState));
  localStorage.setItem("emu_open_apps", JSON.stringify(state.openApps));
  localStorage.setItem("emu_phone_tab", state.phoneTab);
  localStorage.setItem("emu_bdd", JSON.stringify(snapshot));
  syncDatabaseFile(snapshot);
}

function applySystemState() {
  const brightness = Math.max(45, Math.min(115, state.brightness)) / 100;
  screen.style.filter = `brightness(${brightness})`;
  screen.classList.toggle("dark-system", Boolean(state.settings.darkMode));
  applyWallpaper();
  const network = state.settings.airplane
    ? "Avion"
    : `${state.settings.wifi ? "Wi-Fi" : ""}${state.settings.cellular ? "  5G" : ""}`.trim() || "Hors ligne";
  const focus = state.settings.focus ? `  ${state.settings.focusMode || "Focus"}` : "";
  const statusIcons = document.querySelector(".status-icons");
  if (statusIcons) statusIcons.textContent = `${network}${focus}  100%`;
}

function applyWallpaper() {
  wallpaper.style.backgroundImage = state.settings.wallpaperUrl
    ? `url("${state.settings.wallpaperUrl}")`
    : wallpaperBackground(state.settings.wallpaper);
  wallpaper.style.backgroundSize = state.settings.wallpaperFit || "cover";
  wallpaper.style.backgroundPosition = "center";
  wallpaper.style.backgroundRepeat = "no-repeat";
}

function wallpaperBackground(name) {
  const presets = {
    "iOS Blue": "radial-gradient(circle at 28% 18%, rgba(63,145,255,.62), transparent 32%), radial-gradient(circle at 78% 24%, rgba(179,91,255,.46), transparent 31%), linear-gradient(160deg, #071122, #10113a 46%, #24113e 72%, #070914)",
    "Default": "url(\"background-defaut.png\")",
    "iOS Purple": "radial-gradient(circle at 26% 18%, rgba(196,132,252,.58), transparent 34%), radial-gradient(circle at 74% 72%, rgba(244,114,182,.30), transparent 32%), linear-gradient(160deg, #10091f, #251044 56%, #090912)",
    "iOS Dark": "radial-gradient(circle at 30% 20%, rgba(59,130,246,.24), transparent 32%), radial-gradient(circle at 72% 78%, rgba(124,58,237,.18), transparent 30%), linear-gradient(160deg, #020617, #0f172a 55%, #050816)",
    "iOS Light": "radial-gradient(circle at 28% 20%, rgba(125,211,252,.56), transparent 34%), radial-gradient(circle at 75% 70%, rgba(244,114,182,.24), transparent 32%), linear-gradient(160deg, #dbeafe, #f5f3ff 54%, #fdf2f8)",
    "VisionOS": "radial-gradient(circle at 22% 18%, rgba(255,255,255,.72), transparent 30%), radial-gradient(circle at 72% 24%, rgba(125,211,252,.42), transparent 34%), radial-gradient(circle at 48% 82%, rgba(216,180,254,.38), transparent 34%), linear-gradient(160deg, #b8d8ff, #f6f0ff 52%, #d9f4ff)"
  };
  return presets[name] || presets["Default"];
}

function setMusicTrack(index) {
  const numeric = Number(index);
  const requested = Number.isFinite(numeric)
    ? musicTracks[(numeric + musicTracks.length) % musicTracks.length]
    : musicTracks.find(track => track.id === index);
  const track = requested || musicTracks[0];
  state.musicState.currentTrack = track.id;
  state.musicState.duration = track.duration;
  state.musicIndex = musicTracks.findIndex(item => item.id === track.id);
  syncNowPlayingFromMusicState();
  save();
}

function tickClock() {
  const now = new Date();
  statusTime.textContent = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  applySystemState();
  const lockClock = document.querySelector("#lock-clock");
  const lockDate = document.querySelector("#lock-date");
  if (lockClock) lockClock.textContent = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (lockDate) {
    lockDate.textContent = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }
  if (callState.active && callState.status === "connected") {
    if (typeof dynamicIslandRender === "function" && dynamicIslandState.currentActivity?.type === "call") dynamicIslandRender();
    const activeDuration = document.querySelector("#active-call-duration");
    if (activeDuration && typeof formatCallDuration === "function") {
      activeDuration.textContent = formatCallDuration(Date.now() - callState.startedAt);
    }
  }
}

