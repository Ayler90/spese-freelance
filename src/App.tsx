import { useState, useCallback } from 'react';
import { YEARS, loadData, saveData, calc } from './store';
import type { AppData, TabId } from './types';
import Dashboard from './components/Dashboard';
import Inserimento from './components/Inserimento';
import Dettaglio from './components/Dettaglio';
import Obiettivi from './components/Obiettivi';

const CY = new Date().getFullYear();

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [year, setYear] = useState<number>(CY);
  const [tab, setTab] = useState<TabId>('dashboard');
  const [showExport, setShowExport] = useState(false);

  const updateData = useCallback((next: AppData) => {
    setData(next);
    saveData(next);
  }, []);

  const c = calc(data, year);

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `freelance-tracker-${year}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const imp = JSON.parse(ev.target?.result as string) as AppData;
        if (imp.years) {
          updateData(imp);
          setShowExport(false);
        }
      } catch { /* ignore */ }
    };
    r.readAsText(file);
    e.target.value = '';
  };

  const TABS: { id: TabId; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inserimento', label: 'Inserimento' },
    { id: 'dettaglio', label: 'Dettaglio Tasse' },
    { id: 'obiettivi', label: 'Obiettivi' },
  ];

  return (
    <>
      <div className="header">
        <div className="header-inner">
          <div className="header-top">
            <div>
              <h1>Freelance Tracker</h1>
              <p className="subtitle">Regime Forfettario &middot; Gestione Separata INPS</p>
            </div>
            <div className="controls">
              <select
                className="year-select"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button className="btn-header" onClick={() => setShowExport(v => !v)}>Dati</button>
            </div>
          </div>

          {showExport && (
            <div className="export-bar">
              <button className="btn-export" onClick={handleExportJSON}>Esporta JSON</button>
              <label className="btn-import">
                Importa JSON
                <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
              </label>
            </div>
          )}

          <div className="tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="content">
        {tab === 'dashboard' && <Dashboard c={c} />}
        {tab === 'inserimento' && <Inserimento data={data} year={year} c={c} onUpdate={updateData} />}
        {tab === 'dettaglio' && <Dettaglio c={c} year={year} />}
        {tab === 'obiettivi' && <Obiettivi data={data} year={year} c={c} onUpdate={updateData} />}
      </div>
    </>
  );
}
