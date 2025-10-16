const { app, Tray, Menu, dialog, BrowserWindow } = require('electron');
const path = require('path');
const ClaudeManager = require('./claude-manager');
const WebSocketClient = require('./websocket-client');
const config = require('./config');

let tray = null;
let claudeManager = null;
let wsClient = null;
let isConnected = false;

// Prevent app from quitting when all windows are closed
app.on('window-all-closed', () => {
  // Do nothing - keep app running in system tray
});

app.whenReady().then(() => {
  initializeApp();
});

async function initializeApp() {
  try {
    // Load configuration
    const cfg = config.getConfig();

    // Validate configuration
    if (!cfg.backendUrl || !cfg.password) {
      showConfigError('Configuration missing. Please set backend URL and password.');
      return;
    }

    // Create system tray
    createTray();

    // Set auto-start
    if (cfg.autoStart) {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe')
      });
    }

    // Initialize Claude Manager
    claudeManager = new ClaudeManager(cfg.workingDirectory || process.cwd());

    // Set up output callback
    claudeManager.onOutput((data) => {
      if (wsClient && wsClient.isAuthenticated) {
        wsClient.send({
          type: 'claude_output',
          content: data,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Initialize WebSocket Client
    wsClient = new WebSocketClient(cfg.backendUrl, cfg.password);

    // Set up message handler
    wsClient.onMessage((message) => {
      if (message.type === 'user_input' && claudeManager) {
        claudeManager.sendInput(message.content);
      }
    });

    // Set up connection status handler
    wsClient.onConnectionChange((connected) => {
      isConnected = connected;
      updateTrayMenu();

      if (connected) {
        // Start Claude Code when connected
        if (!claudeManager.isRunning) {
          startClaude();
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
      label: 'Open Settings',
      click: openSettings
    },
    {
      label: 'Reconnect',
      click: reconnect
    },
    {
      label: 'Restart Claude',
      click: restartClaude
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: exitApp
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function startClaude() {
  try {
    claudeManager.start();
    console.log('Claude Code process started');

    // Send status to mobile clients
    if (wsClient && wsClient.isAuthenticated) {
      wsClient.send({
        type: 'status',
        status: 'ready',
        message: 'Claude Code is ready'
      });
    }
  } catch (error) {
    console.error('Error starting Claude:', error);
    showError('Failed to start Claude Code: ' + error.message);
  }
}

function reconnect() {
  if (wsClient) {
    wsClient.reconnect();
  }
}

function restartClaude() {
  if (claudeManager) {
    claudeManager.restart();
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
  if (claudeManager) {
    claudeManager.stop();
  }
  if (wsClient) {
    wsClient.disconnect();
  }
  app.quit();
}
