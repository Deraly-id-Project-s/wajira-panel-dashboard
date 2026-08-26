import type { Kas } from '@/types/kas.types';

export const formatBillCode = (id: number | string) => `INV-${String(id).padStart(5, '0')}`;

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatShortDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatInputDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toDateValue = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const toPayloadDate = (value?: Date) => {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCashLabel = (cash?: Pick<Kas, 'code' | 'description'> | null) => {
  if (!cash) return 'Cash';
  const normalized = `${cash.code} ${cash.description}`.toUpperCase();
  if (normalized.includes('USD')) return 'BCA USD';
  if (normalized.includes('BCA')) return 'BCA IDR';
  return 'CASH IDR';
};

export const calculateOutstanding = (bruttoAmount: number, paidAmount: number) => Math.max(Number(bruttoAmount || 0) - Number(paidAmount || 0), 0);
