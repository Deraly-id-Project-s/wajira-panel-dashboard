import { SalesItem, SalesLineItem } from '@/components/features/unit-transaksi/sales/sales.data';
import type { UnitTransactionFormValues } from '@/types/unit-transaction.types';
import { UnitTransaction } from '@/@types/unit-transaction.types';

export type SalesApiModel = {
  id?: number | string;
  company_id?: number | string;
  person_id?: number | string;
  warehouse_id?: number | string;
  code?: string;
  type?: string;
  max_capacity?: number | string;
  stock_state?: string;
  created_at?: string;
  document_template_id?: number | string | null;
  document_template?: { id?: number | string; uuid?: string } | null;
  unit_transaction_bruto_total?: string | number;
  transaction_bruto_total?: string | number;
  unit_transaction_dpp_total?: string | number;
  transaction_dpp_total?: string | number;
  unit_transaction_ppn_total?: string | number;
  transaction_ppn_total?: string | number;
  transaction_bbn_total?: string | number;
  transaction_other_fee?: string | number;
  expedition_fee_total?: string | number;
  person?: {
    id?: number | string;
    name?: string;
  };
  warehouse?: {
    id?: number | string;
    name?: string;
  };
  unit_transaction_billing?: {
    id?: string | number;
    is_paid?: boolean;
    total_paid?: string | number;
    total_payment?: string | number;
    paid_total?: string | number;
    bca_payment?: string | number;
    bca_payment_amount?: string | number;
    cash_payment?: string | number;
    cash_payment_amount?: string | number;
    bca_payment_2?: string | number;
    bca_payment_usd_amount?: string | number;
    unit_transaction_billing_histories?: Array<{
      id?: number | string;
      unit_transaction_billing_id?: number | string;
      unit_transaction_id?: number | string;
      payment_proof?: string | null;
      bca_payment_amount?: string | number;
      cash_payment_amount?: string | number;
      bca_payment_usd_amount?: string | number;
      payment_at?: string;
      note?: string;
      created_at?: string;
      updated_at?: string;
    }>;
  } | null;
  billing_summary?: {
    grand_total?: string | number;
    total_cash_payment?: string | number;
    total_bca_payment?: string | number;
    total_bca_usd_payment?: string | number;
    total_paid?: string | number;
    remaining_payment?: string | number;
    is_paid?: boolean | number | string;
  } | null;
  unit_transaction_item_total_dpp?: string | number;
  unit_transaction_item_total_ppn?: string | number;
  unit_transaction_item_total_bruto?: string | number;
  unit_transaction_item_bruto_total?: string | number;
  unit_transaction_items?: Array<{
    id?: number | string;
    unit_type_id?: number | string;
    unit_type?: {
      name?: string;
    };
    qty_total?: string | number;
    price?: string | number;
    bbn_price?: string | number;
    expedition_fee?: string | number;
    other_fee?: string | number;
    hpp_total_price?: string | number;
    dpp_total_price?: string | number;
    ppn_total_price?: string | number;
    dpp_tax_id?: number | string;
    ppn_tax_id?: number | string;
    price_usd?: string | number;
    price_per_unit_usd?: string | number;
    unit_transaction_item_details?: Array<{
      id?: number | string;
      color?: string;
      machine_number?: string;
      chassis_number?: string;
    }>;
    unit_transaction_item_sales?: Array<{
      id?: number | string;
      unit_transaction_item_detail_id?: number | string;
    }>;
  }>;
  unit_transaction_adjustments?: Array<{
    id?: number | string;
    amount?: number | string;
    description?: string;
    created_at?: string;
  }>;
  is_unit_type_detail_valid?: boolean | string | number;
  unit_transaction_price_usd_total?: string | number;
  unit_transaction_price_usd_total_actual?: string | number;
};

export type SalesListUI = {
  id: string;
  code: string;
  customerName: string;
  warehouseName: string;
  total: number;
  date: string;
  status: 'Lunas' | 'Belum';
  stockState: string;
  isRefunded: boolean;
};

const toNumber = (value: string | number | undefined): number => Number(value ?? 0);
const toBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return false;
};

const getTotalPaid = (billing: SalesApiModel['unit_transaction_billing']): number => {
  if (!billing) return 0;

  const directTotal = toNumber(billing.total_paid ?? billing.total_payment ?? billing.paid_total);
  const fromComponents =
    toNumber(billing.bca_payment ?? billing.bca_payment_amount) +
    toNumber(billing.cash_payment ?? billing.cash_payment_amount) +
    toNumber(billing.bca_payment_2 ?? billing.bca_payment_usd_amount);

  return Math.max(directTotal, fromComponents, 0);
};

const getTotalPaidFromBillingSummary = (item: SalesApiModel): number => {
  const summary = item.billing_summary;
  if (!summary) return 0;

  const directTotal = toNumber(summary.total_paid);
  const fromComponents =
    toNumber(summary.total_cash_payment) +
    toNumber(summary.total_bca_payment) +
    toNumber(summary.total_bca_usd_payment);

  return Math.max(directTotal, fromComponents, 0);
};

const getTotalPaidFromBillingHistory = (billing: SalesApiModel['unit_transaction_billing']): number => {
  const rows = billing?.unit_transaction_billing_histories ?? [];
  if (!Array.isArray(rows) || rows.length === 0) return 0;

  return rows.reduce(
    (acc, row) =>
      acc + toNumber(row.bca_payment_amount) + toNumber(row.cash_payment_amount) + toNumber(row.bca_payment_usd_amount),
    0,
  );
};

const getRemainingPayment = (item: SalesApiModel, totalJual: number, totalPaid: number): number => {
  const remainingFromSummary = toNumber(item.billing_summary?.remaining_payment);
  if (remainingFromSummary > 0 || (toBool(item.billing_summary?.is_paid) && remainingFromSummary === 0)) {
    return remainingFromSummary;
  }

  return Math.max(totalJual - totalPaid, 0);
};

const sumLineItems = (
  items: SalesApiModel['unit_transaction_items'],
  selector: (item: NonNullable<SalesApiModel['unit_transaction_items']>[number]) => string | number | undefined,
): number => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((acc, row) => acc + toNumber(selector(row)), 0);
};

const getBrutoTotal = (item: SalesApiModel): number =>
  toNumber(
    item.unit_transaction_bruto_total ??
    item.unit_transaction_item_bruto_total ??
    item.unit_transaction_item_total_bruto ??
    item.transaction_bruto_total,
  );

const getDppTotal = (item: SalesApiModel): number => {
  const lineDpp = sumLineItems(item.unit_transaction_items, (row) => row.dpp_total_price ?? row.hpp_total_price);
  if (lineDpp > 0) return lineDpp;

  const headerDpp = toNumber(item.unit_transaction_item_total_dpp ?? item.unit_transaction_dpp_total ?? item.transaction_dpp_total);
  if (headerDpp > 0) return headerDpp;

  return 0;
};

const getPpnTotal = (item: SalesApiModel): number => {
  const linePpn = sumLineItems(item.unit_transaction_items, (row) => row.ppn_total_price);
  if (linePpn > 0) return linePpn;

  const headerPpn = toNumber(item.unit_transaction_item_total_ppn ?? item.unit_transaction_ppn_total ?? item.transaction_ppn_total);
  if (headerPpn > 0) return headerPpn;

  return 0;
};

const formatDate = (value?: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function mapSalesToUI(item: SalesApiModel): SalesListUI {
  const stockState = String(item.stock_state ?? '').toLowerCase();
  return {
    id: String(item.id ?? ''),
    code: item.code ?? '-',
    customerName: item.person?.name ?? '-',
    warehouseName: item.warehouse?.name ?? '-',
    total: getBrutoTotal(item),
    date: item.created_at ?? '',
    status: toBool(item.billing_summary?.is_paid ?? item.unit_transaction_billing?.is_paid) ? 'Lunas' : 'Belum',
    stockState,
    isRefunded: stockState === 'outbound_return',
  };
}

export const mapSalesToTableItem = (item: SalesApiModel): UnitTransaction => {
  const mapped = mapSalesToUI(item);
  const totalDpp = getDppTotal(item);
  const totalPpn = getPpnTotal(item);
  const totalJual = getBrutoTotal(item) || mapped.total;
  const totalBayar = Math.max(
    getTotalPaidFromBillingSummary(item),
    getTotalPaid(item.unit_transaction_billing),
    getTotalPaidFromBillingHistory(item.unit_transaction_billing),
  );
  const kurangBayar = getRemainingPayment(item, totalJual, totalBayar);

  return {
    id: mapped.id,
    code: mapped.code,
    supplier: mapped.customerName, // Set customer name as supplier field in UnitTransaction type
    warehouse: mapped.warehouseName,
    transaction_bruto_total: totalJual,
    transaction_dpp_total: totalDpp,
    transaction_ppn_total: totalPpn,
    transaction_bbn_total: toNumber(item.transaction_bbn_total),
    transaction_other_fee: toNumber(item.transaction_other_fee),
    expedition_fee_total: toNumber(item.expedition_fee_total),
    total_operational_fee: toNumber(item.transaction_bbn_total) + toNumber(item.transaction_other_fee),
    stock_state: mapped.stockState,
    isPaid: toBool(item.billing_summary?.is_paid ?? item.unit_transaction_billing?.is_paid),
    paymentAt: null,
    remainingPayment: kurangBayar,
    created_at: formatDate(mapped.date),
    isRefunded: mapped.isRefunded,
    isUnitTypeDetailValid: item.is_unit_type_detail_valid === true || item.is_unit_type_detail_valid === 1 || String(item.is_unit_type_detail_valid) === 'true',
    billing_summary: item.billing_summary
      ? {
        grand_total: toNumber(item.billing_summary.grand_total),
        total_cash_payment: toNumber(item.billing_summary.total_cash_payment),
        total_bca_payment: toNumber(item.billing_summary.total_bca_payment),
        total_paid: toNumber(item.billing_summary.total_paid),
        remaining_payment: toNumber(item.billing_summary.remaining_payment),
        is_paid: toBool(item.billing_summary?.is_paid),
      }
      : null,
    documentTemplateId: item.document_template_id != null ? String(item.document_template_id) : item.document_template?.id != null ? String(item.document_template.id) : item.document_template?.uuid ?? null,
  };
};

const mapSalesLineItem = (item: NonNullable<SalesApiModel['unit_transaction_items']>[number], index: number): SalesLineItem => {
  const qty = toNumber(item.qty_total);
  const hargaJual = toNumber(item.price);
  const biayaBbn = toNumber(item.bbn_price);
  const biayaEkspedisi = toNumber(item.expedition_fee);
  const biayaLain = toNumber(item.other_fee);
  const hpp = toNumber(item.hpp_total_price);
  const dpp = toNumber(item.dpp_total_price);
  const ppn = toNumber(item.ppn_total_price);

  return {
    id: String(item.id ?? index + 1),
    tipeUnit: item.unit_type?.name ?? '-',
    qty,
    hargaJual,
    biayaBbn,
    biayaEkspedisi,
    biayaLain,
    dppTaxVersionId: item.dpp_tax_id != null ? String(item.dpp_tax_id) : '',
    ppnTaxVersionId: item.ppn_tax_id != null ? String(item.ppn_tax_id) : '',
    hpp,
    dpp,
    ppn,
    jumlah: hpp + ppn + biayaBbn + biayaEkspedisi + biayaLain,
    price_usd: item.price_usd !== undefined ? toNumber(item.price_usd) : undefined,
    price_per_unit_usd: item.price_per_unit_usd !== undefined ? toNumber(item.price_per_unit_usd) : undefined,
  };
};

export const mapSalesDetailToUI = (item: SalesApiModel): SalesItem => {
  const totalDpp = getDppTotal(item);
  const totalPpn = getPpnTotal(item);
  const totalJual = getBrutoTotal(item);
  const totalBayar = Math.max(
    getTotalPaidFromBillingSummary(item),
    getTotalPaid(item.unit_transaction_billing),
    getTotalPaidFromBillingHistory(item.unit_transaction_billing),
  );
  const kurangBayar = getRemainingPayment(item, totalJual, totalBayar);
  const qty = toNumber(item.max_capacity);

  return {
    id: String(item.id ?? ''),
    kodeJual: item.code ?? '-',
    tanggal: formatDate(item.created_at),
    customer: item.person?.name ?? '-',
    stockState: String(item.stock_state ?? '').toLowerCase(),
    isRefunded: String(item.stock_state ?? '').toLowerCase() === 'outbound_return',
    warehouse: item.warehouse?.name ?? '-',
    tipeUnit: item.unit_transaction_items?.[0]?.unit_type?.name ?? '-',
    hargaSatuan: toNumber(item.unit_transaction_items?.[0]?.price),
    qty,
    biayaBbn: toNumber(item.transaction_bbn_total),
    biayaEkspedisi: toNumber(item.expedition_fee_total),
    biayaLain: toNumber(item.transaction_other_fee),
    dppTaxVersionId: item.unit_transaction_items?.[0]?.dpp_tax_id != null ? String(item.unit_transaction_items[0].dpp_tax_id) : '',
    ppnTaxVersionId: item.unit_transaction_items?.[0]?.ppn_tax_id != null ? String(item.unit_transaction_items[0].ppn_tax_id) : '',
    totalHpp: totalDpp,
    totalDpp,
    totalPpn,
    totalBiaya: toNumber(item.transaction_bbn_total) + toNumber(item.expedition_fee_total) + toNumber(item.transaction_other_fee),
    totalJual,
    totalBayar,
    kurangBayar,
    lineItems: (item.unit_transaction_items ?? []).map(mapSalesLineItem),
    units: [],
    price_usd: item.unit_transaction_items?.[0]?.price_usd ? toNumber(item.unit_transaction_items[0].price_usd) : undefined,
    price_per_unit_usd: item.unit_transaction_items?.[0]?.price_per_unit_usd ? toNumber(item.unit_transaction_items[0].price_per_unit_usd) : undefined,
    unit_transaction_price_usd_total: item.unit_transaction_price_usd_total ? toNumber(item.unit_transaction_price_usd_total) : undefined,
    unit_transaction_price_usd_total_actual: item.unit_transaction_price_usd_total_actual ? toNumber(item.unit_transaction_price_usd_total_actual) : undefined,
    documentTemplateId: item.document_template_id != null ? String(item.document_template_id) : item.document_template?.id != null ? String(item.document_template.id) : item.document_template?.uuid ?? null,
  };
};

export const mapSalesDetailCard = (item: SalesApiModel) => ({
  code: item.code ?? '-',
  customerName: item.person?.name ?? '-',
  warehouse: item.warehouse?.name ?? '-',
  total: getBrutoTotal(item),
  dpp: getDppTotal(item),
  ppn: getPpnTotal(item),
});

export const mapSalesDetailToEditForm = (item: SalesApiModel): UnitTransactionFormValues => {
  const qty = Math.max(toNumber(item.max_capacity), 1);
  const totalDpp = getDppTotal(item);
  const totalPpn = getPpnTotal(item);

  return {
    unitTypeId: String(item.unit_transaction_items?.[0]?.unit_type_id ?? ''),
    documentTemplateId: item.document_template_id != null ? String(item.document_template_id) : item.document_template?.id != null ? String(item.document_template.id) : item.document_template?.uuid ?? null,
    qty,
    price: toNumber(item.unit_transaction_items?.[0]?.price),
    bbnPrice: toNumber(item.transaction_bbn_total),
    expeditionFee: item.unit_transaction_items?.reduce((acc, row) => acc + toNumber(row.expedition_fee), 0) ?? 0,
    otherFee: toNumber(item.transaction_other_fee),
    hppPerUnit: totalDpp / qty,
    hppTotal: totalDpp,
    dppPerUnit: totalDpp / qty,
    dppTotal: totalDpp,
    ppnPerUnit: totalPpn / qty,
    ppnTotal: totalPpn,
  };
};
