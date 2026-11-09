const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const APP_URL = new URL(process.env.SHOPFLOW_DESKTOP_URL || 'https://shopflow-drc.onrender.com/app/');
const APP_HOST = APP_URL.hostname;
const OAUTH_HOSTS = new Set([
  'sgiyuxpzqyyquvvznomn.supabase.co',
  'accounts.google.com',
  'github.com',
  'www.facebook.com',
]);
const PARTITION = 'persist:shopflow';

app.setAppUserModelId('cd.shopflow.desktop');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    const window = BrowserWindow.getAllWindows()[0];
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
    const target = commandLine.find((value) => value.startsWith('https://'));
    if (target && isTrustedAppUrl(target) && window) void window.loadURL(target);
  });

  app.whenReady().then(createMainWindow);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

function isTrustedAppUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && parsed.hostname === APP_HOST;
  } catch {
    return false;
  }
}

function isTrustedOAuthUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && OAUTH_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function openExternal(rawUrl) {
  if (!/^https?:|^mailto:|^tel:|^whatsapp:/i.test(rawUrl)) return;
  void shell.openExternal(rawUrl).catch(() => {});
}

function protectNavigation(webContents) {
  webContents.setWindowOpenHandler(({ url }) => {
    if (isTrustedAppUrl(url) || isTrustedOAuthUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1080,
          height: 760,
          autoHideMenuBar: true,
          backgroundColor: '#f7f9fc',
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            partition: PARTITION,
          },
        },
      };
    }
    openExternal(url);
    return { action: 'deny' };
  });

  const guard = (event, rawUrl) => {
    if (isTrustedAppUrl(rawUrl) || isTrustedOAuthUrl(rawUrl)) return;
    event.preventDefault();
    openExternal(rawUrl);
  };
  webContents.on('will-navigate', guard);
  webContents.on('will-redirect', guard);
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f7f9fc',
    title: 'ShopFlow',
    icon: path.join(__dirname, 'assets', 'shopflow.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: false,
      partition: PARTITION,
    },
  });

  protectNavigation(window.webContents);
  window.webContents.on('did-create-window', (childWindow) => protectNavigation(childWindow.webContents));
  window.once('ready-to-show', () => window.show());
  window.webContents.on('did-fail-load', (_event, errorCode, _description, validatedUrl, isMainFrame) => {
    if (!isMainFrame || errorCode === -3 || validatedUrl?.startsWith('file:')) return;
    void window.loadFile(path.join(__dirname, 'offline.html')).catch(() => {});
  });
  window.webContents.on('render-process-gone', () => {
    if (!window.isDestroyed()) void window.loadFile(path.join(__dirname, 'offline.html')).catch(() => {});
  });

  void window.loadFile(path.join(__dirname, 'loading.html'))
    .then(() => window.loadURL(APP_URL.href))
    .catch(() => window.loadFile(path.join(__dirname, 'offline.html')));
}
