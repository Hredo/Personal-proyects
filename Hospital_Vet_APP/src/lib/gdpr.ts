import Database from 'better-sqlite3';
import { generateGDPRToken } from './encryption';

/**
 * GDPR Audit Trail System
 * Logs all access, modifications, and data processing events
 */

const db = require('./db').default;

export type AuditEventType = 
  | 'DATA_ACCESS' 
  | 'DATA_MODIFICATION' 
  | 'DATA_EXPORT'
  | 'DATA_DELETION'
  | 'CONSENT_GIVEN'
  | 'CONSENT_WITHDRAWN'
  | 'PASSWORD_CHANGE'
  | 'LOGIN_ATTEMPT'
  | 'UNAUTHORIZED_ACCESS'
  | 'BREACH_NOTIFICATION';

export interface AuditEvent {
  id: string;
  userId: string;
  eventType: AuditEventType;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  affectedRecords?: string; // JSON array of record IDs
  timestamp: string;
  expiresAt?: string;
}

/**
 * Initialize audit trail table
 */
export function initAuditTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS gdpr_audit_log (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      eventType TEXT NOT NULL,
      description TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      affectedRecords TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gdpr_consents (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      consentType TEXT NOT NULL,
      version TEXT NOT NULL,
      given BOOLEAN DEFAULT FALSE,
      givenAt DATETIME,
      expiresAt DATETIME,
      ipAddress TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, consentType)
    );

    CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmedAt DATETIME,
      completedAt DATETIME,
      status TEXT DEFAULT 'PENDING',
      token TEXT NOT NULL UNIQUE,
      expiresAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gdpr_data_exports (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      downloadUrl TEXT,
      expiresAt DATETIME,
      size INTEGER,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_audit_userId ON gdpr_audit_log(userId);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON gdpr_audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_expiresAt ON gdpr_audit_log(expiresAt);
    CREATE INDEX IF NOT EXISTS idx_consents_userId ON gdpr_consents(userId);
    CREATE INDEX IF NOT EXISTS idx_deletion_userId ON gdpr_deletion_requests(userId);
  `);
}

/**
 * Log an audit event
 */
export function logAuditEvent(
  userId: string,
  eventType: AuditEventType,
  description: string,
  ipAddress?: string,
  userAgent?: string,
  affectedRecords?: string[]
): void {
  try {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 3); // Keep for 3 years per GDPR
    
    const stmt = db.prepare(`
      INSERT INTO gdpr_audit_log (id, userId, eventType, description, ipAddress, userAgent, affectedRecords, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      userId,
      eventType,
      description,
      ipAddress || null,
      userAgent || null,
      affectedRecords ? JSON.stringify(affectedRecords) : null,
      expiresAt.toISOString()
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Record consent given by user
 */
export function recordConsent(
  userId: string,
  consentType: string,
  version: string,
  ipAddress?: string
): void {
  try {
    const id = `consent_${userId}_${consentType}`;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 2); // Consent valid for 2 years
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO gdpr_consents (id, userId, consentType, version, given, givenAt, expiresAt, ipAddress)
      VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, ?, ?)
    `);
    
    stmt.run(id, userId, consentType, version, expiresAt.toISOString(), ipAddress || null);
    
    logAuditEvent(userId, 'CONSENT_GIVEN', `Consent given for: ${consentType}`, ipAddress);
  } catch (error) {
    console.error('Failed to record consent:', error);
  }
}

/**
 * Check if user has given consent for specific type
 */
export function hasConsent(userId: string, consentType: string): boolean {
  try {
    const stmt = db.prepare(`
      SELECT given FROM gdpr_consents 
      WHERE userId = ? AND consentType = ? AND given = 1
      AND (expiresAt IS NULL OR expiresAt > CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.get(userId, consentType);
    return result?.given === 1;
  } catch (error) {
    console.error('Failed to check consent:', error);
    return false;
  }
}

/**
 * Request user data deletion (GDPR Right to be Forgotten)
 */
export function requestDataDeletion(userId: string): string {
  try {
    const id = `deletion_${userId}_${Date.now()}`;
    const token = generateGDPRToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day confirmation window
    
    const stmt = db.prepare(`
      INSERT INTO gdpr_deletion_requests (id, userId, token, expiresAt, status)
      VALUES (?, ?, ?, ?, 'PENDING')
    `);
    
    stmt.run(id, userId, token, expiresAt.toISOString());
    
    logAuditEvent(userId, 'DATA_DELETION', 'Data deletion request initiated');
    
    return token;
  } catch (error) {
    console.error('Failed to request data deletion:', error);
    throw new Error('Deletion request failed');
  }
}

/**
 * Confirm and execute user data deletion
 */
export function executeDataDeletion(userId: string, token: string): boolean {
  try {
    const stmt = db.prepare(`
      SELECT id FROM gdpr_deletion_requests 
      WHERE userId = ? AND token = ? AND status = 'PENDING'
      AND expiresAt > CURRENT_TIMESTAMP
    `);
    
    const request = stmt.get(userId, token) as any;
    
    if (!request) {
      return false;
    }
    
    // Start transaction for data deletion
    const transaction = db.transaction(() => {
      // Delete user data (this cascades to related tables via foreign keys)
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      
      // Mark deletion as completed
      db.prepare(`
        UPDATE gdpr_deletion_requests 
        SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(request.id);
    });
    
    transaction();
    logAuditEvent(userId, 'DATA_DELETION', 'User account and data permanently deleted');
    
    return true;
  } catch (error) {
    console.error('Data deletion failed:', error);
    return false;
  }
}

/**
 * Get user audit trail
 */
export function getUserAuditTrail(userId: string, limit = 100): AuditEvent[] {
  try {
    const stmt = db.prepare(`
      SELECT id, userId, eventType, description, ipAddress, userAgent, affectedRecords, timestamp, expiresAt
      FROM gdpr_audit_log
      WHERE userId = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    
    return stmt.all(userId, limit) as AuditEvent[];
  } catch (error) {
    console.error('Failed to retrieve audit trail:', error);
    return [];
  }
}

/**
 * Clean expired audit logs (run daily via cron or scheduled task)
 */
export function cleanExpiredLogs(): number {
  try {
    const result = db.prepare(`
      DELETE FROM gdpr_audit_log 
      WHERE expiresAt IS NOT NULL AND expiresAt < CURRENT_TIMESTAMP
    `).run();
    
    return result.changes;
  } catch (error) {
    console.error('Failed to clean expired logs:', error);
    return 0;
  }
}

/**
 * Export user's personal data (GDPR Right to Portability)
 */
export function exportUserData(userId: string): Record<string, any> {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const client = db.prepare('SELECT * FROM clients WHERE userId = ?').get(userId);
    const patients = db.prepare('SELECT * FROM patients WHERE ownerId IN (SELECT id FROM clients WHERE userId = ?)').all(userId);
    const appointments = db.prepare(`
      SELECT * FROM appointments 
      WHERE patientId IN (SELECT id FROM patients WHERE ownerId IN (SELECT id FROM clients WHERE userId = ?))
    `).all(userId);
    const medicalRecords = db.prepare(`
      SELECT * FROM medical_records 
      WHERE patientId IN (SELECT id FROM patients WHERE ownerId IN (SELECT id FROM clients WHERE userId = ?))
    `).all(userId);
    
    const exportId = `export_${userId}_${Date.now()}`;
    
    const stmt = db.prepare(`
      INSERT INTO gdpr_data_exports (id, userId, completedAt, size)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?)
    `);
    
    const dataSize = JSON.stringify({ user, client, patients, appointments, medicalRecords }).length;
    stmt.run(exportId, userId, dataSize);
    
    logAuditEvent(userId, 'DATA_EXPORT', `Personal data exported (${dataSize} bytes)`);
    
    return {
      exportedAt: new Date().toISOString(),
      user,
      client,
      patients,
      appointments,
      medicalRecords,
    };
  } catch (error) {
    console.error('Failed to export user data:', error);
    throw new Error('Data export failed');
  }
}
