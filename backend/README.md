# Backend Relay Server

WebSocket relay server that routes messages between the desktop app and mobile PWA.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your password:
```bash
AUTH_PASSWORD=your-secure-password-here
PORT=8080
```

3. Run locally:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Deploy to Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect this GitHub repository
3. Railway will auto-detect Node.js and use `npm start`
4. Add environment variable in Railway dashboard:
   - `AUTH_PASSWORD`: Your secure password
5. Railway will provide a public URL (e.g., `your-app.railway.app`)

## Testing

You can test the WebSocket connection using `wscat`:

```bash
npm install -g wscat
wscat -c ws://localhost:8080

# Then send authentication:
{"type":"auth","password":"your-password","client_type":"mobile"}
```

## API Endpoints

- `GET /` - Status information (desktop/mobile connections)
- `GET /health` - Health check endpoint
- WebSocket endpoint at root path

## Message Protocol

### Authentication
```json
{
  "type": "auth",
  "password": "your-password",
  "client_type": "desktop" | "mobile"
}
```

### User Input (Mobile → Desktop)
```json
{
  "type": "user_input",
  "content": "command text",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Claude Output (Desktop → Mobile)
```json
{
  "type": "claude_output",
  "content": "response text",
  "timestamp": "2025-01-01T00:00:00.000Z"
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

### Heartbeat
```json
{"type": "ping"}
{"type": "pong"}
```
