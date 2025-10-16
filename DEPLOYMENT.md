# Deployment Guide

Step-by-step instructions for deploying the Claude Code Remote system.

## Prerequisites

- [ ] GitHub account
- [ ] Railway account (free tier: https://railway.app)
- [ ] Netlify account (free tier: https://netlify.com)
- [ ] Claude Code CLI installed on Windows PC
- [ ] Node.js 18+ installed on Windows PC

## Step 1: Prepare the Code

### 1.1 Create GitHub Repository

```bash
cd "C:\Users\Pete Green\Desktop\Claude Code Remote"
git init
git add .
git commit -m "Initial commit: Claude Code Remote system"
```

Create a new repository on GitHub (e.g., `claude-remote`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/claude-remote.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Select your `claude-remote` repository
5. Railway will detect Node.js automatically

### 2.2 Configure Environment Variables

1. In Railway project dashboard, click on the service
2. Go to "Variables" tab
3. Add variable:
   - **Variable Name**: `AUTH_PASSWORD`
   - **Value**: Create a strong password (20+ characters)
   - Example: `MySecurePassword2025!@#$%`
4. Click "Add"

### 2.3 Configure Root Directory

1. In Settings tab
2. Find "Root Directory"
3. Set to: `backend`
4. Save

### 2.4 Get Backend URL

1. Go to "Settings" tab
2. Find "Domains" section
3. Click "Generate Domain"
4. Railway will provide a URL like: `claude-remote-production.up.railway.app`
5. **IMPORTANT**: Your WebSocket URL will be: `wss://claude-remote-production.up.railway.app`
6. **Save this URL** - you'll need it for desktop app and PWA

### 2.5 Verify Deployment

1. Check the "Deployments" tab
2. Wait for deployment to complete (green checkmark)
3. Test with browser: `https://YOUR_URL.railway.app/health`
4. Should see: `{"status":"ok"}`

## Step 3: Configure and Install Desktop App

### 3.1 Install Dependencies

```bash
cd "C:\Users\Pete Green\Desktop\Claude Code Remote\desktop-app"
npm install
```

### 3.2 First Run

```bash
npm start
```

### 3.3 Configure via Settings

1. Look for the system tray icon (bottom-right of taskbar)
2. Right-click the icon → "Open Settings"
3. Enter configuration:
   - **Backend URL**: `wss://YOUR_URL.railway.app` (from Step 2.4)
   - **Password**: Same password you set in Railway
   - **Working Directory**: Your project directory (e.g., `C:\Projects\krinos`)
4. Click "Save Settings"
5. Close and restart the app

### 3.4 Verify Desktop App

1. System tray icon should show "Connected" when you right-click it
2. Check Railway logs to confirm desktop client connected:
   - Railway dashboard → Your service → "Logs" tab
   - Should see: "Desktop client authenticated"

### 3.5 Build Installer (Optional)

To create an installer for easy installation on other machines:

```bash
npm run build
```

Installer will be in `desktop-app/dist/` folder.

## Step 4: Deploy PWA to Netlify

### 4.1 Update Backend URL in PWA

**CRITICAL STEP**: Edit `pwa/chat.html`

Find line ~53:
```javascript
const BACKEND_URL = 'wss://your-app.railway.app';
```

Change to your Railway URL:
```javascript
const BACKEND_URL = 'wss://YOUR_URL.railway.app';
```

Save the file.

### 4.2 Commit and Push Changes

```bash
git add pwa/chat.html
git commit -m "Update PWA backend URL"
git push
```

### 4.3 Deploy to Netlify

1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Authorize Netlify to access your GitHub
5. Select your `claude-remote` repository
6. Configure build settings:
   - **Base directory**: `pwa`
   - **Build command**: (leave empty)
   - **Publish directory**: `./` or (leave empty)
7. Click "Deploy site"

### 4.4 Get PWA URL

1. Wait for deployment to complete
2. Netlify will provide a URL like: `https://random-name-123.netlify.app`
3. You can customize this:
   - Site settings → Domain management → Edit site name
   - Change to something like: `https://claude-remote-pete.netlify.app`

### 4.5 Test PWA

1. Open the Netlify URL on your phone's browser
2. You should see the login page
3. Enter your password (same as backend/desktop)
4. Should show "Connected" status
5. Try sending a test message

## Step 5: Install PWA on Mobile Device

### iOS (Safari)
1. Open PWA URL in Safari
2. Tap Share button (square with arrow)
3. Scroll down, tap "Add to Home Screen"
4. Tap "Add"
5. PWA icon appears on home screen

### Android (Chrome)
1. Open PWA URL in Chrome
2. Tap menu (three dots)
3. Tap "Install app" or "Add to Home Screen"
4. Tap "Install"
5. PWA icon appears on home screen

## Step 6: Test End-to-End

1. Make sure desktop app is running (check system tray)
2. Open PWA on mobile device
3. Login with password
4. Verify "Connected" status shows
5. Type a simple command: "What is the current date?"
6. You should see Claude's response appear in the chat

## Configuration Summary

After deployment, here's what you should have:

### Backend (Railway)
- URL: `wss://YOUR_URL.railway.app`
- Environment Variable: `AUTH_PASSWORD=YourSecurePassword`
- Status: Running ✓

### Desktop App (Windows)
- Location: `C:\Users\Pete Green\Desktop\Claude Code Remote\desktop-app`
- Config File: `C:\Users\YOUR_USERNAME\AppData\Roaming\claude-remote-desktop\config.json`
- Status: Running in system tray ✓
- Auto-start: Enabled ✓

### PWA (Netlify)
- URL: `https://YOUR_APP.netlify.app`
- Installed on mobile: ✓

## Maintenance

### Update Backend
1. Make changes to `backend/` code
2. Commit and push to GitHub
3. Railway auto-deploys

### Update Desktop App
1. Make changes to `desktop-app/` code
2. Rebuild: `npm run build`
3. Install new version

### Update PWA
1. Make changes to `pwa/` code
2. Commit and push to GitHub
3. Netlify auto-deploys
4. Mobile users: Refresh page to get updates

## Troubleshooting Deployment

### Railway deployment failed
- Check Railway logs for errors
- Verify `backend/package.json` is correct
- Verify root directory is set to `backend`
- Check environment variable is set

### Desktop app won't connect
- Verify backend URL starts with `wss://` (not `https://`)
- Check password matches Railway environment variable
- Verify Railway backend is running (check logs)
- Check Windows Firewall isn't blocking

### PWA won't load
- Check Netlify deploy logs for errors
- Verify base directory is `pwa`
- Check that files deployed correctly
- Try clearing browser cache

### PWA won't connect to backend
- Verify `BACKEND_URL` in `chat.html` is correct
- Must use `wss://` not `https://`
- Check browser console for errors
- Verify desktop app is connected to backend

## Security Checklist

- [ ] Strong password set (20+ characters)
- [ ] Railway environment variable is private
- [ ] Backend URL not shared publicly
- [ ] .gitignore includes .env files
- [ ] Config files not committed to Git
- [ ] Only trusted devices have the password

## Next Steps

Now that everything is deployed:

1. **Test thoroughly** with real Claude Code commands
2. **Bookmark PWA** on mobile device
3. **Set up auto-start** for desktop app (should be automatic)
4. **Monitor Railway usage** (free tier: 500 hours/month)
5. **Consider custom domain** for PWA (optional)

Enjoy controlling Claude Code from anywhere!
