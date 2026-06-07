import type { AppData, MonthData, YearParams, CalcResult, MonthCalc, TaxCalcResult } from './types';

export const MONTHS = [
  'Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'
];
export const SHORT = MONTHS.map(m => m.substring(0, 3));

const CY = new Date().getFullYear();
export const YEARS: number[] = Array.from({ length: 5 }, (_, i) => CY - 2 + i);

export const INPS_RATE = 0.2607;
export const C1 = 0.78;

export const KEY = 'freelance-tracker-data';

export function getYearParams(y: number): YearParams {
  if (y <= 2025) return { tax: 0.05, c2: 0.40, taxLabel: '5%', c2Label: '40%' };
  return { tax: 0.15, c2: 0.67, taxLabel: '15%', c2Label: '67%' };
}

export const fmt = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0);

export function emptyYear(): MonthData[] {
  return MONTHS.map(() => ({ consulenza: 0, videocorsi: 0, spese: 0 }));
}

export function loadData(): AppData {
  try {
    const r = localStorage.getItem(KEY);
    if (r) {
      const parsed = JSON.parse(r) as AppData;
      if (parsed.years) return ensureDefaults(parsed);
    }
  } catch (e) {
    // ignore
  }
  const initial: AppData = { years: {}, products: [{ name: '', price: 0, type: 'consulenza' }], target: 0, mix: {} };
  YEARS.forEach(y => { initial.years[y] = emptyYear(); });
  return initial;
}

function ensureDefaults(d: AppData): AppData {
  if (!d.products) d.products = [{ name: '', price: 0, type: 'consulenza' }];
  if (!d.target) d.target = 0;
  if (!d.mix) d.mix = {};
  YEARS.forEach(y => { if (!d.years[y]) d.years[y] = emptyYear(); });
  return d;
}

export function saveData(d: AppData): void {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* ignore */ }
}

export function calc(data: AppData, year: number): CalcResult {
  const yp = getYearParams(year);
  const yd: MonthData[] = data.years[year] || emptyYear();
  const months: MonthCalc[] = yd.map((m, i) => {
    const fat = m.consulenza + m.videocorsi;
    const imp1 = m.consulenza * C1;
    const imp2 = m.videocorsi * yp.c2;
    const impTot = imp1 + imp2;
    const inps = impTot * INPS_RATE;
    const base = Math.max(0, impTot - inps);
    const impSost = base * yp.tax;
    const tasse = inps + impSost;
    const netto = fat - m.spese;
    return {
      mese: SHORT[i],
      meseFull: MONTHS[i],
      consulenza: m.consulenza,
      videocorsi: m.videocorsi,
      fatturato: fat,
      spese: m.spese,
      imp1, imp2, impTot, inps, impSost, tasse, netto
    };
  });

  const active = months.filter(m => m.fatturato > 0 || m.spese > 0).length || 1;
  const s = (k: keyof MonthCalc) => months.reduce((a, m) => a + (m[k] as number), 0);

  const totFat = s('fatturato'), totCon = s('consulenza'), totVid = s('videocorsi'),
    totSpe = s('spese'), totImp = s('impTot'), totInps = s('inps'),
    totImpSost = s('impSost'), totTasse = s('tasse'), totNetto = s('netto');

  const prevYd: MonthData[] = data.years[year - 1] || emptyYear();
  const prevFat = prevYd.reduce((a, m) => a + m.consulenza + m.videocorsi, 0);

  return {
    months, totFat, totCon, totVid, totSpe, totImp, totInps, totImpSost, totTasse, totNetto,
    avgFat: totFat / active, avgSpe: totSpe / active, avgNet: totNetto / active, active, yp,
    prevFat
  };
}

export function calcTaxOnRevenue(
  revenue: number,
  year: number,
  products?: Array<{ type: string; rev: number }>
): TaxCalcResult {
  const yp = getYearParams(year);
  let totCons = 0, totVid = 0;
  if (products && products.length > 0) {
    products.forEach(p => {
      if (p.type === 'consulenza') totCons += p.rev || 0;
      else totVid += p.rev || 0;
    });
  } else {
    totCons = revenue * 0.5;
    totVid = revenue * 0.5;
  }
  const impCons = totCons * C1;
  const impVid = totVid * yp.c2;
  const impTot = impCons + impVid;
  const inps = impTot * INPS_RATE;
  const base = Math.max(0, impTot - inps);
  const impSost = base * yp.tax;
  const tasse = inps + impSost;
  return {
    impTot, inps, impSost, tasse,
    aliquotaEff: revenue > 0 ? ((tasse / revenue) * 100).toFixed(1) : 0,
    yp
  };
}
