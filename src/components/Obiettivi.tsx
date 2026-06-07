import { useState, useRef } from 'react';
import type { AppData, CalcResult, Product } from '../types';
import { fmt, calcTaxOnRevenue } from '../store';

interface Props {
  data: AppData;
  year: number;
  c: CalcResult;
  onUpdate: (d: AppData) => void;
}

export default function Obiettivi({ data, year, c, onUpdate }: Props) {
  const targetRef = useRef<HTMLInputElement>(null);
  const [mixQty, setMixQty] = useState<Record<number, number>>(data.mix || {});

  const products: Product[] = data.products ?? [{ name: '', price: 0, type: 'consulenza' }];
  const target = data.target || 0;
  const yp = c.yp;

  const setProducts = (prods: Product[]) => {
    const next: AppData = { ...data, products: prods };
    onUpdate(next);
  };

  const addProduct = () => {
    setProducts([...products, { name: '', price: 0, type: 'consulenza' }]);
  };

  const removeProduct = (idx: number) => {
    const next = products.filter((_, i) => i !== idx);
    onUpdate({ ...data, products: next.length ? next : [{ name: '', price: 0, type: 'consulenza' }] });
  };

  const updateProduct = (idx: number, field: keyof Product, val: string | number) => {
    const updated = products.map((p, i) => {
      if (i !== idx) return p;
      if (field === 'price') return { ...p, price: parseFloat(String(val).replace(',', '.')) || 0 };
      return { ...p, [field]: val };
    });
    onUpdate({ ...data, products: updated });
  };

  const handleTargetBlur = () => {
    const val = parseFloat(targetRef.current?.value.replace(',', '.') ?? '') || 0;
    onUpdate({ ...data, target: val });
  };

  const handleMixChange = (idx: number, val: string) => {
    const qty = parseInt(val) || 0;
    const next = { ...mixQty, [idx]: qty };
    setMixQty(next);
    onUpdate({ ...data, mix: next });
  };

  const validProds = products.filter(p => p.price > 0 && p.name);

  // Mix totals
  let mixTotal = 0;
  const mixProducts: Array<{ type: string; rev: number }> = [];
  validProds.forEach((p, i) => {
    const qty = mixQty[i] || 0;
    const subtot = qty * p.price;
    mixTotal += subtot;
    mixProducts.push({ type: p.type, rev: subtot });
  });

  const revForTax = mixTotal > 0 ? mixTotal : target;
  const prodsForTax = mixTotal > 0
    ? mixProducts
    : validProds.map(p => ({ type: p.type, rev: revForTax / validProds.length }));
  const tx = revForTax > 0 ? calcTaxOnRevenue(revForTax, year, prodsForTax) : null;

  return (
    <div>
      {/* Products */}
      <div className="obj-section">
        <h2>I tuoi prodotti e servizi</h2>
        <p className="desc">Aggiungi i prodotti/servizi che vendi, con il prezzo e il tipo di attività (per calcolare le tasse corrette)</p>
        <div>
          {products.map((p, i) => (
            <div key={i} className="prod-row">
              <input
                className="prod-name"
                placeholder="Nome prodotto/servizio"
                defaultValue={p.name}
                onBlur={e => updateProduct(i, 'name', e.target.value)}
              />
              <input
                className="prod-price"
                placeholder="Prezzo"
                defaultValue={p.price || ''}
                inputMode="decimal"
                onBlur={e => updateProduct(i, 'price', e.target.value)}
              />
              <select
                className="prod-type"
                value={p.type}
                onChange={e => updateProduct(i, 'type', e.target.value)}
              >
                <option value="consulenza">Consulenza (78%)</option>
                <option value="videocorsi">Videocorsi ({yp.c2Label})</option>
              </select>
              {products.length > 1 && (
                <button className="btn-remove" onClick={() => removeProduct(i)}>✕</button>
              )}
            </div>
          ))}
        </div>
        <button className="btn-add" onClick={addProduct}>+ Aggiungi prodotto</button>
      </div>

      {/* Target */}
      <div className="obj-section">
        <h2>Obiettivo di fatturato annuale</h2>
        <p className="desc">Quanto vuoi fatturare quest'anno? Inserisci il tuo obiettivo e scopri quanti clienti ti servono</p>
        <input
          ref={targetRef}
          type="text"
          className="target-input"
          defaultValue={target || ''}
          placeholder="es. 50000"
          inputMode="decimal"
          onBlur={handleTargetBlur}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        />
        {target > 0 && (
          <div style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>
            {target - c.totFat > 0
              ? <>Hai fatturato <strong style={{ color: '#6366f1' }}>{fmt(c.totFat)}</strong> finora nel {year} — ti mancano <strong style={{ color: '#f59e0b' }}>{fmt(target - c.totFat)}</strong> per raggiungere l'obiettivo ({c.totFat > 0 ? ((c.totFat / target) * 100).toFixed(0) : 0}%)</>
              : <>Hai già superato l'obiettivo! Fatturato: <strong style={{ color: '#10b981' }}>{fmt(c.totFat)}</strong> su {fmt(target)} (+{fmt(Math.abs(target - c.totFat))})</>
            }
          </div>
        )}
      </div>

      {/* Simulator */}
      <div className="obj-section">
        <h2>Simulatore: quanti clienti ti servono?</h2>
        <p className="desc">Per ogni prodotto, vedi quanti ne dovresti vendere per raggiungere l'obiettivo. Oppure crea il tuo mix personalizzato.</p>

        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginBottom: 16 }}>Se vendessi un solo prodotto</h3>
        <div className="sim-grid">
          {target === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Inserisci un obiettivo di fatturato per vedere la simulazione</p>
          ) : validProds.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Aggiungi almeno un prodotto con nome e prezzo</p>
          ) : (
            validProds.map((p, i) => {
              const needed = Math.ceil(target / p.price);
              return (
                <div key={i} className="sim-card">
                  <h4>{p.name}</h4>
                  <div className="sim-sub">
                    {fmt(p.price)} / unità &middot; {p.type === 'consulenza' ? 'Consulenza 78%' : `Videocorsi ${yp.c2Label}`}
                  </div>
                  <div className="sim-big">{needed} vendite</div>
                  <div className="sim-detail">per raggiungere {fmt(target)} di fatturato</div>
                  <div className="sim-detail" style={{ marginTop: 4, color: '#94a3b8' }}>
                    {needed} &times; {fmt(p.price)} = {fmt(needed * p.price)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mix simulator */}
        <div className="sim-mix">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginBottom: 12 }}>Crea il tuo mix</h3>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
            Inserisci quanti ne vuoi vendere per ogni prodotto e vedi se arrivi all'obiettivo
          </p>
          {validProds.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Aggiungi almeno un prodotto con nome e prezzo</p>
          ) : (
            <>
              {validProds.map((p, i) => {
                const qty = mixQty[i] || 0;
                const subtot = qty * p.price;
                return (
                  <div key={i} className="sim-mix-row">
                    <span className="mix-label">
                      {p.name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({fmt(p.price)})</span>
                    </span>
                    <input
                      className="mix-input"
                      type="number"
                      min={0}
                      value={qty || ''}
                      placeholder="0"
                      onChange={e => handleMixChange(i, e.target.value)}
                    />
                    <span className="mix-result">{fmt(subtot)}</span>
                  </div>
                );
              })}

              {/* Mix total */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Totale mix: {fmt(mixTotal)}</span>
                  {target > 0 && (
                    <span style={{ fontSize: 14, fontWeight: 600, color: mixTotal >= target ? '#10b981' : '#f59e0b' }}>
                      {mixTotal - target >= 0 ? '+' : ''}{fmt(mixTotal - target)} vs obiettivo
                    </span>
                  )}
                </div>
                {target > 0 && (
                  <>
                    <div style={{ background: '#e2e8f0', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                      <div style={{
                        background: mixTotal >= target ? '#10b981' : '#6366f1',
                        height: '100%',
                        width: `${Math.min(100, (mixTotal / target) * 100).toFixed(0)}%`,
                        borderRadius: 8,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      {((mixTotal / target) * 100).toFixed(0)}% dell'obiettivo
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tax estimation */}
      {tx && (
        <div className="tax-result-box">
          <h3>Tasse stimate sull'obiettivo</h3>
          <div className="tax-result-grid">
            {[
              ['Fatturato ' + (mixTotal > 0 ? 'sul tuo mix' : `sull'obiettivo di ${fmt(target)}`), fmt(revForTax)],
              ['Imponibile', fmt(tx.impTot)],
              ['INPS (26,07%)', fmt(tx.inps)],
              [`Imposta sost. (${tx.yp.taxLabel})`, fmt(tx.impSost)],
              ['Totale tasse stimate', fmt(tx.tasse)],
              ['Tax rate effettivo', `${tx.aliquotaEff}%`],
              ['Ti resta dopo le tasse', fmt(revForTax - tx.tasse)],
            ].map(([label, value]) => (
              <div key={label} className="tax-result-item">
                <div className="tr-label">{label}</div>
                <div className="tr-value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
