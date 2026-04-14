'use server'

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
}

function formatDateSQL(date: Date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

function genConsultationNumber() {
  const year = new Date().getFullYear();
  const row = db.prepare(`
    SELECT COUNT(*) as count
    FROM consultations
    WHERE consultationNumber LIKE ?
  `).get(`CONS-${year}-%`) as { count: number };
  const seq = String((row?.count || 0) + 1).padStart(4, '0');
  return `CONS-${year}-${seq}`;
}

function syncInvoiceTotal(invoiceId: string) {
  const row = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM invoice_items
    WHERE invoiceId = ?
  `).get(invoiceId) as { total: number };

  db.prepare(`UPDATE invoices SET amount=? WHERE id=?`).run(row.total || 0, invoiceId);
}

function ensureOpenConsultationAndInvoice({
  patientId,
  clientId,
  appointmentId,
  hospitalizationId
}: {
  patientId: string;
  clientId: string;
  appointmentId?: string | null;
  hospitalizationId?: string | null;
}) {
  let consultation: any;

  if (appointmentId) {
    consultation = db.prepare(`SELECT * FROM consultations WHERE appointmentId = ? LIMIT 1`).get(appointmentId);
  }

  if (!consultation && hospitalizationId) {
    consultation = db.prepare(`
      SELECT * FROM consultations
      WHERE hospitalizationId = ? AND status = 'OPEN'
      ORDER BY startedAt DESC
      LIMIT 1
    `).get(hospitalizationId);
  }

  if (!consultation) {
    consultation = db.prepare(`
      SELECT * FROM consultations
      WHERE patientId = ? AND status = 'OPEN'
      ORDER BY startedAt DESC
      LIMIT 1
    `).get(patientId);
  }

  if (!consultation) {
    const consultationId = genId('cons');
    const consultationNumber = genConsultationNumber();
    db.prepare(`
      INSERT INTO consultations (id, consultationNumber, appointmentId, patientId, hospitalizationId, status)
      VALUES (?, ?, ?, ?, ?, 'OPEN')
    `).run(consultationId, consultationNumber, appointmentId || null, patientId, hospitalizationId || null);
    consultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(consultationId);
  } else if (hospitalizationId && !consultation.hospitalizationId) {
    db.prepare(`UPDATE consultations SET hospitalizationId=? WHERE id=?`).run(hospitalizationId, consultation.id);
    consultation = { ...consultation, hospitalizationId };
  }

  let invoice: any = db.prepare(`SELECT * FROM invoices WHERE consultationId = ? LIMIT 1`).get(consultation.id);
  if (!invoice) {
    const invoiceId = genId('inv');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateSql = dueDate.toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO invoices (id, clientId, amount, status, consultationId, consultationNumber, items, dueDate)
      VALUES (?, ?, 0, 'PENDING', ?, ?, ?, ?)
    `).run(
      invoiceId,
      clientId,
      consultation.id,
      consultation.consultationNumber,
      'Factura generada automaticamente desde seguimiento clinico.',
      dueDateSql
    );
    invoice = db.prepare(`SELECT * FROM invoices WHERE id = ?`).get(invoiceId);
  }

  return { consultation, invoice };
}

// ─── ATTENDANCE ──────────────────────────────────────────────────────────────
export async function getAttendanceStatus(userId: string) {
  const last = db.prepare(`
    SELECT type, timestamp FROM employee_attendance 
    WHERE userId = ? 
    ORDER BY timestamp DESC LIMIT 1
  `).get(userId) as { type: string, timestamp: string } | undefined;
  return last;
}

export async function toggleAttendance(userId: string, notes: string = "") {
  const last = await getAttendanceStatus(userId);
  const nextType = last?.type === 'IN' ? 'OUT' : 'IN';
  const id = genId('att');
  
  db.prepare(`INSERT INTO employee_attendance (id, userId, type, notes) VALUES (?, ?, ?, ?)`)
    .run(id, userId, nextType, notes);
  
  revalidatePath('/dashboard');
  return { success: `Fichaje de ${nextType === 'IN' ? 'entrada' : 'salida'} registrado.` };
}

// ─── NOTIFICATIONS UTILITY ───────────────────────────────────────────────────
export async function sendNotification(userId: string, title: string, message: string, type: string) {
  try {
    const id = genId('n');
    const user: any = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
    const client: any = db.prepare('SELECT phone FROM clients WHERE userId = ?').get(userId);

    db.prepare(`INSERT INTO notifications (id, userId, title, message, type) VALUES (?, ?, ?, ?, ?)`)
      .run(id, userId, title, message, type);
    
    // 📧 ENVÍO DE EMAIL REAL (SI HAY API KEY)
    if (resend && user?.email) {
      await resend.emails.send({
        from: 'Hospital Veterinario <onboarding@resend.dev>',
        to: user.email,
        subject: title,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0d9488;">Hospital Veterinario</h2>
            <p>Estimado/a <strong>${user.name}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">${message}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">Este es un mensaje automático, por favor no responda a este correo.</p>
          </div>
        `
      });
    }

    // Simulación de envío formal en consola para historial/debug
    console.log(`[NOTIFICACIÓN] ${title}: ${message} (Para: ${user?.email})`);

    if (client?.phone) {
      console.log(`[SMS SIMULATED to ${client.phone}]: ${title} - ${message}`);
    }

    return { success: true };
  } catch (e) {
    console.error("Error sending notification:", e);
    return { error: e };
  }
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
export async function createPatient(prevState: any, formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const species = formData.get('species') as string;
  const breed = (formData.get('breed') as string)?.trim() || null;
  const gender = formData.get('gender') as string;
  const weight = parseFloat(formData.get('weight') as string) || null;
  const birthDate = formData.get('birthDate') as string || null;
  const ownerId = formData.get('ownerId') as string;
  const status = formData.get('status') as string || 'HEALTHY';

  if (!name || !species || !ownerId) {
    return { error: 'Nombre, especie y dueño son obligatorios.' };
  }
  try {
    const id = genId('p');
    db.prepare(`
      INSERT INTO patients (id, name, species, breed, birthDate, gender, weight, ownerId, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, species, breed, birthDate, gender, weight, ownerId, status);
    
    const client: any = db.prepare('SELECT userId FROM clients WHERE id = ?').get(ownerId);
    if (client) {
      await sendNotification(client.userId, 'Nueva Mascota', `Se ha registrado a ${name} en nuestro sistema.`, 'HEALTH');
    }

    revalidatePath('/dashboard/patients');
    return { success: 'Paciente registrado correctamente.' };
  } catch (e: any) {
    return { error: 'Error al registrar el paciente: ' + e.message };
  }
}

export async function updatePatient(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  const species = formData.get('species') as string;
  const breed = (formData.get('breed') as string)?.trim() || null;
  const gender = formData.get('gender') as string;
  const weight = parseFloat(formData.get('weight') as string) || null;
  const birthDate = formData.get('birthDate') as string || null;

  if (!id || !name || !species) {
    return { error: 'ID, Nombre y especie son obligatorios.' };
  }
  try {
    db.prepare(`
      UPDATE patients 
      SET name=?, species=?, breed=?, birthDate=?, gender=?, weight=?, updatedAt=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(name, species, breed, birthDate, gender, weight, id);
    
    const patient: any = db.prepare('SELECT ownerId FROM patients WHERE id = ?').get(id);
    const client: any = db.prepare('SELECT userId FROM clients WHERE id = ?').get(patient.ownerId);
    if (client) {
      await sendNotification(client.userId, 'Información Actualizada', `Se han actualizado los datos de perfil de ${name}.`, 'SYSTEM');
    }

    revalidatePath('/dashboard/patients');
    revalidatePath('/client-portal');
    return { success: 'Datos de la mascota actualizados.' };
  } catch (e: any) {
    return { error: 'Error al actualizar: ' + e.message };
  }
}

export async function updatePatientStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  db.prepare(`UPDATE patients SET status=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`).run(status, id);
  revalidatePath('/dashboard/patients');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/hospital');
}

export async function deletePatient(formData: FormData) {
  const id = formData.get('id') as string;
  db.prepare('DELETE FROM patients WHERE id=?').run(id);
  revalidatePath('/dashboard/patients');
  revalidatePath('/dashboard');
}

// ─── MEDICAL RECORDS ──────────────────────────────────────────────────────────
export async function createMedicalRecord(prevState: any, formData: FormData) {
  const patientId = formData.get('patientId') as string;
  const veterinarianId = formData.get('veterinarianId') as string;
  const diagnosis = (formData.get('diagnosis') as string)?.trim();
  const treatment = (formData.get('treatment') as string)?.trim() || null;
  const observations = (formData.get('observations') as string)?.trim() || null;

  if (!patientId || !veterinarianId || !diagnosis) {
    return { error: 'Paciente, veterinario y diagnóstico son obligatorios.' };
  }
  const id = genId('mr');
  db.prepare(`INSERT INTO medical_records (id,patientId,veterinarianId,diagnosis,treatment,observations) VALUES (?,?,?,?,?,?)`)
    .run(id, patientId, veterinarianId, diagnosis, treatment, observations);

  const patient: any = db.prepare('SELECT name, ownerId FROM patients WHERE id = ?').get(patientId);
  const client: any = db.prepare('SELECT userId FROM clients WHERE id = ?').get(patient.ownerId);
  if (client) {
    await sendNotification(client.userId, 'Nuevo Registro Médico', `Se ha generado un diagnóstico para ${patient.name}. Diagnóstico: ${diagnosis}.`, 'HEALTH');
  }

  revalidatePath('/dashboard/patients');
  revalidatePath('/client-portal');
  return { success: 'Registro médico creado.' };
}

// ─── HOSPITALIZATIONS ─────────────────────────────────────────────────────────
export async function admitPatient(prevState: any, formData: FormData) {
  const patientId = formData.get('patientId') as string;
  const notes = (formData.get('notes') as string)?.trim() || '';
  const status = formData.get('hospStatus') as string || 'OBSERVATION';

  const existing = db.prepare(`SELECT id FROM hospitalizations WHERE patientId=? AND dischargeDate IS NULL`).get(patientId);
  if (existing) return { error: 'El paciente ya está hospitalizado.' };

  const id = genId('h');
  db.prepare(`INSERT INTO hospitalizations (id,patientId,status,notes) VALUES (?,?,?,?)`)
    .run(id, patientId, status, notes);
  
  const patientStatus = status === 'INTENSIVE_CARE' ? 'CRITICAL' : 'HOSPITALIZED';
  db.prepare(`UPDATE patients SET status=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`)
    .run(patientStatus, patientId);

  const patient: any = db.prepare('SELECT name, ownerId FROM patients WHERE id = ?').get(patientId);
  const ownerClient: any = db.prepare('SELECT id, userId FROM clients WHERE id = ?').get(patient.ownerId);

  if (ownerClient) {
    ensureOpenConsultationAndInvoice({
      patientId,
      clientId: ownerClient.id,
      hospitalizationId: id
    });
  }

  const client: any = db.prepare('SELECT userId FROM clients WHERE id = ?').get(patient.ownerId);
  if (client) {
    await sendNotification(client.userId, 'Ingreso Hospitalario', `${patient.name} ha sido ingresado en nuestro hospital. Estado: ${status}.`, 'HEALTH');
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/hospital');
  revalidatePath('/dashboard/patients');
  return { success: 'Paciente internado.' };
}

export async function updateHospitalization(formData: FormData) {
  const id = formData.get('id') as string;
  const notes = formData.get('notes') as string;
  const status = formData.get('status') as string;
  const temp = formData.get('temp') as string;
  const heart = formData.get('heart') as string;
  const resp = formData.get('resp') as string;
  const spo2 = formData.get('spo2') as string;
  const vitals = JSON.stringify({ temp, heart, resp, spo2 });

  db.prepare(`UPDATE hospitalizations SET status=?, notes=?, vitals=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`)
    .run(status, notes, vitals, id);
  
  const hosp: any = db.prepare('SELECT patientId FROM hospitalizations WHERE id = ?').get(id);
  const patient: any = db.prepare('SELECT name, ownerId FROM patients WHERE id = ?').get(hosp.patientId);
  const client: any = db.prepare('SELECT userId FROM clients WHERE id = ?').get(patient.ownerId);

  if (client) {
    const parsedVitals = JSON.parse(vitals); // Parse back to access properties
    await sendNotification(client.userId, 'Actualización Médica', `Estado de ${patient.name}: ${status}. Vitals: T:${parsedVitals.temp}, FC:${parsedVitals.heart}.`, 'HEALTH');
  }

  revalidatePath('/dashboard/hospital');
  revalidatePath('/dashboard/hospital/monitor');
}

export async function dischargePatient(formData: FormData) {
  const hospId = formData.get('hospId') as string;
  const patientId = formData.get('patientId') as string;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.prepare(`UPDATE hospitalizations SET dischargeDate=? WHERE id=?`).run(now, hospId);
  db.prepare(`UPDATE patients SET status='HEALTHY', updatedAt=CURRENT_TIMESTAMP WHERE id=?`).run(patientId);
  db.prepare(`UPDATE consultations SET status='CLOSED', closedAt=? WHERE hospitalizationId=? AND status='OPEN'`).run(now, hospId);
  
  const patient: any = db.prepare('SELECT name, ownerId FROM patients WHERE id = ?').get(patientId);
  const client: any = db.prepare('SELECT userId FROM clients WHERE id = ?').get(patient.ownerId);
  if (client) {
    await sendNotification(client.userId, 'Alta Hospitalaria', `${patient.name} ha sido dado de alta. ¡Ya puede volver a casa!`, 'HEALTH');
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/hospital');
  revalidatePath('/dashboard/hospital/monitor');
  revalidatePath('/dashboard/patients');
}

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
export async function createAppointment(prevState: any, formData: FormData) {
  const patientId = formData.get('patientId') as string;
  const reason = (formData.get('reason') as string)?.trim();
  const dateTime = formData.get('dateTime') as string;
  const type = formData.get('type') as string;

  if (!patientId || !reason || !dateTime || !type) {
    return { error: 'Todos los campos son obligatorios.' };
  }
  const id = genId('a');
  db.prepare(`INSERT INTO appointments (id,patientId,reason,dateTime,type,status) VALUES (?,?,?,?,?,'SCHEDULED')`)
    .run(id, patientId, reason, dateTime.replace('T', ' '), type);

  const patient: any = db.prepare('SELECT name, ownerId FROM patients WHERE id = ?').get(patientId);
  const client: any = db.prepare('SELECT userId FROM clients WHERE id = ?').get(patient.ownerId);
  if (client) {
    const formattedDate = new Date(dateTime).toLocaleString('es-ES');
    await sendNotification(client.userId, 'Cita Confirmada', `Se ha agendado una cita para ${patient.name} el día ${formattedDate}. Motivo: ${reason}.`, 'APPOINTMENT');
  }

  revalidatePath('/dashboard/appointments');
  revalidatePath('/client-portal');
  return { success: 'Cita agendada correctamente.' };
}

export async function updateAppointmentStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  db.prepare(`UPDATE appointments SET status=? WHERE id=?`).run(status, id);
  
  const app: any = db.prepare(`
    SELECT a.*, p.name as petName, p.ownerId 
    FROM appointments a JOIN patients p ON a.patientId = p.id 
    WHERE a.id = ?
  `).get(id);

  if (app) {
    const client: any = db.prepare('SELECT userId FROM clients WHERE id = ?').get(app.ownerId);
    if (client) {
      const statusText = status === 'COMPLETED' ? 'Finalizada' : status === 'CANCELLED' ? 'Cancelada' : status;
      await sendNotification(client.userId, 'Estado de Cita', `La cita para ${app.petName} ha sido marcada como: ${statusText}.`, 'APPOINTMENT');
    }
  }

  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard');
}

export async function startAppointment(formData: FormData) {
  const id = formData.get('id') as string;
  db.prepare(`UPDATE appointments SET status='IN_PROGRESS' WHERE id=?`).run(id);

  const app: any = db.prepare(`
    SELECT a.*, p.id as patientId, p.name as petName, p.ownerId 
    FROM appointments a JOIN patients p ON a.patientId = p.id 
    WHERE a.id = ?
  `).get(id);

  if (app) {
    const ownerClient: any = db.prepare('SELECT id, userId FROM clients WHERE id = ?').get(app.ownerId);
    const existingHosp: any = db.prepare(`
      SELECT id FROM hospitalizations WHERE patientId = ? AND dischargeDate IS NULL LIMIT 1
    `).get(app.patientId);

    let hospitalizationId = existingHosp?.id as string | undefined;

    if (!existingHosp) {
      hospitalizationId = genId('h');
      db.prepare(`INSERT INTO hospitalizations (id, patientId, status, notes) VALUES (?, ?, 'OBSERVATION', ?)`)
        .run(hospitalizationId, app.patientId, `Ingreso automático al iniciar consulta (cita ${app.id}).`);
    }

    db.prepare(`UPDATE patients SET status='HOSPITALIZED', updatedAt=CURRENT_TIMESTAMP WHERE id=?`)
      .run(app.patientId);

    if (ownerClient) {
      ensureOpenConsultationAndInvoice({
        patientId: app.patientId,
        clientId: ownerClient.id,
        appointmentId: app.id,
        hospitalizationId: hospitalizationId || null
      });
    }

    const client: any = db.prepare('SELECT userId FROM clients WHERE id = ?').get(app.ownerId);
    if (client) {
      await sendNotification(
        client.userId,
        'Consulta Iniciada',
        `La consulta para ${app.petName} acaba de comenzar y ha sido ingresado/a en hospitalización para seguimiento clínico.`,
        'APPOINTMENT'
      );
    }
  }

  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/hospital');
  revalidatePath('/dashboard/patients');
  revalidatePath('/client-portal');
}

export async function addHospitalizationCharge(prevState: any, formData: FormData) {
  const hospId = formData.get('hospId') as string;
  const catalogItemId = formData.get('catalogItemId') as string;
  const quantity = Number(formData.get('quantity') as string);
  const notes = (formData.get('notes') as string)?.trim() || null;

  if (!hospId || !catalogItemId || !quantity || quantity <= 0) {
    return { error: 'Debes seleccionar un item y una cantidad valida.' };
  }

  const hospitalization: any = db.prepare(`
    SELECT h.id, h.patientId, p.ownerId, p.name as patientName
    FROM hospitalizations h
    JOIN patients p ON p.id = h.patientId
    WHERE h.id = ?
  `).get(hospId);
  if (!hospitalization) return { error: 'Hospitalizacion no encontrada.' };

  const catalogItem: any = db.prepare(`
    SELECT * FROM billing_catalog WHERE id = ? AND isActive = 1
  `).get(catalogItemId);
  if (!catalogItem) return { error: 'Item de catalogo no encontrado.' };

  const ownerClient: any = db.prepare('SELECT id, userId FROM clients WHERE id = ?').get(hospitalization.ownerId);
  if (!ownerClient) return { error: 'No se encontro cliente propietario.' };

  const openConsultation = db.prepare(`
    SELECT * FROM consultations
    WHERE patientId = ? AND status = 'OPEN'
    ORDER BY startedAt DESC
    LIMIT 1
  `).get(hospitalization.patientId);

  const { consultation, invoice } = ensureOpenConsultationAndInvoice({
    patientId: hospitalization.patientId,
    clientId: ownerClient.id,
    hospitalizationId: hospId,
    appointmentId: openConsultation?.appointmentId || null
  });

  const unitPrice = Number(catalogItem.unitPrice);
  const amount = Number((unitPrice * quantity).toFixed(2));

  db.prepare(`
    INSERT INTO invoice_items (
      id, invoiceId, consultationId, hospitalizationId, catalogItemId, description,
      quantity, unit, unitPrice, amount, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    genId('inv_item'),
    invoice.id,
    consultation.id,
    hospId,
    catalogItem.id,
    catalogItem.name,
    quantity,
    catalogItem.unit,
    unitPrice,
    amount,
    notes
  );

  syncInvoiceTotal(invoice.id);

  await sendNotification(
    ownerClient.userId,
    'Factura actualizada',
    `Se ha registrado en la consulta ${consultation.consultationNumber}: ${catalogItem.name} x${quantity}.`,
    'BILLING'
  );

  revalidatePath('/dashboard/hospital/monitor');
  revalidatePath('/dashboard/billing');
  revalidatePath('/client-portal');
  return { success: 'Cargo añadido y factura actualizada.' };
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────
export async function createInventoryItem(prevState: any, formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const category = formData.get('category') as string;
  const quantity = parseInt(formData.get('quantity') as string) || 0;
  const unit = (formData.get('unit') as string)?.trim();
  const minStock = parseInt(formData.get('minStock') as string) || 0;
  const location = (formData.get('location') as string)?.trim() || null;
  const expiryDate = formData.get('expiryDate') as string || null;

  if (!name || !category || !unit) {
    return { error: 'Nombre, categoría y unidad son obligatorios.' };
  }
  const id = genId('i');
  db.prepare(`INSERT INTO inventory_items (id,name,category,quantity,unit,minStock,location,expiryDate) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, name, category, quantity, unit, minStock, location, expiryDate || null);
  revalidatePath('/dashboard/inventory');
  return { success: 'Artículo añadido al inventario.' };
}

export async function updateInventory(formData: FormData) {
  const id = formData.get('id') as string;
  const quantity = parseInt(formData.get('quantity') as string);
  db.prepare(`UPDATE inventory_items SET quantity=? WHERE id=?`).run(quantity, id);
  revalidatePath('/dashboard/inventory');
}

export async function deleteInventoryItem(formData: FormData) {
  const id = formData.get('id') as string;
  db.prepare(`DELETE FROM inventory_items WHERE id=?`).run(id);
  revalidatePath('/dashboard/inventory');
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────
export async function createInvoice(prevState: any, formData: FormData) {
  const clientId = formData.get('clientId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const dueDate = formData.get('dueDate') as string;
  const description = (formData.get('description') as string)?.trim() || null;

  if (!clientId || !amount || !dueDate) {
    return { error: 'Cliente, importe y fecha de vencimiento son obligatorios.' };
  }
  const id = genId('inv');
  const consultationNumber = (formData.get('consultationNumber') as string)?.trim() || null;
  db.prepare(`
    INSERT INTO invoices (id,clientId,amount,status,consultationNumber,items,dueDate)
    VALUES (?,?,?,'PENDING',?,?,?)
  `).run(id, clientId, amount, consultationNumber, description, dueDate);

  if (description) {
    db.prepare(`
      INSERT INTO invoice_items (id, invoiceId, description, quantity, unit, unitPrice, amount, notes)
      VALUES (?, ?, ?, 1, 'servicio', ?, ?, ?)
    `).run(genId('inv_item'), id, description, amount, amount, 'Linea manual de facturacion');
  }

  revalidatePath('/dashboard/billing');
  return { success: 'Factura creada correctamente.' };
}

export async function updateInvoiceStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  db.prepare(`UPDATE invoices SET status=? WHERE id=?`).run(status, id);
  revalidatePath('/dashboard/billing');
}

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
export async function createEmployee(prevState: any, formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const role = formData.get('role') as string;
  const specialization = (formData.get('specialization') as string)?.trim() || null;
  const licenseNumber = (formData.get('licenseNumber') as string)?.trim() || null;
  const schedule = formData.get('schedule') as string || null;
  const password = formData.get('password') as string;

  if (!name || !email || !role || !password) {
    return { error: 'Nombre, email, rol y contraseña son obligatorios.' };
  }
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (existing) return { error: 'Ya existe un usuario con ese email.' };

  const hashedPassword = await hash(password, 10);
  const userId = genId('u');
  const empId = genId('e');

  db.transaction(() => {
    db.prepare(`INSERT INTO users (id,name,email,password,role) VALUES (?,?,?,?,?)`).run(userId, name, email, hashedPassword, role);
    db.prepare(`INSERT INTO employees (id,userId,specialization,licenseNumber,schedule) VALUES (?,?,?,?,?)`).run(empId, userId, specialization, licenseNumber, schedule);
  })();

  revalidatePath('/dashboard/staff');
  return { success: 'Empleado registrado correctamente.' };
}

export async function deleteEmployee(formData: FormData) {
  const userId = formData.get('userId') as string;
  db.prepare('DELETE FROM users WHERE id=?').run(userId); // cascade deletes employee too
  revalidatePath('/dashboard/staff');
}

// ─── PAYMENTS (Client Portal) ─────────────────────────────────────────────────
export async function payInvoice(prevState: any, formData: FormData) {
  const invoiceId  = formData.get('invoiceId') as string;
  const method     = formData.get('method') as string;
  const cardLast4  = formData.get('cardLast4') as string | null;

  if (!invoiceId || !method) {
    return { error: 'Datos de pago incompletos.' };
  }

  // Simulate a brief "processing" — in production this would call Stripe/etc.
  const invoice: any = db.prepare('SELECT * FROM invoices WHERE id=?').get(invoiceId);
  if (!invoice) return { error: 'Factura no encontrada.' };
  if (invoice.status === 'PAID') return { error: 'Esta factura ya está pagada.' };

  const ref = `PAY-${Date.now().toString(36).toUpperCase()}`;
  const note = cardLast4
    ? `${method} •••• ${cardLast4} | Ref: ${ref}`
    : `${method} | Ref: ${ref}`;

  db.prepare(`UPDATE invoices SET status='PAID', items=COALESCE(items,'') || ' [' || ? || ']' WHERE id=?`)
    .run(note, invoiceId);

  const ownerUser: any = db.prepare(`
    SELECT u.id as userId
    FROM invoices i
    JOIN clients c ON i.clientId = c.id
    JOIN users u ON c.userId = u.id
    WHERE i.id = ?
  `).get(invoiceId);

  if (ownerUser?.userId) {
    await sendNotification(ownerUser.userId, 'Pago recibido', `Hemos recibido el pago de la factura ${invoiceId.substring(0, 12)}. Gracias.`, 'BILLING');
  }

  revalidatePath('/client-portal');
  revalidatePath('/dashboard/billing');
  return { success: true, ref, amount: invoice.amount, method };
}

// ─── CLIENT PROFILE ───────────────────────────────────────────────────────────
export async function updateClientProfile(prevState: any, formData: FormData) {
  const userId = formData.get('userId') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;

  if (!userId || !name || !email) return { error: 'Nombre y Email son obligatorios.' };

  try {
    db.transaction(() => {
      db.prepare(`UPDATE users SET name=?, email=? WHERE id=?`).run(name, email, userId);
      db.prepare(`UPDATE clients SET phone=?, address=? WHERE userId=?`).run(phone, address, userId);
    })();
    revalidatePath('/client-portal');
    return { success: 'Perfil actualizado correctamente.' };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─── ADD PET FROM PORTAL ──────────────────────────────────────────────────────
export async function addPetFromPortal(prevState: any, formData: FormData) {
  const clientId = formData.get('clientId') as string;
  const name     = (formData.get('name') as string)?.trim();
  const species  = formData.get('species') as string;
  const breed    = (formData.get('breed') as string)?.trim() || null;
  const gender   = formData.get('gender') as string || null;
  const weight   = parseFloat(formData.get('weight') as string) || null;
  const birthDate = formData.get('birthDate') as string || null;

  if (!clientId || !name || !species) {
    return { error: 'El nombre y la especie de tu mascota son obligatorios.' };
  }

  const id = genId('p');
  db.prepare(`INSERT INTO patients (id,name,species,breed,birthDate,gender,weight,ownerId,status)
              VALUES (?,?,?,?,?,?,?,?,'HEALTHY')`)
    .run(id, name, species, breed, birthDate || null, gender, weight, clientId);

  revalidatePath('/client-portal');
  return { success: 'Mascota registrada. El equipo revisará los datos en breve.' };
}

// ─── OPERATING ROOMS ──────────────────────────────────────────────────────────
export async function occupyOR(prevState: any, formData: FormData) {
  const orId = formData.get('orId') as string;
  const patientId = formData.get('patientId') as string;
  const procedure = formData.get('procedure') as string;
  const staffIds = formData.get('staffIds') as string; // JSON string

  try {
    db.prepare(`
      UPDATE operating_rooms 
      SET status = 'OCCUPIED', patientId = ?, procedure = ?, startTime = CURRENT_TIMESTAMP, staffIds = ?
      WHERE id = ?
    `).run(patientId, procedure, staffIds, orId);

    const patient: any = db.prepare('SELECT name, ownerId FROM patients WHERE id = ?').get(patientId);
    const client: any = db.prepare('SELECT userId FROM clients WHERE id = ?').get(patient.ownerId);
    const room: any = db.prepare('SELECT name FROM operating_rooms WHERE id = ?').get(orId);

    if (client) {
      await sendNotification(client.userId, 'Inicio de Cirugía', `${patient.name} ha ingresado a ${room.name} para: ${procedure}.`, 'HEALTH');
    }

    revalidatePath('/dashboard/hospital/operating-rooms');
    return { success: 'Quirófano ocupado correctamente.' };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function releaseOR(prevState: any, formData: FormData) {
  const orId = formData.get('orId') as string;
  const findings = formData.get('findings') as string;

  try {
    const room: any = db.prepare('SELECT patientId, procedure FROM operating_rooms WHERE id = ?').get(orId);
    
    if (room && room.patientId) {
      const patient: any = db.prepare('SELECT name, ownerId FROM patients WHERE id = ?').get(room.patientId);
      const client: any = db.prepare('SELECT userId FROM clients WHERE id = ?').get(patient.ownerId);

      db.prepare(`
        UPDATE operating_rooms 
        SET status = 'CLEANING', patientId = NULL, procedure = NULL, startTime = NULL, staffIds = NULL, findings = ?
        WHERE id = ?
      `).run(findings, orId);

      if (client) {
        await sendNotification(client.userId, 'Cirugía Finalizada', `${patient.name} ha salido de quirófano satisfactoriamente. Procedimiento completado.`, 'HEALTH');
      }
    } else {
      db.prepare(`
        UPDATE operating_rooms 
        SET status = 'CLEANING', patientId = NULL, procedure = NULL, startTime = NULL, staffIds = NULL, findings = ?
        WHERE id = ?
      `).run(findings, orId);
    }

    revalidatePath('/dashboard/hospital/operating-rooms');
    return { success: 'Quirófano liberado y en proceso de limpieza.' };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateORStatus(orId: string, status: string) {
  db.prepare('UPDATE operating_rooms SET status = ? WHERE id = ?').run(status, orId);
  revalidatePath('/dashboard/hospital/operating-rooms');
}
