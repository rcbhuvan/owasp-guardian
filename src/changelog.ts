import * as fs from 'fs';
import * as path from 'path';

export function logToChangelog(workspacePath: string, message: string) {
  const logPath = path.join(workspacePath, 'changelog.log');
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, line, 'utf-8');
}