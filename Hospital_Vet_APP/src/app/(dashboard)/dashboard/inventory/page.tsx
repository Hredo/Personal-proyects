import db from '@/lib/db';
import { Search, AlertTriangle, Package } from 'lucide-react';
import { NewInventoryItemButton, InventoryQuantityEditor } from '@/components/InventoryActions';

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const { q, cat } = await searchParams;

  let items: any[] = db.prepare(`SELECT * FROM inventory_items ORDER BY name ASC`).all();

  if (q) {
    const t = q.toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(t) || i.category.toLowerCase().includes(t));
  }
  if (cat && cat !== 'Todas') {
    items = items.filter(i => i.category === cat);
  }

  const allItems: any[] = db.prepare(`SELECT * FROM inventory_items`).all();
  const categories = Array.from(new Set(allItems.map(i => i.category))).sort(); 
  const lowStockCount  = allItems.filter(i => i.quantity <= i.minStock && i.quantity > 0).length;
  const criticalCount  = allItems.filter(i => i.quantity === 0).length;
  const okCount        = allItems.filter(i => i.quantity > i.minStock).length;

  const getStatus = (qty: number, min: number) => {
    if (qty === 0) return { label: 'AGOTADO', cls: 'status-critical' };
    if (qty <= min) return { label: 'STOCK BAJO', cls: 'status-hospitalized' };
    return { label: 'EN STOCK', cls: 'status-stable' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Control de Inventario</h1>
          <p style={{ color: '#64748b' }}>Stock de fármacos, consumibles y equipamiento médico.</p>
        </div>
        <NewInventoryItemButton />
      </header>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Package size={18} color="var(--primary)" />
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Referencias</p>
          </div>
          <h3 style={{ fontSize: '1.5rem' }}>{allItems.length}</h3>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', background: '#dcfce7' }}>
          <p style={{ color: '#166534', fontSize: '0.85rem', marginBottom: '0.5rem' }}>En Stock OK</p>
          <h3 style={{ fontSize: '1.5rem', color: '#166534' }}>{okCount}</h3>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', background: '#fffbeb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={16} color="#92400e" />
            <p style={{ color: '#92400e', fontSize: '0.85rem' }}>Stock Bajo</p>
          </div>
          <h3 style={{ fontSize: '1.5rem', color: '#92400e' }}>{lowStockCount}</h3>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', background: '#fef2f2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={16} color="#991b1b" />
            <p style={{ color: '#991b1b', fontSize: '0.85rem' }}>Agotado</p>
          </div>
          <h3 style={{ fontSize: '1.5rem', color: '#991b1b' }}>{criticalCount}</h3>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" action="/dashboard/inventory">
        <div className="glass-card" style={{ background: 'white', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input name="q" type="text" defaultValue={q || ''} placeholder="Buscar por nombre o categoría..."
              style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <select name="cat" defaultValue={cat || 'Todas'} style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none', background: 'white', fontFamily: 'inherit' }}>
            <option value="Todas">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="btn btn-primary">Filtrar</button>
          {(q || (cat && cat !== 'Todas')) && (
            <a href="/dashboard/inventory" className="btn" style={{ border: '1px solid var(--border)', background: 'white', textDecoration: 'none' }}>Limpiar</a>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>Mostrando {items.length} de {allItems.length} artículos</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
              {['ARTÍCULO', 'CATEGORÍA', 'UBICACIÓN', 'CADUCIDAD', 'STOCK ACTUAL', 'ESTADO', ''].map(h => (
                <th key={h} style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontWeight: '500', fontSize: '0.8rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const st = getStatus(item.quantity, item.minStock);
              const isExpiringSoon = item.expiryDate && (new Date(item.expiryDate).getTime() - Date.now()) < 90 * 86400000;
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: {item.id}</div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#f1f5f9', borderRadius: '0.25rem' }}>{item.category}</span>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: '#64748b' }}>{item.location || '—'}</td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    {item.expiryDate ? (
                      <span style={{ fontSize: '0.8rem', color: isExpiringSoon ? '#ef4444' : '#64748b', fontWeight: isExpiringSoon ? '600' : '400' }}>
                        {isExpiringSoon ? '⚠ ' : ''}{new Date(item.expiryDate).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}
                      </span>
                    ) : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '700' }}>{item.quantity} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#64748b' }}>{item.unit}</span></div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Mín: {item.minStock}</div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                    <InventoryQuantityEditor itemId={item.id} currentQty={item.quantity} unit={item.unit} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
