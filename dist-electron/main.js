import require$$0, { BrowserWindow, app, desktopCapturer, screen, ipcMain, shell, protocol, net } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
function createWindow() {
  const win2 = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "logo.png"),
    minWidth: 1200,
    minHeight: 600,
    width: 1200,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      nodeIntegration: true,
      contextIsolation: true
    },
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    transparent: true,
    resizable: false
  });
  win2.setMenu(null);
  if (VITE_DEV_SERVER_URL) {
    win2.loadURL(`${VITE_DEV_SERVER_URL}`);
  } else {
    win2.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  return win2;
}
const appHandler = () => {
  app.commandLine.appendSwitch("disable-features", "WindowsGraphicsCapture");
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
};
async function getScreenSources() {
  const sources = await desktopCapturer.getSources({
    types: ["screen", "window"],
    thumbnailSize: { width: 300, height: 200 },
    fetchWindowIcons: true
  });
  return sources.map((s) => {
    return {
      id: s.id,
      name: s.name,
      icon: s.appIcon && s.appIcon.toDataURL(),
      thumbnail: s.thumbnail.toDataURL(),
      displayId: s.display_id
    };
  });
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function animateWindowBounds(win2, target, duration = 220) {
  return new Promise((resolve) => {
    const start = win2.getBounds();
    const startTime = Date.now();
    const tick = () => {
      if (win2.isDestroyed()) return resolve();
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(t);
      win2.setBounds({
        x: Math.round(start.x + (target.x - start.x) * eased),
        y: Math.round(start.y + (target.y - start.y) * eased),
        width: Math.round(start.width + (target.width - start.width) * eased),
        height: Math.round(start.height + (target.height - start.height) * eased)
      });
      if (t < 1) {
        setTimeout(tick, 1e3 / 60);
      } else {
        resolve();
      }
    };
    tick();
  });
}
async function setWindowBounds(sourceId, win2) {
  const displays = screen.getAllDisplays();
  const display = displays.find((d) => d.id.toString() === sourceId);
  if (!display || !win2) return;
  const { x, y, width, height } = display.bounds;
  await animateWindowBounds(win2, { x, y, width, height });
}
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 600;
const ipcHandler = (win2) => {
  let isMaximized = false;
  const maximizeToFullscreen = async () => {
    const display = screen.getDisplayMatching(win2.getBounds());
    await animateWindowBounds(win2, display.workArea);
    isMaximized = true;
    win2.webContents.send("window:maximized-change", true);
  };
  const restoreToDefault = async () => {
    const display = screen.getDisplayMatching(win2.getBounds());
    const { x, y, width, height } = display.workArea;
    await animateWindowBounds(win2, {
      x: x + Math.round((width - DEFAULT_WIDTH) / 2),
      y: y + Math.round((height - DEFAULT_HEIGHT) / 2),
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT
    });
    isMaximized = false;
    win2.webContents.send("window:maximized-change", false);
  };
  ipcMain.handle("screen:getSources", getScreenSources);
  ipcMain.handle("screen:setSource", async (_, sourceId) => {
    await setWindowBounds(sourceId, win2);
  });
  ipcMain.handle("window:minimize", () => win2 == null ? void 0 : win2.minimize());
  ipcMain.handle("window:close", () => win2 == null ? void 0 : win2.close());
  ipcMain.handle("window:maximize", async () => {
    if (!win2) return;
    if (isMaximized) {
      await restoreToDefault();
    } else {
      await maximizeToFullscreen();
    }
  });
  ipcMain.handle("window:isMaximized", () => isMaximized);
  ipcMain.handle("window:toggleMode", async (_, mode) => {
    if (!win2) return;
    if (mode === "overlay") {
      win2.setResizable(false);
      const { x, y, width, height } = win2.getBounds();
      win2.setBounds({ x, y, width, height });
      win2.setAlwaysOnTop(true, "screen-saver");
    } else {
      win2.setResizable(true);
      win2.setAlwaysOnTop(false);
      if (!isMaximized) {
        await maximizeToFullscreen();
      }
    }
  });
  ipcMain.handle("open-external", async (_event, url) => {
    await shell.openExternal(url);
  });
};
var dist = { exports: {} };
var renderer = {};
var config = {};
Object.defineProperty(config, "__esModule", { value: true });
config.buildFeatureFlags = config.loopbackAudioTypes = config.featureSwitchKey = config.defaultSourcesOptions = config.ipcEvents = void 0;
config.ipcEvents = {
  enableLoopbackAudio: "enable-loopback-audio",
  disableLoopbackAudio: "disable-loopback-audio"
};
config.defaultSourcesOptions = { types: ["screen"] };
config.featureSwitchKey = "enable-features";
config.loopbackAudioTypes = {
  loopback: "loopback",
  loopbackWithMute: "loopbackWithMute"
};
const defaultFeatureFlags = {
  pulseaudioLoopbackForScreenShare: "PulseaudioLoopbackForScreenShare",
  macLoopbackAudioForScreenShare: "MacLoopbackAudioForScreenShare"
};
const coreAudioTapFeatureFlags = {
  macCoreAudioTapSystemAudioLoopbackOverride: "MacCatapSystemAudioLoopbackCapture"
};
const screenCaptureKitFeatureFlags = {
  macScreenCaptureKitSystemAudioLoopbackOverride: "MacSckSystemAudioLoopbackOverride"
};
const buildFeatureFlags = ({ otherEnabledFeatures, forceCoreAudioTap }) => {
  const featureFlags = [...Object.values(defaultFeatureFlags), ...otherEnabledFeatures ?? []];
  if (forceCoreAudioTap) {
    featureFlags.push(coreAudioTapFeatureFlags.macCoreAudioTapSystemAudioLoopbackOverride);
  } else {
    featureFlags.push(screenCaptureKitFeatureFlags.macScreenCaptureKitSystemAudioLoopbackOverride);
  }
  return featureFlags.join(",");
};
config.buildFeatureFlags = buildFeatureFlags;
Object.defineProperty(renderer, "__esModule", { value: true });
renderer.getLoopbackAudioMediaStream = void 0;
const electron_1$1 = require$$0;
const config_js_1$1 = config;
const getLoopbackAudioMediaStream = async (options = {}) => {
  const { removeVideo = true } = options;
  await electron_1$1.ipcRenderer.invoke(config_js_1$1.ipcEvents.enableLoopbackAudio);
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  if (removeVideo) {
    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.stop();
      stream.removeTrack(track);
    });
  }
  await electron_1$1.ipcRenderer.invoke(config_js_1$1.ipcEvents.disableLoopbackAudio);
  return stream;
};
renderer.getLoopbackAudioMediaStream = getLoopbackAudioMediaStream;
var main = {};
Object.defineProperty(main, "__esModule", { value: true });
main.initMain = void 0;
const electron_1 = require$$0;
const config_js_1 = config;
const initMain = (options = {}) => {
  var _a;
  const { forceCoreAudioTap = false, loopbackWithMute = false, onAfterGetSources, sessionOverride, sourcesOptions = config_js_1.defaultSourcesOptions } = options;
  const otherEnabledFeatures = (_a = electron_1.app.commandLine.getSwitchValue(config_js_1.featureSwitchKey)) == null ? void 0 : _a.split(",");
  if (electron_1.app.commandLine.hasSwitch(config_js_1.featureSwitchKey)) {
    electron_1.app.commandLine.removeSwitch(config_js_1.featureSwitchKey);
  }
  const currentFeatureFlags = (0, config_js_1.buildFeatureFlags)({
    otherEnabledFeatures,
    forceCoreAudioTap
  });
  electron_1.app.commandLine.appendSwitch(config_js_1.featureSwitchKey, currentFeatureFlags);
  electron_1.ipcMain.handle(config_js_1.ipcEvents.enableLoopbackAudio, () => {
    const session = sessionOverride || electron_1.session.defaultSession;
    session.setDisplayMediaRequestHandler(async (_, callback) => {
      let sources;
      try {
        sources = await electron_1.desktopCapturer.getSources(sourcesOptions);
        if (onAfterGetSources) {
          sources = onAfterGetSources(sources);
        }
      } catch {
        throw new Error(`Failed to get sources for system audio loopback capture.`);
      }
      if (sources.length === 0) {
        throw new Error(`No sources found for system audio loopback capture.`);
      }
      callback({
        video: sources[0],
        audio: loopbackWithMute ? config_js_1.loopbackAudioTypes.loopbackWithMute : config_js_1.loopbackAudioTypes.loopback
      });
    });
  });
  electron_1.ipcMain.handle(config_js_1.ipcEvents.disableLoopbackAudio, () => {
    const session = sessionOverride || electron_1.session.defaultSession;
    session.setDisplayMediaRequestHandler(null);
  });
};
main.initMain = initMain;
(function(module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.initMain = exports.getLoopbackAudioMediaStream = void 0;
  const renderer_js_1 = renderer;
  Object.defineProperty(exports, "getLoopbackAudioMediaStream", { enumerable: true, get: function() {
    return renderer_js_1.getLoopbackAudioMediaStream;
  } });
  const main_js_1 = main;
  Object.defineProperty(exports, "initMain", { enumerable: true, get: function() {
    return main_js_1.initMain;
  } });
  if (process.type === "renderer") {
    module.exports = { getLoopbackAudioMediaStream: renderer_js_1.getLoopbackAudioMediaStream };
  } else {
    module.exports = { initMain: main_js_1.initMain };
  }
})(dist, dist.exports);
var distExports = dist.exports;
const EYE_MEDIA_SCHEME = "eye-media";
function getRecordingsRoot() {
  return path.join(app.getPath("userData"), "recordings");
}
function toEyeMediaUrl(filePath) {
  return `${EYE_MEDIA_SCHEME}://local/?path=${encodeURIComponent(filePath)}`;
}
function registerEyeMediaScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: EYE_MEDIA_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        bypassCSP: true,
        supportFetchAPI: true,
        stream: true,
        corsEnabled: true
      }
    }
  ]);
}
function setupEyeMediaProtocol() {
  const recordingsRoot = path.resolve(getRecordingsRoot());
  protocol.handle(EYE_MEDIA_SCHEME, (request) => {
    try {
      const url = new URL(request.url);
      const filePath = url.searchParams.get("path");
      if (!filePath) {
        return new Response("Missing path", { status: 400 });
      }
      const resolved = path.resolve(filePath);
      const root = recordingsRoot.toLowerCase();
      if (!resolved.toLowerCase().startsWith(root)) {
        return new Response("Forbidden", { status: 403 });
      }
      if (!fs.existsSync(resolved)) {
        return new Response("Not found", { status: 404 });
      }
      return net.fetch(pathToFileURL(resolved).toString());
    } catch (err) {
      return new Response("Internal error", { status: 500 });
    }
  });
}
const saveTrack = async (_, payload) => {
  const { type, buffer, sessionId, ext = "webm" } = payload;
  const sessionDir = path.join(app.getPath("userData"), "recordings", sessionId);
  fs.mkdirSync(sessionDir, { recursive: true });
  const filePath = path.join(sessionDir, `${type}.${ext}`);
  fs.writeFileSync(filePath, Buffer.from(buffer));
  return { filePath };
};
function getDisplaysMeta() {
  const all = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const map = (d) => ({
    id: d.id,
    label: d.label ?? `Display ${d.id}`,
    bounds: d.bounds,
    workArea: d.workArea,
    scaleFactor: d.scaleFactor,
    rotation: d.rotation,
    isPrimary: d.id === primary.id
  });
  return {
    displays: all.map(map),
    primaryDisplay: map(primary)
  };
}
const BUTTON_MAP = { 1: "left", 2: "right", 3: "middle" };
let uIOhook = null;
try {
  uIOhook = require("uiohook-napi").uIOhook;
} catch {
  console.warn("[mouse] uiohook-napi not found — clicks/scroll will not be tracked");
}
let mouseInterval = null;
let mouseEvents = [];
let sessionStartTime = 0;
let lastX = -1;
let lastY = -1;
const POLL_MS = 50;
function now() {
  return Date.now() - sessionStartTime;
}
function startMouseTracking() {
  mouseEvents = [];
  sessionStartTime = Date.now();
  lastX = -1;
  lastY = -1;
  mouseInterval = setInterval(() => {
    const { x, y } = screen.getCursorScreenPoint();
    if (x !== lastX || y !== lastY) {
      mouseEvents.push({ t: now(), x, y, type: "move" });
      lastX = x;
      lastY = y;
    }
  }, POLL_MS);
  if (uIOhook) {
    uIOhook.removeAllListeners();
    uIOhook.on("mousedown", (e) => {
      mouseEvents.push({ t: now(), x: e.x, y: e.y, type: "mousedown", button: BUTTON_MAP[e.button] ?? "left" });
    });
    uIOhook.on("mouseup", (e) => {
      mouseEvents.push({ t: now(), x: e.x, y: e.y, type: "mouseup", button: BUTTON_MAP[e.button] ?? "left" });
      mouseEvents.push({ t: now(), x: e.x, y: e.y, type: "click", button: BUTTON_MAP[e.button] ?? "left" });
    });
    uIOhook.on("wheel", (e) => {
      mouseEvents.push({
        t: now(),
        x: e.x,
        y: e.y,
        type: "scroll",
        scrollDelta: { x: 0, y: e.rotation * e.delta }
      });
    });
    uIOhook.start();
  }
}
function stopMouseTracking() {
  if (mouseInterval) {
    clearInterval(mouseInterval);
    mouseInterval = null;
  }
  if (uIOhook) {
    uIOhook.stop();
    uIOhook.removeAllListeners();
  }
  const result = [...mouseEvents];
  result.sort((a, b) => a.t - b.t);
  mouseEvents = [];
  return result;
}
function resetSession() {
  mouseEvents = [];
  sessionStartTime = Date.now();
  return sessionStartTime;
}
const startRecord = async () => {
  startMouseTracking();
  const { displays, primaryDisplay } = getDisplaysMeta();
  return {
    sessionId: `session_${Date.now()}`,
    displays,
    primaryDisplay,
    startedAt: Date.now()
  };
};
const syncTimeline = async () => {
  const startedAt = resetSession();
  return {
    startedAt
  };
};
const finalise = async (_, payload) => {
  const { sessionId, config: config2, savedPaths, thumbnailPaths, durationMs } = payload;
  const collectedEvents = stopMouseTracking();
  const { displays, primaryDisplay } = getDisplaysMeta();
  const toUrl = (p) => p ? toEyeMediaUrl(p) : null;
  const assets = {
    camera: toUrl(savedPaths.camera),
    mic: toUrl(savedPaths.mic),
    speaker: toUrl(savedPaths.speaker),
    screen: toUrl(savedPaths.screen),
    cameraThumbnail: toUrl(thumbnailPaths == null ? void 0 : thumbnailPaths.camera),
    screenThumbnail: toUrl(thumbnailPaths == null ? void 0 : thumbnailPaths.screen)
  };
  const meta = { startedAt: sessionStartTime, durationMs, displays, primaryDisplay };
  const result = { config: config2, assets, meta, mouseEvents: collectedEvents };
  const sessionDir = path.join(app.getPath("userData"), "recordings", sessionId);
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, "manifest.json"), JSON.stringify(result, null, 2));
  return { sessionId, ...result };
};
const saveThumbnail = async (_, payload) => {
  const { type, buffer, sessionId } = payload;
  const sessionDir = path.join(app.getPath("userData"), "recordings", sessionId);
  fs.mkdirSync(sessionDir, { recursive: true });
  const filePath = path.join(sessionDir, `${type}-thumb.jpg`);
  fs.writeFileSync(filePath, Buffer.from(buffer));
  return { filePath };
};
const recorder = () => {
  ipcMain.handle("record:saveTrack", saveTrack);
  ipcMain.handle("record:start", startRecord);
  ipcMain.handle("record:syncTimeline", syncTimeline);
  ipcMain.handle("record:finalise", finalise);
  ipcMain.handle("record:saveThumbnail", saveThumbnail);
};
const listRecord = async () => {
  const root = getRecordingsRoot();
  if (!fs.existsSync(root)) return [];
  const entries = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory());
  const items = [];
  for (const entry of entries) {
    const manifestPath = path.join(root, entry.name, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      items.push({
        sessionId: entry.name,
        startedAt: manifest.meta.startedAt,
        durationMs: manifest.meta.durationMs,
        hasScreen: !!manifest.assets.screen,
        hasCamera: !!manifest.assets.camera,
        hasMic: !!manifest.assets.mic,
        hasSpeaker: !!manifest.assets.speaker
      });
    } catch {
    }
  }
  return items.sort((a, b) => b.startedAt - a.startedAt);
};
function assetUrlForTrack(sessionDir, track) {
  const filePath = path.join(sessionDir, `${track}.webm`);
  return fs.existsSync(filePath) ? toEyeMediaUrl(filePath) : null;
}
function resolveAssets(sessionDir, raw) {
  return {
    screen: raw.screen ? assetUrlForTrack(sessionDir, "screen") : null,
    camera: raw.camera ? assetUrlForTrack(sessionDir, "camera") : null,
    mic: raw.mic ? assetUrlForTrack(sessionDir, "mic") : null,
    speaker: raw.speaker ? assetUrlForTrack(sessionDir, "speaker") : null
  };
}
const loadRecord = async (_, sessionId) => {
  const sessionDir = path.join(getRecordingsRoot(), sessionId);
  const manifestPath = path.join(sessionDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Recording not found: ${sessionId}`);
  }
  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const assets = resolveAssets(sessionDir, raw.assets);
  return { sessionId, ...raw, assets };
};
const loader = () => {
  ipcMain.handle("recordings:list", listRecord);
  ipcMain.handle("recordings:load", loadRecord);
};
let win;
distExports.initMain();
registerEyeMediaScheme();
app.whenReady().then(() => {
  win = createWindow();
  appHandler();
  ipcHandler(win);
  recorder();
  loader();
  setupEyeMediaProtocol();
});
