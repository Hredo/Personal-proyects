'use client';

import { useActionState, useState, useRef } from 'react';
import { payInvoice } from '@/lib/actions';
import Modal from '@/components/Modal';
import { CreditCard, Building2, Smartphone, CheckCircle2, Lock, ChevronRight } from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtCard(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
function detectBrand(n: string): 'visa' | 'mc' | 'amex' | 'unknown' {
  const d = n.replace(/\s/g, '');
  if (/^4/.test(d)) return 'visa';
  if (/^5[1-5]/.test(d)) return 'mc';
  if (/^3[47]/.test(d)) return 'amex';
  return 'unknown';
}

const inputS: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.6rem',
  border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem',
  fontFamily: 'inherit', transition: 'border-color 0.2s', background: '#fafafa',
};
const labelS: React.CSSProperties = { fontSize: '0.78rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' };

type Method = 'card' | 'paypal' | 'transfer' | 'bizum';

interface PaymentModalProps {
  invoiceId: string;
  amount: number;
}

export function PaymentModal({ invoiceId, amount }: PaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<Method>('card');
  const [step, setStep] = useState<'method' | 'details' | 'processing' | 'success'>('method');
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry]   = useState('');
  const [cvv, setCvv]         = useState('');
  const [holder, setHolder]   = useState('');
  const [payRef, setPayRef]   = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, action, isPending] = useActionState(payInvoice, null);

  const brand = detectBrand(cardNum);
  const last4 = cardNum.replace(/\s/g, '').slice(-4);

  function handleOpen() {
    setOpen(true); setStep('method'); setCardNum(''); setExpiry(''); setCvv(''); setHolder('');
  }
  function handleClose() {
    setOpen(false); setStep('method');
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setStep('processing');
    // Simulate network delay then submit real action
    await new Promise(r => setTimeout(r, 2000));
    if (formRef.current) {
      const fd = new FormData(formRef.current);
      fd.set('method', method === 'card' ? 'Tarjeta' : method === 'paypal' ? 'PayPal' : method === 'transfer' ? 'Transferencia' : 'Bizum');
      fd.set('cardLast4', last4 || '');
      const result = await action(fd);
      if ((result as any)?.success) {
        setPayRef((result as any).ref || '');
        setStep('success');
      } else {
        setStep('details');
      }
    }
  }

  const methods: { id: Method; label: string; sub: string; icon: React.ReactNode; color: string }[] = [
    { id: 'card',     label: 'Tarjeta de Crédito / Débito', sub: 'Visa, Mastercard, Amex', color: '#1a56db', icon: <CreditCard size={22} /> },
    { id: 'paypal',   label: 'PayPal',                       sub: 'Pago rápido con tu cuenta', color: '#009cde', icon: <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#003087' }}>P</span> },
    { id: 'bizum',    label: 'Bizum',                        sub: 'Con tu número de móvil',   color: '#00d2ff', icon: <Smartphone size={22} /> },
    { id: 'transfer', label: 'Transferencia Bancaria',       sub: 'SEPA — hasta 2 días hábiles', color: '#0f766e', icon: <Building2 size={22} /> },
  ];

  return (
    <>
      <button onClick={handleOpen} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        background: '#0f766e', color: 'white', border: 'none', padding: '0.45rem 0.9rem',
        borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.82rem',
        fontFamily: 'inherit', fontWeight: '700', whiteSpace: 'nowrap'
      }}>
        <CreditCard size={14} /> Pagar
      </button>

      <Modal isOpen={open} onClose={handleClose} title="" width="500px">
        {/* ── Header amount ── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Importe a pagar</p>
          <p style={{ fontSize: '2.8rem', fontWeight: '800', color: '#0f172a', lineHeight: '1' }}>
            {amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} <span style={{ fontSize: '1.5rem', color: '#64748b' }}>€</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.78rem' }}>
            <Lock size={12} /> Pago 100% seguro y encriptado
          </div>
        </div>

        {/* ── STEP: method selection ── */}
        {step === 'method' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Elige cómo quieres pagar:</p>
            {methods.map(m => (
              <button key={m.id} type="button" onClick={() => { setMethod(m.id); setStep('details'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
                  border: `2px solid ${method === m.id ? m.color : '#e2e8f0'}`,
                  borderRadius: '0.75rem', background: method === m.id ? `${m.color}08` : 'white',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', width: '100%',
                  fontFamily: 'inherit'
                }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, flexShrink: 0 }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>{m.label}</p>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{m.sub}</p>
                </div>
                <ChevronRight size={16} color="#cbd5e1" />
              </button>
            ))}
          </div>
        )}

        {/* ── STEP: details ── */}
        {step === 'details' && (
          <form ref={formRef} onSubmit={handlePay}>
            <input type="hidden" name="invoiceId" value={invoiceId} />

            <button type="button" onClick={() => setStep('method')}
              style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}>
              ← Cambiar método
            </button>

            {/* CARD FORM */}
            {method === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Virtual card preview */}
                <div style={{
                  borderRadius: '1rem', padding: '1.5rem', marginBottom: '0.5rem',
                  background: brand === 'visa' ? 'linear-gradient(135deg,#1a56db,#0f3460)' :
                    brand === 'mc' ? 'linear-gradient(135deg,#eb5757,#843b62)' :
                    brand === 'amex' ? 'linear-gradient(135deg,#00d2c8,#0f766e)' :
                    'linear-gradient(135deg,#374151,#111827)',
                  color: 'white', minHeight: '140px', position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ position: 'absolute', bottom: '-30px', right: '20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                  <p style={{ fontSize: '0.7rem', opacity: 0.7, letterSpacing: '0.15em', marginBottom: '1.5rem' }}>{brand !== 'unknown' ? brand.toUpperCase() : 'TARJETA'}</p>
                  <p style={{ fontSize: '1.1rem', letterSpacing: '0.2em', fontFamily: 'monospace', marginBottom: '1rem' }}>
                    {cardNum || '•••• •••• •••• ••••'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.85 }}>
                    <span>{holder || 'TITULAR'}</span>
                    <span>{expiry || 'MM/YY'}</span>
                  </div>
                </div>

                <div>
                  <label style={labelS}>Número de Tarjeta</label>
                  <input value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))}
                    style={{ ...inputS, letterSpacing: '0.1em', fontFamily: 'monospace', fontSize: '1rem' }}
                    placeholder="0000 0000 0000 0000" maxLength={19} required />
                </div>
                <div>
                  <label style={labelS}>Titular de la Tarjeta</label>
                  <input value={holder} onChange={e => setHolder(e.target.value.toUpperCase())}
                    style={inputS} placeholder="COMO APARECE EN LA TARJETA" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelS}>Fecha de Caducidad</label>
                    <input value={expiry} onChange={e => setExpiry(fmtExpiry(e.target.value))}
                      style={inputS} placeholder="MM/AA" maxLength={5} required />
                  </div>
                  <div>
                    <label style={labelS}>CVV / CVC</label>
                    <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      style={inputS} placeholder="•••" type="password" maxLength={4} required />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
                  <input type="checkbox" checked={saveCard} onChange={e => setSaveCard(e.target.checked)} />
                  Guardar tarjeta para futuros pagos
                </label>
              </div>
            )}

            {/* PAYPAL */}
            {method === 'paypal' && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '3rem', fontWeight: '900', color: '#003087', marginBottom: '1rem' }}>Pay<span style={{ color: '#009cde' }}>Pal</span></div>
                <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Se abrirá la ventana de PayPal para que inicies sesión y confirmes el pago de <strong>{amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</strong> de forma segura.
                </p>
                <div style={{ background: '#f0f7ff', borderRadius: '0.75rem', padding: '1rem', fontSize: '0.8rem', color: '#1e40af' }}>
                  💡 Puedes pagar con tu saldo PayPal, tarjeta bancaria o financiación.
                </div>
              </div>
            )}

            {/* BIZUM */}
            {method === 'bizum' && (
              <div style={{ padding: '0.5rem 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '900', background: 'linear-gradient(135deg,#00d2ff,#0984e3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>BIZUM</div>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Introduce tu número de móvil asociado a Bizum.</p>
                </div>
                <div>
                  <label style={labelS}>Número de Teléfono</label>
                  <input name="bizumPhone" style={{ ...inputS, fontSize: '1.2rem', letterSpacing: '0.1em' }}
                    placeholder="+34 600 000 000" type="tel" required />
                </div>
                <div style={{ background: '#f0fdf4', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginTop: '1rem', fontSize: '0.8rem', color: '#166534' }}>
                  ✓ Recibirás una notificación en tu app bancaria para confirmar.
                </div>
              </div>
            )}

            {/* TRANSFER */}
            {method === 'transfer' && (
              <div style={{ padding: '0.5rem 0' }}>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Realiza la transferencia con los siguientes datos. Tu factura se marcará como pagada al recibir el importe.</p>
                {[
                  ['Beneficiario', 'Hospital Veterinario S.L.'],
                  ['IBAN',         'ES12 1234 5678 9012 3456 7890'],
                  ['BIC/SWIFT',    'CAIXESBBXXX'],
                  ['Concepto',     `Factura ${invoiceId.substring(0, 12).toUpperCase()}`],
                  ['Importe',      `${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                    <span style={{ color: '#94a3b8', fontWeight: '600' }}>{label}</span>
                    <span style={{ fontWeight: '700', fontFamily: label === 'IBAN' || label === 'BIC/SWIFT' ? 'monospace' : 'inherit' }}>{val}</span>
                  </div>
                ))}
                <div style={{ background: '#fffbeb', borderRadius: '0.5rem', padding: '0.75rem', marginTop: '1rem', fontSize: '0.78rem', color: '#92400e' }}>
                  ⚠ El plazo de acreditación es de 1-2 días hábiles.
                </div>
              </div>
            )}

            {state?.error && (
              <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>⚠ {state.error}</p>
            )}

            <button type="submit" style={{
              width: '100%', marginTop: '1.5rem', padding: '1rem', background: '#0f766e', color: 'white',
              border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}>
              <Lock size={16} />
              {method === 'transfer' ? 'Confirmar Notificación' : `Pagar ${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              <Lock size={11} /> Cifrado SSL 256-bit · PCI DSS Compliant
            </p>
          </form>
        )}

        {/* ── STEP: processing ── */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 1.5rem',
              border: '4px solid #e2e8f0', borderTopColor: '#0f766e',
              animation: 'spin 0.8s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Procesando el pago…</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Por favor, no cierres esta ventana.</p>
          </div>
        )}

        {/* ── STEP: success ── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: '#dcfce7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
            }}>
              <CheckCircle2 size={44} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0f172a' }}>¡Pago completado!</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Tu factura ha sido marcada como pagada.</p>
            <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: '#94a3b8' }}>Importe:</span>
                <strong>{amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: '#94a3b8' }}>Método:</span>
                <strong>{method === 'card' ? 'Tarjeta' : method === 'paypal' ? 'PayPal' : method === 'bizum' ? 'Bizum' : 'Transferencia'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#94a3b8' }}>Referencia:</span>
                <strong style={{ fontFamily: 'monospace', color: '#0f766e' }}>{payRef}</strong>
              </div>
            </div>
            <button onClick={handleClose} style={{
              width: '100%', padding: '0.875rem', background: '#0f766e', color: 'white',
              border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: '700', fontSize: '0.95rem'
            }}>
              Cerrar
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
