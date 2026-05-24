function formatLog(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

function info(message, ...args) {
  const entry = formatLog("info", message);
  console.info(entry, ...args);
  return entry;
}

function warn(message, ...args) {
  const entry = formatLog("warn", message);
  console.warn(entry, ...args);
  return entry;
}

function error(message, ...args) {
  const entry = formatLog("error", message);
  console.error(entry, ...args);
  return entry;
}

module.exports = {
  info,
  warn,
  error,
};
