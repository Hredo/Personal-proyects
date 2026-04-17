import fs from 'fs';
import path from 'path';

/**
 * Centralized Logging System with Rotation
 * All application logs are stored and rotated daily
 */

const logsDir = path.resolve(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SECURITY';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  userId?: string;
  ip?: string;
  data?: Record<string, any>;
}

const activeLogHandles: Map<string, fs.WriteStream> = new Map();

/**
 * Get or create log file for today
 */
function getLogFilePath(logFile = 'app'): string {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logsDir, `${logFile}-${date}.log`);
}

/**
 * Write log entry
 */
export function log(
  level: LogLevel,
  service: string,
  message: string,
  options: { userId?: string; ip?: string; data?: Record<string, any> } = {}
): void {
  try {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      ...options,
    };

    const logLine = JSON.stringify(entry) + '\n';

    // Determine log file based on level
    const logFile = level === 'SECURITY' ? 'security' : level === 'ERROR' ? 'error' : 'app';
    const filePath = getLogFilePath(logFile);

    // Write to file
    fs.appendFileSync(filePath, logLine);

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      const prefix = `[${level}] [${service}]`;
      console.log(prefix, message, options.data ? options.data : '');
    }
  } catch (error) {
    console.error('Logging failed:', error);
  }
}

/**
 * Log security event (audit trail)
 */
export function logSecurityEvent(
  service: string,
  event: string,
  userId?: string,
  ip?: string,
  details?: Record<string, any>
): void {
  log('SECURITY', service, event, { userId, ip, data: details });
}

/**
 * Log API request/response
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string,
  ip?: string
): void {
  log('INFO', 'API', `${method} ${path} - ${statusCode} (${duration}ms)`, {
    userId,
    ip,
    data: { method, path, statusCode, duration },
  });
}

/**
 * Log database operation
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  duration: number,
  rowsAffected?: number,
  userId?: string
): void {
  log('DEBUG', 'DATABASE', `${operation} on ${table} (${duration}ms)`, {
    userId,
    data: { operation, table, duration, rowsAffected },
  });
}

/**
 * Log error event
 */
export function logError(service: string, error: Error | string, context?: Record<string, any>): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  
  log('ERROR', service, message, {
    data: { ...context, stack },
  });
}

/**
 * Get logs for a specific date range
 */
export function getLogs(
  startDate: Date,
  endDate: Date,
  logFile = 'app'
): LogEntry[] {
  const entries: LogEntry[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const filePath = path.join(logsDir, `${logFile}-${dateStr}.log`);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch {}
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return entries;
}

/**
 * Search logs
 */
export function searchLogs(
  query: string,
  logFile = 'app',
  limit = 100
): LogEntry[] {
  const allLogs = getLogs(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    new Date(),
    logFile
  );

  return allLogs
    .filter(entry =>
      entry.message.toLowerCase().includes(query.toLowerCase()) ||
      entry.service.toLowerCase().includes(query.toLowerCase()) ||
      entry.userId?.toLowerCase().includes(query.toLowerCase())
    )
    .slice(-limit);
}

/**
 * Clean old logs (retention policy: keep 90 days)
 */
export function cleanOldLogs(retentionDays = 90): number {
  try {
    const files = fs.readdirSync(logsDir);
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    let deleted = 0;

    for (const file of files) {
      if (!file.endsWith('.log')) continue;

      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);

      if (new Date(stats.mtime) < cutoffDate) {
        fs.unlinkSync(filePath);
        deleted++;
        console.log(`[CLEANUP] Deleted old log: ${file}`);
      }
    }

    return deleted;
  } catch (error) {
    console.error('[CLEANUP] Error cleaning logs:', error);
    return 0;
  }
}

// Auto-cleanup on app start
cleanOldLogs(90);

export default {
  log,
  logSecurityEvent,
  logApiRequest,
  logDatabaseOperation,
  logError,
  getLogs,
  searchLogs,
  cleanOldLogs,
};
