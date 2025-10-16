const { spawn } = require('child_process');
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

    this.log(`Starting terminal in directory: ${this.workingDirectory}`);

    try {
      // Use PowerShell on Windows
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

      this.terminalProcess = spawn(shell, [], {
        cwd: this.workingDirectory,
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, TERM: 'xterm-256color' }
      });

      this.isRunning = true;
      this.log('Terminal process started successfully');

      // Handle stdout
      this.terminalProcess.stdout.on('data', (data) => {
        const output = data.toString();
        this.log(`Terminal output: ${output.substring(0, 100)}...`, 'DEBUG');

        if (this.outputCallback) {
          this.outputCallback(output);
        }
      });

      // Handle stderr
      this.terminalProcess.stderr.on('data', (data) => {
        const output = data.toString();
        this.log(`Terminal error: ${output.substring(0, 100)}...`, 'WARN');

        if (this.outputCallback) {
          this.outputCallback(output);
        }
      });

      // Handle process exit
      this.terminalProcess.on('close', (code) => {
        this.log(`Terminal process exited with code ${code}`);
        this.isRunning = false;

        // Auto-restart if it crashed
        if (code !== 0 && code !== null) {
          this.log('Terminal crashed, restarting in 5 seconds...');
          setTimeout(() => {
            this.start();
          }, 5000);
        }
      });

      // Handle process errors
      this.terminalProcess.on('error', (error) => {
        this.log(`Failed to start terminal: ${error.message}`, 'ERROR');
        this.isRunning = false;

        if (this.outputCallback) {
          this.outputCallback(`Error: Failed to start terminal - ${error.message}\r\n`);
        }
      });

      // Send initial setup commands
      setTimeout(() => {
        // Change to working directory and show prompt
        this.sendCommand(`cd "${this.workingDirectory}"`);
        this.sendCommand('cls');
        this.sendCommand('Write-Host "Claude Code Remote Terminal" -ForegroundColor Cyan');
        this.sendCommand('Write-Host "Connected from mobile device" -ForegroundColor Green');
        this.sendCommand('Write-Host "Type \\"claude\\" to start Claude Code" -ForegroundColor Yellow');
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
      // Send command followed by Enter
      this.terminalProcess.stdin.write(command + '\r\n');
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
      // Try graceful shutdown
      this.terminalProcess.stdin.write('exit\r\n');

      // Force kill after 3 seconds
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
}

module.exports = TerminalManager;
