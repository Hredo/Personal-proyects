import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { listBackups } from '@/lib/backup';
import { getLogs } from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    tables: number;
    size: number;
  };
  backups: {
    count: number;
    latestTimestamp: string | null;
    totalSize: number;
  };
  logs: {
    errors24h: number;
    warnings24h: number;
  };
  system: {
    memory: {
      total: number;
      used: number;
      free: number;
    };
    disk: {
      used: number;
      available: number;
    };
    uptime: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now();
    
    // 1. Check database
    let dbHealthy = false;
    let tableCount = 0;
    let dbSize = 0;

    try {
      const tables = db.prepare(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
      ).get() as { count: number };
      tableCount = tables.count;
      dbHealthy = tableCount > 0;
      
      const dbPath = path.resolve(process.cwd(), 'vet_hospital.db');
      if (fs.existsSync(dbPath)) {
        dbSize = fs.statSync(dbPath).size;
      }
    } catch (error) {
      dbHealthy = false;
      console.error('Database health check failed:', error);
    }

    // 2. Check backups
    let backupCount = 0;
    let latestBackupTime = null;
    let backupsTotalSize = 0;

    try {
      const backups = listBackups();
      backupCount = backups.length;
      if (backups.length > 0) {
        latestBackupTime = backups[0].timestamp;
        backupsTotalSize = backups.reduce((sum, b) => sum + b.size, 0);
      }
    } catch (error) {
      console.error('Backup health check failed:', error);
    }

    // 3. Check error logs (last 24 hours)
    let errorCount24h = 0;
    let warningCount24h = 0;

    try {
      const logs = getLogs(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date(),
        'error'
      );
      errorCount24h = logs.length;

      const appLogs = getLogs(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date(),
        'app'
      );
      warningCount24h = appLogs.filter(l => l.level === 'WARN').length;
    } catch (error) {
      console.error('Log health check failed:', error);
    }

    // 4. System metrics
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // 5. Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!dbHealthy) {
      status = 'unhealthy';
    } else if (
      errorCount24h > 10 ||
      backupCount === 0 ||
      memUsage.heapUsed / memUsage.heapTotal > 0.9
    ) {
      status = 'degraded';
    }

    const health: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: dbHealthy,
        tables: tableCount,
        size: dbSize,
      },
      backups: {
        count: backupCount,
        latestTimestamp: latestBackupTime,
        totalSize: backupsTotalSize,
      },
      logs: {
        errors24h: errorCount24h,
        warnings24h: warningCount24h,
      },
      system: {
        memory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
        },
        disk: {
          used: 0, // Placeholder - would need diskusage library
          available: 0,
        },
        uptime: os.uptime(),
      },
    };

    const statusCode = status === 'unhealthy' ? 503 : status === 'degraded' ? 200 : 200;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check endpoint failed',
      },
      { status: 503 }
    );
  }
}
