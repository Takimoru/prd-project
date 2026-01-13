const fs = require('fs');
const path = require('path');
const logFile = path.resolve(__dirname, '../../debug_server.log');

export function debugLog(msg: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
}
