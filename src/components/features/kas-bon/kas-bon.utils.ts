import type { DriverCashAdvance } from '@/@types/driver-cash-advance.types';
import { formatDateUI } from '@/lib/utils/date';

export const formatKasBonDate = (value?: string | null) => formatDateUI(value);

export const getKasBonApprovalLabel = (isApprove: boolean) => (isApprove ? 'Disetujui' : 'Menunggu');

export const getKasBonApprovalClassName = (isApprove: boolean) =>
  isApprove
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';

export const isKasBonPaid = (item: DriverCashAdvance): boolean => {
  if (item.is_paid === true || item.isPaid === true) return true;
  if (typeof item.remaining_payment === 'number' && item.remaining_payment === 0) return true;
  if (typeof item.remainingPayment === 'number' && item.remainingPayment === 0) return true;

  const firstBilling = item.billings?.[0];
  if (firstBilling) {
    if (firstBilling.isPaid) return true;
    if (typeof firstBilling.remainingPayment === 'number' && firstBilling.remainingPayment === 0) return true;
  }

  return false;
};
