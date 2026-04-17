import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';

/**
 * Backup & Disaster Recovery System
 * Automated encrypted backups with point-in-time recovery
 */

const dbPath = path.resolve(process.cwd(), 'vet_hospital.db');
const backupsDir = path.resolve(process.cwd(), 'backups');
const logsDir = path.resolve(process.cwd(), 'logs');

// Ensure directories exist
[backupsDir, logsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export interface BackupInfo {
  id: string;
  timestamp: string;
  size: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
  version: string;
  expiresAt?: string;
}

/**
 * Create encrypted backup
 */
export function createBackup(encryptionKey?: string): BackupInfo {
  try {
    const db = new Database(dbPath);
    const timestamp = new Date().toISOString();
    const backupId = `backup_${Date.now()}`;
    const backupPath = path.join(backupsDir, `${backupId}_raw.db`);
    const compressedPath = path.join(backupsDir, `${backupId}_compressed.db.gz`);
    const finalPath = path.join(backupsDir, `${backupId}.db.backup`);

    // 1. Create backup file (SQLite backup API)
    db.backup(backupPath);
    console.log(`[BACKUP] Database backed up to ${backupPath}`);

    // 2. Compress backup
    const fileBuffer = fs.readFileSync(backupPath);
    const compressed = zlib.gzipSync(fileBuffer);
    fs.writeFileSync(compressedPath, compressed);
    console.log(`[BACKUP] Backup compressed (${fileBuffer.length} → ${compressed.length} bytes)`);

    // 3. Encrypt if key provided
    let finalBuffer = compressed;
    let isEncrypted = false;

    if (encryptionKey) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey.slice(0, 64), 'hex'), iv);
      let encrypted = cipher.update(compressed);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();
      finalBuffer = Buffer.concat([iv, authTag, encrypted]);
      isEncrypted = true;
      console.log(`[BACKUP] Backup encrypted with AES-256-GCM`);
    }

    // 4. Write final backup
    fs.writeFileSync(finalPath, finalBuffer);
    const checksum = crypto.createHash('sha256').update(finalBuffer).digest('hex');
    const size = finalBuffer.length;

    // 5. Create metadata
    const backupInfo: BackupInfo = {
      id: backupId,
      timestamp,
      size,
      checksum,
      encrypted: isEncrypted,
      compressed: true,
      version: '1.0',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    };

    // Save metadata
    const metadataPath = path.join(backupsDir, `${backupId}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(backupInfo, null, 2));

    // Clean up temp files
    fs.unlinkSync(backupPath);
    fs.unlinkSync(compressedPath);

    console.log(`[BACKUP] Backup completed: ${backupId}`);
    return backupInfo;
  } catch (error) {
    console.error('[BACKUP] Error creating backup:', error);
    throw new Error('Backup creation failed');
  }
}

/**
 * Restore from backup
 */
export function restoreFromBackup(backupId: string, encryptionKey?: string): boolean {
  try {
    const backupPath = path.join(backupsDir, `${backupId}.db.backup`);
    const metadataPath = path.join(backupsDir, `${backupId}.json`);

    if (!fs.existsSync(backupPath) || !fs.existsSync(metadataPath)) {
      throw new Error(`Backup ${backupId} not found`);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as BackupInfo;
    let backupBuffer = fs.readFileSync(backupPath);

    // 1. Decrypt if necessary
    if (metadata.encrypted) {
      if (!encryptionKey) {
        throw new Error('Encryption key required for encrypted backup');
      }

      const iv = backupBuffer.slice(0, 16);
      const authTag = backupBuffer.slice(16, 32);
      const encrypted = backupBuffer.slice(32);

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(encryptionKey.slice(0, 64), 'hex'),
        iv
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      backupBuffer = decrypted;
      console.log('[RESTORE] Backup decrypted');
    }

    // 2. Decompress
    const decompressed = zlib.gunzipSync(backupBuffer);
    console.log(`[RESTORE] Backup decompressed (${backupBuffer.length} → ${decompressed.length} bytes)`);

    // 3. Verify checksum
    const checksum = crypto.createHash('sha256').update(backupBuffer).digest('hex');
    if (checksum !== metadata.checksum) {
      throw new Error('Backup checksum mismatch - file may be corrupted');
    }
    console.log('[RESTORE] Checksum verified');

    // 4. Create backup of current database before restore
    const currentBackupPath = path.join(backupsDir, `pre_restore_${Date.now()}.db`);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, currentBackupPath);
      console.log('[RESTORE] Current database backed up to ' + currentBackupPath);
    }

    // 5. Restore database
    fs.writeFileSync(dbPath, decompressed);
    console.log(`[RESTORE] Database restored from ${backupId}`);

    return true;
  } catch (error) {
    console.error('[RESTORE] Error restoring backup:', error);
    throw new Error('Backup restore failed');
  }
}

/**
 * List all available backups
 */
export function listBackups(): BackupInfo[] {
  try {
    const files = fs.readdirSync(backupsDir);
    const metadataFiles = files.filter(f => f.endsWith('.json'));

    return metadataFiles.map(file => {
      const content = fs.readFileSync(path.join(backupsDir, file), 'utf-8');
      return JSON.parse(content) as BackupInfo;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('[BACKUP] Error listing backups:', error);
    return [];
  }
}

/**
 * Delete old backups (retention policy: keep 30 days)
 */
export function cleanOldBackups(retentionDays = 30): number {
  try {
    const backups = listBackups();
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    let deleted = 0;

    for (const backup of backups) {
      if (new Date(backup.timestamp) < cutoffDate) {
        const backupPath = path.join(backupsDir, `${backup.id}.db.backup`);
        const metadataPath = path.join(backupsDir, `${backup.id}.json`);

        if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
        if (fs.existsSync(metadataPath)) fs.unlinkSync(metadataPath);

        deleted++;
        console.log(`[CLEANUP] Deleted old backup: ${backup.id}`);
      }
    }

    return deleted;
  } catch (error) {
    console.error('[CLEANUP] Error cleaning backups:', error);
    return 0;
  }
}

/**
 * Automate daily backups (call this from a cron job or scheduler)
 */
export function scheduleAutomaticBackups(intervalHours = 24): NodeJS.Timer {
  console.log('[SCHEDULER] Automatic backups scheduled every ' + intervalHours + ' hours');

  return setInterval(() => {
    try {
      createBackup(process.env.BACKUP_ENCRYPTION_KEY);
      const deletedCount = cleanOldBackups(30);
      console.log(`[SCHEDULER] Backup cycle completed, cleaned ${deletedCount} old backups`);
    } catch (error) {
      console.error('[SCHEDULER] Backup cycle failed:', error);
    }
  }, intervalHours * 60 * 60 * 1000);
}
