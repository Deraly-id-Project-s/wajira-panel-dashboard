import { formatCurrency as formatCurrencyBase } from '@/lib/utils/currency';
import { UnitBillingHistory } from '@/@types/unit-billing.types';

export function calculateTotalAfterDiscount(total: number, discount: number): number {
  return Math.max(0, Number(total || 0) - Number(discount || 0));
}

export function getHistoryUsdAmount(history: UnitBillingHistory): number {
  const fromCashes = history.cashes?.filter(c => c.code === 'bca_usd').reduce((sum, c) => sum + Number(c.amount ?? c.pivot?.amount ?? 0), 0) ?? 0;
  return Math.max(fromCashes, Number(history.bca_payment_usd_amount ?? 0));
}

export function getHistoryBcaIdrAmount(history: UnitBillingHistory): number {
  const fromCashes = history.cashes?.filter(c => c.code === 'bca_idr').reduce((sum, c) => sum + Number(c.amount ?? c.pivot?.amount ?? 0), 0) ?? 0;
  return Math.max(fromCashes, Number(history.bca_payment_amount ?? 0));
}

export function getHistoryCashIdrAmount(history: UnitBillingHistory): number {
  const fromCashes = history.cashes?.filter(c => c.code === 'cash_idr' || c.code === 'cash').reduce((sum, c) => sum + Number(c.amount ?? c.pivot?.amount ?? 0), 0) ?? 0;
  return Math.max(fromCashes, Number(history.cash_payment_amount ?? 0));
}

export function getHistoryTotalIdrEquivalent(history: UnitBillingHistory): number {
  const fromCashes = history.cashes?.reduce((sum, c) => {
    if (c.code === 'bca_usd') {
      const originalAmount = Number(c.pivot?.original_amount ?? c.amount ?? c.pivot?.amount ?? 0);
      return sum + originalAmount;
    }
    return sum + Number(c.amount ?? c.pivot?.amount ?? 0);
  }, 0) ?? 0;

  if (fromCashes > 0) return fromCashes;

  // Fallback to root fields if cashes is empty or 0
  return Number(history.bca_payment_amount ?? 0) + 
         Number(history.cash_payment_amount ?? 0) + 
         Number(history.bca_payment_usd_amount ?? 0);
}

export function getHistoryExchangeRate(history: UnitBillingHistory): number {
  const usdCash = history.cashes?.find(c => c.code === 'bca_usd');
  return Number(usdCash?.pivot?.exchange_amount ?? 0);
}

export function isUsdPayment(pivot?: { original_amount?: number; exchange_amount?: number } | null) {
  return Number(pivot?.original_amount || 0) > 0 && Number(pivot?.exchange_amount || 0) > 0;
}

export function getPaymentCurrency(pivot?: { original_amount?: number; exchange_amount?: number } | null) {
  return isUsdPayment(pivot) ? 'USD' : 'IDR';
}

export function getPaymentDisplayAmount(pivot?: { amount?: number; original_amount?: number; exchange_amount?: number } | null) {
  if (!pivot) return '-';
  if (isUsdPayment(pivot)) {
    return formatCurrencyBase(pivot.amount || 0, 'USD');
  }
  return formatCurrencyBase(pivot.amount || 0, 'IDR');
}

export function getPaymentIdrValue(pivot?: { amount?: number; original_amount?: number; exchange_amount?: number } | null) {
  if (!pivot) return '-';
  if (isUsdPayment(pivot)) {
    return formatCurrencyBase(pivot.original_amount || 0, 'IDR');
  }
  return formatCurrencyBase(pivot.amount || 0, 'IDR');
}

export function getExchangeRateDisplay(pivot?: { original_amount?: number; exchange_amount?: number } | null) {
  if (!pivot || !isUsdPayment(pivot)) return '-';
  return `${formatCurrencyBase(pivot.exchange_amount || 0, 'IDR')} / USD`;
}

export interface UsdCostsBreakdown {
  freight: number;
  boxPacking: number;
  admin: number;
  ckd: number;
  blSwitch: number;
  customs: number;
  other: number;
  totalUsdCost: number;
}

export function getUsdCostsFromItem(item: any): UsdCostsBreakdown {
  if (!item) {
    return {
      freight: 0,
      boxPacking: 0,
      admin: 0,
      ckd: 0,
      blSwitch: 0,
      customs: 0,
      other: 0,
      totalUsdCost: 0,
    };
  }

  const freight = Number(item.usd_cost_freight_total ?? 0);
  const boxPacking = Number(item.usd_cost_box_packing_total ?? 0);
  const admin = Number(item.usd_cost_admin_cost_total ?? 0);
  const ckd = Number(item.usd_cost_ckd_processing_cost_total ?? 0);
  const blSwitch = Number(item.usd_cost_bill_of_lading_switch_cost_total ?? 0);
  const customs = Number(item.usd_cost_customs_clearance_cost_total ?? 0);
  const other = Number(item.usd_cost_other_total ?? 0);

  const rawCosts: any[] = item.unit_transaction_usd_costs || item.usd_costs || [];
  let freightRaw = 0;
  let boxRaw = 0;
  let adminRaw = 0;
  let ckdRaw = 0;
  let blRaw = 0;
  let customsRaw = 0;
  let otherRaw = 0;

  if (Array.isArray(rawCosts) && rawCosts.length > 0) {
    rawCosts.forEach((c) => {
      const amt = Number(c.amount ?? 0);
      const type = String(c.cost_type ?? '').toLowerCase();
      if (type === 'freight') freightRaw += amt;
      else if (type === 'box_packing') boxRaw += amt;
      else if (type === 'admin_cost' || type === 'admin') adminRaw += amt;
      else if (type === 'ckd_processing_cost' || type === 'ckd') ckdRaw += amt;
      else if (type === 'bill_of_lading_switch_cost' || type === 'bl_switch') blRaw += amt;
      else if (type === 'customs_clearance_cost' || type === 'customs') customsRaw += amt;
      else otherRaw += amt;
    });
  }

  const resolvedFreight = freight || freightRaw;
  const resolvedBox = boxPacking || boxRaw;
  const resolvedAdmin = admin || adminRaw;
  const resolvedCkd = ckd || ckdRaw;
  const resolvedBl = blSwitch || blRaw;
  const resolvedCustoms = customs || customsRaw;
  const resolvedOther = other || otherRaw;

  const sumOfParts = resolvedFreight + resolvedBox + resolvedAdmin + resolvedCkd + resolvedBl + resolvedCustoms + resolvedOther;
  const totalCost = Number(
    item.total_usd_cost ??
    item.transaction_usd_cost_total ??
    item.price_usd_additional_total ??
    sumOfParts
  );

  return {
    freight: resolvedFreight,
    boxPacking: resolvedBox,
    admin: resolvedAdmin,
    ckd: resolvedCkd,
    blSwitch: resolvedBl,
    customs: resolvedCustoms,
    other: resolvedOther,
    totalUsdCost: totalCost > 0 ? totalCost : sumOfParts,
  };
}

export function isUnitUsdTransaction(item: any): boolean {
  return Boolean(
    item?.is_usd_transaction === true ||
    item?.is_usd_transaction === 1 ||
    String(item?.is_usd_transaction) === 'true'
  );
}

export function getUnitTransactionBrutoUsd(item: any): number {
  if (item?.billing_summary?.bruto_total !== undefined && item?.billing_summary?.bruto_total !== null) {
    return Number(item.billing_summary.bruto_total);
  }
  if (item?.bruto_total && Number(item.bruto_total) > 0) {
    return Number(item.bruto_total);
  }
  if (item?.transaction_bruto_total && Number(item.transaction_bruto_total) > 0) {
    return Number(item.transaction_bruto_total);
  }
  if (item?.unit_transaction_bruto_total && Number(item.unit_transaction_bruto_total) > 0) {
    return Number(item.unit_transaction_bruto_total);
  }

  const items: any[] = item?.unit_transaction_items ?? item?.lineItems ?? [];
  const baseItemsUsd = items.reduce((sum, it) => {
    const qty = Number(it.qty_total ?? it.qty ?? it.max_capacity ?? 1);
    const unitPrice = Number(it.price_per_unit_usd ?? 0);
    if (unitPrice > 0) return sum + (unitPrice * qty);
    return sum + Number(it.price_usd ?? 0);
  }, 0);

  const additionalCost = getUsdCostsFromItem(item).totalUsdCost;
  return baseItemsUsd + additionalCost;
}

export function getUnitTransactionOtherFeeUsd(item: any): number {
  return getUsdCostsFromItem(item).totalUsdCost;
}

export function getUnitTransactionRemainingPaymentUsd(item: any): number {
  if (item?.isPaid || item?.unit_transaction_billing?.is_paid || item?.billing_summary?.is_paid) {
    return 0;
  }
  if (item?.billing_summary?.remaining_payment_usd !== undefined && item?.billing_summary?.remaining_payment_usd !== null) {
    return Number(item.billing_summary.remaining_payment_usd);
  }
  if (item?.remaining_payment_usd !== undefined && item?.remaining_payment_usd !== null) {
    return Number(item.remaining_payment_usd);
  }
  const grandTotalUsd = Number(
    item?.billing_summary?.grand_total ??
    item?.unit_transaction_price_usd_total ??
    item?.transaction_price_usd_total ??
    getUnitTransactionBrutoUsd(item)
  );
  const paidUsd = Number(item?.billing_summary?.total_paid_usd ?? item?.billing_summary?.total_usd_payment ?? 0);
  return Math.max(0, grandTotalUsd - paidUsd);
}

export interface UsdTransactionSummary {
  isUsd: boolean;
  baseUsd: number;
  costs: UsdCostsBreakdown;
  totalUsdCost: number;
  brutoTotalUsd: number;
  totalDiscountUsd: number;
  discountUsdPercent: number | null;
  grandTotalUsd: number;
  totalPaidUsd: number;
  remainingPaymentUsd: number;
  isPaid: boolean;
}

export function getUsdTransactionSummary(
  data: any,
  items: any[] = [],
  billingHistories: any[] = [],
): UsdTransactionSummary {
  const resolvedItems: any[] = items && items.length > 0
    ? items
    : (data?.unit_transaction_items ?? data?.lineItems ?? []);

  const hasExplicitFlag = data?.is_usd_transaction !== undefined && data?.is_usd_transaction !== null;
  const isUsd = hasExplicitFlag
    ? isUnitUsdTransaction(data)
    : (isUnitUsdTransaction(data) || resolvedItems.some(i => isUnitUsdTransaction(i) || Number(i.price_usd_total ?? i.price_total_usd ?? i.price_per_unit_usd ?? 0) > 0));

  // 1. Subtotal Base USD: qty_total * price_per_unit_usd
  const baseUsd = resolvedItems.reduce((sum, item) => {
    const qty = Number(item.qty_total ?? item.qty ?? item.max_capacity ?? 1);
    const unitPrice = Number(item.price_per_unit_usd ?? 0);
    if (unitPrice > 0) return sum + (unitPrice * qty);
    return sum + Number(item.price_usd ?? 0);
  }, 0);

  // 2. Costs breakdown
  const allUsdCostList: any[] = [
    ...(data?.unit_transaction_usd_costs ?? []),
    ...resolvedItems.flatMap((i) => i?.unit_transaction_usd_costs ?? i?.usd_costs ?? []),
  ];
  const getCostAmountByType = (costType: string): number => {
    return allUsdCostList
      .filter((c) => String(c?.cost_type ?? '').toLowerCase() === costType.toLowerCase())
      .reduce((sum, c) => sum + Number(c?.amount ?? 0), 0);
  };

  const freight = Number(data?.usd_cost_freight_total ?? (resolvedItems.reduce((s, i) => s + Number(i.usd_cost_freight_total ?? 0), 0) || getCostAmountByType('freight')));
  const boxPacking = Number(data?.usd_cost_box_packing_total ?? (resolvedItems.reduce((s, i) => s + Number(i.usd_cost_box_packing_total ?? 0), 0) || getCostAmountByType('box_packing')));
  const admin = Number(data?.usd_cost_admin_cost_total ?? (resolvedItems.reduce((s, i) => s + Number(i.usd_cost_admin_cost_total ?? 0), 0) || getCostAmountByType('admin_cost')));
  const ckd = Number(data?.usd_cost_ckd_processing_cost_total ?? (resolvedItems.reduce((s, i) => s + Number(i.usd_cost_ckd_processing_cost_total ?? 0), 0) || getCostAmountByType('ckd_processing_cost')));
  const blSwitch = Number(data?.usd_cost_bill_of_lading_switch_cost_total ?? (resolvedItems.reduce((s, i) => s + Number(i.usd_cost_bill_of_lading_switch_cost_total ?? 0), 0) || getCostAmountByType('bill_of_lading_switch_cost')));
  const customs = Number(data?.usd_cost_customs_clearance_cost_total ?? (resolvedItems.reduce((s, i) => s + Number(i.usd_cost_customs_clearance_cost_total ?? 0), 0) || getCostAmountByType('customs_clearance_cost')));
  const other = Number(data?.usd_cost_other_total ?? (resolvedItems.reduce((s, i) => s + Number(i.usd_cost_other_total ?? 0), 0) || getCostAmountByType('other')));
  const sumCosts = freight + boxPacking + admin + ckd + blSwitch + customs + other;

  const totalUsdCost = Number(
    data?.total_usd_cost ??
    data?.transaction_usd_cost_total ??
    (resolvedItems.some((i) => Number(i.total_usd_cost ?? 0) > 0)
      ? resolvedItems.reduce((s, i) => s + Number(i.total_usd_cost ?? 0), 0)
      : sumCosts)
  );

  const costs: UsdCostsBreakdown = {
    freight,
    boxPacking,
    admin,
    ckd,
    blSwitch,
    customs,
    other,
    totalUsdCost,
  };

  // 3. Bruto Total (Gross) USD: Base USD + Total USD Cost
  const calculatedBrutoUsd = baseUsd + totalUsdCost;
  const brutoTotalUsd = Number(
    data?.billing_summary?.bruto_total ??
    data?.bruto_total ??
    data?.transaction_bruto_total ??
    data?.unit_transaction_bruto_total ??
    calculatedBrutoUsd
  );

  // 4. Discount USD: nominal amount from price_usd_discount
  const fallbackSingleDiscount = Number(data?.price_usd_discount ?? data?.price_discount_usd ?? 0);
  const calculatedDiscountUsd = resolvedItems.reduce((sum, item) => {
    return sum + Number(item.price_usd_discount ?? item.price_discount_usd ?? 0);
  }, 0);

  const headerDiscount = Number(
    data?.total_discount ??
    data?.transaction_discount_total ??
    data?.price_discount_total ??
    fallbackSingleDiscount
  );
  const totalDiscountUsd = headerDiscount > 0 ? headerDiscount : calculatedDiscountUsd;
  const discountUsdPercent = null;

  // 5. Grand Total (Netto) USD: Bruto - Discount (or from API billing_summary.grand_total / transaction_price_usd_total)
  const headerGrandTotal = Number(
    data?.billing_summary?.grand_total ??
    data?.unit_transaction_price_usd_total_actual ??
    data?.unit_transaction_price_usd_total ??
    data?.transaction_price_usd_total ??
    0
  );
  const grandTotalUsd = headerGrandTotal > 0 ? headerGrandTotal : Math.max(0, brutoTotalUsd - totalDiscountUsd);

  // 6. Paid & Remaining
  const historyPaidUsd = billingHistories.reduce((sum, h) => sum + getHistoryUsdAmount(h), 0);
  const summaryPaidUsd = Number(
    data?.billing_summary?.total_paid_usd ??
    data?.billing_summary?.total_usd_payment ??
    data?.billing_summary?.total_paid ??
    0
  );
  const totalPaidUsd = Math.max(summaryPaidUsd, historyPaidUsd);

  const isPaid = Boolean(
    data?.billing_summary?.is_paid ??
    data?.isPaid ??
    data?.unit_transaction_billing?.is_paid ??
    (grandTotalUsd > 0 && totalPaidUsd >= grandTotalUsd)
  );

  const summaryRemainingUsd = data?.billing_summary?.remaining_payment_usd !== undefined
    ? Number(data.billing_summary.remaining_payment_usd)
    : (data?.billing_summary?.remaining_payment !== undefined && isUsd
      ? Number(data.billing_summary.remaining_payment)
      : (data?.remaining_payment_usd !== undefined ? Number(data.remaining_payment_usd) : undefined));

  const remainingPaymentUsd = isPaid
    ? 0
    : (summaryRemainingUsd !== undefined ? summaryRemainingUsd : Math.max(0, grandTotalUsd - totalPaidUsd));

  return {
    isUsd,
    baseUsd,
    costs,
    totalUsdCost,
    brutoTotalUsd,
    totalDiscountUsd,
    discountUsdPercent,
    grandTotalUsd,
    totalPaidUsd,
    remainingPaymentUsd,
    isPaid,
  };
}

export interface IdrTransactionSummary {
  totalDpp: number;
  totalPpn: number;
  totalHpp: number;
  biayaBbn: number;
  biayaEkspedisi: number;
  biayaLainnya: number;
  totalBiaya: number;
  brutoTotalIdr: number;
  totalDiscountIdr: number;
  discountIdrPercent: number | null;
  grandTotalIdr: number;
  debetBankIdr: number;
  debetCashIdr: number;
  totalPaidIdr: number;
  remainingPaymentIdr: number;
  isPaid: boolean;
}

export function getIdrTransactionSummary(
  data: any,
  items: any[] = [],
  billingHistories: any[] = [],
): IdrTransactionSummary {
  const resolvedItems: any[] = items && items.length > 0
    ? items
    : (data?.unit_transaction_items ?? data?.lineItems ?? []);

  const totalDppFromItems = resolvedItems.reduce((sum, it) => sum + Number(it.dpp ?? it.dpp_total_price ?? 0), 0);
  const totalPpnFromItems = resolvedItems.reduce((sum, it) => sum + Number(it.ppn ?? it.ppn_total_price ?? 0), 0);

  const totalDpp = totalDppFromItems > 0
    ? totalDppFromItems
    : Number(data?.unit_transaction_item_total_dpp ?? data?.transaction_dpp_total ?? data?.total_dpp ?? data?.totalDpp ?? 0);

  const totalPpn = totalPpnFromItems > 0
    ? totalPpnFromItems
    : Number(data?.unit_transaction_item_total_ppn ?? data?.transaction_ppn_total ?? data?.total_ppn ?? data?.totalPpn ?? 0);

  const totalHpp = Number(data?.total_hpp ?? data?.totalHpp ?? 0) || (totalDpp + totalPpn);

  const biayaBbn = Number(data?.transaction_bbn_total ?? data?.total_bbn ?? data?.biayaBbn ?? 0);
  const biayaEkspedisi = Number(data?.expedition_fee_total ?? data?.total_expedition_fee ?? data?.biayaEkspedisi ?? 0);
  const biayaLainnya = Number(data?.transaction_other_fee ?? data?.total_other_fee ?? data?.biayaLain ?? 0);
  const totalBiaya = Number(data?.total_operational_fee ?? data?.totalBiaya ?? (biayaBbn + biayaEkspedisi + biayaLainnya));

  const totalPembelianKotor = totalHpp + totalBiaya;

  const headerBruto = Number(
    data?.billing_summary?.bruto_total ??
    data?.bruto_total ??
    data?.transaction_bruto_total ??
    data?.unit_transaction_bruto_total ??
    data?.totalJual ??
    0
  );
  const brutoTotalIdr = headerBruto > 0 ? headerBruto : totalPembelianKotor;

  // Discount IDR: nominal amount from price_discount
  const fallbackSingleDiscount = Number(data?.price_discount ?? 0);
  const calculatedDiscountIdr = resolvedItems.reduce((sum, item) => {
    return sum + Number(item.price_discount ?? 0);
  }, 0);

  const headerDiscount = Number(
    data?.total_discount ??
    data?.transaction_discount_total ??
    data?.price_discount_total ??
    fallbackSingleDiscount
  );
  const totalDiscountIdr = headerDiscount > 0 ? headerDiscount : calculatedDiscountIdr;
  const discountIdrPercent = null;

  const grandTotalIdr = Number(
    data?.billing_summary?.grand_total ??
    Math.max(0, brutoTotalIdr - totalDiscountIdr)
  );

  const historyPaidIdr = billingHistories.reduce((sum, h) => sum + getHistoryTotalIdrEquivalent(h), 0);
  const debetBankIdr = Number(
    data?.billing_summary?.total_bca_payment ??
    billingHistories.reduce((sum, h) => sum + getHistoryBcaIdrAmount(h), 0)
  );
  const debetCashIdr = Number(
    data?.billing_summary?.total_cash_payment ??
    billingHistories.reduce((sum, h) => sum + getHistoryCashIdrAmount(h), 0)
  );
  const summaryPaidIdr = Number(
    data?.billing_summary?.total_paid ??
    (debetBankIdr + debetCashIdr)
  );
  const totalPaidIdr = Math.max(summaryPaidIdr, historyPaidIdr);

  const isPaid = Boolean(
    data?.billing_summary?.is_paid ??
    data?.isPaid ??
    data?.unit_transaction_billing?.is_paid ??
    (grandTotalIdr > 0 && totalPaidIdr >= grandTotalIdr)
  );

  const summaryRemainingIdr = data?.billing_summary?.remaining_payment !== undefined
    ? Number(data.billing_summary.remaining_payment)
    : (data?.remaining_payment !== undefined ? Number(data.remaining_payment) : undefined);

  const remainingPaymentIdr = isPaid
    ? 0
    : (summaryRemainingIdr !== undefined ? summaryRemainingIdr : Math.max(0, grandTotalIdr - totalPaidIdr));

  return {
    totalDpp,
    totalPpn,
    totalHpp,
    biayaBbn,
    biayaEkspedisi,
    biayaLainnya,
    totalBiaya,
    brutoTotalIdr,
    totalDiscountIdr,
    discountIdrPercent,
    grandTotalIdr,
    debetBankIdr,
    debetCashIdr,
    totalPaidIdr,
    remainingPaymentIdr,
    isPaid,
  };
}

export function getUnitTransactionRemainingPayment(item: any): number {
  if (isUnitUsdTransaction(item)) {
    return getUnitTransactionRemainingPaymentUsd(item);
  }
  if (item?.isPaid) return Number(item.remainingPayment || 0);
  if (!item?.remainingPayment) return Number(item.transaction_bruto_total || 0);
  return Number(item.remainingPayment || 0);
}

export function isKasDisabledForTransaction(
  kasCurrencyType?: string | null,
  isUsdTransaction?: boolean,
  isDetail = false,
): boolean {
  if (isDetail) return true;
  const isUsdKas = String(kasCurrencyType || '').toLowerCase() === 'usd';
  return Boolean(isUsdTransaction ? !isUsdKas : isUsdKas);
}

