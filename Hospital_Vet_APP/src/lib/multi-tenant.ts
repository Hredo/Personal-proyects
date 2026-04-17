import Database from 'better-sqlite3';
import db from './db';

/**
 * Multi-Tenant System
 * Manages clinic isolation, branding, and data segregation
 */

export interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  licenseNumber: string;
  veterinarian: string;
  logoUrl?: string;
  website?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'SUSPENDED';
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  createdAt: string;
  subscriptionExpiresAt?: string;
  config?: Record<string, any>; // JSON: color_scheme, features, etc.
}

/**
 * Initialize clinic tables
 */
export function initClinicTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clinics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'ES',
      licenseNumber TEXT,
      veterinarian TEXT,
      logoUrl TEXT,
      website TEXT,
      status TEXT DEFAULT 'ACTIVE',
      plan TEXT DEFAULT 'STARTER',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      subscriptionExpiresAt DATETIME,
      config TEXT,
      apiKey TEXT UNIQUE,
      apiSecret TEXT
    );

    -- Add clinicId to existing tables if not already present
    CREATE TABLE IF NOT EXISTS users_clinic_link (
      userId TEXT PRIMARY KEY,
      clinicId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE,
      UNIQUE(userId, clinicId)
    );

    CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status);
    CREATE INDEX IF NOT EXISTS idx_clinics_plan ON clinics(plan);
    CREATE INDEX IF NOT EXISTS idx_users_clinic_link_clinicId ON users_clinic_link(clinicId);
  `);
}

/**
 * Create a new clinic
 */
export function createClinic(clinic: Omit<Clinic, 'id' | 'createdAt'>): Clinic {
  try {
    const id = `clinic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const apiKey = generateApiKey();
    const apiSecret = generateApiSecret();

    const stmt = db.prepare(`
      INSERT INTO clinics (id, name, email, phone, address, city, country, licenseNumber, veterinarian, status, plan, apiKey, apiSecret)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      clinic.name,
      clinic.email,
      clinic.phone,
      clinic.address,
      clinic.city,
      clinic.country || 'ES',
      clinic.licenseNumber,
      clinic.veterinarian,
      clinic.status || 'ACTIVE',
      clinic.plan || 'STARTER',
      apiKey,
      apiSecret
    );

    return { ...clinic, id, createdAt: new Date().toISOString() } as Clinic;
  } catch (error) {
    console.error('Failed to create clinic:', error);
    throw new Error('Clinic creation failed');
  }
}

/**
 * Get clinic by ID
 */
export function getClinic(clinicId: string): Clinic | null {
  try {
    const stmt = db.prepare('SELECT * FROM clinics WHERE id = ?');
    return stmt.get(clinicId) as Clinic | null;
  } catch (error) {
    console.error('Failed to get clinic:', error);
    return null;
  }
}

/**
 * Get all clinics
 */
export function getAllClinics(): Clinic[] {
  try {
    const stmt = db.prepare('SELECT * FROM clinics ORDER BY createdAt DESC');
    return stmt.all() as Clinic[];
  } catch (error) {
    console.error('Failed to get clinics:', error);
    return [];
  }
}

/**
 * Update clinic
 */
export function updateClinic(clinicId: string, updates: Partial<Clinic>): boolean {
  try {
    const allowedFields = ['name', 'email', 'phone', 'address', 'city', 'country', 'logoUrl', 'website', 'status', 'plan', 'config'];
    const setClauses = Object.keys(updates).filter(k => allowedFields.includes(k)).map(k => `${k} = ?`);

    if (setClauses.length === 0) {
      return false;
    }

    const values = Object.keys(updates).filter(k => allowedFields.includes(k)).map(k => (updates as any)[k]);
    values.push(clinicId);

    const stmt = db.prepare(`UPDATE clinics SET ${setClauses.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    return result.changes > 0;
  } catch (error) {
    console.error('Failed to update clinic:', error);
    return false;
  }
}

/**
 * Link user to clinic
 */
export function linkUserToClinic(userId: string, clinicId: string): boolean {
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO users_clinic_link (userId, clinicId)
      VALUES (?, ?)
    `);

    const result = stmt.run(userId, clinicId);
    return result.changes > 0;
  } catch (error) {
    console.error('Failed to link user to clinic:', error);
    return false;
  }
}

/**
 * Get clinics for user
 */
export function getUserClinics(userId: string): Clinic[] {
  try {
    const stmt = db.prepare(`
      SELECT c.* FROM clinics c
      INNER JOIN users_clinic_link ucl ON c.id = ucl.clinicId
      WHERE ucl.userId = ?
      ORDER BY c.createdAt DESC
    `);

    return stmt.all(userId) as Clinic[];
  } catch (error) {
    console.error('Failed to get user clinics:', error);
    return [];
  }
}

/**
 * Get users in clinic
 */
export function getClinicUsers(clinicId: string): any[] {
  try {
    const stmt = db.prepare(`
      SELECT u.* FROM users u
      INNER JOIN users_clinic_link ucl ON u.id = ucl.userId
      WHERE ucl.clinicId = ?
      ORDER BY u.createdAt DESC
    `);

    return stmt.all(clinicId) as any[];
  } catch (error) {
    console.error('Failed to get clinic users:', error);
    return [];
  }
}

/**
 * Validate clinic access
 */
export function validateClinicAccess(userId: string, clinicId: string): boolean {
  try {
    const stmt = db.prepare(`
      SELECT 1 FROM users_clinic_link
      WHERE userId = ? AND clinicId = ?
    `);

    return !!stmt.get(userId, clinicId);
  } catch (error) {
    console.error('Failed to validate clinic access:', error);
    return false;
  }
}

/**
 * Generate API Key
 */
export function generateApiKey(): string {
  return `vet_${Date.now().toString(36)}${Math.random().toString(36).substr(2)}`;
}

/**
 * Generate API Secret
 */
export function generateApiSecret(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Get clinic by API Key (for external integrations)
 */
export function getClinicByApiKey(apiKey: string): Clinic | null {
  try {
    const stmt = db.prepare('SELECT * FROM clinics WHERE apiKey = ? AND status = ?');
    return stmt.get(apiKey, 'ACTIVE') as Clinic | null;
  } catch (error) {
    console.error('Failed to get clinic by API key:', error);
    return null;
  }
}

/**
 * Verify clinic authorization
 */
export function verifyClinicAuth(apiKey: string, apiSecret: string): boolean {
  try {
    const stmt = db.prepare('SELECT 1 FROM clinics WHERE apiKey = ? AND apiSecret = ? AND status = ?');
    return !!stmt.get(apiKey, apiSecret, 'ACTIVE');
  } catch (error) {
    console.error('Failed to verify clinic auth:', error);
    return false;
  }
}

/**
 * Get clinic statistics
 */
export function getClinicStats(clinicId: string) {
  try {
    const stats = {
      users: (db.prepare('SELECT COUNT(*) as count FROM users_clinic_link WHERE clinicId = ?').get(clinicId) as any).count,
      // These would need additional tables to track clinic-specific data
      patients: 0,
      appointments: 0,
      invoices: 0,
      revenue: 0,
    };

    return stats;
  } catch (error) {
    console.error('Failed to get clinic stats:', error);
    return null;
  }
}

// Initialize tables on module load
try {
  initClinicTables();
} catch (error) {
  console.error('Failed to initialize clinic tables:', error);
}
