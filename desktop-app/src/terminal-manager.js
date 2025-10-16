const pty = require('@homebridge/node-pty-prebuilt-multiarch');
const os = require('os');

class TerminalManager {
  constructor(workingDirectory, logger = null) {
    this.workingDirectory = workingDirectory;
    this.logger = logger;
    this.terminalProcess = null;
    this.isRunning = false;
    this.outputCallback = null;
  }

  log(message, level = 'INFO') {
    if (this.logger) {
      this.logger.log(message, level);
    } else {
      console.log(`[${level}] ${message}`);
    }
  }

  start() {
    if (this.isRunning) {
      this.log('Terminal already running');
      return;
    }

    this.log(`Starting terminal with PTY in directory: ${this.workingDirectory}`);

    try {
      // Use PowerShell on Windows, bash on Unix
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
      const args = os.platform() === 'win32' ? [] : [];

      // Spawn terminal with PTY support
      this.terminalProcess = pty.spawn(shell, args, {
        name: 'xterm-color',
        cols: 120,
        rows: 30,
        cwd: this.workingDirectory,
        env: process.env
      });

      this.isRunning = true;
      this.log('Terminal process with PTY started successfully');

      // Handle terminal output
      this.terminalProcess.onData((data) => {
        this.log(`Terminal output: ${data.substring(0, 100)}...`, 'DEBUG');

        if (this.outputCallback) {
          this.outputCallback(data);
        }
      });

      // Handle terminal exit
      this.terminalProcess.onExit(({ exitCode, signal }) => {
        this.log(`Terminal process exited with code ${exitCode}, signal ${signal}`);
        this.isRunning = false;

        // Auto-restart if it crashed unexpectedly
        if (exitCode !== 0 && exitCode !== null) {
          this.log('Terminal crashed, restarting in 5 seconds...');
          setTimeout(() => {
            this.start();
          }, 5000);
        }
      });

      // Send initial setup commands
      setTimeout(() => {
        // Change to working directory and show prompt
        this.sendCommand(`cd "${this.workingDirectory}"`);
        this.sendCommand('cls');
        this.sendCommand('Write-Host "Claude Code Remote Terminal (PTY Enabled)" -ForegroundColor Cyan');
        this.sendCommand('Write-Host "Connected from mobile device" -ForegroundColor Green');
        this.sendCommand('Write-Host "Type \\"claude\\" to start Claude Code interactively" -ForegroundColor Yellow');
        this.sendCommand('Write-Host ""');
      }, 500);

    } catch (error) {
      this.log(`Error spawning terminal: ${error.message}`, 'ERROR');
      this.isRunning = false;
      throw error;
    }
  }

  sendCommand(command) {
    if (!this.isRunning || !this.terminalProcess) {
      this.log('Terminal not running', 'ERROR');
      if (this.outputCallback) {
        this.outputCallback('Error: Terminal is not running\r\n');
      }
      return;
    }

    try {
      this.log(`Sending command: ${command}`);
      // With PTY, write command followed by Enter
      this.terminalProcess.write(command + '\r');
    } catch (error) {
      this.log(`Error sending command: ${error.message}`, 'ERROR');
      if (this.outputCallback) {
        this.outputCallback(`Error: ${error.message}\r\n`);
      }
    }
  }

  sendInput(input) {
    // Alias for sendCommand
    this.sendCommand(input);
  }

  stop() {
    if (!this.isRunning || !this.terminalProcess) {
      return;
    }

    this.log('Stopping terminal');

    try {
      // Send exit command
      this.terminalProcess.write('exit\r');

      // Force kill after 3 seconds if still running
      setTimeout(() => {
        if (this.isRunning && this.terminalProcess) {
          this.log('Force killing terminal');
          this.terminalProcess.kill();
        }
      }, 3000);

    } catch (error) {
      this.log(`Error stopping terminal: ${error.message}`, 'ERROR');
      if (this.terminalProcess) {
        this.terminalProcess.kill();
      }
    }

    this.isRunning = false;
  }

  restart() {
    this.log('Restarting terminal');
    this.stop();

    setTimeout(() => {
      this.start();
    }, 2000);
  }

  onOutput(callback) {
    this.outputCallback = callback;
  }

  // Method to resize terminal (useful for responsive UI)
  resize(cols, rows) {
    if (this.terminalProcess && this.isRunning) {
      try {
        this.terminalProcess.resize(cols, rows);
        this.log(`Terminal resized to ${cols}x${rows}`);
      } catch (error) {
        this.log(`Error resizing terminal: ${error.message}`, 'ERROR');
      }
    }
  }
}

module.exports = TerminalManager;
