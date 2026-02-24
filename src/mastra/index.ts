import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { buddy } from './agents/web-agent';
import { createStream } from 'rotating-file-stream';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';

// 5GB rolling log: 500MB per file, 10 files max
// Default to ~/.cache/buddy/logs (XDG-compliant)
const LOG_DIR = process.env.LOG_DIR || join(homedir(), '.cache', 'buddy', 'logs');
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}
console.log(`Logs: ${join(LOG_DIR, 'buddy.log')}`);
if (!process.env.SUPPRESS_HELP_MESSAGES) {
  console.log('  Set LOG_DIR to change location, SUPPRESS_HELP_MESSAGES=1 to hide this');
}

const logStream = createStream('buddy.log', {
  path: LOG_DIR,
  size: '500M',
  maxFiles: 10,
});

export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: 'mastra-storage',
    // stores observability, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ':memory:',
  }),
  agents: { buddy },
  logger: new PinoLogger({
    name: 'buddy',
    level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    transports: { file: logStream as any },
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
