const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

if (!AUTH_PASSWORD) {
  console.error('ERROR: AUTH_PASSWORD environment variable is not set!');
  process.exit(1);
}

// State management
let desktopClient = null;
const mobileClients = new Set();

// Helper function to send JSON message
function sendMessage(ws, message) {
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  let isAuthenticated = false;
  let clientType = null;

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Handle authentication
      if (message.type === 'auth') {
        if (message.password === AUTH_PASSWORD) {
          isAuthenticated = true;
          clientType = message.client_type;

          // Register client based on type
          if (clientType === 'desktop') {
            if (desktopClient) {
              console.log('Replacing existing desktop client');
              desktopClient.close();
            }
            desktopClient = ws;
            console.log('Desktop client authenticated');
          } else if (clientType === 'mobile') {
            mobileClients.add(ws);
            console.log(`Mobile client authenticated (${mobileClients.size} total)`);
          }

          sendMessage(ws, {
            type: 'auth_success',
            message: 'Authentication successful'
          });

          // Notify mobile clients of desktop connection status
          if (clientType === 'desktop') {
            mobileClients.forEach(client => {
              sendMessage(client, {
                type: 'status',
                status: 'ready',
                message: 'Desktop connected'
              });
            });
          }
        } else {
          console.log('Authentication failed - invalid password');
          sendMessage(ws, {
            type: 'auth_failed',
            message: 'Invalid password'
          });
          ws.close();
        }
        return;
      }

      // All other messages require authentication
      if (!isAuthenticated) {
        console.log('Unauthenticated message received, closing connection');
        ws.close();
        return;
      }

      // Handle user input from mobile → desktop
      if (message.type === 'user_input' && clientType === 'mobile') {
        console.log('Routing user input to desktop');
        if (desktopClient) {
          sendMessage(desktopClient, message);
        } else {
          console.log('No desktop client connected');
          sendMessage(ws, {
            type: 'status',
            status: 'error',
            message: 'Desktop not connected'
          });
        }
      }

      // Handle Claude output from desktop → mobile
      if (message.type === 'claude_output' && clientType === 'desktop') {
        console.log('Routing Claude output to mobile clients');
        mobileClients.forEach(client => {
          sendMessage(client, message);
        });
      }

      // Handle status updates from desktop → mobile
      if (message.type === 'status' && clientType === 'desktop') {
        console.log(`Status update: ${message.status}`);
        mobileClients.forEach(client => {
          sendMessage(client, message);
        });
      }

      // Handle heartbeat ping/pong
      if (message.type === 'ping') {
        sendMessage(ws, { type: 'pong' });
      }

    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    if (ws === desktopClient) {
      console.log('Desktop client disconnected');
      desktopClient = null;

      // Notify mobile clients
      mobileClients.forEach(client => {
        sendMessage(client, {
          type: 'status',
          status: 'disconnected',
          message: 'Desktop disconnected'
        });
      });
    } else if (mobileClients.has(ws)) {
      mobileClients.delete(ws);
      console.log(`Mobile client disconnected (${mobileClients.size} remaining)`);
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Basic HTTP endpoint for health checks
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    connections: {
      desktop: desktopClient ? 'connected' : 'disconnected',
      mobile: mobileClients.size
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
server.listen(PORT, () => {
  console.log(`WebSocket relay server running on port ${PORT}`);
  console.log(`Desktop clients: ${desktopClient ? 1 : 0}`);
  console.log(`Mobile clients: ${mobileClients.size}`);
});
