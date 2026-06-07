function closestTarget(event, selector) {
  return event.target?.closest ? event.target.closest(selector) : event.target?.parentElement?.closest(selector);
}

view.addEventListener("click", event => {
  if (dynamicIslandState.mode === "full" && !closestTarget(event, "#dynamic-island")) {
    dynamicIslandCloseFull();
  }
  const deleteButton = closestTarget(event, "[data-delete]");
  if (deleteButton) {
    requestRemoveHomeApp(deleteButton.dataset.delete);
    return;
  }
  const widgetDeleteButton = closestTarget(event, "[data-widget-delete]");
  if (widgetDeleteButton) {
    requestRemoveHomeWidget(widgetDeleteButton.dataset.widgetDelete);
    return;
  }
  const appButton = closestTarget(event, "[data-app]");
  if (appButton && closestTarget(event, ".app-switcher-item.closing")) return;
  if (appButton && !closestTarget(event, "[data-action]") && !state.editMode) {
    openApp(appButton.dataset.app);
    return;
  }
  const calcButton = closestTarget(event, "[data-calc]");
  if (calcButton) {
    doCalc(calcButton.dataset.calc);
    return;
  }
  const dialButton = closestTarget(event, "[data-dial]");
  if (dialButton) {
    state.phoneDial = `${state.phoneDial || ""}${dialButton.dataset.dial}`;
    save();
    if (state.currentApp === "phone") renderPhone(document.querySelector("#app-content"));
    return;
  }
  const passcodeButton = closestTarget(event, "[data-passcode]");
  if (passcodeButton) {
    handlePasscodeKey(passcodeButton.dataset.passcode);
    return;
  }
  const settingsButton = closestTarget(event, "[data-settings]");
  if (settingsButton) {
    renderSettingsDetail(settingsButton.dataset.settings);
    return;
  }
  const wallpaperButton = closestTarget(event, "[data-wallpaper]");
  if (wallpaperButton) {
    state.settings.wallpaper = wallpaperButton.dataset.wallpaper;
    save();
    showHardwareOverlay("Fond", state.settings.wallpaper);
    openApp("settings");
    return;
  }
  const wallpaperPresetButton = closestTarget(event, "[data-wallpaper-preset]");
  if (wallpaperPresetButton) {
    setWallpaperPreset(wallpaperPresetButton.dataset.wallpaperPreset);
    return;
  }
  const wallpaperFitButton = closestTarget(event, "[data-wallpaper-fit]");
  if (wallpaperFitButton) {
    setWallpaperFit(wallpaperFitButton.dataset.wallpaperFit);
    return;
  }
  const actionButton = closestTarget(event, "[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  if (action === "camera") openApp("camera");
  if (action === "flash") updateIsland("Lampe");
  if (action === "lock") renderLock();
  if (action === "emergency") showHardwareOverlay("Urgence", "Appel SOS simule");
  if (action === "home") renderHome();
  if (action === "switcher") renderSwitcher();
  if (action === "force-close-app") {
    forceCloseApp(actionButton.dataset.closeApp);
    renderSwitcher();
  }
  if (action === "close-all-apps") closeAllApps();
  if (action === "settings-root") openApp("settings");
  if (action === "edit") {
    state.editMode = !state.editMode;
    renderHome();
  }
  if (action === "finish-home-edit") {
    state.editMode = false;
    state.homeLayout.widgetGalleryOpen = false;
    state.homeLayout.customizeOpen = false;
    state.homeLayout.confirm = null;
    save();
    renderHome();
  }
  if (action === "open-widget-gallery") {
    state.homeLayout.widgetGalleryOpen = true;
    state.homeLayout.customizeOpen = false;
    renderHome();
  }
  if (action === "open-icon-customizer") {
    state.homeLayout.customizeOpen = true;
    state.homeLayout.widgetGalleryOpen = false;
    renderHome();
  }
  if (action === "close-home-panels") {
    state.homeLayout.widgetGalleryOpen = false;
    state.homeLayout.customizeOpen = false;
    renderHome();
  }
  if (action === "add-widget") addHomeWidget(actionButton.dataset.widgetType, actionButton.dataset.widgetSize);
  if (action === "cycle-widget-size") cycleHomeWidgetSize(actionButton.dataset.widget);
  if (action === "set-icon-theme") setHomeIconTheme(actionButton.dataset.theme);
  if (action === "set-icon-tint") setHomeIconTint(actionButton.dataset.color);
  if (action === "set-icon-size") setHomeIconSize(actionButton.dataset.size);
  if (action === "confirm-remove-home") confirmRemoveHomeItem();
  if (action === "cancel-home-confirm") {
    state.homeLayout.confirm = null;
    renderHome();
  }
  if (action === "library-page") {
    state.homeLayout.page = "library";
    state.editMode = false;
    save();
    renderHome();
  }
  if (action === "home-page") {
    state.homeLayout.page = "home";
    save();
    renderHome();
  }
  if (action === "library-add-app") addAppToHome(actionButton.dataset.appId);
  if (action === "spotlight") renderSpotlight();
  if (action === "notifications") renderNotifications();
  if (action === "mark-notification") {
    const card = actionButton.closest("[data-notification]");
    if (card) markNotification(card.dataset.notification);
  }
  if (action === "clear-notification") {
    const card = actionButton.closest("[data-notification]");
    if (card) clearNotification(card.dataset.notification);
  }
  if (action === "notification-options") {
    showHardwareOverlay("Options", "Notification");
    haptic("tap");
  }
  if (action === "toggle-wifi") toggleWifi();
  if (action === "toggle-bluetooth") toggleBluetooth();
  if (action === "toggle-cellular") toggleCellular();
  if (action === "toggle-airplane") toggleAirplane();
  if (action === "toggle-dark") toggleDarkMode();
  if (action === "open-focus") openFocusPicker();
  if (action === "set-focus") setFocusMode(actionButton.dataset.focus);
  if (action === "settings-toggle-wifi") toggleSettingsValue("wifi");
  if (action === "settings-toggle-bluetooth") toggleSettingsValue("bluetooth");
  if (action === "settings-toggle-cellular") toggleSettingsValue("cellular");
  if (action === "settings-toggle-notifications") toggleSettingsValue("notifications");
  if (action === "settings-toggle-sound") toggleSettingsValue("sound");
  if (action === "settings-toggle-passcode") {
    state.settings.passcodeEnabled = !state.settings.passcodeEnabled;
    save();
    renderSettingsDetail("passcode");
  }
  if (action === "settings-toggle-faceid") {
    state.settings.faceIdEnabled = !state.settings.faceIdEnabled;
    save();
    renderSettingsDetail("passcode");
  }
  if (action === "set-passcode-length") {
    const length = Number(actionButton.dataset.length || 4);
    state.settings.passcodeLength = length;
    if (!new RegExp(`^\\d{${length}}$`).test(String(state.settings.passcode || ""))) {
      state.settings.passcode = length === 6 ? "123456" : "1234";
    }
    save();
    renderSettingsDetail("passcode");
  }
  if (action === "apply-wallpaper-url") applyWallpaperUrl();
  if (action === "music-prev") musicPrevious();
  if (action === "music-toggle") musicToggle();
  if (action === "music-next") musicNext();
  if (action === "store-tab") setStoreTab(actionButton.dataset.tab);
  if (action === "store-detail") openStoreDetail(actionButton.dataset.storeApp);
  if (action === "store-back") closeStoreDetail();
  if (action === "store-profile") openStoreProfile();
  if (action === "store-install") installStoreApp(actionButton.dataset.storeApp);
  if (action === "store-update") updateStoreApp(actionButton.dataset.storeApp);
  if (action === "store-open") openInstalledStoreApp(actionButton.dataset.storeApp);
  if (action === "store-add-home") addStoreAppToHome(actionButton.dataset.storeApp);
  if (action === "store-uninstall") uninstallStoreApp(actionButton.dataset.storeApp);
  if (action === "racing-start" || action === "racing-restart") {
    startRacingGame();
    return;
  }
  if (action === "racing-resume") {
    resumeRacingGame();
    return;
  }
  if (action === "racing-left") {
    if (Date.now() >= racingControlSuppressClick) moveRacing(-1);
    return;
  }
  if (action === "racing-right") {
    if (Date.now() >= racingControlSuppressClick) moveRacing(1);
    return;
  }
  if (action === "racing-best") {
    showHardwareOverlay("FRITIX Racing", `Record ${Math.floor(state.racing.bestScore || 0)}`);
    return;
  }
  if (action === "phone-tab") {
    state.phoneTab = actionButton.dataset.tab || "recents";
    state.phoneContact = "";
    localStorage.setItem("emu_phone_tab", state.phoneTab);
    save();
    renderPhone(document.querySelector("#app-content"));
  }
  if (action === "phone-open-contact") {
    state.phoneContact = actionButton.dataset.contact || "";
    renderPhone(document.querySelector("#app-content"));
  }
  if (action === "phone-back") {
    state.phoneContact = "";
    renderPhone(document.querySelector("#app-content"));
  }
  if (action === "phone-delete") {
    state.phoneDial = (state.phoneDial || "").slice(0, -1);
    save();
    renderPhone(document.querySelector("#app-content"));
  }
  if (action === "phone-call-number") {
    startPhoneCall({ name: state.phoneDial || "Numero inconnu", number: state.phoneDial || "mobile" });
  }
  if (action === "phone-call") {
    const contact = phoneContacts().find(item => item.id === actionButton.dataset.contact);
    startPhoneCall({
      name: contact?.name || actionButton.dataset.name || "Numero inconnu",
      number: contact?.number || actionButton.dataset.number || "mobile"
    });
  }
  if (action === "phone-answer") answerPhoneCall();
  if (action === "phone-decline" || action === "phone-end") endPhoneCall();
  if (action === "phone-new-contact") showHardwareOverlay("Contacts", "Nouveau contact simule");
  if (action === "phone-facetime") showHardwareOverlay("FaceTime", "Simulation");
  if (action === "phone-mail") showHardwareOverlay("Mail", "Simulation");
  if (action === "phone-call-control") actionButton.classList.toggle("active");
  if (action === "phone-call-keypad" && state.phoneCall) {
    callState.showKeypad = !callState.showKeypad;
    syncPhoneCallState();
    renderPhone(document.querySelector("#app-content"));
  }
  if (action === "voicemail-play") showHardwareOverlay("Messagerie", "Lecture");
  if (action === "music-select") {
    musicPlayTrack(actionButton.dataset.track || 0, true);
  }
  if (action === "music-tab") {
    state.musicState.tab = actionButton.dataset.tab || "home";
    state.musicState.playerOpen = false;
    save();
    renderMusic(document.querySelector("#app-content"));
  }
  if (action === "music-open-player") {
    state.musicState.playerOpen = true;
    save();
    renderMusic(document.querySelector("#app-content"));
  }
  if (action === "music-close-player") {
    state.musicState.playerOpen = false;
    save();
    renderMusic(document.querySelector("#app-content"));
  }
  if (action === "new-message") {
    state.composerDraft = "";
    state.composerRecipient = "";
    renderNewMessage(document.querySelector("#app-content"));
  }
  if (action === "messages-root") {
    state.activeConversationId = "";
    state.messageActionId = "";
    renderMessages(document.querySelector("#app-content"));
  }
  if (action === "open-conversation") renderConversation(document.querySelector("#app-content"), actionButton.dataset.chat);
  if (action === "pick-recipient") {
    state.composerRecipient = actionButton.dataset.recipient || "";
    renderNewMessage(document.querySelector("#app-content"));
  }
  if (action === "send-new-message") {
    sendNewConversationMessage(document.querySelector("#new-message-recipient")?.value || "", document.querySelector("#new-message-body")?.value || "");
  }
  if (action === "toggle-auto-reply") {
    state.autoReply = !state.autoReply;
    save();
    renderMessages(document.querySelector("#app-content"));
  }
  if (action === "pin-conversation") {
    const conversation = findConversation(actionButton.dataset.chat);
    if (conversation) conversation.pinned = !conversation.pinned;
    save();
    renderMessages(document.querySelector("#app-content"));
  }
  if (action === "mute-conversation") {
    const conversation = findConversation(actionButton.dataset.chat);
    if (conversation) conversation.muted = !conversation.muted;
    save();
    renderMessages(document.querySelector("#app-content"));
  }
  if (action === "delete-conversation") {
    state.conversations = state.conversations.filter(item => item.id !== actionButton.dataset.chat);
    save();
    renderMessages(document.querySelector("#app-content"));
  }
  if (action === "message-menu") {
    state.messageActionId = state.messageActionId === actionButton.dataset.message ? "" : actionButton.dataset.message;
    renderConversation(document.querySelector("#app-content"), state.activeConversationId);
  }
  if (action === "copy-message") {
    const conversation = findConversation(state.activeConversationId);
    const message = conversation?.messages.find(item => item.id === state.messageActionId);
    if (message) navigator.clipboard?.writeText(message.content).catch(() => {});
    showHardwareOverlay("Message", "Copie");
    state.messageActionId = "";
    renderConversation(document.querySelector("#app-content"), state.activeConversationId);
  }
  if (action === "react-message") {
    const conversation = findConversation(state.activeConversationId);
    const message = conversation?.messages.find(item => item.id === state.messageActionId);
    if (message) message.reaction = message.reaction ? "" : "❤️";
    save();
    state.messageActionId = "";
    renderConversation(document.querySelector("#app-content"), state.activeConversationId);
  }
  if (action === "delete-message") {
    const conversation = findConversation(state.activeConversationId);
    if (conversation) {
      conversation.messages = conversation.messages.filter(item => item.id !== state.messageActionId);
      const last = conversation.messages[conversation.messages.length - 1];
      conversation.lastMessage = last?.content || "";
      conversation.lastMessageAt = last?.createdAt || new Date().toISOString();
    }
    save();
    state.messageActionId = "";
    renderConversation(document.querySelector("#app-content"), state.activeConversationId);
  }
  if (action === "message-call") {
    const conversation = findConversation(actionButton.dataset.chat);
    if (conversation) startPhoneCall({ name: conversation.contactName, number: conversation.contactNumber || "mobile" });
  }
  if (action === "message-info") showHardwareOverlay("Infos", "Contact");
  if (action === "message-plus") showHardwareOverlay("Messages", "Pieces jointes");
  if (action === "message-audio") showHardwareOverlay("Audio", "Simulation");
  if (action === "clock-tab") setClockTab(actionButton.dataset.tab);
  if (action === "clock-add-city") showHardwareOverlay("Horloge", "Ajout simule");
  if (action === "clock-add-alarm") addAlarm();
  if (action === "clock-toggle-alarm") {
    event.stopPropagation();
    toggleAlarm(actionButton.dataset.alarm);
  }
  if (action === "clock-edit-alarm") {
    state.clock.editingAlarmId = actionButton.dataset.alarm;
    save();
    renderClock(document.querySelector("#app-content"));
  }
  if (action === "clock-close-editor") {
    state.clock.editingAlarmId = "";
    renderClock(document.querySelector("#app-content"));
  }
  if (action === "clock-save-alarm") saveEditedAlarm();
  if (action === "clock-delete-alarm") deleteEditedAlarm();
  if (action === "clock-toggle-stopwatch") toggleStopwatch();
  if (action === "clock-lap") lapStopwatch();
  if (action === "clock-reset-stopwatch") resetStopwatch();
  if (action === "clock-toggle-timer") toggleTimer();
  if (action === "clock-cancel-timer") cancelTimer();
  if (action === "open-note" || action === "new-note") renderNoteEditor(document.querySelector("#app-content"));
  if (action === "open-mail") renderMailDetail(document.querySelector("#app-content"), actionButton.dataset.mail);
  if (action === "open-photo") renderPhotoViewer(document.querySelector("#app-content"), Number(actionButton.dataset.photo || 0));
  if (action === "camera-mode") {
    setCameraMode(actionButton.dataset.mode);
    return;
  }
  if (action === "camera-flash") {
    toggleCameraFlash();
    return;
  }
  if (action === "camera-live") {
    toggleCameraLive();
    return;
  }
  if (action === "camera-switch") {
    switchCameraFacing();
    return;
  }
  if (action === "camera-capture") {
    captureCameraPhoto();
    return;
  }
  if (action === "camera-video-toggle") {
    toggleCameraVideo();
    return;
  }
  if (action === "camera-gallery") {
    openCameraGallery();
    return;
  }
  if (action === "camera-gallery-close") {
    closeCameraGallery();
    return;
  }
  if (action === "camera-allow") {
    allowCameraAccess();
    return;
  }
  if (action === "nova-fill") {
    const input = document.querySelector("#nova-input");
    if (input) input.value = actionButton.dataset.command;
  }
  if (action === "toggle-control") actionButton.classList.toggle("active");
  if (action === "send-message") {
    const input = document.querySelector("#message-input");
    if (input.value.trim()) {
      sendMessageToConversation(state.activeConversationId, input.value.trim());
    }
  }
  if (action === "save-notes") {
    state.notes = document.querySelector("#notes-area").value;
    save();
    updateIsland("Notes");
    openApp("notes");
  }
  if (action === "clear-notes") {
    state.notes = "";
    save();
    openApp("notes");
  }
  if (action === "take-photo" || action === "add-photo") {
    captureCameraPhoto();
  }
  if (action === "go-url") document.querySelector("#browser-page").textContent = `Page simulee chargee: ${document.querySelector("#url-input").value}`;
  if (action === "fake-call") startPhoneCall({ name: "Lucas Bernard", number: "+33 6 19 42 11 08", incoming: true });
  if (action === "music-island") updateIsland("Musique");
  if (action === "nova-command") {
    const cmd = document.querySelector("#nova-input").value.trim().toLowerCase();
    const answers = { scan: "Scan local termine. Tout est stable.", status: "Systeme fluide, donnees locales sauvegardees.", shield: "Mode defense simule active." };
    document.querySelector("#nova-output").textContent = answers[cmd] || "Commande recue en simulation locale.";
    updateIsland("NOVA");
  }
  if (action === "save-passcode") {
    const input = document.querySelector("#new-passcode");
    const value = input?.value.trim() || "";
    const length = Number(state.settings.passcodeLength || 4);
    if (new RegExp(`^\\d{${length}}$`).test(value)) {
      state.settings.passcode = value;
      state.settings.passcodeEnabled = true;
      save();
      showHardwareOverlay("Code", "Modifie");
      renderSettingsDetail("passcode");
    } else {
      showHardwareOverlay("Code", `${length} chiffres`);
    }
  }
});

view.addEventListener("dblclick", event => {
  if (event.target.closest(".home")) {
    state.editMode = !state.editMode;
    renderHome();
  }
});

view.addEventListener("input", event => {
  if (event.target.id === "messages-search") {
    state.messageSearch = event.target.value;
    renderMessages(document.querySelector("#app-content"));
    document.querySelector("#messages-search")?.focus();
    return;
  }
  if (event.target.id === "message-input" || event.target.id === "new-message-body") {
    state.composerDraft = event.target.value;
    return;
  }
  if (event.target.id === "new-message-recipient") {
    state.composerRecipient = event.target.value;
    return;
  }
  if (["timer-hours", "timer-minutes", "timer-seconds"].includes(event.target.id)) {
    updateTimerDurationFromPicker();
    return;
  }
  if (event.target.matches("[data-action='set-icon-tint-input']")) {
    setHomeIconTint(event.target.value);
    return;
  }
  if (event.target.id === "phone-search") {
    state.phoneSearch = event.target.value;
    renderPhone(document.querySelector("#app-content"));
    const input = document.querySelector("#phone-search");
    if (input) input.focus();
    return;
  }
  if (event.target.id === "store-search-input") {
    state.appStore.query = event.target.value;
    renderStore(document.querySelector("#app-content"));
    document.querySelector("#store-search-input")?.focus();
    return;
  }
  if (event.target.id === "music-search-input") {
    state.musicState.search = event.target.value;
    save();
    renderMusic(document.querySelector("#app-content"));
    document.querySelector("#music-search-input")?.focus();
    return;
  }
  if (event.target.id === "music-seek-input") {
    musicSeek(event.target.value);
    return;
  }
  if (event.target.id === "music-volume-input") {
    musicSetVolume(event.target.value);
    return;
  }
  if (event.target.id !== "spotlight-input") return;
  const query = event.target.value.toLowerCase();
  const results = apps.filter(app => app.name.toLowerCase().includes(query)).slice(0, 8);
  document.querySelector("#spotlight-results").innerHTML = results.length
    ? results.map(app => `<button class="result-row" data-app="${app.id}">${escapeHtml(app.name)}</button>`).join("")
    : `<button class="result-row">Aucun resultat</button>`;
});

homeIndicator.addEventListener("click", () => {
  if (state.unlocked) renderHome();
  else renderPasscode();
});

sideVolumeUp.addEventListener("click", () => {
  setVolume(systemState.volume + 0.08);
});

sideVolumeDown.addEventListener("click", () => {
  setVolume(systemState.volume - 0.08);
});

sidePower.addEventListener("click", () => {
  if (state.unlocked) {
    showHardwareOverlay("Power", "Verrouillage");
    renderLock();
  } else {
    renderPasscode();
  }
});

island.addEventListener("click", event => {
  console.log("Dynamic Island onClick");
  logCallDebug("DYNAMIC ISLAND:");
  const actionButton = closestTarget(event, "[data-action]");
  if (actionButton) {
    const action = actionButton.dataset.action;
    if (action === "music-prev") musicPrevious();
    if (action === "music-toggle") musicToggle();
    if (action === "music-next") musicNext();
    if (action === "island-close") closeIslandNotification();
    if (action === "camera-island-open") {
      dynamicIslandCloseFull();
      openApp("camera");
    }
    if (action === "camera-video-stop") stopCameraVideo();
    if (action === "clock-island-open") {
      state.clock.tab = dynamicIslandState.currentActivity?.type === "timer" ? "timers" : "stopwatch";
      dynamicIslandCloseFull();
      openApp("clock");
    }
    if (action === "call-decline") endPhoneCall();
    if (action === "call-accept") {
      if (callState.status === "ringing") answerPhoneCall();
      else openCallScreen();
    }
    return;
  }
  const appButton = closestTarget(event, "[data-app]");
  if (appButton?.dataset.app) {
    openApp(appButton.dataset.app);
    closeIslandNotification();
    return;
  }
  if (callState.active) {
    dynamicIslandOpenFull();
    return;
  }
  if (dynamicIslandState.currentActivity?.appId === "clock") {
    state.clock.tab = dynamicIslandState.currentActivity.type === "timer" ? "timers" : "stopwatch";
    openApp("clock");
    return;
  }
  if (dynamicIslandState.currentActivity?.appId === "racing") {
    openApp("racing");
    return;
  }
  if (dynamicIslandState.currentActivity?.appId === "camera") {
    openApp("camera");
    return;
  }
  openIslandPanel();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") dynamicIslandCloseFull();
  if (event.key === "Escape") cancelDrag();
});

let touchStart = null;
let notificationSwipe = null;
let conversationSwipe = null;
let switcherSwipe = null;
let racingSwipe = null;
let cameraModeSwipe = null;
let racingControlSuppressClick = 0;
let activeSlider = null;
let homeLongPressTimer = null;
let homeDrag = null;
screen.addEventListener("pointerdown", event => {
  const racingControl = event.target.closest("[data-racing-control]");
  if (racingControl && state.currentApp === "racing") {
    event.preventDefault();
    event.stopPropagation();
    racingControlSuppressClick = Date.now() + 260;
    racingControl.setPointerCapture?.(event.pointerId);
    moveRacing(Number(racingControl.dataset.racingControl || 0));
    return;
  }
  const slider = event.target.closest("[data-slider]");
  if (slider) {
    activeSlider = slider;
    updateControlSlider(slider, event.clientY);
    return;
  }
  if (state.editMode && state.unlocked && !state.currentApp) {
    const dragTarget = event.target.closest(".app-icon-wrap[data-app], .home-added-widget[data-widget]");
    if (dragTarget && !event.target.closest(".delete-dot, [data-action], .home-sheet, .ios-confirm")) {
      startHomePointerDrag(event, dragTarget);
      return;
    }
  }
  touchStart = { x: event.clientX, y: event.clientY, time: Date.now() };
  if (state.unlocked && !state.currentApp && event.target.closest(".ios-home") && !event.target.closest("[data-action], .home-sheet, .ios-confirm")) {
    clearTimeout(homeLongPressTimer);
    homeLongPressTimer = setTimeout(() => {
      state.editMode = true;
      haptic("tap");
      renderHome();
    }, 520);
  }
  const notificationCard = event.target.closest(".ios-notification");
  notificationSwipe = notificationCard
    ? { card: notificationCard, x: event.clientX, y: event.clientY, time: Date.now() }
    : null;
  const conversationRow = event.target.closest(".message-row-wrap");
  conversationSwipe = conversationRow
    ? { row: conversationRow, x: event.clientX, y: event.clientY, time: Date.now() }
    : null;
  const switcherItem = event.target.closest(".app-switcher-item");
  switcherSwipe = switcherItem
    ? { item: switcherItem, x: event.clientX, y: event.clientY, time: Date.now() }
    : null;
  const racingRoad = event.target.closest(".racing-app");
  racingSwipe = racingRoad && !event.target.closest("[data-racing-control], [data-action], .racing-menu")
    ? { x: event.clientX, y: event.clientY, time: Date.now() }
    : null;
  const cameraModes = event.target.closest("#camera-modes");
  cameraModeSwipe = cameraModes
    ? { x: event.clientX, y: event.clientY, time: Date.now() }
    : null;
});

screen.addEventListener("pointerup", event => {
  clearTimeout(homeLongPressTimer);
  if (homeDrag) {
    finishHomePointerDrag(event);
    return;
  }
  if (activeSlider) {
    updateControlSlider(activeSlider, event.clientY);
    activeSlider = null;
    touchStart = null;
    return;
  }
  if (notificationSwipe) {
    const dxNotification = event.clientX - notificationSwipe.x;
    const dyNotification = Math.abs(event.clientY - notificationSwipe.y);
    if (dyNotification < 44 && Math.abs(dxNotification) > 74) {
      if (dxNotification < 0) {
        notificationSwipe.card.classList.add("show-actions");
        haptic("tap");
      } else {
        markNotification(notificationSwipe.card.dataset.notification);
      }
      notificationSwipe = null;
      touchStart = null;
      return;
    }
    notificationSwipe = null;
  }
  if (conversationSwipe) {
    const dxConversation = event.clientX - conversationSwipe.x;
    const dyConversation = Math.abs(event.clientY - conversationSwipe.y);
    if (dyConversation < 40 && Math.abs(dxConversation) > 58) {
      if (dxConversation < 0) {
        document.querySelectorAll(".message-row-wrap.show-actions").forEach(row => {
          if (row !== conversationSwipe.row) row.classList.remove("show-actions");
        });
        conversationSwipe.row.classList.add("show-actions");
        haptic("tap");
      } else {
        conversationSwipe.row.classList.remove("show-actions");
      }
      conversationSwipe = null;
      touchStart = null;
      return;
    }
    conversationSwipe = null;
  }
  if (switcherSwipe) {
    const dxSwitcher = event.clientX - switcherSwipe.x;
    const dySwitcher = event.clientY - switcherSwipe.y;
    if (Math.abs(dxSwitcher) < 80 && dySwitcher < -68) {
      const appId = switcherSwipe.item.dataset.switcherApp;
      switcherSwipe.item.classList.add("closing");
      setTimeout(() => {
        forceCloseApp(appId);
        renderSwitcher();
      }, 170);
      switcherSwipe = null;
      touchStart = null;
      return;
    }
    switcherSwipe = null;
  }
  if (racingSwipe && state.currentApp === "racing" && state.racing.status === "playing") {
    const dxRacing = event.clientX - racingSwipe.x;
    const dyRacing = Math.abs(event.clientY - racingSwipe.y);
    if (dyRacing < 64 && Math.abs(dxRacing) > 44) {
      moveRacing(dxRacing < 0 ? -1 : 1);
      racingSwipe = null;
      touchStart = null;
      return;
    }
    racingSwipe = null;
  }
  if (cameraModeSwipe && state.currentApp === "camera") {
    const dxCameraMode = event.clientX - cameraModeSwipe.x;
    const dyCameraMode = Math.abs(event.clientY - cameraModeSwipe.y);
    if (dyCameraMode < 42 && Math.abs(dxCameraMode) > 34) {
      const modes = ["slow", "video", "photo", "portrait", "pano"];
      const currentIndex = Math.max(0, modes.indexOf(state.camera.mode || "photo"));
      const nextIndex = Math.max(0, Math.min(modes.length - 1, currentIndex + (dxCameraMode < 0 ? 1 : -1)));
      setCameraMode(modes[nextIndex]);
      cameraModeSwipe = null;
      touchStart = null;
      return;
    }
    cameraModeSwipe = null;
  }
  if (!touchStart) return;
  const rect = screen.getBoundingClientRect();
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  const fast = Date.now() - touchStart.time < 750;
  const fromTop = touchStart.y < rect.top + 72;
  const fromBatteryArea = touchStart.x > rect.right - 132;
  const fromLeftTop = touchStart.y < rect.top + 72 && touchStart.x < rect.left + 132;
  if (dy < -58 && state.unlocked && Date.now() - touchStart.time >= 450) {
    dynamicIslandCloseFull();
    renderSwitcher();
    touchStart = null;
    return;
  }
  if (fast && dy < -70) {
    dynamicIslandCloseFull();
    if (state.unlocked) renderHome();
    else renderPasscode();
  }
  if (fast && dy > 70 && fromTop && fromBatteryArea) renderControlCenter();
  if (fast && dy > 70 && fromLeftTop) renderNotifications();
  if (fast && dx < -92 && !state.currentApp && state.unlocked) {
    state.homeLayout.page = "library";
    save();
    renderHome();
  }
  if (fast && dx > 92 && !state.currentApp && state.unlocked && state.homeLayout.page === "library") {
    state.homeLayout.page = "home";
    save();
    renderHome();
  }
  if (fast && dy > 70 && touchStart.y >= 190) renderSpotlight();
  if (fast && dx > 90 && state.currentApp) renderHome();
  touchStart = null;
});

screen.addEventListener("pointercancel", cancelDrag);
screen.addEventListener("mouseleave", cancelDrag);
window.addEventListener("blur", cancelDrag);

view.addEventListener("dragstart", event => {
  event.preventDefault();
});

view.addEventListener("dragover", event => {
  event.preventDefault();
});

view.addEventListener("drop", event => {
  event.preventDefault();
});

function startHomePointerDrag(event, element) {
  event.preventDefault();
  event.stopPropagation();
  clearTimeout(homeLongPressTimer);
  const rect = element.getBoundingClientRect();
  const type = element.dataset.widget ? "widget" : "app";
  homeDrag = {
    pointerId: event.pointerId,
    type,
    id: type === "app" ? element.dataset.app : element.dataset.widget,
    sourceZone: element.dataset.zone || "home",
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    ghost: element.cloneNode(true),
    placeholder: document.createElement("span"),
    dragging: false
  };
  element.classList.add("home-drag-source");
  homeDrag.placeholder.className = `home-drag-placeholder ${type}`;
  homeDrag.placeholder.style.width = `${rect.width}px`;
  homeDrag.placeholder.style.height = `${rect.height}px`;
  homeDrag.ghost.classList.add("home-drag-ghost");
  homeDrag.ghost.style.width = `${rect.width}px`;
  homeDrag.ghost.style.height = `${rect.height}px`;
  document.body.appendChild(homeDrag.ghost);
  element.after(homeDrag.placeholder);
  element.setPointerCapture?.(event.pointerId);
  updateHomePointerDrag(event);
}

function updateHomePointerDrag(event) {
  if (!homeDrag) return;
  event.preventDefault();
  const dx = Math.abs(event.clientX - homeDrag.startX);
  const dy = Math.abs(event.clientY - homeDrag.startY);
  homeDrag.dragging = homeDrag.dragging || dx > 2 || dy > 2;
  homeDrag.ghost.style.transform = `translate(${event.clientX - homeDrag.offsetX}px, ${event.clientY - homeDrag.offsetY}px)`;
  const target = homeDropTargetFromPoint(event.clientX, event.clientY);
  document.querySelectorAll(".home-drop-active").forEach(node => node.classList.remove("home-drop-active"));
  if (!target) return;
  target.zoneElement?.classList.add("home-drop-active");
  if (target.beforeElement && target.beforeElement !== homeDrag.placeholder) target.beforeElement.before(homeDrag.placeholder);
  else if (target.zoneElement && !target.beforeElement) target.zoneElement.appendChild(homeDrag.placeholder);
}

function homeDropTargetFromPoint(x, y) {
  const ghost = homeDrag?.ghost;
  if (ghost) ghost.style.pointerEvents = "none";
  const element = document.elementFromPoint(x, y);
  if (ghost) ghost.style.pointerEvents = "";
  const dock = element?.closest?.(".dock");
  const appsArea = element?.closest?.(".home-apps-area, .apps-grid");
  const widgetArea = element?.closest?.(".home-widget-layer");
  if (dock && homeDrag.type === "app") return { zone: "dock", zoneElement: dock, beforeElement: nearestHomeItem(dock, x, y, ".app-icon-wrap") };
  if (widgetArea && homeDrag.type === "widget") return { zone: "widgets", zoneElement: widgetArea, beforeElement: nearestHomeItem(widgetArea, x, y, ".home-added-widget") };
  if (appsArea) {
    const grid = document.querySelector(".apps-grid");
    if (homeDrag.type === "widget") return { zone: "widgets", zoneElement: document.querySelector(".home-widget-layer"), beforeElement: nearestHomeItem(document.querySelector(".home-widget-layer"), x, y, ".home-added-widget") };
    return { zone: "home", zoneElement: grid, beforeElement: nearestHomeItem(grid, x, y, ".app-icon-wrap") };
  }
  return null;
}

function nearestHomeItem(container, x, y, selector) {
  const items = [...container.querySelectorAll(selector)].filter(item => item !== homeDrag.placeholder && !item.classList.contains("home-drag-source"));
  let best = null;
  let bestDistance = Infinity;
  items.forEach(item => {
    const rect = item.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const distance = Math.hypot(cx - x, cy - y);
    if (distance < bestDistance) {
      best = item;
      bestDistance = distance;
    }
  });
  if (!best) return null;
  const rect = best.getBoundingClientRect();
  return y < rect.top + rect.height / 2 || x < rect.left + rect.width / 2 ? best : best.nextElementSibling;
}

function finishHomePointerDrag(event) {
  if (!homeDrag) return;
  const target = homeDropTargetFromPoint(event.clientX, event.clientY);
  const source = document.querySelector(".home-drag-source");
  const beforeApp = target?.beforeElement?.dataset?.app || "";
  const beforeWidget = target?.beforeElement?.dataset?.widget || "";
  if (target) {
    if (homeDrag.type === "app") moveHomeApp(homeDrag.id, target.zone === "dock" ? "dock" : "home", beforeApp);
    if (homeDrag.type === "widget" && target.zone !== "dock") moveHomeWidget(homeDrag.id, beforeWidget);
  }
  cleanupHomePointerDrag();
  if (!target && source) renderHome();
}

function cleanupHomePointerDrag() {
  document.querySelectorAll(".home-drop-active").forEach(node => node.classList.remove("home-drop-active"));
  document.querySelector(".home-drag-source")?.classList.remove("home-drag-source");
  homeDrag?.ghost?.remove();
  homeDrag?.placeholder?.remove();
  homeDrag = null;
  touchStart = null;
}

function cancelDrag() {
  clearTimeout(homeLongPressTimer);
  if (homeDrag) {
    cleanupHomePointerDrag();
    renderHome();
  }
}

screen.addEventListener("pointermove", event => {
  if (homeDrag) {
    updateHomePointerDrag(event);
    return;
  }
  if (touchStart && homeLongPressTimer && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 10) {
    clearTimeout(homeLongPressTimer);
    homeLongPressTimer = null;
  }
  if (activeSlider) {
    updateControlSlider(activeSlider, event.clientY);
    return;
  }
  const rect = screen.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
  const y = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
  wallpaper.style.transform = `scale(1.06) translate(${x}px, ${y}px)`;
});

function updateControlSlider(slider, clientY) {
  const rect = slider.getBoundingClientRect();
  const unit = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
  const value = Math.round(unit * 100);
  if (slider.dataset.slider === "brightness") setBrightness(value);
  if (slider.dataset.slider === "volume") setVolume(unit);
  const fill = slider.querySelector(".control-slider-fill");
  if (fill) fill.style.height = `${Math.max(0, Math.min(100, value))}%`;
}

setInterval(tickClock, 1000);
initDatabase().finally(() => {
  normalizeClockState();
  if (state.clock.stopwatch.running || state.clock.timer.running) startClockRuntime();
  syncNowPlayingFromMusicState();
  if (state.musicState.isPlaying) {
    musicStartRuntime();
    musicShowDynamicIsland(false);
  }
  normalizeCameraState();
  if (state.camera.recording) {
    state.camera.recordingStartedAt = state.camera.recordingStartedAt || Date.now();
    startCameraRecordingTimer();
    cameraIslandUpdate(false);
  }
  renderLock();
});
