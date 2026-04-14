const Database = require('better-sqlite3');
const { hashSync } = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../vet_hospital.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = OFF');

console.log('=== Iniciando poblado de base de datos ===\n');

// ─── SCHEMA ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
    name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'CLIENT',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY, userId TEXT UNIQUE NOT NULL, phone TEXT, address TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY, userId TEXT UNIQUE NOT NULL, specialization TEXT,
    licenseNumber TEXT UNIQUE, schedule TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, species TEXT NOT NULL, breed TEXT,
    birthDate DATETIME, gender TEXT, weight REAL, ownerId TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'HEALTHY', image TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ownerId) REFERENCES clients(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS medical_records (
    id TEXT PRIMARY KEY, patientId TEXT NOT NULL, veterinarianId TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP, diagnosis TEXT NOT NULL,
    treatment TEXT, observations TEXT, attachments TEXT,
    FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinarianId) REFERENCES employees(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS hospitalizations (
    id TEXT PRIMARY KEY, patientId TEXT NOT NULL,
    admissionDate DATETIME DEFAULT CURRENT_TIMESTAMP, dischargeDate DATETIME,
    status TEXT NOT NULL DEFAULT 'OBSERVATION', monitoredBy TEXT, notes TEXT, vitals TEXT,
    FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
    speciesTarget TEXT, quantity INTEGER NOT NULL, unit TEXT NOT NULL,
    minStock INTEGER NOT NULL, expiryDate DATETIME, location TEXT
  );
  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY, patientId TEXT NOT NULL, reason TEXT NOT NULL,
    dateTime DATETIME NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'SCHEDULED',
    FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY, clientId TEXT NOT NULL, amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', items TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, dueDate DATETIME NOT NULL,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
  );
`);

// ─── CLEAR ────────────────────────────────────────────────────────────────────
const clearAll = db.transaction(() => {
  db.prepare('DELETE FROM invoices').run();
  db.prepare('DELETE FROM appointments').run();
  db.prepare('DELETE FROM medical_records').run();
  db.prepare('DELETE FROM hospitalizations').run();
  db.prepare('DELETE FROM inventory_items').run();
  db.prepare('DELETE FROM patients').run();
  db.prepare('DELETE FROM employees').run();
  db.prepare('DELETE FROM clients').run();
  db.prepare('DELETE FROM users').run();
});
clearAll();

const adminPwd = hashSync('admin123', 10);
const vetPwd   = hashSync('vet123', 10);
const userPwd  = hashSync('user123', 10);

// ─── STAFF (EMPLOYEES) ────────────────────────────────────────────────────────
const staff = [
  { uid:'u1', eid:'e1', name:'Dr. Alejandro Sanz',    email:'admin@hospitalvet.com',   role:'ADMIN',        spec:'Cirugía Avanzada',          lic:'VET-9942', sched:'Mañana (08:00 - 16:00)',  pwd: adminPwd },
  { uid:'u2', eid:'e2', name:'Dra. Elena Martínez',   email:'elena@hospitalvet.com',   role:'VETERINARIAN', spec:'Animales Exóticos',          lic:'VET-8821', sched:'Noche (23:00 - 07:00)',   pwd: vetPwd },
  { uid:'u3', eid:'e3', name:'Dr. Carlos Rivera',     email:'carlos@hospitalvet.com',  role:'VETERINARIAN', spec:'Medicina Interna',           lic:'VET-7741', sched:'Mañana (08:00 - 16:00)',  pwd: vetPwd },
  { uid:'u4', eid:'e4', name:'Dra. Laura Jiménez',    email:'laura@hospitalvet.com',   role:'VETERINARIAN', spec:'Dermatología Veterinaria',   lic:'VET-6631', sched:'Tarde (16:00 - 00:00)',   pwd: vetPwd },
  { uid:'u5', eid:'e5', name:'Dr. Miguel Ángel Torres',email:'miguel@hospitalvet.com', role:'VETERINARIAN', spec:'Traumatología y Ortopedia',  lic:'VET-5521', sched:'Mañana (08:00 - 16:00)',  pwd: vetPwd },
  { uid:'u6', eid:'e6', name:'Dra. Sara López',       email:'sara@hospitalvet.com',    role:'VETERINARIAN', spec:'Cardiología Veterinaria',    lic:'VET-4411', sched:'Tarde (16:00 - 00:00)',   pwd: vetPwd },
  { uid:'u7', eid:'e7', name:'Aux. Roberto Gómez',    email:'roberto@hospitalvet.com', role:'STAFF',        spec:'Auxiliar de Clínica',        lic:null,       sched:'Noche (23:00 - 07:00)',   pwd: vetPwd },
  { uid:'u8', eid:'e8', name:'Aux. Patricia Ruiz',    email:'patricia@hospitalvet.com',role:'STAFF',        spec:'Técnico en Radiología',      lic:'TEC-1122', sched:'Mañana (08:00 - 16:00)',  pwd: vetPwd },
];

const insUser = db.prepare('INSERT INTO users (id,email,password,name,role) VALUES (?,?,?,?,?)');
const insEmp  = db.prepare('INSERT INTO employees (id,userId,specialization,licenseNumber,schedule) VALUES (?,?,?,?,?)');
for (const s of staff) {
  insUser.run(s.uid, s.email, s.pwd, s.name, s.role);
  insEmp.run(s.eid, s.uid, s.spec, s.lic, s.sched);
}
console.log(`✓ ${staff.length} empleados creados`);

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
const clients = [
  { uid:'u10', cid:'c1', name:'María García',         email:'maria@gmail.com',       phone:'+34 600 111 222', addr:'Calle Mayor 15, Madrid' },
  { uid:'u11', cid:'c2', name:'Zoológico Central',    email:'zoo@madrid.es',         phone:'+34 912 345 678', addr:'Av. de las Comunidades s/n, Madrid' },
  { uid:'u12', cid:'c3', name:'Juan Antonio Pérez',   email:'juanpe@hotmail.com',    phone:'+34 611 222 333', addr:'Gran Vía 42, Madrid' },
  { uid:'u13', cid:'c4', name:'Ana Belén Soria',      email:'ana.soria@outlook.com', phone:'+34 622 333 444', addr:'Paseo del Prado 8, Madrid' },
  { uid:'u14', cid:'c5', name:'Hacienda del Jaral',   email:'hacienda@jaral.es',     phone:'+34 913 456 789', addr:'Carretera M-501 km 12, Villanueva' },
  { uid:'u15', cid:'c6', name:'Pablo Moreno Cruz',    email:'pablo.moreno@gmail.com',phone:'+34 633 444 555', addr:'Calle Alcalá 98, Madrid' },
  { uid:'u16', cid:'c7', name:'Isabel Fernández',     email:'isabel.fdz@gmail.com',  phone:'+34 644 555 666', addr:'Calle Serrano 12, Madrid' },
  { uid:'u17', cid:'c8', name:'Granja Escuela Pinos', email:'granja@pinos.es',       phone:'+34 918 765 432', addr:'Ctra. Colmenar km 8, Madrid' },
  { uid:'u18', cid:'c9', name:'Rafael Domínguez',     email:'rafa.dom@yahoo.es',     phone:'+34 655 666 777', addr:'Avenida de América 44, Madrid' },
  { uid:'u19', cid:'c10',name:'Lucía Navarro Sanz',   email:'lucia.navarro@gmail.com',phone:'+34 666 777 888', addr:'Calle Fuencarral 77, Madrid' },
];

const insCli = db.prepare('INSERT INTO clients (id,userId,phone,address) VALUES (?,?,?,?)');
for (const c of clients) {
  insUser.run(c.uid, c.email, userPwd, c.name, 'CLIENT');
  insCli.run(c.cid, c.uid, c.phone, c.addr);
}
console.log(`✓ ${clients.length} clientes creados`);

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
const patients = [
  // c1 - María García
  { id:'p1',  name:'Luna',       species:'Gato',    breed:'Siamés',               birth:'2020-05-12', gender:'Hembra', weight:4.2,  owner:'c1', status:'HOSPITALIZED' },
  { id:'p2',  name:'Toby',       species:'Perro',   breed:'Golden Retriever',      birth:'2021-02-15', gender:'Macho',  weight:28.3, owner:'c1', status:'HEALTHY' },
  // c2 - Zoológico
  { id:'p3',  name:'Simba',      species:'León',    breed:'Africano',             birth:'2022-08-01', gender:'Macho',  weight:185.0,owner:'c2', status:'CRITICAL' },
  { id:'p4',  name:'Kali',       species:'Tigre',   breed:'Bengala',              birth:'2021-03-10', gender:'Hembra', weight:142.0,owner:'c2', status:'HOSPITALIZED' },
  { id:'p5',  name:'Loro Verde', species:'Loro',    breed:'Amazona',              birth:'2018-06-20', gender:'Macho',  weight:0.45, owner:'c2', status:'HEALTHY' },
  // c3 - Juan Antonio
  { id:'p6',  name:'Rocky',      species:'Perro',   breed:'Bulldog Francés',      birth:'2022-11-01', gender:'Macho',  weight:11.5, owner:'c3', status:'HEALTHY' },
  { id:'p7',  name:'Bella',      species:'Perro',   breed:'Labrador',             birth:'2020-07-22', gender:'Hembra', weight:24.0, owner:'c3', status:'TREATMENT' },
  // c4 - Ana Belén
  { id:'p8',  name:'Mimi',       species:'Gato',    breed:'Persa',                birth:'2019-04-05', gender:'Hembra', weight:3.8,  owner:'c4', status:'HEALTHY' },
  { id:'p9',  name:'Tigre',      species:'Gato',    breed:'Maine Coon',           birth:'2021-09-14', gender:'Macho',  weight:6.1,  owner:'c4', status:'HEALTHY' },
  // c5 - Hacienda del Jaral
  { id:'p10', name:'Trueno',     species:'Caballo', breed:'Pura Sangre Español',  birth:'2017-03-18', gender:'Macho',  weight:510.0,owner:'c5', status:'HOSPITALIZED' },
  { id:'p11', name:'Estrella',   species:'Caballo', breed:'Andaluz',              birth:'2018-07-09', gender:'Hembra', weight:470.0,owner:'c5', status:'HEALTHY' },
  { id:'p12', name:'Nube',       species:'Caballo', breed:'Árabe',                birth:'2020-01-25', gender:'Hembra', weight:430.0,owner:'c5', status:'HEALTHY' },
  // c6 - Pablo Moreno
  { id:'p13', name:'Max',        species:'Perro',   breed:'Pastor Alemán',        birth:'2019-12-03', gender:'Macho',  weight:34.0, owner:'c6', status:'HEALTHY' },
  { id:'p14', name:'Coco',       species:'Perro',   breed:'Chihuahua',            birth:'2023-05-11', gender:'Macho',  weight:3.1,  owner:'c6', status:'HEALTHY' },
  // c7 - Isabel Fernández
  { id:'p15', name:'Nala',       species:'Gato',    breed:'Ragdoll',              birth:'2021-08-17', gender:'Hembra', weight:5.5,  owner:'c7', status:'TREATMENT' },
  { id:'p16', name:'Simón',      species:'Conejo',  breed:'Gigante de Flandes',   birth:'2022-03-02', gender:'Macho',  weight:7.2,  owner:'c7', status:'HEALTHY' },
  // c8 - Granja Escuela
  { id:'p17', name:'Manchas',    species:'Vaca',    breed:'Frisona',              birth:'2019-09-15', gender:'Hembra', weight:620.0,owner:'c8', status:'HEALTHY' },
  { id:'p18', name:'Pelusa',     species:'Oveja',   breed:'Merina',               birth:'2022-02-10', gender:'Hembra', weight:55.0, owner:'c8', status:'HEALTHY' },
  { id:'p19', name:'Chivo',      species:'Cabra',   breed:'Murciano-Granadina',   birth:'2021-11-20', gender:'Macho',  weight:48.0, owner:'c8', status:'CRITICAL' },
  // c9 - Rafael Domínguez
  { id:'p20', name:'Tsunami',    species:'Perro',   breed:'Akita Inu',            birth:'2020-04-08', gender:'Macho',  weight:39.0, owner:'c9', status:'HEALTHY' },
  { id:'p21', name:'Pera',       species:'Iguana',  breed:'Verde',                birth:'2021-07-30', gender:'Hembra', weight:1.8,  owner:'c9', status:'HOSPITALIZED' },
  // c10 - Lucía Navarro
  { id:'p22', name:'Chocolate',  species:'Perro',   breed:'Cocker Spaniel',       birth:'2022-06-14', gender:'Hembra', weight:13.5, owner:'c10',status:'HEALTHY' },
  { id:'p23', name:'Nieve',      species:'Gato',    breed:'Angora',               birth:'2023-01-01', gender:'Hembra', weight:3.2,  owner:'c10',status:'HEALTHY' },
];

const insPat = db.prepare(`INSERT INTO patients (id,name,species,breed,birthDate,gender,weight,ownerId,status) VALUES (?,?,?,?,?,?,?,?,?)`);
for (const p of patients) {
  insPat.run(p.id, p.name, p.species, p.breed, p.birth, p.gender, p.weight, p.owner, p.status);
}
console.log(`✓ ${patients.length} pacientes creados`);

// ─── HOSPITALIZATIONS ─────────────────────────────────────────────────────────
const hosps = [
  { id:'h1', patientId:'p1',  status:'STABLE',          notes:'Post-operatorio esterilización. Evolución favorable.', vitals:{ temp:'38.2C', heart:'110bpm', resp:'22rpm', sp02:'99%' } },
  { id:'h2', patientId:'p3',  status:'INTENSIVE_CARE',  notes:'Trauma severo en extremidad anterior. UCI 24h. Responde a fluidoterapia.', vitals:{ temp:'39.4C', heart:'148bpm', resp:'35rpm', sp02:'93%' } },
  { id:'h3', patientId:'p4',  status:'OBSERVATION',     notes:'Infección parasitaria severa. En tratamiento antiparasitario.', vitals:{ temp:'38.8C', heart:'95bpm', resp:'28rpm', sp02:'97%' } },
  { id:'h4', patientId:'p10', status:'STABLE',          notes:'Cólico intestinal tratado. Monitorización digestiva post-crisis.', vitals:{ temp:'38.1C', heart:'42bpm', resp:'14rpm', sp02:'98%' } },
  { id:'h5', patientId:'p19', status:'CRITICAL',        notes:'Hipocalcemia aguda. Suplementación IV urgente. Estado grave.', vitals:{ temp:'40.1C', heart:'160bpm', resp:'40rpm', sp02:'88%' } },
  { id:'h6', patientId:'p21', status:'OBSERVATION',     notes:'Anorexia y letargia. Posible infección respiratoria en reptil.', vitals:{ temp:'29.5C', heart:'55bpm', resp:'12rpm', sp02:'95%' } },
];
const insHosp = db.prepare(`INSERT INTO hospitalizations (id,patientId,status,notes,vitals) VALUES (?,?,?,?,?)`);
for (const h of hosps) {
  insHosp.run(h.id, h.patientId, h.status, h.notes, JSON.stringify(h.vitals));
}
console.log(`✓ ${hosps.length} hospitalizaciones creadas`);

// ─── MEDICAL RECORDS ──────────────────────────────────────────────────────────
const records = [
  { id:'mr1',  patientId:'p1',  vetId:'e1', date:'2026-02-20 10:30:00', diag:'Ovariohisterectomía programada exitosa', treat:'Amoxicilina 100mg/12h + reposo absoluto 7 días', obs:'Sin complicaciones intraoperatorias' },
  { id:'mr2',  patientId:'p2',  vetId:'e3', date:'2026-01-15 09:00:00', diag:'Revisión anual. Vacunación puesta al día', treat:'Rabia + Moquillo + Parvo. Desparasitación interna', obs:'Animal en perfectas condiciones' },
  { id:'mr3',  patientId:'p3',  vetId:'e1', date:'2026-02-22 14:00:00', diag:'Fractura de radio izquierdo por caída', treat:'Vendaje enyesado + Tramadol 0.5mg/kg cada 8h', obs:'Radiografía post-reducción satisfactoria' },
  { id:'mr4',  patientId:'p4',  vetId:'e2', date:'2026-02-21 11:00:00', diag:'Toxocara canis severo. Parasitemia alta', treat:'Fenbendazol oral 10 días + vitaminas', obs:'Analítica de control en 2 semanas' },
  { id:'mr5',  patientId:'p6',  vetId:'e3', date:'2026-02-10 16:30:00', diag:'Dermatitis atópica leve', treat:'Hidrocortisona tópica + champú medicado 2x/semana', obs:'Evitar alérgenos de gramíneas' },
  { id:'mr6',  patientId:'p7',  vetId:'e4', date:'2026-02-18 12:00:00', diag:'Displasia de cadera bilateral grado II', treat:'Meloxicam 0.2mg/kg/día + fisioterapia acuática', obs:'Control radiológico bimestral' },
  { id:'mr7',  patientId:'p8',  vetId:'e4', date:'2026-01-28 10:00:00', diag:'Alopecia hormonal (hipertiroidismo)', treat:'Metimazol 2.5mg/12h indefinido + dieta hyperthyroid', obs:'Control tiroideo en 30 días' },
  { id:'mr8',  patientId:'p10', vetId:'e3', date:'2026-02-23 08:00:00', diag:'Cólico espasmódico equino', treat:'Butilescopolamina IV + fluidoterapia 10L', obs:'Deambulación supervisada cada 2h' },
  { id:'mr9',  patientId:'p13', vetId:'e5', date:'2026-02-12 11:30:00', diag:'Rotura ligamento cruzado anterior (RLCA)', treat:'Cirugía TPLO programada en 2 semanas', obs:'Vendaje Robert Jones provisional' },
  { id:'mr10', patientId:'p15', vetId:'e4', date:'2026-02-19 09:30:00', diag:'Urolitiasis vesical (cálculos de estruvita)', treat:'Dieta urinary S/O 30 días + hidratación forzada', obs:'Ecografía de control en 3 semanas' },
  { id:'mr11', patientId:'p19', vetId:'e6', date:'2026-02-23 07:00:00', diag:'Hipocalcemia puerperal aguda', treat:'Gluconato cálcico IV lento + VitD3', obs:'Retirar crías temporalmente' },
  { id:'mr12', patientId:'p20', vetId:'e3', date:'2026-01-10 15:00:00', diag:'Vacunación anual + revisión dentadura', treat:'Vacuna polivalente. Profilaxis dental completa', obs:'Estado óptimo. Próxima revisión enero 2027' },
  { id:'mr13', patientId:'p21', vetId:'e2', date:'2026-02-22 16:00:00', diag:'Infección respiratoria bacteriana en reptil', treat:'Enrofloxacino 5mg/kg IM cada 48h + nebulización', obs:'Aumentar temperatura del terrario a 32°C' },
  { id:'mr14', patientId:'p22', vetId:'e4', date:'2026-02-05 10:00:00', diag:'Otitis externa bilateral fúngica', treat:'Clotrimazol ótico 7 días + limpieza diaria con suero', obs:'No bañar durante 2 semanas' },
  { id:'mr15', patientId:'p5',  vetId:'e2', date:'2026-02-14 09:00:00', diag:'Revisión plumaje y pico. Animal sano', treat:'Vitaminas y calcio oral. Enriquecimiento ambiental', obs:'Vocalización normal. Sin cambios de comportamiento' },
];
const insMR = db.prepare(`INSERT INTO medical_records (id,patientId,veterinarianId,date,diagnosis,treatment,observations) VALUES (?,?,?,?,?,?,?)`);
for (const r of records) {
  insMR.run(r.id, r.patientId, r.vetId, r.date, r.diag, r.treat, r.obs);
}
console.log(`✓ ${records.length} registros médicos creados`);

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
const now = new Date();
const fmtDate = (daysOffset, hour, min = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString().replace('T', ' ').substring(0, 19);
};

const appointments = [
  { id:'a1',  patientId:'p2',  reason:'Vacunación anual rabia',           dateTime:fmtDate(1, 9, 0),  type:'Consulta',    status:'SCHEDULED' },
  { id:'a2',  patientId:'p6',  reason:'Revisión dermatitis post-tto',     dateTime:fmtDate(1, 10, 30),type:'Consulta',    status:'SCHEDULED' },
  { id:'a3',  patientId:'p13', reason:'Cirugía TPLO ligamento cruzado',   dateTime:fmtDate(2, 8, 0),  type:'Cirugía',     status:'SCHEDULED' },
  { id:'a4',  patientId:'p7',  reason:'Fisioterapia acuática sesión 3',   dateTime:fmtDate(2, 11, 0), type:'Rehabilitación',status:'SCHEDULED' },
  { id:'a5',  patientId:'p22', reason:'Revisión otitis post-tratamiento', dateTime:fmtDate(3, 9, 30), type:'Consulta',    status:'SCHEDULED' },
  { id:'a6',  patientId:'p8',  reason:'Control tiroideo + analítica',     dateTime:fmtDate(3, 11, 0), type:'Diagnóstico', status:'SCHEDULED' },
  { id:'a7',  patientId:'p15', reason:'Ecografía vesical urolitiasis',    dateTime:fmtDate(5, 10, 0), type:'Diagnóstico', status:'SCHEDULED' },
  { id:'a8',  patientId:'p23', reason:'Primera consulta cachorro',        dateTime:fmtDate(5, 12, 0), type:'Consulta',    status:'SCHEDULED' },
  { id:'a9',  patientId:'p16', reason:'Castración conejo',               dateTime:fmtDate(7, 9, 0),  type:'Cirugía',     status:'SCHEDULED' },
  { id:'a10', patientId:'p20', reason:'Limpieza dental bajo anestesia',   dateTime:fmtDate(7, 14, 0), type:'Cirugía',     status:'SCHEDULED' },
  { id:'a11', patientId:'p11', reason:'Control veterinario equino anual', dateTime:fmtDate(10, 10, 0),type:'Consulta',    status:'SCHEDULED' },
  { id:'a12', patientId:'p17', reason:'Revisión ubre y análisis leche',   dateTime:fmtDate(10, 8, 0), type:'Diagnóstico', status:'SCHEDULED' },
  { id:'a13', patientId:'p9',  reason:'Castración felino',               dateTime:fmtDate(14, 9, 0), type:'Cirugía',     status:'SCHEDULED' },
  { id:'a14', patientId:'p14', reason:'Vacunas primer año completas',     dateTime:fmtDate(14, 11, 0),type:'Consulta',    status:'SCHEDULED' },
  // Past appointments
  { id:'a15', patientId:'p1',  reason:'Pre-operatorio esterilización',    dateTime:fmtDate(-5, 10, 0),type:'Consulta',    status:'COMPLETED' },
  { id:'a16', patientId:'p3',  reason:'Urgencia traumatismo',             dateTime:fmtDate(-3, 3, 30),type:'Urgencia',    status:'COMPLETED' },
  { id:'a17', patientId:'p4',  reason:'Análisis detección parasitaria',   dateTime:fmtDate(-2, 9, 0), type:'Diagnóstico', status:'COMPLETED' },
  { id:'a18', patientId:'p10', reason:'Cólico equino urgente',           dateTime:fmtDate(-1, 2, 0), type:'Urgencia',    status:'COMPLETED' },
  { id:'a19', patientId:'p5',  reason:'Revisión anual aves exóticas',    dateTime:fmtDate(-7, 10, 0),type:'Consulta',    status:'COMPLETED' },
  { id:'a20', patientId:'p18', reason:'Esquila y revisión piel',         dateTime:fmtDate(-4, 8, 30),type:'Consulta',    status:'COMPLETED' },
];
const insApp = db.prepare(`INSERT INTO appointments (id,patientId,reason,dateTime,type,status) VALUES (?,?,?,?,?,?)`);
for (const a of appointments) {
  insApp.run(a.id, a.patientId, a.reason, a.dateTime, a.type, a.status);
}
console.log(`✓ ${appointments.length} citas creadas`);

// ─── INVENTORY ────────────────────────────────────────────────────────────────
const inventory = [
  // Medicamentos
  { id:'i1',  name:'Amoxicilina 250mg',           cat:'Medicación',    qty:450, unit:'tabletas',  min:100, loc:'Farmacia A',   exp:'2027-06-30' },
  { id:'i2',  name:'Meloxicam 1mg/ml (inyect.)',  cat:'Medicación',    qty:85,  unit:'viales',    min:30,  loc:'Farmacia A',   exp:'2026-12-31' },
  { id:'i3',  name:'Tramadol 50mg',               cat:'Medicación',    qty:200, unit:'tabletas',  min:50,  loc:'Farmacia A',   exp:'2027-03-31' },
  { id:'i4',  name:'Enrofloxacino 5%',            cat:'Medicación',    qty:40,  unit:'viales',    min:20,  loc:'Farmacia B',   exp:'2026-09-30' },
  { id:'i5',  name:'Fenbendazol 100mg',           cat:'Antiparasitario',qty:300,unit:'tabletas',  min:80,  loc:'Farmacia B',   exp:'2027-08-31' },
  { id:'i6',  name:'Metronidazol 250mg',          cat:'Medicación',    qty:150, unit:'tabletas',  min:40,  loc:'Farmacia A',   exp:'2027-01-31' },
  { id:'i7',  name:'Ketamina 10% inyectable',     cat:'Anestesia',     qty:22,  unit:'frascos',   min:10,  loc:'Anestesia',    exp:'2026-11-30' },
  { id:'i8',  name:'Propofol 10mg/ml',            cat:'Anestesia',     qty:35,  unit:'viales',    min:15,  loc:'Anestesia',    exp:'2026-10-31' },
  { id:'i9',  name:'Isoflurano 250ml',            cat:'Anestesia',     qty:8,   unit:'botes',     min:5,   loc:'Anestesia',    exp:'2027-12-31' },
  { id:'i10', name:'Gluconato Cálcico 10%',       cat:'Medicación',    qty:55,  unit:'ampollas',  min:20,  loc:'Farmacia B',   exp:'2027-04-30' },
  { id:'i11', name:'Metimazol 5mg',               cat:'Medicación',    qty:90,  unit:'tabletas',  min:30,  loc:'Farmacia A',   exp:'2026-08-31' },
  { id:'i12', name:'Butilescopolamina 20mg',      cat:'Medicación',    qty:60,  unit:'ampollas',  min:15,  loc:'Farmacia B',   exp:'2027-05-31' },
  // Consumibles
  { id:'i13', name:'Suero Fisiológico 500ml',     cat:'Consumibles',   qty:18,  unit:'bolsas',    min:30,  loc:'Almacén A',    exp:null },
  { id:'i14', name:'Suero Ringer Lactato 1L',     cat:'Consumibles',   qty:42,  unit:'bolsas',    min:25,  loc:'Almacén A',    exp:null },
  { id:'i15', name:'Gasas estériles 10x10',       cat:'Consumibles',   qty:800, unit:'unidades',  min:200, loc:'Almacén B',    exp:null },
  { id:'i16', name:'Guantes nitrilo talla M',     cat:'Consumibles',   qty:500, unit:'pares',     min:100, loc:'Almacén B',    exp:null },
  { id:'i17', name:'Jeringas 5ml',                cat:'Consumibles',   qty:1200,unit:'unidades',  min:300, loc:'Almacén B',    exp:null },
  { id:'i18', name:'Catéteres IV 22G',            cat:'Consumibles',   qty:150, unit:'unidades',  min:50,  loc:'Almacén A',    exp:null },
  { id:'i19', name:'Vendas elásticas 10cm',       cat:'Consumibles',   qty:35,  unit:'rollos',    min:20,  loc:'Almacén B',    exp:null },
  { id:'i20', name:'Suturas Vicryl 2-0',          cat:'Consumibles',   qty:0,   unit:'cajas',     min:10,  loc:'Quirófano 1',  exp:'2027-07-31' },
  { id:'i21', name:'Tubos endotraqueales set',    cat:'Consumibles',   qty:45,  unit:'unidades',  min:15,  loc:'Anestesia',    exp:null },
  // Vacunas
  { id:'i22', name:'Vac. Polivalente DHPP Canina',cat:'Vacuna',        qty:120, unit:'dosis',     min:40,  loc:'Nevera 1',     exp:'2026-06-30' },
  { id:'i23', name:'Vac. Antirrábica canina',     cat:'Vacuna',        qty:95,  unit:'dosis',     min:30,  loc:'Nevera 1',     exp:'2026-08-31' },
  { id:'i24', name:'Vac. Trivalente felina',      cat:'Vacuna',        qty:80,  unit:'dosis',     min:25,  loc:'Nevera 1',     exp:'2026-05-31' },
  { id:'i25', name:'Vac. Leucemia Felina (FeLV)', cat:'Vacuna',        qty:50,  unit:'dosis',     min:20,  loc:'Nevera 1',     exp:'2026-07-31' },
  // Equipamiento / Diagnóstico
  { id:'i26', name:'Tiras reactivas glucosa',     cat:'Diagnóstico',   qty:200, unit:'tiras',     min:50,  loc:'Lab.',         exp:'2026-12-31' },
  { id:'i27', name:'Tubos EDTA analítica',        cat:'Diagnóstico',   qty:400, unit:'unidades',  min:100, loc:'Lab.',         exp:null },
  { id:'i28', name:'Alcohol isopropílico 1L',     cat:'Desinfectante', qty:24,  unit:'botellas',  min:10,  loc:'Almacén A',    exp:null },
  { id:'i29', name:'Clorhexidina 2% 500ml',       cat:'Desinfectante', qty:12,  unit:'botellas',  min:8,   loc:'Almacén A',    exp:null },
  { id:'i30', name:'Alimento terapéutico Renal',  cat:'Nutrición',     qty:140, unit:'latas',     min:40,  loc:'Alimentación', exp:'2027-08-31' },
];
const insInv = db.prepare(`INSERT INTO inventory_items (id,name,category,quantity,unit,minStock,location,expiryDate) VALUES (?,?,?,?,?,?,?,?)`);
for (const item of inventory) {
  insInv.run(item.id, item.name, item.cat, item.qty, item.unit, item.min, item.loc, item.exp);
}
console.log(`✓ ${inventory.length} artículos de inventario creados`);

// ─── INVOICES ─────────────────────────────────────────────────────────────────
const pastDate = (daysAgo) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().replace('T', ' ').substring(0, 19);
};
const dueDate = (daysOffset) => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().replace('T', ' ').substring(0, 19);
};

const invoices = [
  { id:'inv1',  cid:'c1',  amount:385.00, status:'PAID',    created:pastDate(30), due:pastDate(15) },
  { id:'inv2',  cid:'c2',  amount:1850.50,status:'PAID',    created:pastDate(25), due:pastDate(10) },
  { id:'inv3',  cid:'c3',  amount:420.00, status:'PENDING', created:pastDate(5),  due:dueDate(25) },
  { id:'inv4',  cid:'c4',  amount:275.00, status:'PAID',    created:pastDate(15), due:pastDate(1) },
  { id:'inv5',  cid:'c5',  amount:2400.00,status:'PENDING', created:pastDate(3),  due:dueDate(27) },
  { id:'inv6',  cid:'c6',  amount:580.00, status:'OVERDUE', created:pastDate(45), due:pastDate(15) },
  { id:'inv7',  cid:'c7',  amount:195.00, status:'PAID',    created:pastDate(10), due:pastDate(0) },
  { id:'inv8',  cid:'c8',  amount:310.00, status:'PENDING', created:pastDate(7),  due:dueDate(23) },
  { id:'inv9',  cid:'c9',  amount:145.00, status:'PAID',    created:pastDate(20), due:pastDate(5) },
  { id:'inv10', cid:'c10', amount:95.00,  status:'PAID',    created:pastDate(12), due:pastDate(2) },
  { id:'inv11', cid:'c1',  amount:650.00, status:'PENDING', created:pastDate(2),  due:dueDate(28) },
  { id:'inv12', cid:'c2',  amount:3200.00,status:'PENDING', created:pastDate(1),  due:dueDate(29) },
  { id:'inv13', cid:'c5',  amount:1200.00,status:'OVERDUE', created:pastDate(60), due:pastDate(30) },
  { id:'inv14', cid:'c3',  amount:890.00, status:'OVERDUE', created:pastDate(50), due:pastDate(20) },
  { id:'inv15', cid:'c6',  amount:220.00, status:'PAID',    created:pastDate(8),  due:pastDate(0) },
];
const insInv2 = db.prepare(`INSERT INTO invoices (id,clientId,amount,status,createdAt,dueDate) VALUES (?,?,?,?,?,?)`);
for (const inv of invoices) {
  insInv2.run(inv.id, inv.cid, inv.amount, inv.status, inv.created, inv.due);
}
console.log(`✓ ${invoices.length} facturas creadas`);

db.pragma('foreign_keys = ON');

console.log('\n=== ✅ Base de datos poblada exitosamente ===');
console.log('\n📋 Credenciales de acceso:');
console.log('  Admin:  admin@hospitalvet.com   /  admin123');
console.log('  Vet:    elena@hospitalvet.com   /  vet123');
console.log('  Vet:    carlos@hospitalvet.com  /  vet123');
console.log('  Client: maria@gmail.com         /  user123');
console.log('  Client: zoo@madrid.es           /  user123');
console.log('  Client: juanpe@hotmail.com      /  user123');

db.close();
