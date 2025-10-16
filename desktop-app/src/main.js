const { app, Tray, Menu, dialog, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const TerminalManager = require('./terminal-manager');
const WebSocketClient = require('./websocket-client');
const config = require('./config');
const Logger = require('./logger');
const { createLogWindow } = require('./log-window');

let tray = null;
let terminalManager = null;
let wsClient = null;
let isConnected = false;
let logger = null;
let logWindow = null;

// Prevent app from quitting when all windows are closed
app.on('window-all-closed', () => {
  // Do nothing - keep app running in system tray
});

app.whenReady().then(() => {
  initializeApp();
});

async function initializeApp() {
  try {
    // Initialize logger first
    logger = new Logger();
    logger.info('='.repeat(50));
    logger.info('Claude Remote Control - Starting');
    logger.info('='.repeat(50));

    // Set up log forwarding to log window
    logger.onLog((logText) => {
      if (logWindow && !logWindow.isDestroyed()) {
        logWindow.webContents.send('log', logText);
      }
    });

    // Load configuration
    const cfg = config.getConfig();
    logger.info(`Config loaded: Backend=${cfg.backendUrl}, WorkDir=${cfg.workingDirectory}`);

    // Validate configuration
    if (!cfg.backendUrl || !cfg.password) {
      logger.error('Configuration missing - backend URL or password not set');
      showConfigError('Configuration missing. Please set backend URL and password.');
      return;
    }

    // Create system tray
    createTray();
    logger.info('System tray icon created');

    // Set auto-start
    if (cfg.autoStart) {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe')
      });
    }

    // Initialize Terminal Manager
    logger.info('Initializing Terminal Manager...');
    terminalManager = new TerminalManager(cfg.workingDirectory || process.cwd(), logger);

    // Set up output callback
    terminalManager.onOutput((data) => {
      if (wsClient && wsClient.isAuthenticated) {
        wsClient.send({
          type: 'claude_output',
          content: data,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Initialize WebSocket Client
    logger.info('Initializing WebSocket client...');
    wsClient = new WebSocketClient(cfg.backendUrl, cfg.password, logger);

    // Set up message handler
    wsClient.onMessage((message) => {
      if (message.type === 'user_input' && terminalManager) {
        logger.info(`Received user input: ${message.content}`);
        terminalManager.sendInput(message.content);
      }
    });

    // Set up connection status handler
    wsClient.onConnectionChange((connected) => {
      isConnected = connected;
      updateTrayMenu();

      if (connected) {
        // Start Terminal when connected
        if (!terminalManager.isRunning) {
          startTerminal();
        }
      }
    });

    // Connect to backend
    wsClient.connect();

  } catch (error) {
    console.error('Error initializing app:', error);
    showError('Failed to initialize app: ' + error.message);
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Claude Code Remote');
  updateTrayMenu();
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: isConnected ? '🟢 Connected' : '🔴 Disconnected',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'View Logs & Status',
      click: openLogWindow
    },
    {
      label: 'Open Settings',
      click: openSettings
    },
    {
      label: 'Reconnect',
      click: reconnect
    },
    {
      label: 'Restart Terminal',
      click: restartTerminal
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: exitApp
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function openLogWindow() {
  if (logger) {
    logWindow = createLogWindow(logger);

    // Set up IPC handlers for log window
    ipcMain.on('get-logs', (event) => {
      if (logger) {
        event.reply('logs-data', logger.getRecentLogs());
      }
    });

    ipcMain.on('get-status', (event) => {
      event.reply('status', {
        wsConnected: isConnected,
        claudeRunning: terminalManager ? terminalManager.isRunning : false
      });
    });

    ipcMain.on('get-log-file', (event) => {
      if (logger) {
        event.reply('log-file', logger.getLogFile());
      }
    });

    // Send status updates every 2 seconds
    setInterval(() => {
      if (logWindow && !logWindow.isDestroyed()) {
        logWindow.webContents.send('status', {
          wsConnected: isConnected,
          claudeRunning: terminalManager ? terminalManager.isRunning : false
        });
      }
    }, 2000);
  }
}

function startTerminal() {
  try {
    logger.info('Starting terminal...');
    terminalManager.start();

    // Send status to mobile clients
    if (wsClient && wsClient.isAuthenticated) {
      wsClient.send({
        type: 'status',
        status: 'ready',
        message: 'Terminal is ready'
      });
    }
  } catch (error) {
    logger.error(`Error starting terminal: ${error.message}`);
    showError('Failed to start terminal: ' + error.message);
  }
}

function reconnect() {
  if (wsClient) {
    logger.info('Manual reconnect triggered');
    wsClient.reconnect();
  }
}

function restartTerminal() {
  if (terminalManager) {
    logger.info('Restarting terminal...');
    terminalManager.restart();
  }
}

function openSettings() {
  const settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Create a simple settings page
  const settingsHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Claude Remote Settings</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 20px;
          background: #f5f5f5;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        input[type="text"], input[type="password"] {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        button:hover {
          background: #1d4ed8;
        }
        .info {
          background: #e0f2fe;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <h2>Settings</h2>
      <div class="info">
        After changing settings, restart the app for changes to take effect.
      </div>
      <div class="form-group">
        <label>Backend URL:</label>
        <input type="text" id="backendUrl" placeholder="wss://your-app.railway.app">
      </div>
      <div class="form-group">
        <label>Password:</label>
        <input type="password" id="password" placeholder="Your secure password">
      </div>
      <div class="form-group">
        <label>Working Directory:</label>
        <input type="text" id="workingDirectory" placeholder="C:\\Projects\\krinos">
      </div>
      <button onclick="saveSettings()">Save Settings</button>
      <button onclick="loadSettings()" style="background: #6b7280;">Load Current</button>

      <script>
        const { ipcRenderer } = require('electron');
        const config = require('./src/config');

        function loadSettings() {
          const cfg = config.getConfig();
          document.getElementById('backendUrl').value = cfg.backendUrl || '';
          document.getElementById('password').value = cfg.password || '';
          document.getElementById('workingDirectory').value = cfg.workingDirectory || '';
        }

        function saveSettings() {
          const cfg = {
            backendUrl: document.getElementById('backendUrl').value,
            password: document.getElementById('password').value,
            workingDirectory: document.getElementById('workingDirectory').value,
            autoStart: true
          };
          config.saveConfig(cfg);
          alert('Settings saved! Please restart the app.');
        }

        loadSettings();
      </script>
    </body>
    </html>
  `;

  settingsWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(settingsHtml));
}

function showConfigError(message) {
  dialog.showErrorBox('Configuration Error', message + '\n\nPlease check the config file at:\n' + config.getConfigPath());
  openSettings();
}

function showError(message) {
  dialog.showErrorBox('Error', message);
}

function exitApp() {
  if (terminalManager) {
    logger.info('Stopping terminal...');
    terminalManager.stop();
  }
  if (wsClient) {
    logger.info('Disconnecting WebSocket...');
    wsClient.disconnect();
  }
  logger.info('Exiting application');
  app.quit();
}
