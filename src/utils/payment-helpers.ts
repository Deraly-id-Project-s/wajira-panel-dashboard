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
  const explicit = Number(
    item?.unit_transaction_price_usd_total && Number(item.unit_transaction_price_usd_total) > 0
      ? item.unit_transaction_price_usd_total
      : (item?.transaction_price_usd_total && Number(item.transaction_price_usd_total) > 0
        ? item.transaction_price_usd_total
        : (item?.unit_transaction_price_usd_total_actual && Number(item.unit_transaction_price_usd_total_actual) > 0
          ? item.unit_transaction_price_usd_total_actual
          : (item?.price_usd && Number(item.price_usd) > 0
            ? item.price_usd
            : 0)))
  );

  const items: any[] = item?.unit_transaction_items ?? [];
  const baseItemsUsd = items.reduce((sum, it) => {
    const p = Number(
      it.price_usd && Number(it.price_usd) > 0
        ? it.price_usd
        : (Number(it.price_per_unit_usd ?? 0) * Number(it.qty_total ?? it.qty ?? 1))
    );
    return sum + p;
  }, 0);

  const additionalCost = getUsdCostsFromItem(item).totalUsdCost;
  const calculated = baseItemsUsd + additionalCost;

  return Math.max(explicit, calculated);
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
  const brutoUsd = getUnitTransactionBrutoUsd(item);
  const paidUsd = Number(item?.billing_summary?.total_paid_usd ?? item?.billing_summary?.total_usd_payment ?? 0);
  return Math.max(0, brutoUsd - paidUsd);
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

