const Store = require('electron-store');

const schema = {
  backendUrl: {
    type: 'string',
    default: ''
  },
  password: {
    type: 'string',
    default: ''
  },
  workingDirectory: {
    type: 'string',
    default: ''
  },
  autoStart: {
    type: 'boolean',
    default: true
  }
};

const store = new Store({ schema });

function getConfig() {
  return {
    backendUrl: store.get('backendUrl'),
    password: store.get('password'),
    workingDirectory: store.get('workingDirectory'),
    autoStart: store.get('autoStart')
  };
}

function saveConfig(config) {
  if (config.backendUrl !== undefined) {
    store.set('backendUrl', config.backendUrl);
  }
  if (config.password !== undefined) {
    store.set('password', config.password);
  }
  if (config.workingDirectory !== undefined) {
    store.set('workingDirectory', config.workingDirectory);
  }
  if (config.autoStart !== undefined) {
    store.set('autoStart', config.autoStart);
  }
}

function getConfigPath() {
  return store.path;
}

module.exports = {
  getConfig,
  saveConfig,
  getConfigPath
};
