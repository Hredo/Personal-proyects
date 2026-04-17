export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Política de Privacidad</h1>
        <p style={{ color: '#666' }}>Última actualización: Abril 2026</p>
      </div>

      <div style={{ lineHeight: '1.8', color: '#333' }}>
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#1a1a1a' }}>1. Información General</h2>
          <p>
            VetHospital 24h ("nosotros", "nos", "nuestro") opera con compromiso total a la privacidad de nuestros usuarios. 
            Esta política de privacidad explica cómo recopilamos, utilizamos, divulgamos y protegemos su información cuando 
            utiliza nuestros servicios de gestión veterinaria.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#1a1a1a' }}>2. Datos que Recopilamos</h2>
          <p><strong>Datos Personales Directos:</strong></p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Nombre completo, correo electrónico, teléfono, dirección</li>
            <li>Información de identificación veterinaria y credentials profesionales</li>
            <li>Datos de acceso y autenticación (email, contraseña hash)</li>
          </ul>
          <p><strong>Datos de Pacientes (Mascotas):</strong></p>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li>Nombre, especie, raza, edad, peso</li>
            <li>Historial médico, diagnósticos, tratamientos</li>
            <li>Registros de hospitalizaciones y consultas</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#1a1a1a' }}>3. Base Legal para el Procesamiento</h2>
          <p>Procesamos sus datos bajo estas bases legales:</p>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li><strong>Consentimiento:</strong> Cuando usted explícitamente autoriza</li>
            <li><strong>Contrato:</strong> Para ejecutar servicios solicitados</li>
            <li><strong>Obligación Legal:</strong> Para cumplir con regulaciones veterinarias</li>
            <li><strong>Interés Legítimo:</strong> Para mejorar seguridad y operaciones</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#1a1a1a' }}>4. Cómo Utilizamos sus Datos</h2>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li>Proporcionar servicios de gestión veterinaria</li>
            <li>Procesar pagos y transacciones</li>
            <li>Enviar notificaciones sobre citas y tratamientos</li>
            <li>Cumplir con obligaciones legales y regulatorias</li>
            <li>Mejorar la calidad y seguridad del servicio</li>
            <li>Investigar fraude y prevenir delitos</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#1a1a1a' }}>5. Protección de Datos</h2>
          <p>Implementamos medidas de seguridad avanzadas:</p>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li>Cifrado AES-256-GCM para datos sensibles en reposo</li>
            <li>Transmisión HTTPS/TLS para todos los datos en tránsito</li>
            <li>Control de acceso basado en roles (RBAC)</li>
            <li>Auditoría de acceso y modificaciones de datos</li>
            <li>Aislamiento de base de datos con WAL y constraints</li>
            <li>Backups automáticos y encriptados</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#1a1a1a' }}>6. Derechos RGPD</h2>
          <p>Bajo el Reglamento General de Protección de Datos (RGPD), usted tiene derecho a:</p>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li><strong>Acceso:</strong> Solicitar acceso a sus datos personales</li>
            <li><strong>Rectificación:</strong> Corregir datos inexactos</li>
            <li><strong>Eliminación:</strong> Solicitar la "eliminación" (derecho al olvido)</li>
            <li><strong>Restricción:</strong> Solicitar la restricción del procesamiento</li>
            <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
            <li><strong>Objeción:</strong> Objetar el procesamiento de datos</li>
            <li><strong>Retiro de Consentimiento:</strong> Retirar el consentimiento en cualquier momento</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#1a1a1a' }}>7. Tiempo de Retención de Datos</h2>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li><strong>Datos de Cuenta:</strong> Durante la vigencia de la cuenta + 3 años posteriores</li>
            <li><strong>Registros Médicos:</strong> Mínimo 7 años (conforme a regulaciones veterinarias)</li>
            <li><strong>Registros Contables:</strong> 6 años (conforme a regulaciones fiscales)</li>
            <li><strong>Logs de Auditoría:</strong> 3 años</li>
            <li><strong>Datos de Consentimiento:</strong> 2 años tras expiración</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#1a1a1a' }}>8. Transferencias Internacionales</h2>
          <p>
            Sus datos pueden ser transferidos, procesados y almacenados en ubicaciones dentro de la UE. 
            Si transferimos datos fuera de la UE, implementamos mecanismos de protección como cláusulas contractuales estándar.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#1a1a1a' }}>9. Contacto de Privacidad</h2>
          <p>Para consultas sobre privacidad, contacte a nuestro Oficial de Protección de Datos:</p>
          <p style={{ marginLeft: '1.5rem' }}>
            <strong>Email:</strong> privacy@vethospital24h.com<br />
            <strong>Teléfono:</strong> +34-XXX-XXX-XXXX<br />
            <strong>Dirección:</strong> [Insertar dirección de la clínica]
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#1a1a1a' }}>10. Notificación de Brechas</h2>
          <p>
            En caso de una brecha de seguridad que afecte sus datos personales, le notificaremos dentro de 72 horas, 
            tal como requiere el RGPD. La notificación incluirá información sobre:
          </p>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li>Naturaleza de la brecha</li>
            <li>Datos afectados</li>
            <li>Medidas de mitigación implementadas</li>
            <li>Contacto para más información</li>
          </ul>
        </section>

        <section style={{ marginBottom:'2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#1a1a1a' }}>11. Cambios a esta Política</h2>
          <p>
            Nos reservamos el derecho de actualizar esta política de privacidad en cualquier momento. 
            Le notificaremos de cambios significativos enviando un aviso a su email registrado.
          </p>
        </section>
      </div>
    </div>
  );
}
