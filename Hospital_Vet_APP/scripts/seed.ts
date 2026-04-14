import db, { initDb } from '../src/lib/db';
import { hashSync } from 'bcryptjs';

async function seed() {
  console.log('🌱 Iniciando poblado MASIVO de base de datos...');
  initDb();

  // Borrar datos existentes
  console.log('🗑️  Limpiando datos existentes...');
  db.prepare('DELETE FROM notifications').run();
  db.prepare('DELETE FROM employee_attendance').run();
  db.prepare('DELETE FROM operating_rooms').run();
  db.prepare('DELETE FROM invoice_items').run();
  db.prepare('DELETE FROM consultations').run();
  db.prepare('DELETE FROM hospitalizations').run();
  db.prepare('DELETE FROM medical_records').run();
  db.prepare('DELETE FROM appointments').run();
  db.prepare('DELETE FROM inventory_items').run();
  db.prepare('DELETE FROM invoices').run();
  db.prepare('DELETE FROM patients').run();
  db.prepare('DELETE FROM employees').run();
  db.prepare('DELETE FROM clients').run();
  db.prepare('DELETE FROM users').run();

  const hashedAdminPassword = hashSync('admin123', 10);
  const hashedUserPassword = hashSync('user123', 10);
  
  console.log('👥 Creando personal veterinario (20 empleados)...');

  // ============== EMPLEADOS (20) ==============
  const employees = [
    { id: 'u1', email: 'admin@hospitalvet.com', name: 'Dr. Alejandro Sanz', role: 'ADMIN', empId: 'e1', spec: 'Cirugía Avanzada', lic: 'VET-9942', schedule: 'Mañana (08:00 - 16:00)' },
    { id: 'u2', email: 'elena@hospitalvet.com', name: 'Dra. Elena Martínez', role: 'VETERINARIAN', empId: 'e2', spec: 'Animales Exóticos', lic: 'VET-8821', schedule: 'Noche (23:00 - 07:00)' },
    { id: 'u5', email: 'carlos@hospitalvet.com', name: 'Dr. Carlos Ruiz', role: 'VETERINARIAN', empId: 'e3', spec: 'Traumatología', lic: 'VET-7734', schedule: 'Tarde (14:00 - 22:00)' },
    { id: 'u6', email: 'sofia@hospitalvet.com', name: 'Dra. Sofía López', role: 'VETERINARIAN', empId: 'e4', spec: 'Cardiología', lic: 'VET-6655', schedule: 'Mañana (08:00 - 16:00)' },
    { id: 'u51', email: 'miguel@hospitalvet.com', name: 'Dr. Miguel Torres', role: 'VETERINARIAN', empId: 'e5', spec: 'Neurología', lic: 'VET-5544', schedule: 'Tarde (14:00 - 22:00)' },
    { id: 'u52', email: 'ana@hospitalvet.com', name: 'Dra. Ana Moreno', role: 'VETERINARIAN', empId: 'e6', spec: 'Dermatología', lic: 'VET-4433', schedule: 'Mañana (08:00 - 16:00)' },
    { id: 'u53', email: 'pablo@hospitalvet.com', name: 'Dr. Pablo Jiménez', role: 'VETERINARIAN', empId: 'e7', spec: 'Oftalmología', lic: 'VET-3322', schedule: 'Tarde (14:00 - 22:00)' },
    { id: 'u54', email: 'lucia@hospitalvet.com', name: 'Dra. Lucía Romero', role: 'VETERINARIAN', empId: 'e8', spec: 'Oncología', lic: 'VET-2211', schedule: 'Mañana (08:00 - 16:00)' },
    { id: 'u55', email: 'javier@hospitalvet.com', name: 'Dr. Javier Navarro', role: 'VETERINARIAN', empId: 'e9', spec: 'Odontología', lic: 'VET-1100', schedule: 'Tarde (14:00 - 22:00)' },
    { id: 'u56', email: 'carmen@hospitalvet.com', name: 'Dra. Carmen Vega', role: 'VETERINARIAN', empId: 'e10', spec: 'Reproducción', lic: 'VET-9988', schedule: 'Mañana (08:00 - 16:00)' },
    { id: 'u57', email: 'diego@hospitalvet.com', name: 'Dr. Diego Campos', role: 'VETERINARIAN', empId: 'e11', spec: 'Medicina Interna', lic: 'VET-8877', schedule: 'Noche (23:00 - 07:00)' },
    { id: 'u58', email: 'isabel@hospitalvet.com', name: 'Dra. Isabel Santos', role: 'VETERINARIAN', empId: 'e12', spec: 'Cirugía Ortopédica', lic: 'VET-7766', schedule: 'Mañana (08:00 - 16:00)' },
    { id: 'u59', email: 'roberto@hospitalvet.com', name: 'Dr. Roberto Gil', role: 'VETERINARIAN', empId: 'e13', spec: 'Anestesiología', lic: 'VET-6677', schedule: 'Tarde (14:00 - 22:00)' },
    { id: 'u60', email: 'beatriz@hospitalvet.com', name: 'Dra. Beatriz Ramos', role: 'VETERINARIAN', empId: 'e14', spec: 'Nutrición', lic: 'VET-5566', schedule: 'Mañana (08:00 - 16:00)' },
    { id: 'u61', email: 'fernando@hospitalvet.com', name: 'Dr. Fernando Cruz', role: 'VETERINARIAN', empId: 'e15', spec: 'Medicina Felina', lic: 'VET-4455', schedule: 'Tarde (14:00 - 22:00)' },
    { id: 'u62', email: 'patricia@hospitalvet.com', name: 'Patricia Álvarez', role: 'VETERINARIAN', empId: 'e16', spec: 'Medicina Canina', lic: 'VET-3344', schedule: 'Mañana (08:00 - 16:00)' },
    { id: 'u63', email: 'raul@hospitalvet.com', name: 'Raúl Mendoza', role: 'VETERINARIAN', empId: 'e17', spec: 'Urgencias', lic: 'VET-2233', schedule: 'Noche (23:00 - 07:00)' },
    { id: 'u64', email: 'natalia@hospitalvet.com', name: 'Natalia Herrera', role: 'VETERINARIAN', empId: 'e18', spec: 'Diagnóstico por Imagen', lic: 'VET-1122', schedule: 'Mañana (08:00 - 16:00)' },
    { id: 'u65', email: 'sergio@hospitalvet.com', name: 'Sergio Castro', role: 'VETERINARIAN', empId: 'e19', spec: 'Comportamiento Animal', lic: 'VET-0011', schedule: 'Tarde (14:00 - 22:00)' },
    { id: 'u66', email: 'veronica@hospitalvet.com', name: 'Verónica Ortiz', role: 'VETERINARIAN', empId: 'e20', spec: 'Fisioterapia', lic: 'VET-9900', schedule: 'Mañana (08:00 - 16:00)' },
  ];

  for (const emp of employees) {
    db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)').run(
      emp.id, emp.email, hashedAdminPassword, emp.name, emp.role
    );
    db.prepare('INSERT INTO employees (id, userId, specialization, licenseNumber, schedule) VALUES (?, ?, ?, ?, ?)').run(
      emp.empId, emp.id, emp.spec, emp.lic, emp.schedule
    );
  }

  console.log('🏠 Creando clientes (50 clientes)...');

  // ============== CLIENTES (50) ==============
  const clients = [
    { id: 'u3', email: 'maria@gmail.com', name: 'María García', cId: 'c1', phone: '+34 600 111 222', address: 'Calle Mayor 15, Madrid' },
    { id: 'u4', email: 'zoo@madrid.es', name: 'Zoológico Central', cId: 'c2', phone: '+34 912 345 678', address: 'Av. de las Comunidades, s/n' },
    { id: 'u7', email: 'juan@gmail.com', name: 'Juan Pérez', cId: 'c3', phone: '+34 655 444 333', address: 'Calle Sol 42, Barcelona' },
    { id: 'u8', email: 'laura@gmail.com', name: 'Laura Fernández', cId: 'c4', phone: '+34 677 888 999', address: 'Av. Libertad 88, Valencia' },
    { id: 'u101', email: 'antonio@gmail.com', name: 'Antonio Rodríguez', cId: 'c5', phone: '+34 611 222 333', address: 'Plaza España 5, Sevilla' },
    { id: 'u102', email: 'rosa@gmail.com', name: 'Rosa Martín', cId: 'c6', phone: '+34 622 333 444', address: 'Calle Luna 22, Bilbao' },
    { id: 'u103', email: 'francisco@gmail.com', name: 'Francisco López', cId: 'c7', phone: '+34 633 444 555', address: 'Av. Constitución 12, Málaga' },
    { id: 'u104', email: 'mercedes@gmail.com', name: 'Mercedes González', cId: 'c8', phone: '+34 644 555 666', address: 'Calle Real 33, Granada' },
    { id: 'u105', email: 'manuel@gmail.com', name: 'Manuel Sánchez', cId: 'c9', phone: '+34 655 666 777', address: 'Plaza Mayor 8, Salamanca' },
    { id: 'u106', email: 'dolores@gmail.com', name: 'Dolores Ramírez', cId: 'c10', phone: '+34 666 777 888', address: 'Calle Ancha 19, Murcia' },
    { id: 'u107', email: 'jose@gmail.com', name: 'José Fernández', cId: 'c11', phone: '+34 677 888 999', address: 'Av. del Puerto 45, Alicante' },
    { id: 'u108', email: 'pilar@gmail.com', name: 'Pilar Moreno', cId: 'c12', phone: '+34 688 999 000', address: 'Calle Nueva 77, Zaragoza' },
    { id: 'u109', email: 'luis@gmail.com', name: 'Luis Torres', cId: 'c13', phone: '+34 699 000 111', address: 'Plaza del Carmen 3, Córdoba' },
    { id: 'u110', email: 'carmen.r@gmail.com', name: 'Carmen Ruiz', cId: 'c14', phone: '+34 600 111 222', address: 'Calle Larga 56, Valladolid' },
    { id: 'u111', email: 'pedro@gmail.com', name: 'Pedro Jiménez', cId: 'c15', phone: '+34 611 222 333', address: 'Av. Principal 90, Vigo' },
    { id: 'u112', email: 'ana.g@gmail.com', name: 'Ana García', cId: 'c16', phone: '+34 622 333 444', address: 'Calle Central 14, Gijón' },
    { id: 'u113', email: 'miguel.s@gmail.com', name: 'Miguel Sanz', cId: 'c17', phone: '+34 633 444 555', address: 'Plaza Nueva 27, Hospitalet' },
    { id: 'u114', email: 'isabel.m@gmail.com', name: 'Isabel Martínez', cId: 'c18', phone: '+34 644 555 666', address: 'Calle Mayor 101, Vitoria' },
    { id: 'u115', email: 'rafael@gmail.com', name: 'Rafael Navarro', cId: 'c19', phone: '+34 655 666 777', address: 'Av. Europa 23, La Coruña' },
    { id: 'u116', email: 'teresa@gmail.com', name: 'Teresa Romero', cId: 'c20', phone: '+34 666 777 888', address: 'Calle del Rio 88, Elche' },
    { id: 'u117', email: 'alberto@gmail.com', name: 'Alberto Gil', cId: 'c21', phone: '+34 677 888 999', address: 'Plaza de Toros 15, Oviedo' },
    { id: 'u118', email: 'monica@gmail.com', name: 'Mónica Díaz', cId: 'c22', phone: '+34 688 999 000', address: 'Calle Ancha 42, Badalona' },
    { id: 'u119', email: 'fernando.g@gmail.com', name: 'Fernando García', cId: 'c23', phone: '+34 699 000 111', address: 'Av. Libertad 67, Cartagena' },
    { id: 'u120', email: 'cristina@gmail.com', name: 'Cristina López', cId: 'c24', phone: '+34 600 222 333', address: 'Calle Sol 29, Jerez' },
    { id: 'u121', email: 'javier.m@gmail.com', name: 'Javier Muñoz', cId: 'c25', phone: '+34 611 333 444', address: 'Plaza España 11, Terrassa' },
    { id: 'u122', email: 'silvia@gmail.com', name: 'Silvia Santos', cId: 'c26', phone: '+34 622 444 555', address: 'Calle Mayor 55, Alcalá' },
    { id: 'u123', email: 'raul.p@gmail.com', name: 'Raúl Pastor', cId: 'c27', phone: '+34 633 555 666', address: 'Av. Principal 78, Fuenlabrada' },
    { id: 'u124', email: 'patricia.h@gmail.com', name: 'Patricia Hernández', cId: 'c28', phone: '+34 644 666 777', address: 'Calle Nueva 91, Pamplona' },
    { id: 'u125', email: 'daniel@gmail.com', name: 'Daniel Vega', cId: 'c29', phone: '+34 655 777 888', address: 'Plaza del Sol 6, Almería' },
    { id: 'u126', email: 'yolanda@gmail.com', name: 'Yolanda Castro', cId: 'c30', phone: '+34 666 888 999', address: 'Calle Prado 13, Burgos' },
    { id: 'u127', email: 'sergio.l@gmail.com', name: 'Sergio León', cId: 'c31', phone: '+34 677 999 000', address: 'Av. de la Paz 44, Albacete' },
    { id: 'u128', email: 'noelia@gmail.com', name: 'Noelia Ramos', cId: 'c32', phone: '+34 688 000 111', address: 'Calle Real 66, Getafe' },
    { id: 'u129', email: 'victor@gmail.com', name: 'Víctor Iglesias', cId: 'c33', phone: '+34 699 111 222', address: 'Plaza Mayor 9, Alcorcón' },
    { id: 'u130', email: 'rocio@gmail.com', name: 'Rocío Ortiz', cId: 'c34', phone: '+34 600 333 444', address: 'Calle Larga 21, Santander' },
    { id: 'u131', email: 'enrique@gmail.com', name: 'Enrique Cortés', cId: 'c35', phone: '+34 611 444 555', address: 'Av. del Mar 35, Castellón' },
    { id: 'u132', email: 'marta@gmail.com', name: 'Marta Rubio', cId: 'c36', phone: '+34 622 555 666', address: 'Calle Ancha 48, Logroño' },
    { id: 'u133', email: 'oscar@gmail.com', name: 'Óscar Blanco', cId: 'c37', phone: '+34 633 666 777', address: 'Plaza Central 17, Badajoz' },
    { id: 'u134', email: 'eva@gmail.com', name: 'Eva Molina', cId: 'c38', phone: '+34 644 777 888', address: 'Calle del Sol 72, Huelva' },
    { id: 'u135', email: 'adrian@gmail.com', name: 'Adrián Serrano', cId: 'c39', phone: '+34 655 888 999', address: 'Av. Europa 26, Lérida' },
    { id: 'u136', email: 'beatriz.s@gmail.com', name: 'Beatriz Soler', cId: 'c40', phone: '+34 666 999 000', address: 'Calle Nueva 39, Tarragona' },
    { id: 'u137', email: 'ivan@gmail.com', name: 'Iván Gallego', cId: 'c41', phone: '+34 677 000 111', address: 'Plaza del Rey 12, León' },
    { id: 'u138', email: 'elena.d@gmail.com', name: 'Elena Domínguez', cId: 'c42', phone: '+34 688 111 222', address: 'Calle Mayor 84, Cádiz' },
    { id: 'u139', email: 'pablo.c@gmail.com', name: 'Pablo Carmona', cId: 'c43', phone: '+34 699 222 333', address: 'Av. Principal 51, Jaén' },
    { id: 'u140', email: 'laura.p@gmail.com', name: 'Laura Prieto', cId: 'c44', phone: '+34 600 444 555', address: 'Calle Real 95, Ourense' },
    { id: 'u141', email: 'david@gmail.com', name: 'David Peña', cId: 'c45', phone: '+34 611 555 666', address: 'Plaza Nueva 4, Salamanca' },
    { id: 'u142', email: 'irene@gmail.com', name: 'Irene Fuentes', cId: 'c46', phone: '+34 622 666 777', address: 'Calle Larga 31, Ávila' },
    { id: 'u143', email: 'jorge@gmail.com', name: 'Jorge Montero', cId: 'c47', phone: '+34 633 777 888', address: 'Av. de la Luz 59, Segovia' },
    { id: 'u144', email: 'sandra@gmail.com', name: 'Sandra Ibáñez', cId: 'c48', phone: '+34 644 888 999', address: 'Calle Central 76, Cuenca' },
    { id: 'u145', email: 'mario@gmail.com', name: 'Mario Vargas', cId: 'c49', phone: '+34 655 999 000', address: 'Plaza España 20, Guadalajara' },
    { id: 'u146', email: 'nuria@gmail.com', name: 'Nuria Delgado', cId: 'c50', phone: '+34 666 000 111', address: 'Calle Mayor 62, Toledo' },
  ];

  for (const client of clients) {
    db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)').run(
      client.id, client.email, hashedUserPassword, client.name, 'CLIENT'
    );
    db.prepare('INSERT INTO clients (id, userId, phone, address) VALUES (?, ?, ?, ?)').run(
      client.cId, client.id, client.phone, client.address
    );
  }

  console.log('🐾 Creando pacientes (100 pacientes)...');

  // ============== PACIENTES (100) ==============
  const petNames = ['Luna', 'Max', 'Bella', 'Charlie', 'Lucy', 'Rocky', 'Molly', 'Buddy', 'Daisy', 'Cooper', 'Sadie', 'Tucker', 'Bailey', 'Sophie', 'Bear', 'Chloe', 'Duke', 'Lola', 'Zeus', 'Lily', 'Oliver', 'Stella', 'Jack', 'Nala', 'Toby', 'Abby', 'Leo', 'Zoe', 'Milo', 'Coco', 'Oscar', 'Rosie', 'Bentley', 'Maggie', 'Winston', 'Ruby', 'Teddy', 'Penny', 'Harley', 'Ellie', 'Diesel', 'Ginger', 'Buster', 'Princess', 'Murphy', 'Willow', 'Thor', 'Mia', 'Simba', 'Pepper'];
  const dogBreeds = ['Labrador', 'Golden Retriever', 'Pastor Alemán', 'Bulldog', 'Beagle', 'Chihuahua', 'Yorkshire Terrier', 'Poodle', 'Husky', 'Pug'];
  const catBreeds = ['Siamés', 'Persa', 'Maine Coon', 'Ragdoll', 'British Shorthair', 'Sphynx', 'Bengalí', 'Angora', 'Común Europeo', 'Exótico'];
  const statuses = ['HEALTHY', 'HEALTHY', 'HEALTHY', 'HEALTHY', 'HEALTHY', 'HOSPITALIZED', 'CRITICAL'];
  
  const patients: any[] = [];
  for (let i = 1; i <= 100; i++) {
    const isSpecial = i <= 10; // Primeros 10 son especiales
    const isDog = i % 2 === 0 || isSpecial;
    const isCat = !isDog && i % 3 === 0;
    const species = isSpecial && i <= 2 ? (i === 2 ? 'León' : 'Gato') : 
                    isDog ? 'Perro' : 
                    isCat ? 'Gato' : 
                    i % 7 === 0 ? 'Ave' : 
                    i % 11 === 0 ? 'Conejo' : 
                    isDog ? 'Perro' : 'Gato';
    
    const breed = species === 'Perro' ? dogBreeds[i % dogBreeds.length] :
                  species === 'Gato' ? catBreeds[i % catBreeds.length] :
                  species === 'Ave' ? 'Loro' :
                  species === 'Conejo' ? 'Holland Lop' :
                  species === 'León' ? 'Africano' : 'Mestizo';
    
    const name = isSpecial && i === 1 ? 'Luna' :
                 isSpecial && i === 2 ? 'Simba' :
                 isSpecial && i === 3 ? 'Toby' :
                 petNames[i % petNames.length] + (i > 50 ? ' ' + Math.floor(i/10) : '');
    
    const weight = species === 'Perro' ? 15 + (i % 30) :
                   species === 'Gato' ? 3 + (i % 6) * 0.5 :
                   species === 'León' ? 10 + (i % 20) :
                   species === 'Ave' ? 0.3 + (i % 5) * 0.1 :
                   2 + (i % 4);
    
    const ownerId = 'c' + (1 + (i % 50));
    const status = i <= 5 ? statuses[5 + (i % 2)] : statuses[i % statuses.length];
    
    patients.push({
      id: `p${i}`,
      name,
      species,
      breed,
      birthDate: `${2018 + (i % 6)}-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
      gender: i % 2 === 0 ? 'Macho' : 'Hembra',
      weight,
      ownerId,
      status
    });
  }

  for (const patient of patients) {
    db.prepare('INSERT INTO patients (id, name, species, breed, birthDate, gender, weight, ownerId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      patient.id, patient.name, patient.species, patient.breed, patient.birthDate, patient.gender, patient.weight, patient.ownerId, patient.status
    );
  }

  console.log('🏥 Creando hospitalizaciones (15 hospitalizaciones)...');

  // ============== HOSPITALIZACIONES ==============
  const hospitalizations = [
    { id: 'h1', patientId: 'p1', status: 'STABLE', notes: 'Post-operatorio de esterilización. Evolución favorable.', vitals: { temp: '38.5C', heart: '120bpm', resp: '24rpm' } },
    { id: 'h2', patientId: 'p2', status: 'INTENSIVE_CARE', notes: 'Traumatismo severo. En observación 24h.', vitals: { temp: '39.1C', heart: '145bpm', resp: '32rpm' } },
    { id: 'h3', patientId: 'p5', status: 'STABLE', notes: 'Infección respiratoria. Respondiendo bien a antibióticos.', vitals: { temp: '38.8C', heart: '130bpm', resp: '28rpm' } },
    { id: 'h4', patientId: 'p8', status: 'OBSERVATION', notes: 'Gastroenteritis. Monitoreo de hidratación.', vitals: { temp: '38.2C', heart: '110bpm', resp: '22rpm' } },
    { id: 'h5', patientId: 'p12', status: 'INTENSIVE_CARE', notes: 'Insuficiencia renal aguda. Terapia de fluidos.', vitals: { temp: '37.9C', heart: '95bpm', resp: '20rpm' } },
    { id: 'h6', patientId: 'p15', status: 'STABLE', notes: 'Recuperación post-cirugía de cadera.', vitals: { temp: '38.6C', heart: '118bpm', resp: '25rpm' } },
    { id: 'h7', patientId: 'p18', status: 'OBSERVATION', notes: 'Sospecha de pancreatitis. En ayunas.', vitals: { temp: '38.4C', heart: '125bpm', resp: '26rpm' } },
    { id: 'h8', patientId: 'p22', status: 'STABLE', notes: 'Fractura de pata. Enyesado y reposo.', vitals: { temp: '38.3C', heart: '115bpm', resp: '23rpm' } },
    { id: 'h9', patientId: 'p25', status: 'INTENSIVE_CARE', notes: 'Paro cardíaco recuperado. Monitoreo continuo.', vitals: { temp: '37.5C', heart: '85bpm', resp: '18rpm' } },
    { id: 'h10', patientId: 'p28', status: 'STABLE', notes: 'Post-operatorio tumor benigno. Estable.', vitals: { temp: '38.7C', heart: '122bpm', resp: '24rpm' } },
    { id: 'h11', patientId: 'p32', status: 'OBSERVATION', notes: 'Intoxicación alimentaria leve.', vitals: { temp: '38.9C', heart: '135bpm', resp: '29rpm' } },
    { id: 'h12', patientId: 'p36', status: 'STABLE', notes: 'Neumonía. Tratamiento con antibióticos IV.', vitals: { temp: '39.2C', heart: '140bpm', resp: '31rpm' } },
    { id: 'h13', patientId: 'p40', status: 'OBSERVATION', notes: 'Deshidratación severa. Rehidratación en curso.', vitals: { temp: '38.0C', heart: '105bpm', resp: '21rpm' } },
    { id: 'h14', patientId: 'p44', status: 'STABLE', notes: 'Diabetes. Estabilización de glucosa.', vitals: { temp: '38.5C', heart: '112bpm', resp: '23rpm' } },
    { id: 'h15', patientId: 'p48', status: 'INTENSIVE_CARE', notes: 'Mordedura de serpiente. Antídoto administrado.', vitals: { temp: '37.8C', heart: '90bpm', resp: '19rpm' } },
  ];

  for (const h of hospitalizations) {
    db.prepare('INSERT INTO hospitalizations (id, patientId, status, notes, vitals) VALUES (?, ?, ?, ?, ?)').run(
      h.id, h.patientId, h.status, h.notes, JSON.stringify(h.vitals)
    );
  }

  console.log('💊 Creando inventario (40 items)...');

  // ============== INVENTARIO (40) ==============
  const inventory = [
    { id: 'i1', name: 'Amoxicilina 250mg', category: 'Medicación', quantity: 450, unit: 'tabletas', minStock: 100, location: 'Farmacia Principal' },
    { id: 'i2', name: 'Suero Fisiológico 500ml', category: 'Consumibles', quantity: 12, unit: 'bolsas', minStock: 20, location: 'Almacén A' },
    { id: 'i3', name: 'Guantes Quirúrgicos', category: 'Consumibles', quantity: 250, unit: 'unidades', minStock: 50, location: 'Almacén A' },
    { id: 'i4', name: 'Anestesia General', category: 'Medicación', quantity: 35, unit: 'viales', minStock: 10, location: 'Farmacia Principal' },
    { id: 'i5', name: 'Vendas Estériles', category: 'Consumibles', quantity: 80, unit: 'rollos', minStock: 30, location: 'Almacén B' },
    { id: 'i6', name: 'Antibiótico Inyectable', category: 'Medicación', quantity: 120, unit: 'ampollas', minStock: 40, location: 'Farmacia Principal' },
    { id: 'i7', name: 'Jeringas 5ml', category: 'Consumibles', quantity: 500, unit: 'unidades', minStock: 100, location: 'Almacén A' },
    { id: 'i8', name: 'Agujas hipodérmicas', category: 'Consumibles', quantity: 800, unit: 'unidades', minStock: 200, location: 'Almacén A' },
    { id: 'i9', name: 'Desinfectante quirúrgico', category: 'Consumibles', quantity: 25, unit: 'litros', minStock: 10, location: 'Almacén B' },
    { id: 'i10', name: 'Gasas estériles', category: 'Consumibles', quantity: 300, unit: 'paquetes', minStock: 50, location: 'Almacén A' },
    { id: 'i11', name: 'Antiinflamatorio canino', category: 'Medicación', quantity: 180, unit: 'tabletas', minStock: 50, location: 'Farmacia Principal' },
    { id: 'i12', name: 'Antiparasitario interno', category: 'Medicación', quantity: 220, unit: 'dosis', minStock: 60, location: 'Farmacia Principal' },
    { id: 'i13', name: 'Vacuna antirrábica', category: 'Vacunas', quantity: 95, unit: 'dosis', minStock: 30, location: 'Refrigerador 1' },
    { id: 'i14', name: 'Vacuna polivalente', category: 'Vacunas', quantity: 110, unit: 'dosis', minStock: 40, location: 'Refrigerador 1' },
    { id: 'i15', name: 'Collar isabelino pequeño', category: 'Equipamiento', quantity: 45, unit: 'unidades', minStock: 15, location: 'Almacén C' },
    { id: 'i16', name: 'Collar isabelino mediano', category: 'Equipamiento', quantity: 38, unit: 'unidades', minStock: 15, location: 'Almacén C' },
    { id: 'i17', name: 'Collar isabelino grande', category: 'Equipamiento', quantity: 32, unit: 'unidades', minStock: 10, location: 'Almacén C' },
    { id: 'i18', name: 'Sondas urinarias', category: 'Consumibles', quantity: 65, unit: 'unidades', minStock: 20, location: 'Almacén B' },
    { id: 'i19', name: 'Catéteres IV', category: 'Consumibles', quantity: 88, unit: 'unidades', minStock: 25, location: 'Almacén B' },
    { id: 'i20', name: 'Hilo quirúrgico absorbible', category: 'Consumibles', quantity: 150, unit: 'unidades', minStock: 40, location: 'Quirófanos' },
    { id: 'i21', name: 'Analgésico postoperatorio', category: 'Medicación', quantity: 95, unit: 'ampollas', minStock: 30, location: 'Farmacia Principal' },
    { id: 'i22', name: 'Corticoide inyectable', category: 'Medicación', quantity: 72, unit: 'viales', minStock: 25, location: 'Farmacia Principal' },
    { id: 'i23', name: 'Solución Ringer Lactato', category: 'Consumibles', quantity: 140, unit: 'bolsas', minStock: 50, location: 'Almacén A' },
    { id: 'i24', name: 'Alimento terapéutico gastrointestinal', category: 'Alimentos', quantity: 55, unit: 'kg', minStock: 20, location: 'Almacén D' },
    { id: 'i25', name: 'Alimento renal veterinario', category: 'Alimentos', quantity: 42, unit: 'kg', minStock: 15, location: 'Almacén D' },
    { id: 'i26', name: 'Mascarillas quirúrgicas', category: 'Consumibles', quantity: 650, unit: 'unidades', minStock: 150, location: 'Almacén A' },
    { id: 'i27', name: 'Batas quirúrgicas desechables', category: 'Consumibles', quantity: 120, unit: 'unidades', minStock: 30, location: 'Almacén A' },
    { id: 'i28', name: 'Termómetro digital veterinario', category: 'Equipamiento', quantity: 18, unit: 'unidades', minStock: 5, location: 'Consultorios' },
    { id: 'i29', name: 'Estetoscopio veterinario', category: 'Equipamiento', quantity: 12, unit: 'unidades', minStock: 4, location: 'Consultorios' },
    { id: 'i30', name: 'Otoscopio', category: 'Equipamiento', quantity: 8, unit: 'unidades', minStock: 3, location: 'Consultorios' },
    { id: 'i31', name: 'Placas radiográficas', category: 'Consumibles', quantity: 95, unit: 'unidades', minStock: 30, location: 'Radiología' },
    { id: 'i32', name: 'Antiséptico tópico', category: 'Medicación', quantity: 48, unit: 'frascos', minStock: 20, location: 'Farmacia Secundaria' },
    { id: 'i33', name: 'Gotas oftálmicas', category: 'Medicación', quantity: 65, unit: 'frascos', minStock: 25, location: 'Farmacia Principal' },
    { id: 'i34', name: 'Probióticos veterinarios', category: 'Medicación', quantity: 88, unit: 'sobres', minStock: 30, location: 'Farmacia Principal' },
    { id: 'i35', name: 'Vitaminas inyectables', category: 'Medicación', quantity: 52, unit: 'ampollas', minStock: 20, location: 'Farmacia Principal' },
    { id: 'i36', name: 'Test rápido parvovirosis', category: 'Diagnóstico', quantity: 32, unit: 'test', minStock: 10, location: 'Laboratorio' },
    { id: 'i37', name: 'Test rápido leucemia felina', category: 'Diagnóstico', quantity: 28, unit: 'test', minStock: 10, location: 'Laboratorio' },
    { id: 'i38', name: 'Tubos para análisis sangre', category: 'Consumibles', quantity: 250, unit: 'unidades', minStock: 80, location: 'Laboratorio' },
    { id: 'i39', name: 'Pipetas antiparasitarias', category: 'Medicación', quantity: 145, unit: 'pipetas', minStock: 50, location: 'Farmacia Secundaria' },
    { id: 'i40', name: 'Champú medicado', category: 'Medicación', quantity: 38, unit: 'frascos', minStock: 15, location: 'Farmacia Secundaria' },
  ];

  for (const item of inventory) {
    db.prepare('INSERT INTO inventory_items (id, name, category, quantity, unit, minStock, location) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      item.id, item.name, item.category, item.quantity, item.unit, item.minStock, item.location
    );
  }

  console.log('🏥 Creando quirófanos (8 quirófanos)...');

  // ============== QUIRÓFANOS (8) ==============
  const operatingRooms = [
    { id: 'or1', name: 'Quirófano 1', status: 'AVAILABLE', patientId: null, procedure: null, startTime: null, staffIds: null, findings: 'Última cirugía: Esterilización exitosa. Sin complicaciones.' },
    { id: 'or2', name: 'Quirófano 2', status: 'OCCUPIED', patientId: 'p1', procedure: 'Cirugía de Esterilización', startTime: '2026-02-24 09:30:00', staffIds: JSON.stringify(['e1', 'e2']), findings: null },
    { id: 'or3', name: 'Quirófano 3', status: 'CLEANING', patientId: null, procedure: null, startTime: null, staffIds: null, findings: 'Cirugía de emergencia traumatismo. Paciente estabilizado.' },
    { id: 'or4', name: 'Quirófano 4', status: 'AVAILABLE', patientId: null, procedure: null, startTime: null, staffIds: null, findings: 'Limpieza dental rutinaria completada sin incidencias.' },
    { id: 'or5', name: 'Quirófano 5 (Exóticos)', status: 'AVAILABLE', patientId: null, procedure: null, startTime: null, staffIds: null, findings: 'Cirugía ocular en loro. Recuperación exitosa.' },
    { id: 'or6', name: 'Quirófano 6 (Ortopedia)', status: 'OCCUPIED', patientId: 'p15', procedure: 'Reparación de Fractura de Cadera', startTime: '2026-02-24 11:00:00', staffIds: JSON.stringify(['e3', 'e12', 'e13']), findings: null },
    { id: 'or7', name: 'Quirófano 7 (Cardiología)', status: 'AVAILABLE', patientId: null, procedure: null, startTime: null, staffIds: null, findings: 'Cirugía cardíaca menor. Éxito completo.' },
    { id: 'or8', name: 'Quirófano 8 (Oncología)', status: 'CLEANING', patientId: null, procedure: null, startTime: null, staffIds: null, findings: 'Extirpación tumor maligno. Márgenes limpios.' },
  ];

  for (const or of operatingRooms) {
    db.prepare('INSERT INTO operating_rooms (id, name, status, patientId, procedure, startTime, staffIds, findings) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      or.id, or.name, or.status, or.patientId, or.procedure, or.startTime, or.staffIds, or.findings
    );
  }

  console.log('📅 Creando citas (80 citas)...');

  // ============== CITAS (80) ==============
  const appointmentTypes = ['Consulta', 'Vacunación', 'Cirugía', 'Emergencia', 'Revisión', 'Chequeo'];
  const appointmentStatuses = ['SCHEDULED', 'SCHEDULED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];
  const reasons = [
    'Revisión anual', 'Vacunación antirrábica', 'Limpieza dental', 'Chequeo post-operatorio', 
    'Consulta urgente', 'Esterilización', 'Control de peso', 'Desparasitación', 
    'Problema de piel', 'Cojera', 'Vómitos', 'Diarrea', 'Análisis de sangre',
    'Ecografía', 'Radiografía', 'Corte de uñas', 'Vacunación polivalente',
    'Consulta de comportamiento', 'Dolor abdominal', 'Infección de oído'
  ];

  for (let i = 1; i <= 80; i++) {
    const patientId = `p${1 + (i % 100)}`;
    const reason = reasons[i % reasons.length];
    const type = appointmentTypes[i % appointmentTypes.length];
    const status = i <= 50 ? 'SCHEDULED' : appointmentStatuses[i % appointmentStatuses.length];
    
    const dayOffset = i <= 40 ? i : -((i - 40));
    const hour = 8 + (i % 12);
    const minute = (i % 2) === 0 ? '00' : '30';
    const dateTime = `2026-${String(2 + Math.floor(dayOffset / 28)).padStart(2, '0')}-${String(1 + Math.abs(dayOffset % 28)).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${minute}:00`;
    
    db.prepare('INSERT INTO appointments (id, patientId, reason, dateTime, type, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      `a${i}`, patientId, reason, dateTime, type, status
    );
  }

  console.log('💰 Creando facturas (60 facturas)...');

  // ============== FACTURAS (60) ==============
  const invoiceStatuses = ['PAID', 'PAID', 'PENDING', 'OVERDUE'];
  const invoiceItems = [
    [{ name: 'Consulta general', price: 50 }, { name: 'Medicación', price: 100 }],
    [{ name: 'Cirugía de emergencia', price: 600 }, { name: 'Hospitalización 3 días', price: 250 }],
    [{ name: 'Vacunación', price: 45 }, { name: 'Desparasitación', price: 30 }],
    [{ name: 'Limpieza dental', price: 150 }, { name: 'Análisis sangre', price: 50 }],
    [{ name: 'Esterilización', price: 280 }, { name: 'Medicación postoperatoria', price: 60 }],
    [{ name: 'Radiografía', price: 80 }, { name: 'Consulta traumatología', price: 70 }],
    [{ name: 'Ecografía', price: 120 }, { name: 'Analítica completa', price: 95 }],
    [{ name: 'Cirugía ortopédica', price: 950 }, { name: 'Seguimiento semanal', price: 180 }],
    [{ name: 'Tratamiento dermatológico', price: 85 }, { name: 'Champú medicado', price: 25 }],
    [{ name: 'Consulta cardiología', price: 110 }, { name: 'Electrocardiograma', price: 75 }],
  ];

  for (let i = 1; i <= 60; i++) {
    const clientId = `c${1 + (i % 50)}`;
    const items = invoiceItems[i % invoiceItems.length];
    const amount = items.reduce((sum, item) => sum + item.price, 0);
    const status = invoiceStatuses[i % invoiceStatuses.length];
    const daysAgo = i * 2;
    const createdAt = `2026-${String(1 + Math.floor((90 - daysAgo) / 30)).padStart(2, '0')}-${String(1 + ((90 - daysAgo) % 30)).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:00:00`;
    const dueDate = `2026-${String(1 + Math.floor((120 - daysAgo) / 30)).padStart(2, '0')}-${String(1 + ((120 - daysAgo) % 30)).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:00:00`;
    
    db.prepare('INSERT INTO invoices (id, clientId, amount, status, items, createdAt, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      `inv${i}`, clientId, amount, status, JSON.stringify(items), createdAt, dueDate
    );
  }

  console.log('📋 Creando registros médicos (120 registros)...');

  // ============== REGISTROS MÉDICOS (120) ==============
  const diagnoses = [
    'Infección urinaria leve', 'Displasia de cadera', 'Chequeo anual - saludable',
    'Otitis externa', 'Gastroenteritis aguda', 'Dermatitis alérgica', 'Fractura de fémur',
    'Insuficiencia renal crónica', 'Diabetes mellitus', 'Hipertiroidismo felino',
    'Enfermedad periodontal', 'Parásitos intestinales', 'Conjuntivitis',
    'Tumor cutáneo benigno', 'Artritis degenerativa', 'Bronquitis crónica',
    'Soplo cardíaco grado II', 'Cálculos renales', 'Obesidad', 'Anemia leve'
  ];

  const treatments = [
    'Antibiótico oral 10 días', 'Suplementos articulares + ejercicio moderado', 'Vacunas al día',
    'Gotas óticas 7 días', 'Dieta blanda + probióticos', 'Antihistamínico + champú medicado',
    'Cirugía de osteosíntesis', 'Dieta renal + manejo de fluidos', 'Insulina + control dietético',
    'Medicación tiroidea diaria', 'Limpieza dental + extracción', 'Desparasitación completa',
    'Colirio antibiótico', 'Extirpación quirúrgica programada', 'Analgésicos + fisioterapia',
    'Broncodilatadores', 'Control ecocardiográfico', 'Tratamiento disolvente + control',
    'Plan de adelgazamiento', 'Suplemento de hierro'
  ];

  for (let i = 1; i <= 120; i++) {
    const patientId = `p${1 + (i % 100)}`;
    const veterinarianId = `e${1 + (i % 20)}`;
    const daysAgo = i * 2;
    const date = `2026-${String(1 + Math.floor((240 - daysAgo) / 30)).padStart(2, '0')}-${String(1 + ((240 - daysAgo) % 30)).padStart(2, '0')} ${String(9 + (i % 9)).padStart(2, '0')}:${String((i % 6) * 10).padStart(2, '0')}:00`;
    const diagnosis = diagnoses[i % diagnoses.length];
    const treatment = treatments[i % treatments.length];
    const observations = i % 3 === 0 ? 'Control en ' + (7 + i % 21) + ' días' : i % 5 === 0 ? 'Evolución favorable' : 'Sin observaciones adicionales';
    
    db.prepare('INSERT INTO medical_records (id, patientId, veterinarianId, date, diagnosis, treatment, observations) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      `mr${i}`, patientId, veterinarianId, date, diagnosis, treatment, observations
    );
  }

  console.log('🔔 Creando notificaciones (40 notificaciones)...');

  // ============== NOTIFICACIONES (40) ==============
  // Crear lista de IDs válidos (empleados + clientes)
  const validUserIds = [
    ...employees.map(e => e.id),
    ...clients.map(c => c.id)
  ];

  const notificationTypes = ['APPOINTMENT', 'BILLING', 'HEALTH', 'SYSTEM'] as const;
  type NotificationType = (typeof notificationTypes)[number];
  const notificationTitles: Record<NotificationType, string[]> = {
    APPOINTMENT: ['Cita Programada', 'Recordatorio de Cita', 'Cita Confirmada', 'Cambio de Cita'],
    BILLING: ['Factura Pendiente', 'Pago Recibido', 'Factura Vencida', 'Nueva Factura'],
    HEALTH: ['Resultados de Análisis', 'Recordatorio Medicación', 'Alerta de Salud', 'Vacunación Pendiente'],
    SYSTEM: ['Actualización del Sistema', 'Mantenimiento Programado', 'Nueva Funcionalidad', 'Mensaje del Veterinario']
  };

  for (let i = 1; i <= 40; i++) {
    const userId = validUserIds[i % validUserIds.length];
    const type = notificationTypes[i % notificationTypes.length];
    const titles = notificationTitles[type];
    const title = titles[i % titles.length];
    const messages: Record<NotificationType, string> = {
      APPOINTMENT: `Tienes una cita programada para el ${24 + (i % 7)}/02/2026 a las ${9 + (i % 9)}:00h`,
      BILLING: `Tienes una ${i % 2 === 0 ? 'factura pendiente' : 'factura pagada'} de ${50 + (i * 15)}€`,
      HEALTH: i % 3 === 0 ? `Los resultados del análisis están listos` : `Recuerda administrar la medicación a las ${8 + (i % 12)}:00h`,
      SYSTEM: i % 2 === 0 ? `Nueva funcionalidad disponible en el portal` : `El Dr. ${['Sanz', 'Martínez', 'Ruiz', 'López'][i % 4]} te ha enviado un mensaje`
    };
    const message = messages[type];
    const isRead = i % 3 === 0;
    const hoursAgo = i * 2;
    const createdAt = `2026-02-${String(Math.max(1, 24 - Math.floor(hoursAgo / 24))).padStart(2, '0')} ${String((24 - (hoursAgo % 24)) % 24).padStart(2, '0')}:${String((i * 15) % 60).padStart(2, '0')}:00`;
    
    db.prepare('INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      `n${i}`, userId, title, message, type, isRead ? 1 : 0, createdAt
    );
  }

  console.log('⏰ Creando registros de asistencia (50 registros)...');

  // ============== ASISTENCIAS DE EMPLEADOS (50) ==============
  const employeeUserIds = employees.map(e => e.id);
  
  for (let i = 1; i <= 50; i++) {
    const userId = employeeUserIds[i % employeeUserIds.length];
    const type = i % 2 === 0 ? 'IN' : 'OUT';
    const daysAgo = Math.floor(i / 4);
    const hour = type === 'IN' ? 8 : 16;
    const timestamp = `2026-02-${String(Math.max(1, 24 - daysAgo)).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}:00`;
    const notes = i % 7 === 0 ? 'Turno de guardia' : i % 11 === 0 ? 'Hora extra' : null;
    
    db.prepare('INSERT INTO employee_attendance (id, userId, type, timestamp, notes) VALUES (?, ?, ?, ?, ?)').run(
      `att${i}`, userId, type, timestamp, notes
    );
  }

  console.log('✅ Base de datos poblada exitosamente!');
  console.log('');
  console.log('📊 RESUMEN:');
  console.log('   👥 20 Empleados veterinarios');
  console.log('   🏠 50 Clientes');
  console.log('   🐾 100 Pacientes');
  console.log('   🏥 15 Hospitalizaciones');
  console.log('   💊 40 Items de inventario');
  console.log('   🏥 8 Quirófanos');
  console.log('   📅 80 Citas');
  console.log('   💰 60 Facturas');
  console.log('   📋 120 Registros médicos');
  console.log('   🔔 40 Notificaciones');
  console.log('   ⏰ 50 Registros de asistencia');
  console.log('');
  console.log('🎉 Total: ¡Más de 600 registros creados!');
}

seed().catch(console.error);
