# Desktop App

Electron system tray application that wraps Claude Code CLI and connects to the backend relay.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the app:
   - Run the app once: `npm start`
   - Click on the system tray icon → Open Settings
   - Enter your backend URL (from Railway)
   - Enter your password
   - Set your working directory (e.g., `C:\Projects\krinos`)
   - Click Save

3. The configuration is stored at:
   - Windows: `C:\Users\<username>\AppData\Roaming\claude-remote-desktop\config.json`

## Running

Development mode:
```bash
npm start
```

Build installer:
```bash
npm run build
```

This creates an installer in the `dist/` folder.

## Features

- Runs in system tray (no window)
- Auto-starts with Windows
- Spawns Claude Code process
- Captures all output in real-time
- Forwards commands from mobile app
- Auto-reconnects to backend
- Auto-restarts Claude if it crashes

## System Tray Menu

- Connection status indicator
- Open Settings
- Reconnect (manual reconnect to backend)
- Restart Claude (restart Claude Code process)
- Exit (stop everything and quit)

## Troubleshooting

**App won't connect:**
- Check your internet connection
- Verify the backend URL is correct (should start with `wss://`)
- Verify password matches the backend
- Check Windows Firewall isn't blocking the connection

**Claude Code won't start:**
- Make sure Claude Code CLI is installed: `claude --version`
- Verify the working directory exists and is accessible
- Make sure Claude Code is authenticated: run `claude` manually first
- Check Task Manager for zombie `claude` processes

**Configuration issues:**
- Delete config file and reconfigure: `C:\Users\<username>\AppData\Roaming\claude-remote-desktop\config.json`
- Check the console output when running `npm start`

## Auto-Start

The app is configured to start automatically when Windows boots. To disable:
1. Open Settings
2. Uncheck "Auto-start"
3. Restart the app

Or manually via Windows:
- Task Manager → Startup tab → Disable "Claude Remote"
