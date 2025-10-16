const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
  constructor() {
    // Create logs directory in user data
    const userDataPath = app.getPath('userData');
    this.logsDir = path.join(userDataPath, 'logs');

    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    this.logFile = path.join(this.logsDir, `claude-remote-${timestamp}.log`);

    this.log('Logger initialized', 'INFO');
    this.log(`Log file: ${this.logFile}`, 'INFO');
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    // Write to file
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }

    // Also console log
    console.log(logEntry.trim());

    // Emit to any listeners (for UI)
    if (this.onLogCallback) {
      this.onLogCallback(logEntry.trim());
    }
  }

  info(message) {
    this.log(message, 'INFO');
  }

  error(message) {
    this.log(message, 'ERROR');
  }

  warn(message) {
    this.log(message, 'WARN');
  }

  debug(message) {
    this.log(message, 'DEBUG');
  }

  onLog(callback) {
    this.onLogCallback = callback;
  }

  getLogFile() {
    return this.logFile;
  }

  getRecentLogs(lines = 100) {
    try {
      const content = fs.readFileSync(this.logFile, 'utf-8');
      const allLines = content.split('\n').filter(line => line.trim());
      return allLines.slice(-lines).join('\n');
    } catch (error) {
      return 'No logs available';
    }
  }
}

module.exports = Logger;
