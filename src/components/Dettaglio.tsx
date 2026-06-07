import type { CalcResult } from '../types';
import { fmt } from '../store';

interface Props {
  c: CalcResult;
  year: number;
}

export default function Dettaglio({ c, year }: Props) {
  const nc = c.totNetto >= 0 ? '#10b981' : '#ef4444';
  const taxRate = c.totFat > 0 ? ((c.totTasse / c.totFat) * 100).toFixed(1) + '%' : '—';

  const summaryItems: [string, string][] = [
    ['Fatturato lordo', fmt(c.totFat)],
    ['Imponibile totale', fmt(c.totImp)],
    ['INPS Gestione Separata', fmt(c.totInps)],
    ['Imposta sostitutiva', fmt(c.totImpSost)],
    ['Totale tasse', fmt(c.totTasse)],
    ['Spese sostenute', fmt(c.totSpe)],
    ['Saldo (Fat. - Spese)', fmt(c.totNetto)],
    ['Tax rate effettivo', taxRate],
  ];

  return (
    <div>
      <div className="table-wrap" style={{ marginBottom: 24 }}>
        <h2>Dettaglio tasse — {year}</h2>
        <p className="desc">Calcolo dettagliato delle imposte mese per mese</p>
        <div className="scroll-x">
          <table className="detail-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Mese</th>
                <th style={{ textAlign: 'right' }}>Fatturato</th>
                <th style={{ textAlign: 'right' }}>Imponibile</th>
                <th style={{ textAlign: 'right' }}>INPS (26,07%)</th>
                <th style={{ textAlign: 'right' }}>Imp. Sost. ({c.yp.taxLabel})</th>
                <th style={{ textAlign: 'right' }}>Tot. Tasse</th>
                <th style={{ textAlign: 'right' }}>Spese</th>
                <th style={{ textAlign: 'right' }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {c.months.map(m => {
                const mnc = m.netto >= 0 ? '#10b981' : '#ef4444';
                return (
                  <tr key={m.meseFull}>
                    <td style={{ fontWeight: 600, color: '#334155' }}>{m.meseFull}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(m.fatturato)}</td>
                    <td style={{ textAlign: 'right', color: '#3b82f6' }}>{fmt(m.impTot)}</td>
                    <td style={{ textAlign: 'right', color: '#f59e0b' }}>{fmt(m.inps)}</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>{fmt(m.impSost)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>{fmt(m.tasse)}</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>{fmt(m.spese)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: mnc }}>{fmt(m.netto)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 800 }}>Totale</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(c.totFat)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#3b82f6' }}>{fmt(c.totImp)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>{fmt(c.totInps)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{fmt(c.totImpSost)}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>{fmt(c.totTasse)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{fmt(c.totSpe)}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: nc }}>{fmt(c.totNetto)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="summary-card">
        <h3>Riepilogo annuale {year}</h3>
        <div className="summary-grid">
          {summaryItems.map(([label, value]) => (
            <div key={label} className="summary-item">
              <div className="slabel">{label}</div>
              <div className="svalue">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
