import type {
  CreateInvoiceDetailRow,
  CreateInvoicePrintPayload,
  CreateInvoiceProcessValues,
  DoInvoice,
  DoInvoiceExpedition,
  DoInvoiceTableRow,
  InvoiceProcessDraft,
} from '@/types/create-invoice.types';

const PROCESS_DRAFT_STORAGE_KEY = 'wajira_do_invoice_process_drafts_v2';

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDisplayDate = (value?: string | null) => {
  const date = toDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

export const formatLongDate = (value?: string | null) => {
  const date = toDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

export const formatMoney = (value?: number | null, minimumFractionDigits = 0) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(Number(value ?? 0));

export const formatInvoiceMoney = (
  value?: number | null,
  isUsd = false,
  rateUsd = 16000,
  decimals?: number
) => {
  const amount = Number(value ?? 0);
  if (isUsd) {
    const converted = amount / (rateUsd || 16000);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals ?? 2,
      maximumFractionDigits: decimals ?? 2,
    }).format(converted);
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
  }).format(amount);
};

export const getPrintStatusLabel = (value: boolean) => (value ? 'Sudah diprint' : 'Belum diprint');

export const toDoInvoiceTableRow = (invoice: DoInvoice): DoInvoiceTableRow => ({
  id: invoice.id,
  code: invoice.code,
  orderCode: invoice.orderList?.code || invoice.expeditions[0]?.orderList?.code || '-',
  customerName: invoice.customer?.name || invoice.expeditions[0]?.customer?.name || '-',
  date: invoice.date,
  isPrinted: invoice.isAlreadyPrint,
  statusLabel: getPrintStatusLabel(invoice.isAlreadyPrint),
  raw: invoice,
});

export const matchesInvoiceSearch = (row: DoInvoiceTableRow, search: string) => {
  const keyword = search.trim().toLowerCase();
  if (!keyword) return true;
  return [row.code, row.orderCode, row.customerName, row.statusLabel].join(' ').toLowerCase().includes(keyword);
};

const mapExpeditionToRow = (invoice: DoInvoice, expedition: DoInvoiceExpedition): CreateInvoiceDetailRow => ({
  invoiceId: invoice.id,
  expeditionId: expedition.id,
  orderListId: expedition.orderList?.id ?? invoice.orderList?.id ?? null,
  date: expedition.date || invoice.date,
  noPolisi: expedition.vehicle?.registrationNumber || '-',
  type: expedition.vehicle?.type || '-',
  driver: expedition.driver?.name || '-',
  loadingIn: expedition.tarif?.loadingIn || '-',
  destination: expedition.destination || expedition.tarif?.destination || '-',
  loadingOut: expedition.tarif?.loadingOut || '-',
  noSuratDo: expedition.orderList?.code || invoice.orderList?.code || expedition.noSuratDo || expedition.doLetterCode || '-',
  description: expedition.description || expedition.tarif?.description || invoice.description || '-',
  qty: expedition.qty || expedition.tarif?.qty || 0,
  invoiceExpedition: expedition.invoiceExpedition || expedition.tarif?.invoicePrice || 0,
  ppn: expedition.ppn || expedition.tarif?.ppnPrice || 0,
  totalAmount: expedition.totalAmount || (expedition.invoiceExpedition || expedition.tarif?.invoicePrice || 0) + (expedition.ppn || expedition.tarif?.ppnPrice || 0),
  status: expedition.status || '-',
  isPrinted: Boolean(expedition.isAlreadyPrint),
  kodeOrder: expedition.orderList?.code || invoice.orderList?.code || '-',
});

export const buildDetailRows = (invoices: DoInvoice[], selectedExpeditionIds?: number[]) => {
  const rows = invoices.flatMap((invoice) => {
    if (!invoice.expeditions.length) {
      return [
        {
          invoiceId: invoice.id,
          expeditionId: 0,
          orderListId: invoice.orderList?.id ?? null,
          date: invoice.date,
          noPolisi: '-',
          type: '-',
          driver: '-',
          loadingIn: '-',
          destination: '-',
          loadingOut: '-',
          noSuratDo: '-',
          description: invoice.description || '-',
          qty: 0,
          invoiceExpedition: 0,
          ppn: 0,
          totalAmount: 0,
          status: '-',
          isPrinted: false,
          kodeOrder: invoice.orderList?.code || '-',
        },
      ];
    }

    return invoice.expeditions.map((expedition) => mapExpeditionToRow(invoice, expedition));
  });

  if (!selectedExpeditionIds?.length) return rows;
  return rows.filter((row) => selectedExpeditionIds.includes(row.expeditionId));
};

export const buildProcessDefaults = (invoice: DoInvoice, draft?: InvoiceProcessDraft | null): CreateInvoiceProcessValues => ({
  invoiceCode: draft?.invoiceCode ?? invoice.code,
  date: draft?.date ?? invoice.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  subject: draft?.subject ?? invoice.subject ?? 'Invoice Ekspedisi',
  attachmentLabel: draft?.attachmentLabel ?? '1 lembar',
  letterContent: draft?.letterContent ?? invoice.letterContent ?? 'Mohon pembayaran dapat dilakukan ke rekening perusahaan.',
  customerName: draft?.customerName ?? invoice.customer?.name ?? invoice.expeditions[0]?.customer?.name ?? '-',
  description: draft?.description ?? invoice.description ?? '',
  attachmentFile: null,
  isUsd: draft?.isUsd ?? false,
  rateUsd: draft?.rateUsd ?? 16000,
});

const readDraftMap = (): Record<string, InvoiceProcessDraft> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PROCESS_DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, InvoiceProcessDraft>) : {};
  } catch {
    return {};
  }
};

const writeDraftMap = (value: Record<string, InvoiceProcessDraft>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROCESS_DRAFT_STORAGE_KEY, JSON.stringify(value));
};

export const getInvoiceProcessDraft = (id: number | string): InvoiceProcessDraft | null => {
  const map = readDraftMap();
  return map[String(id)] ?? null;
};

export const saveInvoiceProcessDraft = (draft: InvoiceProcessDraft) => {
  const map = readDraftMap();
  map[String(draft.primaryInvoiceId)] = draft;
  writeDraftMap(map);
};

export const createProcessDraftPayload = (
  invoice: DoInvoice,
  values: CreateInvoiceProcessValues,
  selectedExpeditionIds?: number[],
): InvoiceProcessDraft => ({
  primaryInvoiceId: invoice.id,
  invoiceIds: [invoice.id],
  selectedExpeditionIds,
  invoiceCode: values.invoiceCode,
  date: values.date,
  subject: values.subject,
  attachmentLabel: values.attachmentLabel,
  letterContent: values.letterContent,
  customerName: values.customerName,
  description: values.description,
  savedAt: new Date().toISOString(),
  isUsd: values.isUsd,
  rateUsd: values.rateUsd,
});

export const createBulkProcessDraftPayload = (
  primaryInvoiceId: number,
  invoiceIds: number[],
  invoiceCode: string,
  values: CreateInvoiceProcessValues,
  selectedExpeditionIds?: number[],
): InvoiceProcessDraft => ({
  primaryInvoiceId,
  invoiceIds,
  invoiceCode,
  selectedExpeditionIds,
  date: values.date,
  subject: values.subject,
  attachmentLabel: values.attachmentLabel,
  letterContent: values.letterContent,
  customerName: values.customerName,
  description: values.description,
  savedAt: new Date().toISOString(),
  isUsd: values.isUsd,
  rateUsd: values.rateUsd,
});

export const buildPrintPayload = (
  invoice: DoInvoice,
  rows: CreateInvoiceDetailRow[],
  companyName: string,
  draft: InvoiceProcessDraft,
): CreateInvoicePrintPayload => ({
  draft,
  invoiceCode: draft.invoiceCode || invoice.code,
  companyName,
  customerName: draft.customerName || invoice.customer?.name || '-',
  rows,
  statusLabel: getPrintStatusLabel(invoice.isAlreadyPrint),
});
