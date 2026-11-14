import { currenciesFormat } from '@/components/ui/currenciesFormat';

export type ReportArchiveColumnFormat = 'text' | 'number' | 'currency' | 'date';

export interface ReportArchiveColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: ReportArchiveColumnFormat;
  width?: number;
}

export interface ReportArchiveTotal {
  key: string;
  value: number;
  label?: string;
  format?: 'currency' | 'number';
}

const SKIPPED_KEYS = new Set([
  'id',
  'uuid',
  'company_id',
  'created_at',
  'updated_at',
  'deleted_at',
  'created_by',
  'updated_by',
]);

const DATE_KEY_PATTERN = /(tanggal|tgl|date|waktu|time|periode|period)/i;
const CURRENCY_KEY_PATTERN =
  /(debit|kredit|credit|amount|total|nominal|tarif|invoice|harga|saldo|subtotal|biaya|pajak|tax|price|nilai|balance|bayar|terima|sisa|pendapatan|laba|rugi|aset|kewajiban|modal)/i;
const NON_CURRENCY_TOTAL_PATTERN = /(count|qty|quantity|expedition|jumlah\s+do|total\s+do)/i;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
};

export const getReportArchiveValue = (
  row: Record<string, unknown>,
  key: string,
): unknown => {
  if (key in row) return row[key];
  return key.split('.').reduce<unknown>((current, segment) => {
    if (!isPlainObject(current)) return undefined;
    return current[segment];
  }, row);
};

export const flattenReportArchiveRow = (
  row: Record<string, unknown>,
  prefix = '',
  depth = 0,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  Object.entries(row).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value) && depth < 2) {
      Object.assign(result, flattenReportArchiveRow(value, nextKey, depth + 1));
      return;
    }

    if (Array.isArray(value)) {
      result[nextKey] = value
        .filter((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))
        .join(', ');
      return;
    }

    result[nextKey] = value;
  });

  return result;
};

export const humanizeReportArchiveKey = (key: string): string => {
  const leaf = key.split('.').pop() ?? key;
  return leaf
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

const detectColumnFormat = (
  key: string,
  values: unknown[],
): ReportArchiveColumnFormat => {
  if (DATE_KEY_PATTERN.test(key)) return 'date';

  const sample = values.find((value) => value !== null && value !== undefined && value !== '');
  if (typeof sample === 'string') {
    const parsed = new Date(sample);
    if (!Number.isNaN(parsed.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(sample)) {
      return 'date';
    }
  }

  if (CURRENCY_KEY_PATTERN.test(key)) return 'currency';

  const numericValues = values.filter(
    (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)),
  );
  if (numericValues.length > 0 && numericValues.length === values.filter((v) => v !== null && v !== undefined && v !== '').length) {
    return 'number';
  }

  return 'text';
};

const getColumnWidth = (format: ReportArchiveColumnFormat, key: string): number => {
  if (format === 'date') return 12;
  if (format === 'currency') return 14;
  if (format === 'number') return 9;
  if (/(keterangan|description|nama|name|alamat|address|catatan|note)/i.test(key)) return 24;
  return 16;
};

export const inferReportArchiveColumns = (
  data: Array<Record<string, unknown>>,
  maxColumns = 8,
): ReportArchiveColumn[] => {
  const rows = data.slice(0, 25).map((row) => flattenReportArchiveRow(row));
  const keys: string[] = [];

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (keys.length >= maxColumns) return;
      if (keys.includes(key)) return;
      if (SKIPPED_KEYS.has(key)) return;
      if (key.endsWith('_id') || key.endsWith('.id')) return;

      const value = row[key];
      if (value === null || value === undefined) return;
      if (typeof value === 'object') return;

      keys.push(key);
    });
  });

  return keys.map((key) => {
    const values = rows.map((row) => row[key]);
    const format = detectColumnFormat(key, values);

    return {
      key,
      label: humanizeReportArchiveKey(key),
      format,
      align: format === 'currency' || format === 'number' ? 'right' : format === 'date' ? 'center' : 'left',
      width: getColumnWidth(format, key),
    };
  });
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const formatReportArchiveValue = (
  value: unknown,
  format: ReportArchiveColumnFormat = 'text',
): string => {
  if (value === null || value === undefined || value === '') return '-';

  if (format === 'date') {
    const date = value instanceof Date ? value : new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    return String(value);
  }

  if (format === 'currency') {
    return currenciesFormat('idr', toNumber(value));
  }

  if (format === 'number') {
    return new Intl.NumberFormat('id-ID').format(toNumber(value));
  }

  return String(value);
};

export interface ReportArchiveTableColumn {
  header?: unknown;
  label?: unknown;
  accessorKey?: string;
  id?: string;
  alignment?: 'left' | 'center' | 'right';
}

const detectColumnFormatFromLabel = (key: string, label?: string): ReportArchiveColumnFormat => {
  const descriptor = `${key} ${label ?? ''}`;

  if (DATE_KEY_PATTERN.test(descriptor)) return 'date';
  if (CURRENCY_KEY_PATTERN.test(descriptor) && !NON_CURRENCY_TOTAL_PATTERN.test(descriptor)) {
    return 'currency';
  }

  return 'text';
};

export const reportArchiveColumnsFromTable = (
  columns: ReportArchiveTableColumn[],
  maxColumns = 8,
): ReportArchiveColumn[] => {
  const result: ReportArchiveColumn[] = [];

  for (const column of columns) {
    if (result.length >= maxColumns) break;

    const key = column.accessorKey;
    if (!key || key === 'no') continue;

    const label = typeof column.header === 'string'
      ? column.header
      : typeof column.label === 'string'
        ? column.label
        : humanizeReportArchiveKey(key);
    const format = detectColumnFormatFromLabel(key, label);

    result.push({
      key,
      label,
      format,
      align: column.alignment ?? (format === 'currency' ? 'right' : format === 'date' ? 'center' : 'left'),
      width: getColumnWidth(format, key),
    });
  }

  return result;
};

export const buildReportArchiveTotals = (
  data: Array<Record<string, unknown>>,
  keys: string[],
): ReportArchiveTotal[] => {
  const rows = data.map((row) => flattenReportArchiveRow(row));

  return keys.map((key) => ({
    key,
    value: rows.reduce((sum, row) => sum + toNumber(row[key]), 0),
    format: 'currency',
  }));
};
