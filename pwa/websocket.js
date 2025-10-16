class ClaudeWebSocket {
  constructor(backendUrl, password) {
    this.backendUrl = backendUrl;
    this.password = password;
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 30000;
    this.onMessageCallback = null;
    this.onConnectionChangeCallback = null;
  }

  connect() {
    try {
      console.log('Connecting to backend:', this.backendUrl);
      this.ws = new WebSocket(this.backendUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.authenticate();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;

        if (this.onConnectionChangeCallback) {
          this.onConnectionChangeCallback(false);
        }

        // Schedule reconnection
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  authenticate() {
    const authMessage = {
      type: 'auth',
      password: this.password,
      client_type: 'mobile'
    };

    this.send(authMessage);
  }

  handleMessage(message) {
    console.log('Received message:', message.type);

    if (message.type === 'auth_success') {
      console.log('Authentication successful');
      this.isConnected = true;

      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(true);
      }
    } else if (message.type === 'auth_failed') {
      console.error('Authentication failed:', message.message);
      this.isConnected = false;

      if (this.onMessageCallback) {
        this.onMessageCallback({
          type: 'status',
          status: 'error',
          message: 'Authentication failed: ' + message.message
        });
      }
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  scheduleReconnect() {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    console.log(`Reconnecting in ${delay / 1000} seconds...`);
    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  onConnectionChange(callback) {
    this.onConnectionChangeCallback = callback;
  }
}
