# PWA Mobile Interface

Progressive Web App for controlling Claude Code from mobile devices.

## Setup

### Before Deployment

1. Update the backend URL in `chat.html`:
   ```javascript
   const BACKEND_URL = 'wss://your-app.railway.app'; // Update this!
   ```

### Deploy to Netlify

1. Push the `pwa/` directory to GitHub
2. Log in to [Netlify](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select your repository
5. Configure build settings:
   - **Base directory**: `pwa`
   - **Build command**: (leave empty)
   - **Publish directory**: (leave empty or `./`)
6. Click "Deploy site"
7. Netlify will provide a URL like: `https://your-app.netlify.app`

### Optional: Custom Domain

1. In Netlify dashboard → Site settings → Domain management
2. Click "Add custom domain"
3. Follow instructions to configure DNS

## Testing Locally

You can test the PWA locally using a simple HTTP server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open: `http://localhost:8000`

**Note**: WebSocket connections will not work locally unless you also run the backend locally.

## Features

- **Progressive Web App**: Install on mobile home screen
- **Offline Support**: Service worker caches static assets
- **Responsive Design**: Works on all screen sizes
- **Dark Theme**: Easy on the eyes
- **Touch Optimized**: Large buttons, smooth scrolling
- **Auto-reconnect**: Handles network issues gracefully

## Usage

1. Open the PWA URL on your mobile device
2. Enter your password (same as configured on backend/desktop)
3. You should see "Connected" status
4. Type commands and see Claude's responses in real-time

## Installing as PWA

### iOS (Safari)
1. Open the site in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the site in Chrome
2. Tap the menu (three dots)
3. Tap "Install app" or "Add to Home Screen"
4. Tap "Install"

## Troubleshooting

**Can't connect:**
- Verify the backend URL is correct in `chat.html`
- Make sure your desktop app is running and connected
- Check that you're using the correct password
- Verify Railway backend is deployed and running

**PWA won't install:**
- Make sure you're using HTTPS (Netlify provides this automatically)
- Try clearing browser cache
- Make sure `manifest.json` and service worker are loading

**Messages not appearing:**
- Check browser console for errors (Developer Tools)
- Verify WebSocket connection is established
- Try logging out and back in
- Check desktop app is running

## Files

- `index.html` - Login page
- `chat.html` - Main chat interface
- `app.js` - Application utilities
- `websocket.js` - WebSocket client class
- `styles.css` - Styling
- `manifest.json` - PWA manifest
- `service-worker.js` - Service worker for offline support
