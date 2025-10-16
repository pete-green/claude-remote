# Claude Code Remote Controller

Control Claude Code CLI from your mobile device while it runs on your Windows PC with full system access.

## Architecture

This project consists of three components:

1. **Backend Relay Server** (Railway) - WebSocket server that routes messages
2. **Desktop App** (Windows) - Electron system tray app that wraps Claude Code CLI
3. **PWA** (Netlify) - Mobile-friendly web interface

### Data Flow

```
Mobile PWA → WebSocket → Backend Relay → Desktop App → Claude Code stdin
Claude Code stdout → Desktop App → Backend Relay → PWA → User sees output
```

## Quick Start

### 1. Deploy Backend to Railway

```bash
cd backend
npm install
```

1. Create a new project on [Railway](https://railway.app)
2. Push this repo to GitHub
3. Connect Railway to your GitHub repository
4. Set environment variable in Railway:
   - `AUTH_PASSWORD`: Your secure password (20+ characters recommended)
5. Railway will provide a URL like: `wss://your-app.railway.app`

### 2. Install Desktop App

```bash
cd desktop-app
npm install
npm start
```

First run:
1. Click system tray icon → Open Settings
2. Enter Railway backend URL (e.g., `wss://your-app.railway.app`)
3. Enter your password (same as Railway AUTH_PASSWORD)
4. Set working directory (e.g., `C:\Projects\krinos`)
5. Click Save

The app will auto-start with Windows.

### 3. Deploy PWA to Netlify

```bash
cd pwa
```

**IMPORTANT**: Update backend URL in `chat.html` (line 53):
```javascript
const BACKEND_URL = 'wss://your-app.railway.app'; // Update this!
```

Deploy:
1. Push to GitHub
2. Log in to [Netlify](https://netlify.com)
3. New site → Import from GitHub
4. Base directory: `pwa`
5. Deploy
6. Get URL: `https://your-app.netlify.app`

## Usage

1. Make sure desktop app is running (system tray icon visible)
2. Open PWA on your phone: `https://your-app.netlify.app`
3. Enter password
4. Type commands like: "Update the homepage and deploy to Netlify"
5. Watch Claude execute in real-time

## Project Structure

```
claude-remote/
├── backend/              # WebSocket relay server (Railway)
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── desktop-app/          # Electron system tray app (Windows)
│   ├── src/
│   │   ├── main.js
│   │   ├── claude-manager.js
│   │   ├── websocket-client.js
│   │   └── config.js
│   ├── assets/
│   ├── package.json
│   └── README.md
├── pwa/                  # Progressive Web App (Netlify)
│   ├── index.html
│   ├── chat.html
│   ├── app.js
│   ├── websocket.js
│   ├── styles.css
│   ├── manifest.json
│   ├── service-worker.js
│   └── README.md
├── README.md
└── .gitignore
```

## Configuration

### Backend (Railway)
- `AUTH_PASSWORD`: Shared password for authentication
- `PORT`: Server port (default: 8080)

### Desktop App
Configuration stored in: `C:\Users\<username>\AppData\Roaming\claude-remote-desktop\config.json`

```json
{
  "backendUrl": "wss://your-app.railway.app",
  "password": "your-secure-password",
  "workingDirectory": "C:\\Projects\\krinos",
  "autoStart": true
}
```

### PWA
Update `BACKEND_URL` in `pwa/chat.html` before deploying.

## Message Protocol

### Authentication
```json
{
  "type": "auth",
  "password": "string",
  "client_type": "desktop" | "mobile"
}
```

### User Input (Mobile → Desktop)
```json
{
  "type": "user_input",
  "content": "command text",
  "timestamp": "ISO 8601"
}
```

### Claude Output (Desktop → Mobile)
```json
{
  "type": "claude_output",
  "content": "response text",
  "timestamp": "ISO 8601"
}
```

### Status Updates
```json
{
  "type": "status",
  "status": "ready" | "processing" | "error" | "disconnected",
  "message": "optional message"
}
```

## Security

- **Authentication**: Simple shared password over WSS (encrypted WebSocket)
- **Network**: All PWA connections use WSS (WebSocket Secure)
- **Password**: Use strong, unique password (20+ characters)
- **Access**: Desktop app has full system access (intentional design)
- **Private**: Keep backend URL and password private

## Troubleshooting

### Desktop app won't connect
- Check internet connection
- Verify Railway backend is running
- Check backend URL in settings (should start with `wss://`)
- Verify password matches Railway environment variable
- Check Windows Firewall

### PWA shows disconnected
- Check mobile device internet connection
- Verify desktop app is running and connected
- Check browser console for errors
- Try logging out and back in

### Claude Code not responding
- Make sure Claude Code CLI is installed: `claude --version`
- Verify working directory exists and is accessible
- Run `claude` manually to check authentication
- Check Task Manager for zombie processes
- Restart desktop app

### Messages not appearing
- Check WebSocket connection status
- Verify backend is routing messages (check Railway logs)
- Check browser console for errors
- Try refreshing PWA
- Restart desktop app

## Development

### Backend (Local)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your password
npm run dev
```

### Desktop App (Local)
```bash
cd desktop-app
npm install
npm start
```

### PWA (Local)
```bash
cd pwa
npx http-server -p 8000
```

## Building

### Desktop App Installer
```bash
cd desktop-app
npm run build
```

Creates installer in `desktop-app/dist/`

## Requirements

- Node.js 18+
- Claude Code CLI installed and authenticated
- Windows 10/11 (for desktop app)
- Modern web browser (for PWA)
- Railway account (free tier works)
- Netlify account (free tier works)
- GitHub account

## License

MIT

## Future Enhancements

- Multiple project support
- Command history
- File browser in PWA
- Voice input
- Push notifications
- Multi-user support
- Session persistence
- Logs viewer
