import type { AppData, CalcResult } from '../types';
import { MONTHS, fmt } from '../store';

interface Props {
  data: AppData;
  year: number;
  c: CalcResult;
  onUpdate: (d: AppData) => void;
}

export default function Inserimento({ data, year, c, onUpdate }: Props) {
  const yd = data.years[year] ?? [];

  const handleBlur = (idx: number, field: 'consulenza' | 'videocorsi' | 'spese', raw: string) => {
    const val = parseFloat(raw.replace(',', '.')) || 0;
    const next: AppData = {
      ...data,
      years: {
        ...data.years,
        [year]: data.years[year].map((m, i) => i === idx ? { ...m, [field]: val } : m),
      },
    };
    onUpdate(next);
  };

  const totNettoSemplice = c.totFat - c.totSpe;
  const nc2 = totNettoSemplice >= 0 ? '#10b981' : '#ef4444';

  return (
    <div className="table-wrap">
      <h2>Inserimento dati — {year}</h2>
      <p className="desc">Inserisci il fatturato mensile per ogni attività e le spese sostenute</p>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Mese</th>
              <th style={{ textAlign: 'right', color: '#156686', minWidth: 120 }}>Consulenza (78%)</th>
              <th style={{ textAlign: 'right', color: '#f59e0b', minWidth: 120 }}>
                Videocorsi ({c.yp.c2Label})
              </th>
              <th style={{ textAlign: 'right', color: '#ef4444', minWidth: 120 }}>Spese</th>
              <th style={{ textAlign: 'right' }}>Totale</th>
              <th style={{ textAlign: 'right', color: '#10b981' }}>Saldo (Fat. - Spese)</th>
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((mese, i) => {
              const m = c.months[i];
              const nettoSemplice = m.fatturato - m.spese;
              const nc = nettoSemplice >= 0 ? '#10b981' : '#ef4444';
              return (
                <tr key={mese}>
                  <td style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{mese}</td>
                  <td style={{ padding: '4px 8px' }}>
                    <InputCell
                      defaultValue={yd[i]?.consulenza || 0}
                      onCommit={v => handleBlur(i, 'consulenza', v)}
                    />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <InputCell
                      defaultValue={yd[i]?.videocorsi || 0}
                      onCommit={v => handleBlur(i, 'videocorsi', v)}
                    />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <InputCell
                      defaultValue={yd[i]?.spese || 0}
                      onCommit={v => handleBlur(i, 'spese', v)}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>{fmt(m.fatturato)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: nc }}>{fmt(nettoSemplice)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ fontWeight: 800, fontSize: 14 }}>Totale</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: '#156686' }}>{fmt(c.totCon)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>{fmt(c.totVid)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{fmt(c.totSpe)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(c.totFat)}</td>
              <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: nc2 }}>{fmt(totNettoSemplice)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

interface InputCellProps {
  defaultValue: number;
  onCommit: (v: string) => void;
}
function InputCell({ defaultValue, onCommit }: InputCellProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur();
  };
  return (
    <input
      className="input-cell"
      defaultValue={defaultValue || ''}
      placeholder="0"
      onBlur={e => onCommit(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}
