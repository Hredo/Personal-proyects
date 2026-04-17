# Service Level Agreement (SLA)
## VetHospital 24h - Acuerdo de Nivel de Servicio

**Efectivo desde:** 1 de Abril de 2026  
**Próxima revisión:** 1 de Octubre de 2026  

---

## 1. Disponibilidad del Servicio

### 1.1 Compromisos de Uptime

| Nivel de Plan | SLA de Uptime | Crédito |
|---|---|---|
| **STARTER** | 95% | Descuento 10% |
| **PROFESSIONAL** | 99% | Descuento 20% |
| **ENTERPRISE** | 99.9% | Descuento 50% |

**Definição:** Uptime se calcula como el porcentaje de métrica de disponibilidad medida a través de nuestro endpoint `/api/health` con heartbeat cada 5 minutos.

### 1.2 Ventanas de Mantenimiento

- **Mantenimiento Planificado:** Máx. 2 horas por mes
- **Notificación:** Mínimo 7 días de anticipación
- **Horario:** Generalmente 22:00-23:00 (UTC+1) entre semana
- **Los viernes:** No se realizan mantenimientos programados

### 1.3 Ventanas de Exclusión del SLA

El SLA no aplica a:
- Problemas causados por cliente (configuración incorrecta, credenciales)
- Ataques DDoS o fuerza bruta
- Mantenimiento de emergencia crítico
- Fallos de terceros (hosting provider, DNS, ISP)
- Eventos de fuerza mayor

---

## 2. Rendimiento

### 2.1 Tiempos de Respuesta

| Métrica | Objetivo | Umbral |
|---|---|---|
| **Tiempo de carga de página** | < 2 segundos | p95 |
| **API response time** | < 100ms | p95 |
| **Dashboard initial load** | < 3 segundos | p95 |
| **Report generation** | < 5 segundos | p95 |

### 2.2 Throughput

- **Usuarios concurrentes:** Mín. 1000
- **Transacciones por minuto:** Mín. 5000
- **Facturas/mes:** Sin límite en ENTERPRISE

---

## 3. Seguridad & Cumplimiento

### 3.1 Encriptación

✅ **Encriptación en tránsito:** HTTPS/TLS 1.2+ (obligatorio)  
✅ **Encriptación en reposo:** AES-256-GCM para datos sensibles  
✅ **Backups encriptados:** Sí

### 3.2 Auditoría & Logging

✅ **Auditoría de acceso:** Todos los eventos registrados  
✅ **Retención de logs:** 90 días mínimo  
✅ **Acceso a logs:** Via admin dashboard  

### 3.3 Cumplimiento Regulatorio

✅ **RGPD (EU):** Cumplimiento completo  
✅ **Derechos del usuario:** Acceso, rectificación, eliminación, portabilidad  
✅ **Auditorías de terceros:** Disponibles en ENTERPRISE  

---

## 4. Backup & Disaster Recovery

### 4.1 Política de Backups

| Frecuencia | Retención | Encriptación | Recuperación |
|---|---|---|---|
| Cada 24 horas | 90 días | Sí | < 1 hora |
| Backup de punto en tiempo | 30 días | Sí | < 4 horas |

### 4.2 RTO & RPO

- **RTO (Objetivo de Tiempo de Recuperación):** < 1 hora
- **RPO (Objetivo de Punto de Recuperación):** < 24 horas
- **Restauración manual:** Disponible por solicitud

### 4.3 Pruebas de Disaster Recovery

- **Frecuencia:** Trimestral
- **Validación:** Verificación completa de integridad
- **Reporte:** Disponible en ENTERPRISE

---

## 5. Soporte Técnico

### 5.1 Canales de Soporte

| Canal | Tiempo de Respuesta |  Disponibilidad |
|---|---|---|
| **Email** | 24 horas | 24/7 |
| **Teléfono** | 1 hora | 9:00-18:00 CET |
| **Chat** | 30 minutos | 9:00-18:00 CET |
| **Emergency hotline** | 15 minutos | 24/7 (ENTERPRISE) |

### 5.2 Niveles de Prioridad

| Prioridad | Definición | Response Time | Resolution Target |
|---|---|---|---|
| **P1 - Crítica** | Sistema down, datos perdidos | 15 min | 2 horas |
| **P2 - Alta** | Feature importante no funciona | 1 hora | 12 horas |
| **P3 - Media** | Funcionamiento lento, bugs menores | 4 horas | 24 horas |
| **P4 - Baja** | Solicitudes de mejora, documentación | 24 horas | 72 horas |

### 5.3 Escalada

- 1era línea: Soporte técnico
- 2da línea: Ingeniero de sistemas
- 3era línea: Director técnico
- Escalada automática si no resuelto en timeframe

---

## 6. Disponibilidad de Características

### 6.1 Roadmap Garantizado

| Versión | Fecha | Características |
|---|---|---|
| v2.1 | Junio 2026 | App móvil beta |
| v2.2 | Septiembre 2026 | Integración POS |
| v2.3 | Diciembre 2026 | Telemedicina |

### 6.2 Deprecación de Características

- Notificación con 6 meses de anticipación
- Período de transición de 3 meses
- Migración automática de datos cuando sea posible

---

## 7. Privacidad de Datos

### 7.1 Localización de Datos

✅ **PRI MARYM:** Servidores en la UE (conforme a RGPD)  
✅ **Backups:** Replica en segundo centro UE  
✅ **Sin transferencias fuera de la UE:** Salvo consentimiento explícito

### 7.2 Retención de Datos

- **Datos activos:** Durante actitud de suscripción
- **Datos después de cancelación:** 30 días de período de gracia
- **Datos de cumplimiento legal:** Según regulación local
- **Eliminación completa:** Under GDPR "Derecho al olvido"

---

## 8. Créditos por Incumplimiento del SLA

### 8.1 Aplicación de Créditos

Si no cumplimos el SLA de uptime:

| Downtime | STARTER | PROFESSIONAL | ENTERPRISE |
|---|---|---|---|
| 0.1% - 1% | 5% | 10% | 25% |
| 1% - 5% | 10% | 20% | 50% |
| > 5% | 15% | 30% | 100% |

### 8.2 Proceso de Reclamación

1. Notificar dentro de 30 días del incidente
2. Proporcionar evidencia (logs, tiempo exacto)
3. Nosotros validamos y procesamos crédito
4. Crédito aplicado en próxima factura dentro de 30 días

---

## 9. Cambios al SLA

### 9.1 Proceso de Revisión

- Revisión anual (próxima: Oct 2026)
- Cambios significativos requieren 30 días notificación
- Cliente puede cancelar sin penalidad si términos empeoran

---

## 10. Contato & Escalada

**Gerente de Cuenta:** accounts@vethospital24h.com  
**Soporte Técnico:** support@vethospital24h.com  
**Gerente SLA:** sla@vethospital24h.com  
**Emergencias 24/7:** +34-XXX-XXX-XXXX  

---

## Certificaciones & Auditorías

- ✅ ISO 27001 (Seguridad de Información)
- ✅ SOC 2 Type II (en progreso - completado Q2 2026)
- ✅ RGPD Compliant (certificado anualmente)
- ✅ PCI DSS Compliant (si procesa pagos directos)

---

**Firmado:** VetHospital 24h SL  
**Fecha:** 1 de Abril de 2026  
**Próxima Revisión:** 1 de Octubre de 2026  

*Este SLA es un compromiso empresa-cliente y es legalmente vinculante.*
