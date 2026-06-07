function doCalc(key) {
  if (key === "AC") state.calc = "";
  else if (key === "DEL") state.calc = state.calc.slice(0, -1);
  else if (key === "+/-") state.calc = state.calc.startsWith("-") ? state.calc.slice(1) : "-" + state.calc;
  else if (key === "%") state.calc = String(Number(state.calc || "0") / 100);
  else if (key === "=") {
    try {
      state.calc = String(Function(`"use strict"; return (${state.calc || "0"})`)());
    } catch {
      state.calc = "Erreur";
    }
  } else {
    if (state.calc === "Erreur") state.calc = "";
    state.calc += key;
  }
  openApp("calculator");
}

function updateIsland(label = "NOVA") {
  if (label === "Musique") {
    musicShowDynamicIsland();
    return;
  }
  dynamicIslandStart({
    type: label === "Musique" ? "music" : label === "Appel" ? "call" : "notification",
    title: label === "Musique" ? nowPlaying.title : label,
    body: label === "Musique" ? nowPlaying.artist : "",
    icon: label.slice(0, 2),
    color: label === "Appel" ? "#30d158" : "#0a84ff",
    duration: label === "Musique" ? 3600 : 2800
  });
}

function dynamicIslandStart(activity) {
  const normalized = {
    id: `${Date.now()}-${Math.random()}`,
    type: "notification",
    title: "Notification",
    body: "",
    icon: "N",
    color: "#0a84ff",
    duration: 3000,
    live: false,
    ...activity
  };
  const current = dynamicIslandState.currentActivity;
  const priority = dynamicIslandPriority(normalized);
  const currentPriority = current ? dynamicIslandPriority(current) : -1;

  if (current && dynamicIslandState.locked && priority < currentPriority) {
    dynamicIslandState.queue.push(normalized);
    return;
  }
  if (current && priority < currentPriority) {
    dynamicIslandState.queue.push(normalized);
    return;
  }

  dynamicIslandState.currentActivity = normalized;
  dynamicIslandState.mode = "expanded";
  dynamicIslandState.expanded = true;
  dynamicIslandRender();
  dynamicIslandScheduleCollapse(normalized);
}

function dynamicIslandPriority(activity) {
  return dynamicIslandState.priorities[activity.type] ?? dynamicIslandState.priorities.notification;
}

function dynamicIslandScheduleCollapse(activity) {
  clearTimeout(dynamicIslandState.timer);
  if (activity.type === "call") {
    dynamicIslandState.locked = true;
    return;
  }
  dynamicIslandState.locked = false;
  dynamicIslandState.timer = setTimeout(() => {
    if (dynamicIslandState.currentActivity?.id !== activity.id) return;
    if (activity.live || activity.type === "music") dynamicIslandCompactLive(activity);
    else dynamicIslandReset();
  }, activity.duration);
}

function dynamicIslandCompactLive(activity = dynamicIslandState.currentActivity) {
  dynamicIslandState.currentActivity = activity;
  dynamicIslandState.mode = "compact";
  dynamicIslandState.expanded = false;
  dynamicIslandRender();
}

function dynamicIslandOpenFull() {
  if (!dynamicIslandState.currentActivity) {
    musicShowDynamicIsland();
  }
  dynamicIslandState.mode = dynamicIslandState.mode === "full" ? "compact" : "full";
  dynamicIslandState.expanded = dynamicIslandState.mode !== "compact";
  clearTimeout(dynamicIslandState.timer);
  dynamicIslandRender();
}

function dynamicIslandCloseFull() {
  if (dynamicIslandState.mode === "full") {
    const activity = dynamicIslandState.currentActivity;
    if (activity?.live || activity?.type === "music" || activity?.type === "call") dynamicIslandCompactLive(activity);
    else dynamicIslandReset();
  }
}

function dynamicIslandEnd(type = null) {
  if (!type || dynamicIslandState.currentActivity?.type === type) dynamicIslandReset();
}

function dynamicIslandReset() {
  clearTimeout(dynamicIslandState.timer);
  dynamicIslandState.mode = "compact";
  dynamicIslandState.currentActivity = null;
  dynamicIslandState.expanded = false;
  dynamicIslandState.locked = false;
  dynamicIslandRender();
  dynamicIslandFlushQueue();
}

function dynamicIslandFlushQueue() {
  if (!dynamicIslandState.queue.length || dynamicIslandState.currentActivity) return;
  const nextIndex = dynamicIslandState.queue
    .map((activity, index) => ({ activity, index, priority: dynamicIslandPriority(activity) }))
    .sort((a, b) => b.priority - a.priority)[0].index;
  const [next] = dynamicIslandState.queue.splice(nextIndex, 1);
  setTimeout(() => dynamicIslandStart(next), 180);
}

function dynamicIslandRender() {
  const activity = dynamicIslandState.currentActivity;
  island.className = "dynamic-island";
  island.classList.add(`island-${dynamicIslandState.mode}`);

  try {
    if (!activity) {
      island.innerHTML = `<span class="camera-dot"></span><span class="island-live-min"></span>`;
      return;
    }
    if (dynamicIslandState.mode === "compact") island.innerHTML = islandCompact(activity);
    if (dynamicIslandState.mode === "expanded") island.innerHTML = islandExpanded(activity);
    if (dynamicIslandState.mode === "full") island.innerHTML = islandFull(activity);
  } catch {
    dynamicIslandState.currentActivity = null;
    island.innerHTML = `<span class="camera-dot"></span>`;
  }
}

function islandCompact(activity) {
  if (activity.type === "camera") {
    return `<span class="island-compact-dot camera-recording">●</span><span class="island-call-time">${escapeHtml(activity.body || "00:00")}</span>`;
  }
  if (activity.type === "racing") {
    return `<span class="island-compact-dot racing">🏎</span><span class="island-call-time">${escapeHtml(String(Math.floor(state.racing.score || 0)))}</span>`;
  }
  if (activity.type === "music") {
    const track = currentMusicTrack();
    return `<span class="island-compact-dot island-album" style="background:${escapeHtml(track.color)}">${escapeHtml(track.cover)}</span><span class="island-eq compact ${state.musicState.isPlaying ? "playing" : ""}"><i></i><i></i><i></i></span>`;
  }
  if (activity.type === "call") {
    const duration = activity.startedAt ? formatCallDuration(Date.now() - activity.startedAt) : "appel";
    return `<span class="island-compact-dot call">☎</span><span class="island-call-time">${escapeHtml(duration)}</span>`;
  }
  if (activity.type === "timer" || activity.type === "stopwatch") {
    return `<span class="island-compact-dot clock">⌚</span><span class="island-call-time">${escapeHtml(activity.body || "")}</span>`;
  }
  return `<span class="camera-dot"></span><span class="island-live-min"></span>`;
}

function islandExpanded(activity) {
  if (activity.type === "camera") {
    return `
      <span class="island-app-icon camera-recording">●</span>
      <span class="island-copy"><strong>Enregistrement</strong><small>${escapeHtml(activity.body || "00:00")}</small></span>
    `;
  }
  if (activity.type === "racing") {
    return `
      <span class="island-app-icon" style="background:#ff375f">🏎</span>
      <span class="island-copy"><strong>FRITIX Racing</strong><small>Score : ${Math.floor(state.racing.score || 0)}</small></span>
    `;
  }
  if (activity.type === "music") {
    const track = currentMusicTrack();
    return `
      <span class="island-album" style="background:${escapeHtml(track.color)}">${escapeHtml(track.cover)}</span>
      <span class="island-copy"><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)}</small></span>
      <button class="island-music-toggle" data-action="music-toggle">${state.musicState.isPlaying ? "II" : ">"}</button>
    `;
  }
  if (activity.type === "call") {
    return `
      <span class="island-person">${escapeHtml(activity.icon || "L")}</span>
      <span class="island-copy"><strong>${escapeHtml(activity.title || "Appel")}</strong><small>${escapeHtml(activity.body || "Appel entrant")}</small></span>
      <span class="island-call-actions"><button data-action="call-decline">×</button><button data-action="call-accept">✓</button></span>
    `;
  }
  if (activity.type === "timer" || activity.type === "stopwatch") {
    return `
      <span class="island-app-icon" style="background:${escapeHtml(activity.color || "#ff9f0a")}">${escapeHtml(activity.icon || "⌚")}</span>
      <span class="island-copy"><strong>${escapeHtml(activity.title)}</strong><small>${escapeHtml(activity.body || "")}</small></span>
    `;
  }
  return `
    <span class="island-app-icon" style="background:${escapeHtml(activity.color || "#0a84ff")}">${escapeHtml(activity.icon || "N")}</span>
    <span class="island-copy"><strong>${escapeHtml(activity.title)}</strong><small>${escapeHtml(activity.body || "")}</small></span>
  `;
}

function islandFull(activity) {
  if (activity.type === "camera") return islandCameraFull(activity);
  if (activity.type === "racing") return islandRacingFull();
  if (activity.type === "music") return islandMusicFull();
  if (activity.type === "call") return islandCallFull(activity);
  if (activity.type === "timer" || activity.type === "stopwatch") return islandClockFull(activity);
  return islandNotificationFull(activity);
}

function islandCameraFull(activity) {
  return `
    <div class="island-panel-content island-alert-panel">
      <span class="island-app-icon camera-recording">●</span>
      <span class="island-panel-track"><strong>Enregistrement video</strong><small>${escapeHtml(activity.body || "00:00")}</small></span>
      <span class="island-panel-actions">
        <button data-action="camera-island-open">Camera</button>
        <button data-action="camera-video-stop">Stop</button>
      </span>
    </div>
  `;
}

function islandRacingFull() {
  return `
    <div class="island-panel-content island-alert-panel">
      <span class="island-app-icon" style="background:#ff375f">🏎</span>
      <span class="island-panel-track"><strong>FRITIX Racing</strong><small>Score : ${Math.floor(state.racing.score || 0)}</small></span>
      <span class="island-panel-actions">
        <button data-app="racing">Retour</button>
        <button data-action="island-close">Fermer</button>
      </span>
    </div>
  `;
}

function islandClockFull(activity) {
  return `
    <div class="island-panel-content island-alert-panel">
      <span class="island-app-icon" style="background:${escapeHtml(activity.color || "#ff9f0a")}">${escapeHtml(activity.icon || "⌚")}</span>
      <span class="island-panel-track"><strong>${escapeHtml(activity.title || "Horloge")}</strong><small>${escapeHtml(activity.body || "")}</small></span>
      <span class="island-panel-actions">
        <button data-action="clock-island-open">Ouvrir</button>
        <button data-action="island-close">Fermer</button>
      </span>
    </div>
  `;
}

function islandMusicFull() {
  const track = currentMusicTrack();
  const progress = musicProgressPercent();
  return `
    <div class="island-panel-content island-music-panel">
      <span class="island-panel-cover" style="background:${escapeHtml(track.color)}">${escapeHtml(track.cover)}</span>
      <span class="island-panel-track"><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)}</small><i><b style="width:${progress}%"></b></i></span>
      <span class="island-panel-controls">
        <button data-action="music-prev">&lt;</button>
        <button data-action="music-toggle">${state.musicState.isPlaying ? "II" : ">"}</button>
        <button data-action="music-next">&gt;</button>
      </span>
    </div>
  `;
}

function islandCallFull(activity) {
  const subtitle = activity.startedAt ? formatCallDuration(Date.now() - activity.startedAt) : (activity.body || "Appel entrant");
  return `
    <div class="island-panel-content island-call-panel">
      <span class="island-person large">${escapeHtml(activity.icon || "L")}</span>
      <span class="island-panel-track"><strong>${escapeHtml(activity.title || "Lucas")}</strong><small>${escapeHtml(subtitle)}</small></span>
      <span class="island-panel-controls">
        <button class="decline" data-action="call-decline">${activity.startedAt ? "Raccrocher" : "Refuser"}</button>
        <button class="accept" data-action="call-accept">${activity.startedAt ? "Retour" : "Repondre"}</button>
      </span>
    </div>
  `;
}

function islandNotificationFull(activity) {
  return `
    <div class="island-panel-content island-alert-panel">
      <span class="island-app-icon" style="background:${escapeHtml(activity.color || "#0a84ff")}">${escapeHtml(activity.icon || "N")}</span>
      <span class="island-panel-track"><strong>${escapeHtml(activity.title)}</strong><small>${escapeHtml(activity.body || "Nouvelle notification")}</small></span>
      <span class="island-panel-actions">
        <button data-app="${escapeHtml(activity.appId || "")}">Ouvrir</button>
        <button data-action="island-close">Fermer</button>
      </span>
    </div>
  `;
}

function notifyViaIsland(item) {
  dynamicIslandStart({
    type: "notification",
    app: item.app,
    appId: item.appId,
    icon: item.icon,
    color: item.color,
    title: item.title,
    body: item.body,
    duration: 3000
  });
}

function normalizeCameraState() {
  state.camera = { ...defaultCameraState(), ...(state.camera || {}) };
  state.camera.photos = Array.isArray(state.camera.photos) ? state.camera.photos : [];
  state.camera.videos = Array.isArray(state.camera.videos) ? state.camera.videos : [];
  if (!["slow", "video", "photo", "portrait", "pano"].includes(state.camera.mode)) state.camera.mode = "photo";
  return state.camera;
}

function cameraGradient() {
  const palettes = [
    "linear-gradient(145deg, #0f172a, #2563eb 52%, #f472b6)",
    "linear-gradient(145deg, #06221d, #14b8a6 48%, #fde68a)",
    "linear-gradient(145deg, #111827, #7c3aed 48%, #fb7185)",
    "linear-gradient(145deg, #020617, #64748b 45%, #e0f2fe)",
    "linear-gradient(145deg, #1f2937, #f97316 48%, #fef3c7)"
  ];
  return palettes[Math.floor(Math.random() * palettes.length)];
}

function formatCameraDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds || 0)));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function renderCameraCurrent() {
  if (state.currentApp === "camera") renderCamera(document.querySelector("#app-content"));
}

function setCameraMode(mode) {
  const camera = normalizeCameraState();
  if (!["slow", "video", "photo", "portrait", "pano"].includes(mode)) return;
  camera.mode = mode;
  camera.galleryOpen = false;
  save();
  renderCameraCurrent();
}

function toggleCameraFlash() {
  const camera = normalizeCameraState();
  camera.flash = !camera.flash;
  save();
  renderCameraCurrent();
}

function toggleCameraLive() {
  const camera = normalizeCameraState();
  camera.live = !camera.live;
  save();
  renderCameraCurrent();
}

function switchCameraFacing() {
  const camera = normalizeCameraState();
  camera.facing = camera.facing === "front" ? "back" : "front";
  haptic("tap");
  save();
  renderCameraCurrent();
}

function captureCameraPhoto() {
  const camera = normalizeCameraState();
  const photo = {
    id: `photo-${Date.now()}`,
    color: cameraGradient(),
    createdAt: new Date().toISOString(),
    mode: camera.mode,
    kind: "photo"
  };
  camera.photos.unshift(photo);
  state.photos.unshift(photo.color);
  camera.captureFlash = true;
  haptic("tap");
  save();
  renderCameraCurrent();
  setTimeout(() => {
    camera.captureFlash = false;
    save();
    renderCameraCurrent();
  }, 180);
  dynamicIslandStart({
    type: "notification",
    appId: "camera",
    icon: "◉",
    color: "#111827",
    title: "Photo",
    body: "Capture enregistree",
    duration: 1400
  });
}

function startCameraVideo() {
  const camera = normalizeCameraState();
  camera.mode = "video";
  camera.recording = true;
  camera.recordingStartedAt = Date.now();
  camera.recordingElapsed = 0;
  haptic("message");
  save();
  renderCameraCurrent();
  startCameraRecordingTimer();
  cameraIslandUpdate(true);
}

function stopCameraVideo(silent = false) {
  const camera = normalizeCameraState();
  if (!camera.recording) return;
  camera.recordingElapsed = Math.max(1, Math.floor((Date.now() - Number(camera.recordingStartedAt || Date.now())) / 1000));
  camera.videos.unshift({
    id: `video-${Date.now()}`,
    color: cameraGradient(),
    createdAt: new Date().toISOString(),
    duration: camera.recordingElapsed,
    kind: "video"
  });
  camera.recording = false;
  camera.recordingStartedAt = null;
  clearInterval(cameraRecordingTimer);
  cameraRecordingTimer = null;
  removeDynamicIslandActivity("camera");
  if (!silent) haptic("tap");
  save();
  renderCameraCurrent();
}

function toggleCameraVideo() {
  if (normalizeCameraState().recording) stopCameraVideo();
  else startCameraVideo();
}

function startCameraRecordingTimer() {
  clearInterval(cameraRecordingTimer);
  cameraRecordingTimer = setInterval(() => {
    const camera = normalizeCameraState();
    if (!camera.recording) {
      clearInterval(cameraRecordingTimer);
      cameraRecordingTimer = null;
      return;
    }
    camera.recordingElapsed = Math.floor((Date.now() - Number(camera.recordingStartedAt || Date.now())) / 1000);
    const time = document.querySelector("#camera-rec-time");
    if (time) time.textContent = formatCameraDuration(camera.recordingElapsed);
    cameraIslandUpdate(false);
  }, 500);
}

function cameraIslandUpdate(expanded = false) {
  const camera = normalizeCameraState();
  if (!camera.recording) return;
  const activity = {
    type: "camera",
    appId: "camera",
    title: "Enregistrement",
    body: formatCameraDuration(camera.recordingElapsed || 0),
    icon: "●",
    color: "#ff3b30",
    duration: 2600,
    live: true
  };
  if (dynamicIslandState.currentActivity?.type === "camera") {
    dynamicIslandState.currentActivity = { ...dynamicIslandState.currentActivity, ...activity };
    if (expanded) {
      dynamicIslandState.mode = "expanded";
      dynamicIslandState.expanded = true;
    }
    dynamicIslandRender();
  } else {
    dynamicIslandStart(activity);
  }
}

function openCameraGallery() {
  normalizeCameraState().galleryOpen = true;
  save();
  renderCameraCurrent();
}

function closeCameraGallery() {
  normalizeCameraState().galleryOpen = false;
  save();
  renderCameraCurrent();
}

function allowCameraAccess() {
  normalizeCameraState().permission = true;
  save();
  renderCameraCurrent();
}

function normalizeConversationId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `conv-${Date.now()}`;
}

function getOrCreateConversation(recipient) {
  const clean = recipient.trim();
  const existing = state.conversations.find(item =>
    item.contactName.toLowerCase() === clean.toLowerCase() ||
    String(item.contactNumber || "").replace(/\s/g, "") === clean.replace(/\s/g, "")
  );
  if (existing) return existing;
  const conversation = {
    id: normalizeConversationId(clean),
    contactId: normalizeConversationId(clean),
    contactName: clean,
    contactNumber: /\d/.test(clean) ? clean : "",
    contactAvatar: clean[0]?.toUpperCase() || "?",
    lastMessage: "",
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    pinned: false,
    muted: false,
    messages: []
  };
  state.conversations.unshift(conversation);
  return conversation;
}

function addConversationMessage(conversationId, sender, content, status = "delivered") {
  const conversation = findConversation(conversationId);
  if (!conversation || !content.trim()) return null;
  const message = {
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sender,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    status
  };
  conversation.messages.push(message);
  conversation.lastMessage = message.content;
  conversation.lastMessageAt = message.createdAt;
  if (sender === "them") conversation.unreadCount = state.activeConversationId === conversation.id ? 0 : (conversation.unreadCount || 0) + 1;
  state.conversations = sortedConversations();
  save();
  return message;
}

function sendMessageToConversation(conversationId, content) {
  const message = addConversationMessage(conversationId, "me", content, "delivered");
  if (!message) return;
  state.composerDraft = "";
  renderConversation(document.querySelector("#app-content"), conversationId);
  if (state.autoReply) {
    setTimeout(() => receiveMessage(conversationId, "Ok je regarde ca."), 1200 + Math.floor(Math.random() * 800));
  }
}

function sendNewConversationMessage(recipient, content) {
  if (!recipient.trim() || !content.trim()) return;
  const conversation = getOrCreateConversation(recipient);
  state.composerRecipient = "";
  state.composerDraft = "";
  sendMessageToConversation(conversation.id, content);
}

function receiveMessage(conversationId, content) {
  const message = addConversationMessage(conversationId, "them", content, "delivered");
  const conversation = findConversation(conversationId);
  if (!message || !conversation) return;
  const item = {
    id: `msg-notif-${message.id}`,
    app: "Messages",
    appId: "messages",
    icon: conversation.contactAvatar || "M",
    color: "#30d158",
    title: conversation.contactName,
    body: message.content,
    time: "maintenant",
    unread: true,
    kind: "message",
    conversationId
  };
  if (!conversation.muted) {
    state.notifications.unshift(item);
    notifyViaIsland(item);
    haptic("message");
  }
  save();
  if (state.currentApp === "messages" && state.activeConversationId === conversationId) renderConversation(document.querySelector("#app-content"), conversationId);
}

function markConversationNotificationsRead(conversationId) {
  state.notifications.forEach(item => {
    if (item.conversationId === conversationId) item.unread = false;
  });
}

let clockRuntimeTimer = null;

function normalizeClockState() {
  state.clock = { ...defaultClockState(), ...(state.clock || {}) };
  state.clock.stopwatch = { ...defaultClockState().stopwatch, ...(state.clock.stopwatch || {}) };
  state.clock.timer = { ...defaultClockState().timer, ...(state.clock.timer || {}) };
  if (!Array.isArray(state.clock.alarms)) state.clock.alarms = defaultClockState().alarms;
}

function setClockTab(tab) {
  normalizeClockState();
  state.clock.tab = tab;
  state.clock.editingAlarmId = "";
  save();
  renderClock(document.querySelector("#app-content"));
}

function toggleAlarm(id) {
  const alarm = state.clock.alarms.find(item => item.id === id);
  if (!alarm) return;
  alarm.enabled = !alarm.enabled;
  save();
  renderClock(document.querySelector("#app-content"));
}

function addAlarm() {
  const alarm = {
    id: `alarm-${Date.now()}`,
    time: "07:00",
    label: "Alarme",
    repeat: "Jamais",
    sound: "Radar",
    vibration: "Standard",
    enabled: true
  };
  state.clock.alarms.unshift(alarm);
  state.clock.editingAlarmId = alarm.id;
  save();
  renderClock(document.querySelector("#app-content"));
}

function saveEditedAlarm() {
  const alarm = state.clock.alarms.find(item => item.id === state.clock.editingAlarmId);
  if (!alarm) return;
  alarm.time = document.querySelector("#alarm-edit-time")?.value || alarm.time;
  alarm.label = document.querySelector("#alarm-edit-label")?.value.trim() || "Alarme";
  alarm.repeat = document.querySelector("#alarm-edit-repeat")?.value.trim() || "Jamais";
  alarm.sound = document.querySelector("#alarm-edit-sound")?.value.trim() || "Radar";
  alarm.vibration = document.querySelector("#alarm-edit-vibration")?.value.trim() || "Standard";
  state.clock.editingAlarmId = "";
  save();
  renderClock(document.querySelector("#app-content"));
}

function deleteEditedAlarm() {
  state.clock.alarms = state.clock.alarms.filter(item => item.id !== state.clock.editingAlarmId);
  state.clock.editingAlarmId = "";
  save();
  renderClock(document.querySelector("#app-content"));
}

function toggleStopwatch() {
  const watch = state.clock.stopwatch;
  if (watch.running) {
    watch.elapsed = clockStopwatchMs();
    watch.running = false;
    watch.startedAt = null;
    dynamicIslandEnd("stopwatch");
  } else {
    watch.running = true;
    watch.startedAt = Date.now();
    startClockRuntime();
    updateClockIsland("stopwatch");
  }
  save();
  renderClock(document.querySelector("#app-content"));
}

function lapStopwatch() {
  if (!state.clock.stopwatch.running) return;
  state.clock.stopwatch.laps.unshift(clockStopwatchMs());
  save();
  renderClock(document.querySelector("#app-content"));
}

function resetStopwatch() {
  state.clock.stopwatch.elapsed = 0;
  state.clock.stopwatch.startedAt = null;
  state.clock.stopwatch.running = false;
  state.clock.stopwatch.laps = [];
  dynamicIslandEnd("stopwatch");
  save();
  renderClock(document.querySelector("#app-content"));
}

function readTimerPicker() {
  const hours = Math.max(0, Math.min(23, Number(document.querySelector("#timer-hours")?.value || 0)));
  const minutes = Math.max(0, Math.min(59, Number(document.querySelector("#timer-minutes")?.value || 0)));
  const seconds = Math.max(0, Math.min(59, Number(document.querySelector("#timer-seconds")?.value || 0)));
  return Math.max(1, hours * 3600 + minutes * 60 + seconds);
}

function toggleTimer() {
  const timer = state.clock.timer;
  if (timer.running) {
    timer.remaining = clockTimerRemaining();
    timer.running = false;
    timer.endsAt = null;
    dynamicIslandEnd("timer");
  } else {
    if (!timer.remaining || timer.remaining <= 0) timer.remaining = readTimerPicker();
    timer.duration = readTimerPicker();
    timer.remaining = timer.remaining || timer.duration;
    timer.running = true;
    timer.startedAt = Date.now();
    timer.endsAt = Date.now() + timer.remaining * 1000;
    startClockRuntime();
    updateClockIsland("timer");
  }
  save();
  renderClock(document.querySelector("#app-content"));
}

function cancelTimer() {
  const duration = readTimerPicker();
  state.clock.timer.running = false;
  state.clock.timer.duration = duration;
  state.clock.timer.remaining = duration;
  state.clock.timer.startedAt = null;
  state.clock.timer.endsAt = null;
  dynamicIslandEnd("timer");
  save();
  renderClock(document.querySelector("#app-content"));
}

function updateTimerDurationFromPicker() {
  if (state.clock.timer.running) return;
  const duration = readTimerPicker();
  state.clock.timer.duration = duration;
  state.clock.timer.remaining = duration;
  save();
  const display = document.querySelector("#timer-display");
  if (display) display.textContent = formatTimer(duration);
}

function startClockRuntime() {
  if (clockRuntimeTimer) return;
  clockRuntimeTimer = setInterval(tickClockRuntime, 250);
}

function tickClockRuntime() {
  normalizeClockState();
  if (state.clock.stopwatch.running) {
    const display = document.querySelector("#stopwatch-display");
    if (display) display.textContent = formatStopwatch(clockStopwatchMs());
    updateClockIsland("stopwatch", false);
  }
  if (state.clock.timer.running) {
    const remaining = clockTimerRemaining();
    state.clock.timer.remaining = remaining;
    const display = document.querySelector("#timer-display");
    if (display) display.textContent = formatTimer(remaining);
    updateClockIsland("timer", false);
    if (remaining <= 0) finishTimer();
  }
  if (!state.clock.stopwatch.running && !state.clock.timer.running) {
    clearInterval(clockRuntimeTimer);
    clockRuntimeTimer = null;
  }
}

function updateClockIsland(type, start = true) {
  const title = type === "timer" ? "Minuteur" : "Chronometre";
  const body = type === "timer" ? formatTimer(clockTimerRemaining()) : formatStopwatch(clockStopwatchMs());
  const activity = { type, appId: "clock", icon: "⌚", color: "#ff9f0a", title, body, live: true, duration: 2200 };
  if (start || dynamicIslandState.currentActivity?.type !== type) dynamicIslandStart(activity);
  else {
    dynamicIslandState.currentActivity = { ...dynamicIslandState.currentActivity, ...activity };
    dynamicIslandRender();
  }
}

function finishTimer() {
  state.clock.timer.running = false;
  state.clock.timer.remaining = 0;
  state.clock.timer.endsAt = null;
  const item = {
    id: `timer-${Date.now()}`,
    app: "Horloge",
    appId: "clock",
    icon: "⌚",
    color: "#ff9f0a",
    title: "Minuteur termine",
    body: "Minuteur termine",
    time: "maintenant",
    unread: true,
    kind: "timer"
  };
  state.notifications.unshift(item);
  dynamicIslandStart({ type: "timer", appId: "clock", icon: "⌚", color: "#ff9f0a", title: "Minuteur termine", body: "00:00:00", duration: 3500 });
  haptic("message");
  showHardwareOverlay("Horloge", "Minuteur termine");
  save();
  if (state.currentApp === "clock") renderClock(document.querySelector("#app-content"));
}

function requestRemoveHomeApp(id) {
  const app = apps.find(item => item.id === id);
  if (!app) return;
  state.homeLayout.confirm = { type: "app", id, name: app.name };
  renderHome();
}

function requestRemoveHomeWidget(id) {
  const widget = state.homeLayout.widgets.find(item => item.id === id);
  if (!widget) return;
  state.homeLayout.confirm = { type: "widget", id, name: widgetName(widget.type) };
  renderHome();
}

function confirmRemoveHomeItem() {
  const confirm = state.homeLayout.confirm;
  if (!confirm) return;
  if (confirm.type === "app") {
    if (!state.homeLayout.hiddenApps.includes(confirm.id)) state.homeLayout.hiddenApps.push(confirm.id);
    state.homeLayout.dock = state.homeLayout.dock.filter(id => id !== confirm.id);
  }
  if (confirm.type === "widget") {
    state.homeLayout.widgets = state.homeLayout.widgets.filter(widget => widget.id !== confirm.id);
  }
  state.homeLayout.confirm = null;
  save();
  renderHome();
}

function addAppToHome(id) {
  if (!apps.some(app => app.id === id)) return;
  state.homeLayout.hiddenApps = state.homeLayout.hiddenApps.filter(appId => appId !== id);
  if (!state.homeLayout.appOrder.includes(id)) state.homeLayout.appOrder.push(id);
  state.homeLayout.page = "home";
  save();
  renderHome();
}

function addHomeWidget(type, size = "small") {
  state.homeLayout.widgets.push({ id: `widget-${type}-${Date.now()}`, type, size });
  state.homeLayout.widgetGalleryOpen = false;
  state.homeLayout.page = "home";
  save();
  renderHome();
}

function cycleHomeWidgetSize(id) {
  const widget = state.homeLayout.widgets.find(item => item.id === id);
  if (!widget) return;
  const sizes = ["small", "medium", "large"];
  widget.size = sizes[(sizes.indexOf(widget.size) + 1) % sizes.length] || "small";
  save();
  renderHome();
}

function moveHomeWidget(id, beforeId = "") {
  const current = state.homeLayout.widgets.find(item => item.id === id);
  if (!current) return;
  state.homeLayout.widgets = state.homeLayout.widgets.filter(item => item.id !== id);
  const beforeIndex = state.homeLayout.widgets.findIndex(item => item.id === beforeId);
  if (beforeIndex >= 0) state.homeLayout.widgets.splice(beforeIndex, 0, current);
  else state.homeLayout.widgets.push(current);
  save();
  renderHome();
}

function moveHomeApp(id, zone = "home", beforeId = "") {
  if (!apps.some(app => app.id === id)) return;
  state.homeLayout.hiddenApps = state.homeLayout.hiddenApps.filter(appId => appId !== id);
  state.homeLayout.dock = state.homeLayout.dock.filter(appId => appId !== id);
  state.homeLayout.appOrder = state.homeLayout.appOrder.filter(appId => appId !== id);
  if (zone === "dock") {
    const beforeIndex = beforeId ? state.homeLayout.dock.indexOf(beforeId) : -1;
    if (beforeIndex >= 0) state.homeLayout.dock.splice(beforeIndex, 0, id);
    else state.homeLayout.dock.push(id);
    const overflow = state.homeLayout.dock.splice(4);
    overflow.forEach(appId => {
      if (appId !== id && !state.homeLayout.appOrder.includes(appId)) state.homeLayout.appOrder.push(appId);
    });
  } else {
    const beforeIndex = beforeId ? state.homeLayout.appOrder.indexOf(beforeId) : -1;
    if (beforeIndex >= 0) state.homeLayout.appOrder.splice(beforeIndex, 0, id);
    else state.homeLayout.appOrder.push(id);
  }
  save();
  renderHome();
}

function setHomeIconTheme(theme) {
  if (!["light", "dark", "auto", "tinted"].includes(theme)) return;
  state.homeLayout.iconTheme = theme;
  save();
  renderHome();
}

function setHomeIconTint(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color || "")) return;
  state.homeLayout.iconTint = color;
  state.homeLayout.iconTheme = "tinted";
  save();
  renderHome();
}

function setHomeIconSize(size) {
  if (!["small", "large"].includes(size)) return;
  state.homeLayout.iconSize = size;
  save();
  renderHome();
}

function setStoreTab(tab) {
  state.appStore.tab = tab || "today";
  state.appStore.selectedAppId = "";
  state.appStore.profileOpen = false;
  save();
  renderStore(document.querySelector("#app-content"));
}

function openStoreDetail(id) {
  state.appStore.selectedAppId = id || "";
  state.appStore.profileOpen = false;
  renderStore(document.querySelector("#app-content"));
}

function closeStoreDetail() {
  state.appStore.selectedAppId = "";
  state.appStore.profileOpen = false;
  renderStore(document.querySelector("#app-content"));
}

function openStoreProfile() {
  state.appStore.profileOpen = true;
  state.appStore.selectedAppId = "";
  renderStore(document.querySelector("#app-content"));
}

function ensureStoreSystemApp(id) {
  const catalogApp = storeCatalog().find(app => app.id === id);
  if (!catalogApp) return null;
  let systemApp = apps.find(app => app.id === id);
  if (!systemApp) {
    systemApp = { id, name: catalogApp.name, icon: storeInitial(catalogApp.name), color: catalogApp.color };
    apps.push(systemApp);
  }
  return systemApp;
}

function installStoreApp(id) {
  const app = storeCatalog().find(item => item.id === id);
  if (!app) return;
  if (state.appStore.installedApps.includes(id)) {
    openInstalledStoreApp(id);
    return;
  }
  state.appStore.downloads[id] = { status: "downloading", progress: 0 };
  save();
  renderStore(document.querySelector("#app-content"));
  const timer = setInterval(() => {
    const download = state.appStore.downloads[id];
    if (!download) {
      clearInterval(timer);
      return;
    }
    download.progress = Math.min(100, (download.progress || 0) + 18);
    if (download.progress >= 100) {
      clearInterval(timer);
      download.status = "installed";
      if (!state.appStore.installedApps.includes(id)) state.appStore.installedApps.push(id);
      state.appStore.recentDownloads = [id, ...state.appStore.recentDownloads.filter(item => item !== id)].slice(0, 8);
      ensureStoreSystemApp(id);
      save();
      showHardwareOverlay("App Store", `${app.name} installee`);
    }
    if (state.currentApp === "store") renderStore(document.querySelector("#app-content"));
  }, 260);
}

function updateStoreApp(id) {
  const app = storeCatalog().find(item => item.id === id);
  if (!app) return;
  state.appStore.downloads[id] = { status: "downloading", progress: 0 };
  save();
  renderStore(document.querySelector("#app-content"));
  const timer = setInterval(() => {
    const download = state.appStore.downloads[id];
    if (!download) {
      clearInterval(timer);
      return;
    }
    download.progress = Math.min(100, (download.progress || 0) + 20);
    if (download.progress >= 100) {
      clearInterval(timer);
      download.status = "installed";
      state.appStore.recentDownloads = [id, ...state.appStore.recentDownloads.filter(item => item !== id)].slice(0, 8);
      save();
      showHardwareOverlay("App Store", `${app.name} mise a jour`);
    }
    if (state.currentApp === "store") renderStore(document.querySelector("#app-content"));
  }, 240);
}

function openInstalledStoreApp(id) {
  ensureStoreSystemApp(id);
  openApp(id);
}

function addStoreAppToHome(id) {
  ensureStoreSystemApp(id);
  if (!state.appStore.installedApps.includes(id)) {
    installStoreApp(id);
    return;
  }
  addAppToHome(id);
  showHardwareOverlay("Accueil", "App ajoutee");
}

function uninstallStoreApp(id) {
  state.appStore.installedApps = state.appStore.installedApps.filter(item => item !== id);
  state.homeLayout.hiddenApps = state.homeLayout.hiddenApps.filter(item => item !== id);
  state.homeLayout.appOrder = state.homeLayout.appOrder.filter(item => item !== id);
  state.homeLayout.dock = state.homeLayout.dock.filter(item => item !== id);
  delete state.appStore.downloads[id];
  save();
  renderStore(document.querySelector("#app-content"));
}

function closeIslandNotification() {
  dynamicIslandReset();
}

function openIslandPanel() {
  dynamicIslandOpenFull();
}

function markAppOpen(appId) {
  const app = apps.find(item => item.id === appId);
  if (!app) return;
  const existing = state.openApps.find(item => item.id === appId);
  const entry = {
    id: appId,
    name: app.name,
    lastOpenedAt: Date.now(),
    snapshot: appSnapshotLabel(appId),
    isRunning: true
  };
  state.openApps = existing
    ? state.openApps.map(item => item.id === appId ? { ...item, ...entry } : item)
    : [entry, ...state.openApps];
  state.openApps = state.openApps
    .filter(item => apps.some(appItem => appItem.id === item.id))
    .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

function appSnapshotLabel(appId) {
  if (appId === "racing") return state.racing.status === "playing" ? `Score ${Math.floor(state.racing.score || 0)}` : "Jeu en pause";
  if (appId === "music") return state.musicState.isPlaying ? `${nowPlaying.title} en lecture` : "Bibliotheque musicale";
  if (appId === "messages") return state.activeConversationId ? "Conversation ouverte" : "Liste des conversations";
  if (appId === "phone") return callState.active ? "Appel actif" : "Telephone";
  if (appId === "clock") return state.clock.tab || "Horloge";
  if (appId === "store") return "App Store";
  return "App active";
}

function removeDynamicIslandActivity(appId) {
  dynamicIslandState.queue = dynamicIslandState.queue.filter(activity => activity.appId !== appId);
  if (dynamicIslandState.currentActivity?.appId === appId) dynamicIslandReset();
}

function stopMusic() {
  clearInterval(musicRuntimeTimer);
  state.musicState.isPlaying = false;
  state.musicState.currentTrack = null;
  state.musicState.currentTime = 0;
  state.musicState.playerOpen = false;
  nowPlaying.playing = false;
  removeDynamicIslandActivity("music");
  save();
}

function closeApp(appId, options = {}) {
  const force = options.force !== false;
  state.openApps = state.openApps.filter(item => item.id !== appId);
  if (appId === "music" && force) stopMusic();
  if (appId === "clock" && force) {
    removeDynamicIslandActivity("clock");
  }
  if (appId === "racing" && force) {
    stopRacingLoop();
    state.racing.status = "menu";
    state.racing.score = 0;
    state.racing.obstacles = [];
    removeDynamicIslandActivity("racing");
  }
  if (appId === "camera" && force) {
    stopCameraVideo(true);
    removeDynamicIslandActivity("camera");
  }
  if (appId === "phone" && force && callState.active) {
    endPhoneCall({ keepScreen: false });
  }
  if (dynamicIslandState.currentActivity?.appId === appId) removeDynamicIslandActivity(appId);
  if (state.currentApp === appId) {
    state.currentApp = null;
    renderHome();
  } else {
    save();
  }
}

let racingFrame = null;

function startRacingGame() {
  stopRacingLoop();
  state.racing.status = "playing";
  state.racing.score = 0;
  state.racing.lane = 1;
  state.racing.obstacles = [];
  state.racing.speed = 2.8;
  state.racing.spawnEvery = 980;
  state.racing.lastSpawn = performance.now();
  state.racing.lastTick = performance.now();
  state.racing.pausedByExit = false;
  save();
  racingIslandUpdate(true);
  renderRacing(document.querySelector("#app-content"));
}

function resumeRacingGame() {
  state.racing.status = "playing";
  state.racing.pausedByExit = false;
  state.racing.lastTick = performance.now();
  state.racing.lastSpawn = performance.now();
  save();
  racingIslandUpdate(true);
  renderRacing(document.querySelector("#app-content"));
}

function pauseRacing(byExit = false) {
  if (state.racing.status !== "playing") return;
  stopRacingLoop();
  state.racing.status = "paused";
  state.racing.pausedByExit = Boolean(byExit);
  save();
  racingIslandUpdate(false);
}

function stopRacingLoop() {
  if (racingFrame) cancelAnimationFrame(racingFrame);
  racingFrame = null;
}

function startRacingLoop() {
  stopRacingLoop();
  state.racing.lastTick = performance.now();
  racingFrame = requestAnimationFrame(racingTick);
}

function racingTick(now) {
  if (state.racing.status !== "playing") {
    stopRacingLoop();
    return;
  }
  const dt = Math.min(34, now - (state.racing.lastTick || now));
  state.racing.lastTick = now;
  state.racing.score = Number(state.racing.score || 0) + dt / 100;
  state.racing.speed = Math.min(8.4, 2.8 + state.racing.score / 380);
  state.racing.spawnEvery = Math.max(380, 980 - state.racing.score / 2);
  if (now - (state.racing.lastSpawn || 0) > state.racing.spawnEvery) {
    spawnRacingObstacle();
    state.racing.lastSpawn = now;
  }
  state.racing.obstacles = (state.racing.obstacles || [])
    .map(item => ({ ...item, y: item.y + state.racing.speed * (dt / 16.6) }))
    .filter(item => item.y < 620);
  if (racingHasCollision()) {
    gameOverRacing();
    return;
  }
  updateRacingDom();
  if (Math.floor(state.racing.score) % 20 === 0) racingIslandUpdate(false);
  racingFrame = requestAnimationFrame(racingTick);
}

function spawnRacingObstacle() {
  const types = ["car", "truck", "cone", "barrier"];
  const type = types[Math.floor(Math.random() * types.length)];
  state.racing.obstacles.push({
    id: `obs-${Date.now()}-${Math.random()}`,
    type,
    lane: Math.floor(Math.random() * 3),
    y: -80
  });
}

function racingHasCollision() {
  const road = document.querySelector("#racing-road");
  const roadHeight = road?.clientHeight || 620;
  const playerTop = roadHeight - 92 - 72 + 18;
  const playerBottom = roadHeight - 92 - 12;
  return (state.racing.obstacles || []).some(item => {
    if (item.lane !== state.racing.lane) return false;
    const obstacle = racingObstacleHitbox(item);
    return obstacle.bottom > playerTop && obstacle.top < playerBottom;
  });
}

function racingObstacleHitbox(item) {
  const boxes = {
    car: { top: 14, bottom: 58 },
    truck: { top: 14, bottom: 76 },
    cone: { top: 10, bottom: 40 },
    barrier: { top: 8, bottom: 28 }
  };
  const box = boxes[item.type] || boxes.car;
  return {
    top: Number(item.y || 0) + box.top,
    bottom: Number(item.y || 0) + box.bottom
  };
}

function gameOverRacing() {
  stopRacingLoop();
  state.racing.status = "gameover";
  state.racing.bestScore = Math.max(Number(state.racing.bestScore || 0), Math.floor(state.racing.score || 0));
  localStorage.setItem("fritixRacingBest", String(state.racing.bestScore));
  removeDynamicIslandActivity("racing");
  save();
  if (state.currentApp === "racing") renderRacing(document.querySelector("#app-content"));
}

function moveRacing(direction) {
  if (state.racing.status !== "playing") return;
  state.racing.lane = Math.max(0, Math.min(2, Number(state.racing.lane || 1) + direction));
  updateRacingDom();
  save();
}

function updateRacingDom() {
  const score = document.querySelector("#racing-score");
  if (score) score.textContent = Math.floor(state.racing.score || 0);
  const player = document.querySelector("#racing-player");
  if (player) player.className = `racing-car player lane-${state.racing.lane || 1}`;
  const obstacles = document.querySelector("#racing-obstacles");
  if (obstacles) obstacles.innerHTML = renderRacingObstacles();
}

function racingIslandUpdate(expanded = false) {
  if (state.racing.status !== "playing" && state.racing.status !== "paused") return;
  const activity = {
    type: "racing",
    appId: "racing",
    icon: "🏎",
    color: "#ff375f",
    title: "FRITIX Racing",
    body: `Score : ${Math.floor(state.racing.score || 0)}`,
    live: true,
    duration: expanded ? 2200 : 1200
  };
  if (dynamicIslandState.currentActivity?.type === "racing") {
    dynamicIslandState.currentActivity = { ...dynamicIslandState.currentActivity, ...activity };
    if (expanded) dynamicIslandState.mode = "expanded";
    dynamicIslandRender();
  } else {
    dynamicIslandStart(activity);
  }
}

function forceCloseApp(appId) {
  closeApp(appId, { force: true });
}

function closeAllApps() {
  [...state.openApps].forEach(item => forceCloseApp(item.id));
  state.openApps = [];
  save();
  renderSwitcher();
}

function haptic(kind = "tap") {
  screen.classList.remove("tap-feedback", "haptic-message", "haptic-call");
}

function setVolume(value) {
  systemState.volume = normalizeUnitValue(value, systemState.volume);
  state.volume = Math.round(systemState.volume * 100);
  state.settings.volume = state.volume;
  state.musicState.volume = Number(systemState.volume.toFixed(2));
  localStorage.setItem("systemVolume", String(systemState.volume));
  save();
  applySystemState();
  showVolumeOverlay();
  updateVolumeControlVisual();
  musicRefreshSurfaces(false);
}

function setBrightness(value) {
  state.brightness = Math.max(0, Math.min(100, value));
  systemState.brightness = normalizeUnitValue(state.brightness, systemState.brightness);
  state.settings.brightness = state.brightness;
  save();
  applySystemState();
  showHardwareOverlay("Luminosite", `${state.brightness}%`);
}

function toggleWifi() {
  if (state.settings.airplane) state.settings.airplane = false;
  state.settings.wifi = !state.settings.wifi;
  save();
  applySystemState();
  renderControlCenter();
}

function toggleBluetooth() {
  state.settings.bluetooth = !state.settings.bluetooth;
  save();
  applySystemState();
  renderControlCenter();
}

function toggleCellular() {
  if (state.settings.airplane) state.settings.airplane = false;
  state.settings.cellular = !state.settings.cellular;
  save();
  applySystemState();
  renderControlCenter();
}

function toggleAirplane() {
  state.settings.airplane = !state.settings.airplane;
  if (state.settings.airplane) {
    state.settings.wifi = false;
    state.settings.cellular = false;
  }
  save();
  applySystemState();
  renderControlCenter();
}

function toggleDarkMode() {
  state.settings.darkMode = !state.settings.darkMode;
  save();
  applySystemState();
  renderControlCenter();
}

function openFocusPicker() {
  state.focusPickerOpen = !state.focusPickerOpen;
  renderControlCenter();
}

function setFocusMode(mode) {
  state.settings.focus = true;
  state.settings.focusMode = mode;
  state.focusPickerOpen = false;
  save();
  applySystemState();
  if (state.currentApp === "settings") renderSettingsDetail("focus");
  else renderControlCenter();
}

let musicRuntimeTimer = null;

function musicProgressPercent() {
  return Math.max(0, Math.min(100, (state.musicState.currentTime / Math.max(1, state.musicState.duration)) * 100));
}

function formatMusicTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function musicTrackIndex(trackId = state.musicState.currentTrack) {
  const queue = state.musicState.queue?.length ? state.musicState.queue : musicTracks.map(track => track.id);
  const index = queue.indexOf(trackId);
  return index >= 0 ? index : 0;
}

function musicShowDynamicIsland(expanded = true) {
  const track = currentMusicTrack();
  if (dynamicIslandState.currentActivity?.type === "music" && dynamicIslandState.mode === "full") {
    dynamicIslandState.currentActivity = {
      ...dynamicIslandState.currentActivity,
      title: track.title,
      body: track.artist,
      icon: track.cover,
      color: track.color,
      live: true
    };
    dynamicIslandRender();
    return;
  }
  dynamicIslandStart({
    type: "music",
    appId: "music",
    title: track.title,
    body: track.artist,
    icon: track.cover,
    color: track.color,
    live: true,
    duration: expanded ? 2800 : 1200
  });
}

function musicStartRuntime() {
  clearInterval(musicRuntimeTimer);
  if (!state.musicState.isPlaying) return;
  musicRuntimeTimer = setInterval(() => {
    if (!state.musicState.isPlaying) {
      clearInterval(musicRuntimeTimer);
      return;
    }
    state.musicState.currentTime = Math.min(state.musicState.duration, Number(state.musicState.currentTime || 0) + 1);
    if (state.musicState.currentTime >= state.musicState.duration) {
      if (state.musicState.repeat) state.musicState.currentTime = 0;
      else musicNext(false);
      return;
    }
    syncNowPlayingFromMusicState();
    musicRefreshSurfaces(false);
  }, 1000);
}

function musicRefreshSurfaces(shouldSave = true) {
  syncNowPlayingFromMusicState();
  if (shouldSave) save();
  if (dynamicIslandState.currentActivity?.type === "music") dynamicIslandRender();
  if (document.querySelector(".ios-control-center")) renderControlCenter();
  if (state.currentApp === "music") {
    if (shouldSave) renderMusic(document.querySelector("#app-content"));
    else musicUpdateLiveDom();
  }
}

function musicUpdateLiveDom() {
  const track = currentMusicTrack();
  const seek = document.querySelector("#music-seek-input");
  if (seek) seek.value = Math.floor(state.musicState.currentTime);
  const progress = document.querySelector(".music-player-progress");
  if (progress) progress.style.width = `${musicProgressPercent()}%`;
  const times = document.querySelectorAll(".music-progress-wrap em");
  if (times[0]) times[0].textContent = formatMusicTime(state.musicState.currentTime);
  if (times[1]) times[1].textContent = `-${formatMusicTime(track.duration - state.musicState.currentTime)}`;
}

function musicPlayTrack(trackRef, openPlayer = true) {
  const numeric = Number(trackRef);
  const track = Number.isFinite(numeric)
    ? musicTracks[(numeric + musicTracks.length) % musicTracks.length]
    : musicTracks.find(item => item.id === trackRef);
  if (!track) return;
  state.musicState.currentTrack = track.id;
  state.musicState.currentTime = 0;
  state.musicState.duration = track.duration;
  state.musicState.isPlaying = true;
  state.musicState.playerOpen = Boolean(openPlayer);
  syncNowPlayingFromMusicState();
  musicStartRuntime();
  musicShowDynamicIsland(true);
  musicRefreshSurfaces();
}

function musicPrevious(showIsland = true) {
  const queue = state.musicState.queue?.length ? state.musicState.queue : musicTracks.map(track => track.id);
  const index = musicTrackIndex();
  const previous = queue[(index - 1 + queue.length) % queue.length];
  state.musicState.currentTrack = previous;
  state.musicState.currentTime = 0;
  syncNowPlayingFromMusicState();
  if (state.musicState.isPlaying) musicStartRuntime();
  if (showIsland) musicShowDynamicIsland(dynamicIslandState.mode !== "full");
  musicRefreshSurfaces();
}

function musicNext(showIsland = true) {
  const queue = state.musicState.queue?.length ? state.musicState.queue : musicTracks.map(track => track.id);
  const index = musicTrackIndex();
  const next = queue[(index + 1) % queue.length];
  state.musicState.currentTrack = next;
  state.musicState.currentTime = 0;
  syncNowPlayingFromMusicState();
  if (state.musicState.isPlaying) musicStartRuntime();
  if (showIsland) musicShowDynamicIsland(dynamicIslandState.mode !== "full");
  musicRefreshSurfaces();
}

function musicToggle() {
  state.musicState.isPlaying = !state.musicState.isPlaying;
  syncNowPlayingFromMusicState();
  musicStartRuntime();
  musicShowDynamicIsland(dynamicIslandState.mode !== "full");
  musicRefreshSurfaces();
}

function musicSeek(value) {
  state.musicState.currentTime = Math.max(0, Math.min(state.musicState.duration, Number(value) || 0));
  musicRefreshSurfaces();
}

function musicSetVolume(value) {
  setVolume(normalizeUnitValue(value, systemState.volume));
}

let hardwareOverlayTimer = null;

function showHardwareOverlay(title, value) {
  hardwareOverlay.className = "hardware-overlay";
  hardwareOverlay.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(value)}</span>
    ${title === "Volume" ? `<i style="width:${state.volume}%"></i>` : ""}
  `;
  hardwareOverlay.classList.add("show");
  clearTimeout(hardwareOverlayTimer);
  hardwareOverlayTimer = setTimeout(() => {
    hardwareOverlay.classList.remove("show");
  }, 950);
}

function showVolumeOverlay() {
  const percent = Math.round(systemState.volume * 100);
  const icon = percent <= 0 ? "Mute" : percent < 35 ? "Vol" : percent < 70 ? "Vol+" : "Vol++";
  hardwareOverlay.className = "hardware-overlay volume-overlay";
  hardwareOverlay.innerHTML = `
    <span class="volume-icon">${escapeHtml(icon)}</span>
    <span class="volume-track"><i style="width:${percent}%"></i></span>
    <strong>${percent}%</strong>
  `;
  hardwareOverlay.classList.add("show");
  clearTimeout(hardwareOverlayTimer);
  hardwareOverlayTimer = setTimeout(() => {
    hardwareOverlay.classList.remove("show");
    setTimeout(() => {
      hardwareOverlay.className = "hardware-overlay";
    }, 220);
  }, 1000);
}

function updateVolumeControlVisual() {
  const slider = document.querySelector(".control-slider[data-slider='volume']");
  if (!slider) return;
  const percent = Math.round(systemState.volume * 100);
  const fill = slider.querySelector(".control-slider-fill");
  const label = slider.querySelector("strong");
  if (fill) fill.style.height = `${percent}%`;
  if (label) label.textContent = percent <= 1 ? "Mute" : "Vol";
}

function updatePasscodeDots() {
  const dots = document.querySelectorAll("#passcode-dots span");
  dots.forEach((dot, index) => {
    dot.classList.toggle("filled", index < state.passcodeInput.length);
  });
}

function formatCallDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function logCallDebug(label) {
  console.log(label || "CALL DEBUG");
  console.log("CALL STATE:", { ...callState });
  console.log("DYNAMIC ISLAND:", { ...dynamicIslandState });
}

function syncPhoneCallState() {
  state.phoneCall = callState.active
    ? {
        status: callState.status,
        name: callState.contactName,
        number: callState.number,
        startedAt: callState.startedAt,
        showKeypad: callState.showKeypad
      }
    : null;
}

function callActivityFromState() {
  return {
    type: "call",
    title: callState.contactName || "Appel",
    body: callState.status === "ringing" ? "Appel entrant" : callState.status === "calling" ? "Appel..." : "Appel en cours",
    icon: (callState.contactName || "A")[0],
    live: callState.status !== "ringing",
    startedAt: callState.startedAt
  };
}

function updateCallIsland(mode = null) {
  if (!callState.active) return;
  const activity = callActivityFromState();
  const nextMode = mode || (dynamicIslandState.mode === "full" ? "full" : "compact");
  dynamicIslandState.currentActivity = activity;
  dynamicIslandState.mode = nextMode;
  dynamicIslandState.expanded = nextMode !== "compact";
  dynamicIslandState.locked = callState.status === "ringing";
  clearTimeout(dynamicIslandState.timer);
  dynamicIslandRender();
  logCallDebug("DYNAMIC ISLAND:");
}

function openCallScreen() {
  console.log("openCallScreen() called");
  if (!callState.active) return;
  syncPhoneCallState();
  state.currentApp = "phone";
  state.editMode = false;
  screen.classList.remove("edit-mode");
  screen.classList.add("light-context");
  view.innerHTML = `
    <section class="call-app-shell phone-call-mode">
      <div class="app-content call-app-content" id="app-content"></div>
    </section>
  `;
  renderPhone(document.querySelector("#app-content"));
  updateCallIsland("compact");
}

function refreshCallScreen() {
  if (!callState.active || state.currentApp !== "phone") return;
  syncPhoneCallState();
  const content = document.querySelector("#app-content");
  if (content) renderPhone(content);
}

function startPhoneCall({ name = "Lucas Bernard", number = "+33 6 19 42 11 08", incoming = false } = {}) {
  console.log("startCall() called");
  resetCallUI({ keepScreen: true });
  callState.active = true;
  callState.contactName = name;
  callState.number = number;
  callState.status = incoming ? "ringing" : "calling";
  callState.minimized = false;
  callState.startedAt = null;
  callState.previousApp = state.currentApp;
  syncPhoneCallState();
  updateCallIsland(incoming ? "expanded" : "compact");
  openCallScreen();
  if (!incoming) setTimeout(connectPhoneCall, 1400);
  logCallDebug("CALL STATE:");
}

function answerPhoneCall() {
  if (!callState.active) return;
  connectPhoneCall();
  openCallScreen();
}

function connectPhoneCall() {
  if (!callState.active || callState.status === "connected") return;
  callState.status = "connected";
  callState.startedAt = Date.now();
  callState.duration = 0;
  clearInterval(callState.timer);
  callState.timer = setInterval(() => {
    callState.duration = Math.floor((Date.now() - callState.startedAt) / 1000);
    updateCallIsland();
    const activeDuration = document.querySelector("#active-call-duration");
    if (activeDuration) activeDuration.textContent = formatCallDuration(Date.now() - callState.startedAt);
  }, 1000);
  syncPhoneCallState();
  updateCallIsland("compact");
  refreshCallScreen();
  logCallDebug("CALL STATE:");
}

function endPhoneCall() {
  resetCallUI();
}

function resetCallUI(options = {}) {
  clearInterval(callState.timer);
  callState.active = false;
  callState.contactName = null;
  callState.number = null;
  callState.duration = 0;
  callState.status = "idle";
  callState.minimized = false;
  callState.startedAt = null;
  callState.showKeypad = false;
  callState.timer = null;
  state.phoneCall = null;
  dynamicIslandState.queue = dynamicIslandState.queue.filter(activity => activity.type !== "call");
  dynamicIslandReset();
  screen.style.pointerEvents = "";
  view.style.pointerEvents = "";
  document.querySelectorAll(".phone-call-screen").forEach(node => node.remove());
  logCallDebug("CALL STATE:");
  if (!options.keepScreen && state.currentApp === "phone") openApp("phone");
}

function handlePasscodeKey(key) {
  if (state.faceIdStatus === "scanning") {
    state.faceIdStatus = "passcode";
    updatePasscodePrompt("Saisir le code", "");
  }
  if (key === "del") {
    state.passcodeInput = state.passcodeInput.slice(0, -1);
    state.passcodeError = false;
    updatePasscodeDots();
    return;
  }
  const requiredLength = Number(state.settings.passcodeLength || 4);
  if (/^\d$/.test(key) && state.passcodeInput.length < requiredLength) {
    state.passcodeInput += key;
    updatePasscodeDots();
  }
  if (state.passcodeInput.length === requiredLength) {
    checkPasscode();
  }
}

function checkPasscode() {
  if (state.passcodeInput === String(state.settings.passcode || "")) {
    unlockWithAnimation();
    return;
  }
  state.passcodeError = true;
  updatePasscodePrompt("Saisir le code", "Code incorrect");
  const dots = document.querySelector("#passcode-dots");
  dots?.classList.remove("shake");
  void dots?.offsetWidth;
  dots?.classList.add("shake");
  state.passcodeInput = "";
  setTimeout(updatePasscodeDots, 260);
}

function updatePasscodePrompt(title, message = "") {
  const titleNode = document.querySelector("#passcode-title");
  const messageNode = document.querySelector("#passcode-message");
  if (titleNode) titleNode.textContent = title;
  if (messageNode) messageNode.textContent = message;
}

function simulateFaceId() {
  if (!document.querySelector(".ios-passcode") || !state.settings.faceIdEnabled || state.faceIdStatus !== "scanning") return;
  const auth = document.querySelector("#passcode-auth");
  auth?.classList.add("face-success");
  updatePasscodePrompt("Face ID", "Deverrouille");
  setTimeout(unlockWithAnimation, 360);
}

function unlockWithAnimation() {
  screen.classList.add("unlocking");
  const passcode = document.querySelector(".ios-passcode");
  passcode?.classList.add("unlock-success");
  setTimeout(() => {
    screen.classList.remove("unlocking");
    renderHome();
  }, 450);
}

function renderSettingsDetail(id) {
  const content = document.querySelector("#app-content");
  if (!content) return;

  if (id === "airplane") {
    toggleAirplane();
    openApp("settings");
    return;
  }

  if (id === "wifi") {
    renderSettingsPage(content, "Wi-Fi", `
      ${settingsToggleLine("Wi-Fi", state.settings.wifi, "settings-toggle-wifi")}
      <div class="ios-settings-group">
        <button class="settings-row"><span class="settings-title">LocalNet</span><span class="settings-detail-text">${state.settings.wifi ? "Connecte" : "Desactive"}</span></button>
        <button class="settings-row"><span class="settings-title">Fritix Studio</span><em>›</em></button>
      </div>
    `);
    return;
  }

  if (id === "bluetooth") {
    renderSettingsPage(content, "Bluetooth", `
      ${settingsToggleLine("Bluetooth", state.settings.bluetooth, "settings-toggle-bluetooth")}
      <div class="ios-settings-group">
        <button class="settings-row"><span class="settings-title">AirPods Pro</span><span class="settings-detail-text">${state.settings.bluetooth ? "Connectable" : "Non"}</span></button>
        <button class="settings-row"><span class="settings-title">Magic Keyboard</span><em>›</em></button>
      </div>
    `);
    return;
  }

  if (id === "cellular") {
    renderSettingsPage(content, "Donnees cellulaires", `
      ${settingsToggleLine("Donnees cellulaires", state.settings.cellular, "settings-toggle-cellular")}
      <div class="ios-settings-group">
        <button class="settings-row"><span class="settings-title">Options</span><span class="settings-detail-text">5G Auto</span></button>
        <button class="settings-row"><span class="settings-title">Reseau</span><span class="settings-detail-text">Local Carrier</span></button>
      </div>
    `);
    return;
  }

  if (id === "notifications") {
    renderSettingsPage(content, "Notifications", `
      ${settingsToggleLine("Autoriser les notifications", state.settings.notifications, "settings-toggle-notifications")}
      <div class="ios-settings-group">
        <button class="settings-row"><span class="settings-title">Afficher les apercus</span><span class="settings-detail-text">Toujours</span></button>
        <button class="settings-row"><span class="settings-title">Messages</span><em>›</em></button>
      </div>
    `);
    return;
  }

  if (id === "sound") {
    renderSettingsPage(content, "Sons et vibrations", `
      ${settingsToggleLine("Sons systeme", state.settings.sound, "settings-toggle-sound")}
      <div class="ios-settings-group">
        <button class="settings-row"><span class="settings-title">Volume</span><span class="settings-detail-text">${state.volume}%</span></button>
        <button class="settings-row"><span class="settings-title">Sonnerie</span><span class="settings-detail-text">Reflection</span></button>
      </div>
    `);
    return;
  }

  if (id === "focus") {
    renderSettingsPage(content, "Concentration", `
      <div class="ios-settings-group">
        ${["Ne pas deranger", "Travail", "Personnel", "Sommeil"].map(mode => `<button class="settings-row" data-action="set-focus" data-focus="${escapeHtml(mode)}"><span class="settings-title">${escapeHtml(mode)}</span><span class="settings-detail-text">${state.settings.focusMode === mode ? "Active" : ""}</span></button>`).join("")}
      </div>
    `);
    return;
  }

  if (id === "wallpaper") {
    renderWallpaperSettings(content);
    return;
  }

  if (id === "passcode") {
    renderPasscodeSettings(content);
    return;
  }

  if (["general", "battery", "display", "control-center", "siri", "privacy", "screen-time", "profile"].includes(id)) {
    const titles = {
      general: "General",
      battery: "Batterie",
      display: "Luminosite et affichage",
      "control-center": "Centre de controle",
      siri: "Siri / NOVA",
      privacy: "Confidentialite",
      "screen-time": "Temps d'ecran",
      profile: "Fritix"
    };
    renderSettingsPage(content, titles[id], `
      <div class="ios-settings-group">
        <button class="settings-row"><span class="settings-title">Etat</span><span class="settings-detail-text">${escapeHtml(titles[id])}</span></button>
        <button class="settings-row"><span class="settings-title">Version</span><span class="settings-detail-text">Emulator OS 1.0</span></button>
      </div>
    `);
    return;
  }
}

function renderSettingsPage(content, title, body) {
  content.innerHTML = `
    <div class="ios-settings ios-settings-page">
      <button class="settings-back" data-action="settings-root">‹ Reglages</button>
      <h1>${escapeHtml(title)}</h1>
      ${body}
    </div>
  `;
}

function settingsToggleLine(title, checked, action) {
  return `
    <div class="ios-settings-group">
      <button class="settings-row" data-action="${action}">
        <span class="settings-title">${escapeHtml(title)}</span>
        <span class="settings-switch ${checked ? "on" : ""}"></span>
      </button>
    </div>
  `;
}

function renderWallpaperSettings(content) {
  renderSettingsPage(content, "Fond d'ecran", `
    <div class="wallpaper-preview">
      <div class="wallpaper-preview-screen" style="background-image:${state.settings.wallpaperUrl ? `url('${escapeHtml(state.settings.wallpaperUrl)}')` : wallpaperBackground(state.settings.wallpaper)};background-size:${escapeHtml(state.settings.wallpaperFit || "cover")}"></div>
      <span>Fond actuel</span>
    </div>
    <div class="ios-settings-group wallpaper-presets">
      ${["Default", "iOS Blue", "iOS Purple", "iOS Dark", "iOS Light", "VisionOS"].map(name => `<button class="wallpaper-preset ${state.settings.wallpaper === name ? "selected" : ""}" data-wallpaper-preset="${escapeHtml(name)}">${escapeHtml(name === "Default" ? "FRITIX Default" : name)}</button>`).join("")}
    </div>
    <div class="ios-settings-group wallpaper-url-group">
      <label>URL image</label>
      <input id="wallpaper-url-input" value="${escapeHtml(state.settings.wallpaperUrl || "")}" placeholder="https://monsite.com/image.jpg">
      <button class="settings-apply" data-action="apply-wallpaper-url">Appliquer</button>
    </div>
    <div class="ios-settings-group wallpaper-fit-group">
      ${[
        ["cover", "Remplir"],
        ["contain", "Ajuster"],
        ["auto", "Centrer"],
        ["140%", "Zoomer"]
      ].map(([fit, label]) => `<button class="${state.settings.wallpaperFit === fit ? "selected" : ""}" data-wallpaper-fit="${fit}">${label}</button>`).join("")}
    </div>
  `);
}

function renderPasscodeSettings(content) {
  renderSettingsPage(content, "Face ID et code", `
    <div class="ios-settings-group">
      <button class="settings-row" data-action="settings-toggle-passcode">
        <span class="settings-title">Code</span>
        <span class="settings-switch ${state.settings.passcodeEnabled ? "on" : ""}"></span>
      </button>
      <button class="settings-row" data-action="settings-toggle-faceid">
        <span class="settings-title">Face ID simule</span>
        <span class="settings-switch ${state.settings.faceIdEnabled ? "on" : ""}"></span>
      </button>
      <button class="settings-row"><span class="settings-title">Verrouillage automatique</span><span class="settings-detail-text">${escapeHtml(state.settings.autoLock || "Immediatement")}</span></button>
    </div>
    <div class="ios-settings-group passcode-length-group">
      <button class="settings-row ${Number(state.settings.passcodeLength) === 4 ? "selected" : ""}" data-action="set-passcode-length" data-length="4"><span class="settings-title">Code a 4 chiffres</span><span class="settings-detail-text">${Number(state.settings.passcodeLength) === 4 ? "Actif" : ""}</span></button>
      <button class="settings-row ${Number(state.settings.passcodeLength) === 6 ? "selected" : ""}" data-action="set-passcode-length" data-length="6"><span class="settings-title">Code a 6 chiffres</span><span class="settings-detail-text">${Number(state.settings.passcodeLength) === 6 ? "Actif" : ""}</span></button>
    </div>
    <div class="ios-settings-group passcode-change-group">
      <label>Nouveau code</label>
      <input id="new-passcode" type="password" inputmode="numeric" maxlength="${Number(state.settings.passcodeLength || 4)}" placeholder="${"•".repeat(Number(state.settings.passcodeLength || 4))}" autocomplete="off">
      <button class="settings-apply" data-action="save-passcode">Changer le code</button>
    </div>
  `);
}

function toggleSettingsValue(key) {
  state.settings[key] = !state.settings[key];
  if (key === "wifi" && state.settings.wifi) state.settings.airplane = false;
  if (key === "cellular" && state.settings.cellular) state.settings.airplane = false;
  save();
  applySystemState();
  renderSettingsDetail(key === "sound" ? "sound" : key);
}

function setWallpaperPreset(name) {
  state.settings.wallpaper = name;
  state.settings.wallpaperUrl = "";
  save();
  applySystemState();
  renderSettingsDetail("wallpaper");
}

function setWallpaperFit(fit) {
  state.settings.wallpaperFit = fit;
  save();
  applySystemState();
  renderSettingsDetail("wallpaper");
}

function applyWallpaperUrl() {
  const input = document.querySelector("#wallpaper-url-input");
  const url = input?.value.trim() || "";
  if (!/^https?:\/\/.+/i.test(url)) {
    showHardwareOverlay("Fond", "URL invalide");
    return;
  }
  const image = new Image();
  image.onload = () => {
    state.settings.wallpaperUrl = url;
    save();
    applySystemState();
    renderSettingsDetail("wallpaper");
  };
  image.onerror = () => showHardwareOverlay("Fond", "Image invalide");
  image.src = url;
}

/*
function renderSettingsDetailOld(id) {
  const detail = document.querySelector("#settings-detail");
  if (!detail) return;

  if (["wifi", "bluetooth", "cellular", "notifications", "sound", "focus"].includes(id)) {
    state.settings[id] = !state.settings[id];
    save();
    openApp("settings");
    return;
  }

  if (id === "accessibility") {
    state.settings.reduceMotion = !state.settings.reduceMotion;
    save();
    openApp("settings");
    return;
  }

  if (id === "passcode") {
    detail.innerHTML = `
      <div class="settings-detail app-card">
        <strong>Modifier le code</strong>
        <p>Entre un code a 4 chiffres.</p>
        <div class="input-row">
          <input id="new-passcode" maxlength="4" inputmode="numeric" placeholder="1234">
          <button class="primary" data-action="save-passcode">OK</button>
        </div>
      </div>
    `;
    return;
  }

  if (id === "wallpaper") {
    detail.innerHTML = `
      <div class="settings-detail app-card">
        <strong>Fond d'ecran</strong>
        <p>Choisis un style local.</p>
        <div class="settings-choice">
          ${["Aurora", "Ocean", "Graphite"].map(name => `<button data-wallpaper="${name}">${name}</button>`).join("")}
        </div>
      </div>
    `;
    return;
  }

  const content = {
    general: ["Version: Emulator OS 1.0", "Stockage: localStorage", "Mode: simulation"],
    battery: ["Charge: 100%", "Sante: normale", "Optimisation: active"]
  };
  detail.innerHTML = `<div class="settings-detail app-card"><strong>${escapeHtml(id)}</strong>${(content[id] || ["Option locale"]).map(line => `<p>${escapeHtml(line)}</p>`).join("")}</div>`;
}
*/

function markNotification(id) {
  const item = state.notifications.find(notification => notification.id === id);
  if (!item) return;
  item.unread = false;
  save();
  showHardwareOverlay("Notification", "Lue");
  haptic(item.kind || "tap");
  if (document.querySelector(".ios-notification-center")) renderNotifications();
  else renderLock();
}

function clearNotification(id) {
  state.notifications = state.notifications.filter(notification => notification.id !== id);
  save();
  showHardwareOverlay("Notification", "Effacee");
  haptic("tap");
  if (document.querySelector(".ios-notification-center")) renderNotifications();
  else renderLock();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
