const WebSocket = require('ws');

class WebSocketClient {
  constructor(backendUrl, password, logger = null) {
    this.backendUrl = backendUrl;
    this.password = password;
    this.ws = null;
    this.isAuthenticated = false;
    this.reconnectInterval = null;
    this.heartbeatInterval = null;
    this.onMessageCallback = null;
    this.onConnectionChangeCallback = null;
    this.logger = logger;
  }

  log(message, level = 'INFO') {
    if (this.logger) {
      this.logger.log(message, level);
    } else {
      console.log(`[${level}] ${message}`);
    }
  }

  connect() {
    try {
      this.log(`Connecting to backend: ${this.backendUrl}`);
      this.ws = new WebSocket(this.backendUrl);

      this.ws.on('open', () => {
        this.log('WebSocket connected - OPEN event received');
        this.authenticate();
        this.startHeartbeat();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      this.ws.on('close', (code, reason) => {
        this.log(`WebSocket disconnected - Code: ${code}, Reason: ${reason || 'No reason provided'}`, 'WARN');
        this.isAuthenticated = false;
        this.stopHeartbeat();

        if (this.onConnectionChangeCallback) {
          this.onConnectionChangeCallback(false);
        }

        // Auto-reconnect after 5 seconds
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        this.log(`WebSocket error: ${error.message}`, 'ERROR');
      });

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  authenticate() {
    const authMessage = {
      type: 'auth',
      password: this.password,
      client_type: 'desktop'
    };

    this.send(authMessage);
  }

  handleMessage(message) {
    console.log('Received message:', message.type);

    if (message.type === 'auth_success') {
      console.log('Authentication successful');
      this.isAuthenticated = true;

      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(true);
      }
    } else if (message.type === 'auth_failed') {
      console.error('Authentication failed:', message.message);
      this.isAuthenticated = false;
      this.ws.close();
    } else if (message.type === 'pong') {
      // Heartbeat response received
    } else {
      // Pass other messages to callback
      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected, cannot send message');
    }
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isAuthenticated = false;
  }

  reconnect() {
    console.log('Manual reconnect triggered');
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  scheduleReconnect() {
    if (this.reconnectInterval) {
      return; // Already scheduled
    }

    console.log('Scheduling reconnect in 5 seconds...');
    this.reconnectInterval = setTimeout(() => {
      this.reconnectInterval = null;
      this.connect();
    }, 5000);
  }

  startHeartbeat() {
    // Send ping every 10 seconds to keep Railway connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.isAuthenticated && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.log('Sending heartbeat ping');
        this.send({ type: 'ping' });
      }
    }, 10000); // Send ping every 10 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  onConnectionChange(callback) {
    this.onConnectionChangeCallback = callback;
  }
}

module.exports = WebSocketClient;
