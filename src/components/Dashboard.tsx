import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend, Filler,
  type ChartOptions
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import type { CalcResult } from '../types';
import { SHORT, fmt } from '../store';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

interface Props { c: CalcResult; }

const tickCallback = (v: string | number) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return n >= 1000 ? (n / 1000) + 'k' : v;
};

const tooltipLabel = (i: { dataset: { label?: string }; raw: unknown }) =>
  (i.dataset.label || '') + ': ' + fmt(i.raw as number);

export default function Dashboard({ c }: Props) {
  const pos = c.totNetto >= 0;

  const barData = {
    labels: SHORT,
    datasets: [
      { label: 'Consulenza', data: c.months.map(m => m.consulenza), backgroundColor: '#6366f1', borderRadius: 4 },
      { label: 'Videocorsi', data: c.months.map(m => m.videocorsi), backgroundColor: '#f59e0b', borderRadius: 4 },
      { label: 'Spese', data: c.months.map(m => m.spese), backgroundColor: '#ef4444', borderRadius: 4 },
    ]
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: true }, tooltip: { callbacks: { label: tooltipLabel } } },
    scales: { y: { ticks: { callback: tickCallback } } }
  };

  const lineData = {
    labels: SHORT,
    datasets: [
      {
        label: 'Netto', data: c.months.map(m => m.netto),
        borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 3, pointRadius: 4, pointBackgroundColor: '#10b981', fill: true, tension: 0.3
      },
      {
        label: 'Fatturato lordo', data: c.months.map(m => m.fatturato),
        borderColor: '#6366f1', borderWidth: 2, borderDash: [5, 5],
        pointRadius: 0, fill: false, tension: 0.3
      }
    ]
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { tooltip: { callbacks: { label: tooltipLabel } } },
    scales: { y: { ticks: { callback: tickCallback } } }
  };

  const hasIncome = c.totCon > 0 || c.totVid > 0;
  const pieIncData = {
    labels: ['Consulenza', 'Videocorsi'],
    datasets: [{ data: [c.totCon, c.totVid], backgroundColor: ['#6366f1', '#f59e0b'], borderWidth: 0, spacing: 4 }]
  };
  const pieIncOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '60%',
    plugins: { tooltip: { callbacks: { label: (i) => i.label + ': ' + fmt(i.raw as number) } } }
  };

  const hasTax = c.totInps > 0 || c.totImpSost > 0;
  const pieTaxData = {
    labels: ['INPS (26,07%)', `Imp. Sost. (${c.yp.taxLabel})`],
    datasets: [{ data: [c.totInps, c.totImpSost], backgroundColor: ['#f59e0b', '#ef4444'], borderWidth: 0, spacing: 4 }]
  };
  const pieTaxOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '60%',
    plugins: { tooltip: { callbacks: { label: (i) => i.label + ': ' + fmt(i.raw as number) } } }
  };

  return (
    <div>
      {/* KPI cards */}
      <div className="cards">
        <StatCard label="Fatturato annuo" value={fmt(c.totFat)} sub={`Media ${fmt(c.avgFat)}/mese`} color="#6366f1" icon="💰" />
        <StatCard label="Spese annue" value={fmt(c.totSpe)} sub={`Media ${fmt(c.avgSpe)}/mese`} color="#ef4444" icon="🧾" />
        <StatCard label="Tasse totali" value={fmt(c.totTasse)} sub={`INPS ${fmt(c.totInps)} + Imp. ${fmt(c.totImpSost)}`} color="#f59e0b" icon="🏛️" />
        <StatCard
          label="Saldo (Fat. - Spese)" value={fmt(c.totNetto)}
          sub={`Media ${fmt(c.avgNet)}/mese`}
          color={pos ? '#10b981' : '#ef4444'} icon={pos ? '✅' : '⚠️'}
        />
      </div>

      {/* Profit bar */}
      <div className="profit-bar" style={{ background: pos ? '#ecfdf5' : '#fef2f2' }}>
        <span className="emoji">{pos ? '📈' : '📉'}</span>
        <div>
          <div className="title" style={{ color: pos ? '#065f46' : '#991b1b' }}>
            {pos ? 'Sei in guadagno!' : 'Attenzione: sei in perdita'}
          </div>
          <div className="detail" style={{ color: pos ? '#047857' : '#b91c1c' }}>
            {pos
              ? `Dopo le spese ti restano ${fmt(c.totNetto)} su ${c.active} mesi attivi`
              : `Le spese superano il fatturato di ${fmt(Math.abs(c.totNetto))}`}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="charts-row">
        <div className="chart-box chart-main">
          <h3>Andamento mensile</h3>
          <Bar data={barData} options={barOptions} height={280} />
        </div>
        <div className="chart-box chart-side">
          <h3>Ripartizione fatturato</h3>
          {hasIncome
            ? <Doughnut data={pieIncData} options={pieIncOptions} height={220} />
            : <div className="empty-chart">Nessun dato inserito</div>}
        </div>
      </div>

      {/* Line chart */}
      <div className="chart-box" style={{ marginBottom: 24 }}>
        <h3>Utile netto mensile (dopo tasse e spese)</h3>
        <Line data={lineData} options={lineOptions} height={240} />
      </div>

      {/* Info row */}
      <div className="info-row">
        <div className="chart-box chart-side">
          <h3>Composizione tasse</h3>
          {hasTax
            ? <Doughnut data={pieTaxData} options={pieTaxOptions} height={220} />
            : <div className="empty-chart">Nessun dato</div>}
        </div>
        <div className="info-box">
          <h3>Come vengono calcolate le tasse</h3>
          <p>
            <strong style={{ color: '#6366f1' }}>1. Imponibile</strong>{' '}
            = Fatturato Consulenza &times; 78% + Fatturato Videocorsi &times; {c.yp.c2Label}
          </p>
          <p>
            <strong style={{ color: '#f59e0b' }}>2. INPS Gestione Separata</strong>{' '}
            = Imponibile &times; 26,07%
          </p>
          <p>
            <strong style={{ color: '#ef4444' }}>3. Imposta sostitutiva</strong>{' '}
            = (Imponibile &minus; INPS) &times; {c.yp.taxLabel}
          </p>
          <p>
            <strong style={{ color: '#10b981' }}>4. Saldo</strong>{' '}
            = Fatturato &minus; Spese (le tasse sono già incluse nelle spese quando le paghi)
          </p>
          <p className="note">
            Nota: i contributi INPS versati l'anno precedente sono deducibili dall'imponibile.
            Questa app calcola una stima semplificata senza considerare i versamenti pregressi.
          </p>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string; value: string; sub: string; color: string; icon: string;
}
function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  return (
    <div className="stat-card" style={{ '--card-color': color } as React.CSSProperties}>
      <div className="label"><span className="icon">{icon}</span>{label}</div>
      <div className="value">{value}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}
