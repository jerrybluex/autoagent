const fs = require('fs');
const path = require('path');

function loadConfig(baseDir) {
  const root = baseDir || path.resolve(__dirname, '..');

  const defaultPath = path.join(root, 'config', 'default.json');
  const defaultConfig = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));

  const localPath = path.join(root, 'config', 'local.json');
  let localConfig = {};
  if (fs.existsSync(localPath)) {
    localConfig = JSON.parse(fs.readFileSync(localPath, 'utf8'));
  }

  return { ...defaultConfig, ...localConfig };
}

module.exports = { loadConfig };
