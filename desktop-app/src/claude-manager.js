const { spawn } = require('child_process');

class ClaudeManager {
  constructor(workingDirectory) {
    this.workingDirectory = workingDirectory;
    this.claudeProcess = null;
    this.isRunning = false;
    this.outputCallback = null;
  }

  start() {
    if (this.isRunning) {
      console.log('Claude process already running');
      return;
    }

    console.log(`Starting Claude Code in directory: ${this.workingDirectory}`);

    try {
      // Spawn Claude Code process
      this.claudeProcess = spawn('claude', [], {
        cwd: this.workingDirectory,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.isRunning = true;

      // Handle stdout
      this.claudeProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Claude output:', output);

        if (this.outputCallback) {
          this.outputCallback(output);
        }
      });

      // Handle stderr
      this.claudeProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.error('Claude error:', output);

        if (this.outputCallback) {
          this.outputCallback(output);
        }
      });

      // Handle process exit
      this.claudeProcess.on('close', (code) => {
        console.log(`Claude process exited with code ${code}`);
        this.isRunning = false;

        // Auto-restart after 5 seconds if it crashed
        if (code !== 0) {
          console.log('Claude crashed, restarting in 5 seconds...');
          setTimeout(() => {
            this.start();
          }, 5000);
        }
      });

      // Handle process errors
      this.claudeProcess.on('error', (error) => {
        console.error('Failed to start Claude process:', error);
        this.isRunning = false;

        if (this.outputCallback) {
          this.outputCallback(`Error: Failed to start Claude Code - ${error.message}`);
        }
      });

      console.log('Claude Code process started successfully');

    } catch (error) {
      console.error('Error spawning Claude process:', error);
      this.isRunning = false;
      throw error;
    }
  }

  sendInput(input) {
    if (!this.isRunning || !this.claudeProcess) {
      console.error('Claude process not running');
      return;
    }

    try {
      console.log('Sending input to Claude:', input);
      this.claudeProcess.stdin.write(input + '\n');
    } catch (error) {
      console.error('Error sending input to Claude:', error);
    }
  }

  stop() {
    if (!this.isRunning || !this.claudeProcess) {
      return;
    }

    console.log('Stopping Claude process');

    try {
      // Try graceful shutdown first (Ctrl+C)
      this.claudeProcess.stdin.write('\x03');

      // Force kill after 3 seconds if still running
      setTimeout(() => {
        if (this.isRunning) {
          console.log('Force killing Claude process');
          this.claudeProcess.kill();
        }
      }, 3000);

    } catch (error) {
      console.error('Error stopping Claude process:', error);
      // Force kill as fallback
      if (this.claudeProcess) {
        this.claudeProcess.kill();
      }
    }

    this.isRunning = false;
  }

  restart() {
    console.log('Restarting Claude process');
    this.stop();

    setTimeout(() => {
      this.start();
    }, 2000);
  }

  onOutput(callback) {
    this.outputCallback = callback;
  }
}

module.exports = ClaudeManager;
