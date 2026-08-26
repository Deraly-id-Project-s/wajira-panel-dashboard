import type { GoodsReceiptEquipment, GoodsReceiptEquipmentBilling, GoodsReceiptEquipmentDetail } from '@/types/goods-receipt-equipment.types';
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
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatCurrency = (value?: number | null) => `Rp ${(value ?? 0).toLocaleString('id-ID')}`;

export const getReceiptStatusLabel = (item: GoodsReceiptEquipment) => {
  if (item.isPaid) return 'Lunas';
  return 'Belum Lunas';
};

export const getPaymentMethodLabel = (cash: Kas) => {
  const code = cash.code.toUpperCase();
  const description = cash.description.toUpperCase();
  if (code.includes('USD') || description.includes('USD')) return 'BCA USD';
  if (code.includes('BCA') || description.includes('BCA')) return 'BCA IDR';
  return 'CASH IDR';
};

export const getReceiptBilling = (receipt?: GoodsReceiptEquipmentDetail | null): GoodsReceiptEquipmentBilling | null => {
  if (!receipt?.goodsTransactionBillings?.length) return null;
  return receipt.goodsTransactionBillings[0] ?? null;
};

export const resolveInvoiceUrl = (file?: string | null) => {
  if (!file) return null;
  if (file.startsWith('http://') || file.startsWith('https://')) return file;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
  if (!apiBase) return file;
  return `${apiBase.replace(/\/$/, '')}/${file.replace(/^\//, '')}`;
};

export const isPdfFile = (file?: string | null) => {
  if (!file) return false;
  return file.toLowerCase().includes('.pdf');
};

export const isImageFile = (file?: string | null) => {
  if (!file) return false;
  const normalized = file.toLowerCase();
  return normalized.includes('.jpg') || normalized.includes('.jpeg') || normalized.includes('.png');
};

export const isDocumentFile = (file?: string | null) => {
  if (!file) return false;
  const normalized = file.toLowerCase();
  return normalized.includes('.doc') || normalized.includes('.docx');
};
