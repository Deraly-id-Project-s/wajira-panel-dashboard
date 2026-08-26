import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { AccountingReportTab } from '@/types/accounting-report.types';
import { ACCOUNTING_REPORT_TABS } from './laporan-akuntansi.constants';

const COMPANY_NAME_MATCHERS = [
  {
    matches: ['morindo'],
    value: 'PT. WAJIRA JAGRATARA MORINDO',
  },
  {
    matches: ['adhiyas', 'agradasta'],
    value: 'PT. ADHIYAS AGRADASTA',
  },
  {
    matches: ['international'],
    value: 'PT. WAJIRA INTERNATIONAL',
  },
];

export function getAccountingReportTab(value?: string | null): AccountingReportTab {
  const matchedTab = ACCOUNTING_REPORT_TABS.find((tab) => tab.value === value);
  return matchedTab?.value ?? 'profit-loss';
}

export function getAccountingCompanyName(slug?: string | null) {
  const normalizedSlug = (slug || '').toLowerCase();
  const matchedCompany = COMPANY_NAME_MATCHERS.find((item) =>
    item.matches.some((keyword) => normalizedSlug.includes(keyword)),
  );

  if (matchedCompany) {
    return matchedCompany.value;
  }

  if (!normalizedSlug) {
    return 'PT. WAJIRA JAGRATARA MORINDO';
  }

  const readableSlug = normalizedSlug
    .split('-')
    .filter(Boolean)
    .map((part) => part.toUpperCase())
    .join(' ');

  return readableSlug.startsWith('PT') ? readableSlug : `PT. ${readableSlug}`;
}

export function parseAccountingPeriod(value?: string | string[] | null) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return new Date(2025, 0, 20);
  }

  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date(2025, 0, 20);
  }

  return parsedDate;
}

export function formatAccountingPeriodQuery(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export function formatAccountingMonthYear(date: Date) {
  const label = format(date, 'LLLL yyyy', { locale: id });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

export function formatAccountingYear(date: Date) {
  return format(date, 'yyyy');
}

export function formatAccountingLongDate(date: Date) {
  return format(date, 'd MMMM yyyy', { locale: id }).toUpperCase();
}

export function formatAccountingNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return '-';
  }

  if (value < 0) {
    return `(${Math.abs(value).toLocaleString('id-ID')})`;
  }

  return value.toLocaleString('id-ID');
}
