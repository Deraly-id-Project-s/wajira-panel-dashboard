import { AccountingReportTab } from '@/types/accounting-report.types';

export interface AccountingTabDefinition {
  value: AccountingReportTab;
  label: string;
}

export const ACCOUNTING_REPORT_TABS: AccountingTabDefinition[] = [
  { value: 'profit-loss', label: 'Laporan Rugi Laba' },
  { value: 'balance-sheet', label: 'Neraca' },
  { value: 'vat-input-monthly', label: 'Laporan PPN Masukan Perbulan' },
  { value: 'vat-output-monthly', label: 'Laporan PPN Keluaran Perbulan' },
  { value: 'vat-yearly', label: 'Laporan PPN Pertahun' },
];

export const ACCOUNTING_REPORT_TAB_QUERY_MAP: Record<string, AccountingReportTab> = {
  'rugi-laba': 'profit-loss',
  neraca: 'balance-sheet',
  'ppn-masukan-perbulan': 'vat-input-monthly',
  'ppn-keluaran-perbulan': 'vat-output-monthly',
  'ppn-pertahun': 'vat-yearly',
};
