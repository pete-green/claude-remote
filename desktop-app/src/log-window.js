const { BrowserWindow } = require('electron');

let logWindow = null;

function createLogWindow(logger) {
  if (logWindow) {
    logWindow.focus();
    return logWindow;
  }

  logWindow = new BrowserWindow({
    width: 900,
    height: 700,
    title: 'Claude Remote - Logs & Status',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  logWindow.on('closed', () => {
    logWindow = null;
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Claude Remote - Logs & Status</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Consolas', 'Monaco', monospace;
          background: #1a1a1a;
          color: #e0e0e0;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header {
          background: #2a2a2a;
          padding: 15px 20px;
          border-bottom: 2px solid #3a3a3a;
        }

        .header h1 {
          font-size: 18px;
          margin-bottom: 10px;
          color: #fff;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .status-item {
          background: #252525;
          padding: 10px;
          border-radius: 6px;
        }

        .status-label {
          font-size: 11px;
          color: #888;
          margin-bottom: 5px;
        }

        .status-value {
          font-size: 14px;
          font-weight: bold;
        }

        .status-connected {
          color: #10b981;
        }

        .status-disconnected {
          color: #ef4444;
        }

        .status-ready {
          color: #3b82f6;
        }

        .tabs {
          display: flex;
          background: #2a2a2a;
          border-bottom: 1px solid #3a3a3a;
        }

        .tab {
          padding: 12px 20px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          background: #333;
        }

        .tab.active {
          border-bottom-color: #3b82f6;
          color: #3b82f6;
        }

        .tab-content {
          flex: 1;
          overflow: hidden;
          display: none;
        }

        .tab-content.active {
          display: flex;
          flex-direction: column;
        }

        .logs-container {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          background: #1e1e1e;
        }

        .log-entry {
          margin-bottom: 2px;
          font-size: 12px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .log-entry.info {
          color: #60a5fa;
        }

        .log-entry.error {
          color: #f87171;
        }

        .log-entry.warn {
          color: #fbbf24;
        }

        .log-entry.debug {
          color: #a78bfa;
        }

        .controls {
          padding: 10px 15px;
          background: #2a2a2a;
          border-top: 1px solid #3a3a3a;
          display: flex;
          gap: 10px;
        }

        button {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        }

        button:hover {
          background: #2563eb;
        }

        button.secondary {
          background: #4b5563;
        }

        button.secondary:hover {
          background: #374151;
        }

        .auto-scroll-toggle {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .config-content {
          padding: 20px;
          overflow-y: auto;
        }

        .config-item {
          margin-bottom: 20px;
        }

        .config-label {
          font-size: 13px;
          color: #888;
          margin-bottom: 8px;
        }

        .config-value {
          background: #252525;
          padding: 10px;
          border-radius: 4px;
          font-size: 14px;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Claude Remote Control - Debug Console</h1>
        <div class="status-grid">
          <div class="status-item">
            <div class="status-label">Backend Connection</div>
            <div class="status-value" id="wsStatus">Checking...</div>
          </div>
          <div class="status-item">
            <div class="status-label">Claude Process</div>
            <div class="status-value" id="claudeStatus">Checking...</div>
          </div>
          <div class="status-item">
            <div class="status-label">Log File</div>
            <div class="status-value status-ready" id="logFile">Loading...</div>
          </div>
        </div>
      </div>

      <div class="tabs">
        <div class="tab active" onclick="switchTab('logs')">Live Logs</div>
        <div class="tab" onclick="switchTab('config')">Configuration</div>
      </div>

      <div class="tab-content active" id="logs-tab">
        <div class="logs-container" id="logsContainer"></div>
        <div class="controls">
          <button onclick="clearLogs()">Clear</button>
          <button class="secondary" onclick="refreshLogs()">Refresh</button>
          <button class="secondary" onclick="openLogFile()">Open Log File</button>
          <div class="auto-scroll-toggle">
            <input type="checkbox" id="autoScroll" checked>
            <label for="autoScroll">Auto-scroll</label>
          </div>
        </div>
      </div>

      <div class="tab-content" id="config-tab">
        <div class="config-content">
          <div class="config-item">
            <div class="config-label">Backend URL</div>
            <div class="config-value" id="configBackendUrl">-</div>
          </div>
          <div class="config-item">
            <div class="config-label">Working Directory</div>
            <div class="config-value" id="configWorkingDir">-</div>
          </div>
          <div class="config-item">
            <div class="config-label">Password Set</div>
            <div class="config-value" id="configPassword">-</div>
          </div>
          <div class="config-item">
            <div class="config-label">Auto-start</div>
            <div class="config-value" id="configAutoStart">-</div>
          </div>
        </div>
      </div>

      <script>
        const { ipcRenderer, shell } = require('electron');
        const config = require('./src/config');

        let logs = [];

        function switchTab(tab) {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

          event.target.classList.add('active');
          document.getElementById(tab + '-tab').classList.add('active');

          if (tab === 'config') {
            loadConfig();
          }
        }

        function addLog(logText) {
          logs.push(logText);

          const container = document.getElementById('logsContainer');
          const entry = document.createElement('div');
          entry.className = 'log-entry';

          if (logText.includes('[ERROR]')) {
            entry.classList.add('error');
          } else if (logText.includes('[WARN]')) {
            entry.classList.add('warn');
          } else if (logText.includes('[DEBUG]')) {
            entry.classList.add('debug');
          } else {
            entry.classList.add('info');
          }

          entry.textContent = logText;
          container.appendChild(entry);

          if (document.getElementById('autoScroll').checked) {
            container.scrollTop = container.scrollHeight;
          }
        }

        function clearLogs() {
          logs = [];
          document.getElementById('logsContainer').innerHTML = '';
        }

        function refreshLogs() {
          // Request fresh logs from main process
          ipcRenderer.send('get-logs');
        }

        function openLogFile() {
          const logFile = document.getElementById('logFile').textContent;
          shell.showItemInFolder(logFile);
        }

        function updateStatus(wsConnected, claudeRunning) {
          const wsStatus = document.getElementById('wsStatus');
          const claudeStatus = document.getElementById('claudeStatus');

          if (wsConnected) {
            wsStatus.textContent = 'Connected';
            wsStatus.className = 'status-value status-connected';
          } else {
            wsStatus.textContent = 'Disconnected';
            wsStatus.className = 'status-value status-disconnected';
          }

          if (claudeRunning) {
            claudeStatus.textContent = 'Running';
            claudeStatus.className = 'status-value status-connected';
          } else {
            claudeStatus.textContent = 'Stopped';
            claudeStatus.className = 'status-value status-disconnected';
          }
        }

        function loadConfig() {
          const cfg = config.getConfig();
          document.getElementById('configBackendUrl').textContent = cfg.backendUrl || 'Not set';
          document.getElementById('configWorkingDir').textContent = cfg.workingDirectory || 'Not set';
          document.getElementById('configPassword').textContent = cfg.password ? '••••••••' : 'Not set';
          document.getElementById('configAutoStart').textContent = cfg.autoStart ? 'Enabled' : 'Disabled';
        }

        // Listen for log updates
        ipcRenderer.on('log', (event, logText) => {
          addLog(logText);
        });

        ipcRenderer.on('status', (event, data) => {
          updateStatus(data.wsConnected, data.claudeRunning);
        });

        ipcRenderer.on('log-file', (event, logFile) => {
          document.getElementById('logFile').textContent = logFile;
        });

        ipcRenderer.on('logs-data', (event, logsText) => {
          clearLogs();
          logsText.split('\\n').forEach(line => {
            if (line.trim()) addLog(line);
          });
        });

        // Request initial data
        ipcRenderer.send('get-logs');
        ipcRenderer.send('get-status');
        ipcRenderer.send('get-log-file');
      </script>
    </body>
    </html>
  `;

  logWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  return logWindow;
}

module.exports = { createLogWindow };
