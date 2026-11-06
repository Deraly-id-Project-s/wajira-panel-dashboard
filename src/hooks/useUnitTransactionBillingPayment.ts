import { useState, useMemo } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { usePurchaseById } from '@/hooks/useUnitTransaction';
import { useSalesDetail } from '@/hooks/useSales';
import {
  useBillingHistory,
  useBillingValidation,
  useCreateBillingHistory,
  useCreateBillingV2,
  useCurrentBilling,
  useDeleteBillingHistory,
} from '@/hooks/useUnitBilling';
import { toast } from 'sonner';
import {
  getHistoryUsdAmount,
  getHistoryTotalIdrEquivalent,
  getUsdTransactionSummary,
  getIdrTransactionSummary,
} from '@/utils/payment-helpers';
import type { UnitBilling, UnitBillingHistory } from '@/@types/unit-billing.types';

export interface PaymentFormData {
  bcaPayment?: number; // BCA USD
  cashPayment?: number; // Cash IDR
  bcaPayment2?: number; // BCA IDR
  paymentDate: string;
  note?: string;
  paymentProof?: File | null;
  isPaid?: boolean;
}

export interface UseUnitTransactionBillingPaymentOptions {
  type: 'purchase' | 'sales';
  transactionId: string;
}

export const readBillingApiError = (error: any): string => {
  const stringifyDetail = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const details = error?.details ?? error?.response?.data?.errors;
  if (typeof details === 'string' && details.trim()) return details;
  if (details && typeof details === 'object') {
    const text = Object.entries(details)
      .map(([field, value]) => {
        if (Array.isArray(value)) {
          return `${field}: ${value.map((item) => stringifyDetail(item)).join(' | ')}`;
        }
        return `${field}: ${stringifyDetail(value)}`;
      })
      .join(', ')
      .trim();
    if (text) return text;
  }
  return error?.response?.data?.message || error?.message || 'Gagal memproses tagihan.';
};

export const readCheckRightAmountError = (error: any): string => {
  const payload = error?.response?.data ?? {};
  const errors = payload?.errors ?? error?.details;

  const invalidItems = errors?.invalid_items;
  const summary = errors?.summary;
  const hint = errors?.hint;

  if (!invalidItems && !summary && !hint) {
    return readBillingApiError(error);
  }

  const invalidArray = Array.isArray(invalidItems)
    ? invalidItems
    : Array.isArray(summary)
      ? summary.filter((item: any) => item?.is_valid === false)
      : [];

  if (invalidArray.length === 0) {
    return hint ? `Validasi billing: ${String(hint)}` : 'Validasi billing: Lengkapi detail unit terlebih dahulu.';
  }

  const detailText = invalidArray
    .map((item: any) => {
      const itemId = item?.item_id ?? item?.unit_transaction_item_id ?? '-';
      const diff = item?.difference ?? item?.difference_total ?? (Number(item?.qty_input ?? 0) - Number(item?.qty_actual ?? 0));
      return `Item ${itemId}: kurang ${Number(diff) > 0 ? Number(diff) : 0} unit`;
    })
    .join('; ');

  return `Data pada Detail Unit Tipe belum lengkap (${detailText}).`;
};

export function useUnitTransactionBillingPayment({
  type,
  transactionId,
}: UseUnitTransactionBillingPaymentOptions) {
  const { companyId } = useCompany();
  const isPurchase = type === 'purchase';

  // Purchase query
  const {
    data: purchase,
    isLoading: purchaseLoading,
    refetch: refetchPurchase,
  } = usePurchaseById(isPurchase ? transactionId : undefined);

  // Sales query
  const {
    data: salesDetail,
    isLoading: salesLoading,
    refetch: refetchSales,
  } = useSalesDetail(isPurchase ? undefined : transactionId);

  // Current billing query
  const {
    data: currentBilling,
    isLoading: billingLoading,
    refetch: refetchCurrentBilling,
  } = useCurrentBilling(transactionId);

  const billingId = String(currentBilling?.id ?? '');

  // Billing history query
  const {
    data: billingHistories = [],
    isLoading: historyLoading,
    refetch: refetchBillingHistory,
  } = useBillingHistory(billingId || undefined, transactionId);

  // Validation query
  const { refetch: revalidateAmount } = useBillingValidation(
    companyId ? String(companyId) : undefined,
    transactionId,
    { enabled: false },
  );

  // Mutations
  const createBillingMutation = useCreateBillingV2();
  const createBillingHistoryMutation = useCreateBillingHistory();
  const deleteBillingHistoryMutation = useDeleteBillingHistory();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | undefined>(undefined);

  // Transaction code
  const code = useMemo(() => {
    if (isPurchase) return purchase?.code ?? '-';
    return salesDetail?.ui?.kodeJual ?? salesDetail?.raw?.code ?? '-';
  }, [isPurchase, purchase?.code, salesDetail]);

  const transactionData = useMemo(() => {
    return isPurchase ? purchase : (salesDetail?.raw ?? salesDetail?.ui);
  }, [isPurchase, purchase, salesDetail]);

  const transactionItems = useMemo(() => {
    if (isPurchase) return purchase?.unit_transaction_items ?? [];
    return salesDetail?.raw?.unit_transaction_items ?? salesDetail?.ui?.lineItems ?? [];
  }, [isPurchase, purchase, salesDetail]);

  const usdSummary = useMemo(() => {
    return getUsdTransactionSummary(transactionData, transactionItems, billingHistories);
  }, [transactionData, transactionItems, billingHistories]);

  const idrSummary = useMemo(() => {
    return getIdrTransactionSummary(transactionData, transactionItems, billingHistories);
  }, [transactionData, transactionItems, billingHistories]);

  // Is USD Transaction
  const isUsd = useMemo(() => {
    if (currentBilling?.is_usd_transaction !== undefined) {
      return Boolean(currentBilling.is_usd_transaction);
    }
    return usdSummary.isUsd;
  }, [currentBilling?.is_usd_transaction, usdSummary.isUsd]);

  // Computed amounts for USD
  const totalTagihanUsd = useMemo(() => {
    if (!isUsd) return 0;
    if (currentBilling?.grand_total && Number(currentBilling.grand_total) > 0) {
      return Number(currentBilling.grand_total);
    }
    return usdSummary.grandTotalUsd;
  }, [isUsd, currentBilling?.grand_total, usdSummary.grandTotalUsd]);

  const totalPaidUsd = useMemo(() => {
    if (!isUsd) return 0;
    const fromBilling = Number(currentBilling?.total_usd_payment ?? currentBilling?.total_paid ?? 0);
    return Math.max(fromBilling, usdSummary.totalPaidUsd);
  }, [isUsd, currentBilling, usdSummary.totalPaidUsd]);

  const remainingPaymentUsd = useMemo(() => {
    if (!isUsd) return 0;
    if (currentBilling?.is_paid || usdSummary.isPaid) return 0;
    const fromBilling = Number(currentBilling?.remaining_payment_usd ?? currentBilling?.remaining_payment ?? 0);
    if (fromBilling > 0) return fromBilling;
    return usdSummary.remainingPaymentUsd;
  }, [isUsd, currentBilling, usdSummary.isPaid, usdSummary.remainingPaymentUsd]);

  // Computed amounts for IDR
  const totalTagihanIdr = useMemo(() => {
    if (isUsd) return 0;
    if (currentBilling?.grand_total && Number(currentBilling.grand_total) > 0) {
      return Number(currentBilling.grand_total);
    }
    return idrSummary.grandTotalIdr;
  }, [isUsd, currentBilling?.grand_total, idrSummary.grandTotalIdr]);

  const totalPaidIdr = useMemo(() => {
    if (isUsd) return 0;
    const fromBilling = Number(
      currentBilling?.total_paid ??
      (Number(currentBilling?.total_cash_payment ?? 0) + Number(currentBilling?.total_bca_payment ?? 0))
    );
    return Math.max(fromBilling, idrSummary.totalPaidIdr);
  }, [isUsd, currentBilling, idrSummary.totalPaidIdr]);

  const remainingPaymentIdr = useMemo(() => {
    if (isUsd) return 0;
    if (currentBilling?.is_paid || idrSummary.isPaid) return 0;
    const fromBilling = Number(currentBilling?.remaining_payment ?? 0);
    if (fromBilling > 0) return fromBilling;
    return idrSummary.remainingPaymentIdr;
  }, [isUsd, currentBilling, idrSummary.isPaid, idrSummary.remainingPaymentIdr]);

  const totalPpn = useMemo(() => {
    if (isUsd) return 0;
    return idrSummary.totalPpn;
  }, [isUsd, idrSummary.totalPpn]);

  const totalDpp = useMemo(() => {
    if (isUsd) return 0;
    return idrSummary.totalDpp;
  }, [isUsd, idrSummary.totalDpp]);

  const isPaid = useMemo(() => {
    if (currentBilling?.is_paid) return true;
    if (isUsd) {
      return usdSummary.isPaid || (totalTagihanUsd > 0 && remainingPaymentUsd === 0);
    }
    return idrSummary.isPaid || (totalTagihanIdr > 0 && remainingPaymentIdr === 0);
  }, [currentBilling?.is_paid, isUsd, usdSummary.isPaid, totalTagihanUsd, remainingPaymentUsd, idrSummary.isPaid, totalTagihanIdr, remainingPaymentIdr]);

  // Submit payment handler
  const submitPayment = async (data: PaymentFormData) => {
    if (!companyId) {
      toast.error('Company belum dipilih');
      return;
    }
    if (!transactionId) {
      toast.error('ID transaksi tidak valid');
      return;
    }

    const bcaPaymentUsd = Number(data.bcaPayment ?? 0);
    const bcaPaymentIdr = Number(data.bcaPayment2 ?? 0);
    const cashPaymentIdr = Number(data.cashPayment ?? 0);
    const totalInputIdr = bcaPaymentIdr + cashPaymentIdr;

    if (bcaPaymentUsd <= 0 && totalInputIdr <= 0) {
      toast.error('Minimal salah satu nominal pembayaran harus lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    setValidationMessage(undefined);

    try {
      // 1. Check right amount validation (warn if incomplete)
      const valRes = await revalidateAmount();
      if (valRes.error) {
        const msg = readCheckRightAmountError(valRes.error);
        setValidationMessage(msg);
      }

      // 2. Refetch current billing to get the latest snapshot
      const refreshed = await refetchCurrentBilling();
      let activeBilling: UnitBilling | null = refreshed.data ?? currentBilling ?? null;

      // 3. Create billing if it does not exist yet
      if (!activeBilling?.id) {
        const newBillingRes = await createBillingMutation.mutateAsync({
          company_id: String(companyId),
          unit_transaction_id: String(transactionId),
        });

        const createdSnapshot = await refetchCurrentBilling();
        activeBilling = createdSnapshot.data ?? (newBillingRes as any)?.data ?? newBillingRes ?? null;
      }

      if (!activeBilling?.id) {
        throw new Error('Gagal membuat billing otomatis. Silakan refresh halaman dan coba kembali.');
      }

      // 4. Validate payment limit against actual remaining from backend
      const isUsdTx = Boolean(activeBilling.is_usd_transaction ?? isUsd);
      if (isUsdTx) {
        if (totalInputIdr > 0) {
          throw new Error('Transaksi USD ini tidak memiliki tagihan Rupiah (IDR). Gunakan pembayaran BCA USD.');
        }

        const actualRemainingUsd = activeBilling.is_paid
          ? 0
          : Number(activeBilling.remaining_payment_usd ?? activeBilling.remaining_payment ?? 0) > 0
            ? Number(activeBilling.remaining_payment_usd ?? activeBilling.remaining_payment)
            : Math.max(0, totalTagihanUsd - totalPaidUsd);

        if (actualRemainingUsd > 0 && bcaPaymentUsd > actualRemainingUsd) {
          throw new Error(`Nominal pembayaran USD melebihi sisa tagihan aktual ($ ${actualRemainingUsd.toLocaleString('en-US')}).`);
        }
      } else {
        if (bcaPaymentUsd > 0) {
          throw new Error('Transaksi IDR ini tidak memiliki tagihan USD. Gunakan pembayaran BCA IDR atau Cash IDR.');
        }

        const actualRemainingIdr = activeBilling.is_paid
          ? 0
          : Number(activeBilling.remaining_payment ?? 0) > 0
            ? Number(activeBilling.remaining_payment)
            : Math.max(0, totalTagihanIdr - totalPaidIdr);

        if (actualRemainingIdr > 0 && totalInputIdr > actualRemainingIdr) {
          throw new Error(`Nominal pembayaran IDR melebihi sisa tagihan aktual (Rp ${actualRemainingIdr.toLocaleString('id-ID')}).`);
        }
      }

      // 5. Store billing history
      await createBillingHistoryMutation.mutateAsync({
        unit_transaction_billing_id: String(activeBilling.id),
        bca_payment_amount: bcaPaymentIdr,
        cash_payment_amount: cashPaymentIdr,
        bca_payment_usd_amount: bcaPaymentUsd,
        payment_at: data.paymentDate,
        note: data.note,
        payment_proof: data.paymentProof,
      });

      // 6. Refetch all queries
      await Promise.all([
        refetchCurrentBilling(),
        refetchBillingHistory(),
        revalidateAmount(),
        isPurchase ? refetchPurchase() : refetchSales(),
      ]);

      toast.success('Pembayaran berhasil disimpan!');
    } catch (err: any) {
      const msg = readBillingApiError(err);
      if (msg.toLowerCase().includes('total payment exceeds grand total')) {
        toast.error('Nominal pembayaran melebihi sisa tagihan saat ini. Silakan refresh dan sesuaikan nominal.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete history handler
  const deleteHistory = async (id: string | number) => {
    try {
      await deleteBillingHistoryMutation.mutateAsync(id);
      toast.success('Histori pembayaran berhasil dihapus');
      await Promise.all([
        refetchCurrentBilling(),
        refetchBillingHistory(),
        revalidateAmount(),
        isPurchase ? refetchPurchase() : refetchSales(),
      ]);
    } catch (err: any) {
      toast.error(readBillingApiError(err));
    }
  };

  const isLoading = (isPurchase ? purchaseLoading : salesLoading) || billingLoading || historyLoading;

  return {
    code,
    isUsd,
    isPaid,
    billing: currentBilling ?? null,
    histories: billingHistories,
    totalTagihanUsd,
    totalPaidUsd,
    remainingPaymentUsd,
    totalTagihanIdr,
    totalPaidIdr,
    remainingPaymentIdr,
    totalDpp,
    totalPpn,
    brutoTotalUsd: usdSummary.brutoTotalUsd,
    totalDiscountUsd: usdSummary.totalDiscountUsd,
    discountUsdPercent: usdSummary.discountUsdPercent,
    brutoTotalIdr: idrSummary.brutoTotalIdr,
    totalDiscountIdr: idrSummary.totalDiscountIdr,
    discountIdrPercent: idrSummary.discountIdrPercent,
    isLoading,
    isSubmitting: isSubmitting || createBillingHistoryMutation.isPending || deleteBillingHistoryMutation.isPending,
    validationMessage,
    submitPayment,
    deleteHistory,
  };
}
