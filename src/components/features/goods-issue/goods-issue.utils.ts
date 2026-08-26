import type { GoodsIssue, GoodsIssueBilling, GoodsIssueDetail } from '@/types/goods-issue.types';
import type { Kas } from '@/types/kas.types';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'dd MMMM yyyy', { locale: id });
};

export const formatLongDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatCurrency = (value?: number | null) => `Rp ${(value ?? 0).toLocaleString('id-ID')}`;

export const getIssueStatusLabel = (item: GoodsIssue) => (item.isPaid ? 'Lunas' : 'Belum Lunas');

export const getPaymentMethodLabel = (cash: Kas) => {
  const code = cash.code.toUpperCase();
  const description = cash.description.toUpperCase();
  if (code.includes('USD') || description.includes('USD')) return 'BCA USD';
  if (code.includes('BCA') || description.includes('BCA')) return 'BCA IDR';
  return 'CASH IDR';
};

export const getIssueBilling = (issue?: GoodsIssueDetail | null): GoodsIssueBilling | null => {
  if (!issue?.goodsTransactionBillings?.length) return null;
  return issue.goodsTransactionBillings[0] ?? null;
};
