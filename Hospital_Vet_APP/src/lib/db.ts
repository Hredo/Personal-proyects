import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'vet_hospital.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 5000');

// Initialize database with schema
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CLIENT',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      phone TEXT,
      address TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      specialization TEXT,
      licenseNumber TEXT UNIQUE,
      schedule TEXT,
      qualifications TEXT,
      position TEXT,
      biography TEXT,
      workDays TEXT, -- JSON array
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_attendance (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL, -- IN, OUT
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      breed TEXT,
      birthDate DATETIME,
      gender TEXT,
      weight REAL,
      ownerId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'HEALTHY',
      image TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ownerId) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      veterinarianId TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      diagnosis TEXT NOT NULL,
      treatment TEXT,
      observations TEXT,
      attachments TEXT,
      FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (veterinarianId) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hospitalizations (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      admissionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      dischargeDate DATETIME,
      status TEXT NOT NULL DEFAULT 'OBSERVATION',
      monitoredBy TEXT,
      notes TEXT,
      vitals TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      speciesTarget TEXT,
      quantity INTEGER NOT NULL CHECK (quantity >= 0),
      unit TEXT NOT NULL,
      minStock INTEGER NOT NULL CHECK (minStock >= 0),
      expiryDate DATETIME,
      location TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      reason TEXT NOT NULL,
      dateTime DATETIME NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      clientId TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount >= 0),
      status TEXT NOT NULL DEFAULT 'PENDING',
      consultationId TEXT,
      consultationNumber TEXT,
      items TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      dueDate DATETIME NOT NULL,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      consultationNumber TEXT UNIQUE NOT NULL,
      appointmentId TEXT,
      patientId TEXT NOT NULL,
      hospitalizationId TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      closedAt DATETIME,
      FOREIGN KEY (appointmentId) REFERENCES appointments(id) ON DELETE SET NULL,
      FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (hospitalizationId) REFERENCES hospitalizations(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS billing_catalog (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      unitPrice REAL NOT NULL,
      isActive BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoiceId TEXT NOT NULL,
      consultationId TEXT,
      hospitalizationId TEXT,
      catalogItemId TEXT,
      description TEXT NOT NULL,
      quantity REAL NOT NULL CHECK (quantity > 0),
      unit TEXT NOT NULL,
      unitPrice REAL NOT NULL CHECK (unitPrice >= 0),
      amount REAL NOT NULL CHECK (amount >= 0),
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE SET NULL,
      FOREIGN KEY (hospitalizationId) REFERENCES hospitalizations(id) ON DELETE SET NULL,
      FOREIGN KEY (catalogItemId) REFERENCES billing_catalog(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS operating_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE
      patientId TEXT,
      procedure TEXT,
      startTime DATETIME,
      staffIds TEXT, -- JSON array of employee IDs
      findings TEXT,
      FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- APPOINTMENT, BILLING, HEALTH, SYSTEM
      isRead BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_patients_ownerId ON patients(ownerId);
    CREATE INDEX IF NOT EXISTS idx_appointments_patientId ON appointments(patientId);
    CREATE INDEX IF NOT EXISTS idx_appointments_dateTime ON appointments(dateTime);
    CREATE INDEX IF NOT EXISTS idx_hospitalizations_patientId ON hospitalizations(patientId);
    CREATE INDEX IF NOT EXISTS idx_hospitalizations_dischargeDate ON hospitalizations(dischargeDate);
    CREATE INDEX IF NOT EXISTS idx_consultations_patient_status ON consultations(patientId, status);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoiceId ON invoice_items(invoiceId);
    CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);

    -- GDPR Compliance Tables
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

// Auto-initialize on import
initDb();

// Migrations
try { db.exec(`ALTER TABLE hospitalizations ADD COLUMN vitals TEXT`); } catch {}
try { db.exec(`ALTER TABLE hospitalizations ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS operating_rooms (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'AVAILABLE', patientId TEXT, procedure TEXT, startTime DATETIME, staffIds TEXT, findings TEXT)`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, userId TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, type TEXT NOT NULL, isRead BOOLEAN DEFAULT 0, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`); } catch {}
try { db.exec(`ALTER TABLE employees ADD COLUMN qualifications TEXT`); } catch {}
try { db.exec(`ALTER TABLE employees ADD COLUMN position TEXT`); } catch {}
try { db.exec(`ALTER TABLE employees ADD COLUMN biography TEXT`); } catch {}
try { db.exec(`ALTER TABLE employees ADD COLUMN workDays TEXT`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS employee_attendance (id TEXT PRIMARY KEY, userId TEXT NOT NULL, type TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, notes TEXT)`); } catch {}
try { db.exec(`ALTER TABLE invoices ADD COLUMN consultationId TEXT`); } catch {}
try { db.exec(`ALTER TABLE invoices ADD COLUMN consultationNumber TEXT`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS consultations (id TEXT PRIMARY KEY, consultationNumber TEXT UNIQUE NOT NULL, appointmentId TEXT, patientId TEXT NOT NULL, hospitalizationId TEXT, status TEXT NOT NULL DEFAULT 'OPEN', startedAt DATETIME DEFAULT CURRENT_TIMESTAMP, closedAt DATETIME)`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS billing_catalog (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, unit TEXT NOT NULL, unitPrice REAL NOT NULL, isActive BOOLEAN DEFAULT 1, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS invoice_items (id TEXT PRIMARY KEY, invoiceId TEXT NOT NULL, consultationId TEXT, hospitalizationId TEXT, catalogItemId TEXT, description TEXT NOT NULL, quantity REAL NOT NULL, unit TEXT NOT NULL, unitPrice REAL NOT NULL, amount REAL NOT NULL, notes TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`); } catch {}

function seedBillingCatalog() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM billing_catalog').get() as { c: number }).c;
  if (count > 0) return;

  const catalog = [
    ['bc_001', 'CONS-GENERAL', 'Consulta general', 'PROCEDURE', 'consulta', 45],
    ['bc_002', 'CONS-URG', 'Consulta de urgencias', 'PROCEDURE', 'consulta', 85],
    ['bc_003', 'CONS-CARDIO', 'Consulta cardiologia', 'PROCEDURE', 'consulta', 110],
    ['bc_004', 'HOSP-DAY', 'Hospitalizacion diaria', 'PROCEDURE', 'dia', 75],
    ['bc_005', 'ICU-DAY', 'UCI diaria', 'PROCEDURE', 'dia', 140],
    ['bc_006', 'XRAY', 'Radiografia', 'PROCEDURE', 'prueba', 68],
    ['bc_007', 'ECO', 'Ecografia', 'PROCEDURE', 'prueba', 95],
    ['bc_008', 'AN-BASIC', 'Analitica basica', 'PROCEDURE', 'prueba', 59],
    ['bc_009', 'AN-COMP', 'Analitica completa', 'PROCEDURE', 'prueba', 110],
    ['bc_010', 'SURG-STER', 'Esterilizacion', 'PROCEDURE', 'cirugia', 290],
    ['bc_011', 'SURG-TRAUMA', 'Cirugia traumatologica', 'PROCEDURE', 'cirugia', 980],
    ['bc_012', 'DENTAL-CLEAN', 'Limpieza dental', 'PROCEDURE', 'procedimiento', 155],
    ['bc_013', 'ANEST', 'Anestesia general', 'SUPPLY', 'dosis', 65],
    ['bc_014', 'FLUID-THERAPY', 'Fluidoterapia', 'PROCEDURE', 'sesion', 42],
    ['bc_015', 'MONITOR', 'Monitorizacion continua', 'PROCEDURE', 'hora', 18],
    ['bc_016', 'AMOX-250', 'Amoxicilina 250 mg', 'MEDICATION', 'tableta', 1.25],
    ['bc_017', 'ABX-INJ', 'Antibiotico inyectable', 'MEDICATION', 'ampolla', 12.4],
    ['bc_018', 'ANTIINF', 'Antiinflamatorio canino', 'MEDICATION', 'tableta', 1.9],
    ['bc_019', 'ANALG-INJ', 'Analgesico postoperatorio', 'MEDICATION', 'ampolla', 9.8],
    ['bc_020', 'CORT-INJ', 'Corticoide inyectable', 'MEDICATION', 'vial', 11.2],
    ['bc_021', 'RINGER', 'Solucion Ringer Lactato', 'SUPPLY', 'bolsa', 8.5],
    ['bc_022', 'SUERO-500', 'Suero fisiologico 500 ml', 'SUPPLY', 'bolsa', 6.8],
    ['bc_023', 'CATH-IV', 'Cateter IV', 'SUPPLY', 'unidad', 2.4],
    ['bc_024', 'SYR-5', 'Jeringa 5 ml', 'SUPPLY', 'unidad', 0.55],
    ['bc_025', 'NEEDLE', 'Aguja hipodermica', 'SUPPLY', 'unidad', 0.25],
    ['bc_026', 'GAUZE', 'Gasas esteriles', 'SUPPLY', 'paquete', 1.8],
    ['bc_027', 'SUTURE', 'Hilo quirurgico absorbible', 'SUPPLY', 'unidad', 7.2],
    ['bc_028', 'VACC-RAB', 'Vacuna antirrabica', 'MEDICATION', 'dosis', 42],
    ['bc_029', 'VACC-POLY', 'Vacuna polivalente', 'MEDICATION', 'dosis', 48],
    ['bc_030', 'PARASITE', 'Desparasitacion interna', 'MEDICATION', 'dosis', 29]
  ] as const;

  const insert = db.prepare(`
    INSERT INTO billing_catalog (id, code, name, category, unit, unitPrice)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const row of catalog) {
      insert.run(row[0], row[1], row[2], row[3], row[4], row[5]);
    }
  });
  tx();
}

seedBillingCatalog();

export default db;
