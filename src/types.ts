export interface MonthData {
  consulenza: number;
  videocorsi: number;
  spese: number;
}

export interface Product {
  name: string;
  price: number;
  type: 'consulenza' | 'videocorsi';
}

export interface AppData {
  years: Record<number, MonthData[]>;
  products: Product[];
  target: number;
  mix: Record<number, number>;
}

export interface YearParams {
  tax: number;
  c2: number;
  taxLabel: string;
  c2Label: string;
}

export interface MonthCalc {
  mese: string;
  meseFull: string;
  consulenza: number;
  videocorsi: number;
  fatturato: number;
  spese: number;
  imp1: number;
  imp2: number;
  impTot: number;
  inps: number;
  impSost: number;
  tasse: number;
  netto: number;
}

export interface CalcResult {
  months: MonthCalc[];
  totFat: number;
  totCon: number;
  totVid: number;
  totSpe: number;
  totImp: number;
  totInps: number;
  totImpSost: number;
  totTasse: number;
  totNetto: number;
  avgFat: number;
  avgSpe: number;
  avgNet: number;
  active: number;
  yp: YearParams;
}

export interface TaxCalcResult {
  impTot: number;
  inps: number;
  impSost: number;
  tasse: number;
  aliquotaEff: number | string;
  yp: YearParams;
}

export type TabId = 'dashboard' | 'inserimento' | 'dettaglio' | 'obiettivi';
