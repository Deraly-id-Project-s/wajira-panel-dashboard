import { formatCurrency as formatCurrencyBase } from '@/lib/utils/currency';
import { UnitBillingHistory } from '@/types/unit-billing.types';

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
