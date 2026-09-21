'use client';


import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { type PaymentFormData } from '@/components/features/unit-transaksi/UnitTransactionPaymentForm';
import { UnitTransactionPaymentPageView } from '@/components/features/unit-transaksi/UnitTransactionPaymentPageView';
import { usePurchaseById } from '@/hooks/useUnitTransaction';
import {
  useBillingHistory,
  useBillingValidation,
  useCreateBillingHistory,
  useCreateBillingV2,
  useCurrentBilling,
  useDeleteBillingHistory,
} from '@/hooks/useUnitBilling';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { getHistoryTotalIdrEquivalent } from '@/utils/payment-helpers';
import { LoadingState } from '@/components/ui/loading-state';

const readApiError = (error: any): string => {
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
  return error?.response?.data?.message || error?.message || 'Unexpected server error';
};

const readCheckRightAmountError = (error: any): string => {
  const payload = error?.response?.data ?? {};
  const errors = payload?.errors ?? error?.details;

  const invalidItems = errors?.invalid_items;
  const summary = errors?.summary;
  const hint = errors?.hint;

  if (!invalidItems && !summary && !hint) {
    return readApiError(error);
  }

  const invalidArray = Array.isArray(invalidItems)
    ? invalidItems
    : Array.isArray(summary)
      ? summary.filter((item: any) => item?.is_valid === false)
      : [];

  if (invalidArray.length === 0) {
    return hint ? `Validasi billing gagal. ${String(hint)}` : 'Validasi billing gagal. Lengkapi detail unit terlebih dahulu.';
  }

  const detailText = invalidArray
    .map((item: any) => {
      const itemId = item?.item_id ?? item?.unit_transaction_item_id ?? '-';
      const diff = item?.difference ?? (Number(item?.qty_input ?? 0) - Number(item?.qty_actual ?? 0));
      return `Item ${itemId}: kurang ${Number(diff) > 0 ? Number(diff) : 0} unit`;
    })
    .join('; ');

  return `Data pada Detail Unit Tipe belum lengkap ${detailText}.`;
};

export default function PurchasePaymentPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const purchaseId = String(id ?? '');
  const { companyId } = useCompany();
  const { data: purchase, isLoading: purchaseLoading } = usePurchaseById(purchaseId);
  const { refetch: revalidateAmount } = useBillingValidation(
    companyId ? String(companyId) : undefined,
    purchaseId,
    { enabled: false },
  );
  const { data: currentBilling, isLoading: billingLoading, refetch: refetchCurrentBilling } = useCurrentBilling(purchaseId);
  const billingId = String(currentBilling?.id ?? '');
  const { data: billingHistories = [], isLoading: historyLoading, refetch: refetchBillingHistory } = useBillingHistory(billingId || undefined, purchaseId);
  const createBilling = useCreateBillingV2();
  const createBillingHistory = useCreateBillingHistory();
  const deleteBillingHistory = useDeleteBillingHistory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | undefined>(undefined);

  const purchaseBruto = Number(purchase?.unit_transaction_bruto_total ?? purchase?.unit_transaction_item_bruto_total ?? 0);
  const billingGrandTotal = Number(currentBilling?.grand_total ?? 0);
  const totalTagihan = billingGrandTotal > 0 ? billingGrandTotal : purchaseBruto;
  const totalPpn = Number((purchase as any)?.unit_transaction_item_total_ppn ?? (purchase as any)?.transaction_ppn_total ?? (purchase as any)?.unit_transaction_ppn_total ?? 0);
  const totalTagihanUsd = Number(purchase?.unit_transaction_price_usd_total ?? 0);
  const totalTagihanUsdActual = Number(purchase?.unit_transaction_price_usd_total_actual ?? 0);

  const historyPaid = (billingHistories ?? []).reduce(
    (acc, item) => acc + getHistoryTotalIdrEquivalent(item),
    0,
  );
  const totalPaidFromBilling = Number(currentBilling?.total_paid ?? (Number(currentBilling?.bca_payment ?? 0) + Number(currentBilling?.cash_payment ?? 0) + Number(currentBilling?.bca_payment_2 ?? 0)));
  const totalPaid = currentBilling?.is_paid ? Math.max(totalPaidFromBilling, historyPaid) : historyPaid;

  const ensureBaseData = () => {
    if (!companyId) {
      toast.error('Company belum dipilih');
      return false;
    }
    if (!purchaseId) {
      toast.error('ID transaksi tidak valid');
      return false;
    }
    return true;
  };

  const handleDeleteHistory = async (id: string | number) => {
    try {
      await deleteBillingHistory.mutateAsync(id);
      toast.success('Histori pembayaran berhasil dihapus');
      await Promise.all([refetchCurrentBilling(), refetchBillingHistory(), revalidateAmount()]);
    } catch (error: any) {
      toast.error(readApiError(error));
    }
  };

  const handleSubmitPayment = async (data: PaymentFormData) => {
    if (!ensureBaseData()) return;

    setIsSubmitting(true);
    setValidationMessage(undefined);
    try {
      const refreshedBilling = await refetchCurrentBilling();
      const latestBilling = refreshedBilling.data ?? currentBilling;
      const latestGrandTotal = Number(latestBilling?.grand_total ?? totalTagihan);
      const latestPaid = Number(latestBilling?.total_paid ?? totalPaid);
      const latestRemaining = latestBilling?.is_paid
        ? 0
        : Math.max(0, Number(latestBilling?.remaining_payment ?? (latestGrandTotal - latestPaid)));

      const inputPaymentIdr = Number(data.cashPayment ?? 0) + Number(data.bcaPayment2 ?? 0);
      const inputPaymentUsd = Number(data.bcaPayment ?? 0);
      const totalPaidUsdFromHistory = (billingHistories ?? []).reduce((acc, item) => acc + (item.bca_payment_usd_amount ?? 0), 0);
      const tagihanUsdVal = totalTagihanUsdActual > 0 ? totalTagihanUsdActual : totalTagihanUsd;
      const latestRemainingUsd = latestBilling?.is_paid
        ? 0
        : Number(latestBilling?.remaining_payment_usd) > 0
          ? Number(latestBilling?.remaining_payment_usd)
          : Math.max(0, tagihanUsdVal - totalPaidUsdFromHistory);

      if (inputPaymentIdr > latestRemaining) {
        throw new Error('Nominal pembayaran IDR melebihi sisa tagihan Rupiah.');
      }
      if (latestRemainingUsd > 0 && inputPaymentUsd > latestRemainingUsd) {
        throw new Error('Nominal pembayaran USD melebihi sisa tagihan USD.');
      }

      const validationResult = await revalidateAmount();
      if (validationResult.error) {
        const message = readCheckRightAmountError(validationResult.error);
        setValidationMessage(message);
      }

      let billing = latestBilling ?? currentBilling;
      if (!billing?.id) {
        const newBillingResponse = await createBilling.mutateAsync({
          company_id: String(companyId),
          unit_transaction_id: purchaseId,
        });

        const createdSnapshot = await refetchCurrentBilling();
        billing = createdSnapshot.data ?? (newBillingResponse as any)?.data ?? newBillingResponse ?? null;
      }

      if (!billing?.id) {
        throw new Error('Gagal membuat billing otomatis. Silakan coba lagi atau buat billing manual.');
      }

      // RE-CHECK against the actual billing generated by backend
      const actualRemainingIdr = billing?.is_paid
        ? 0
        : Math.max(0, Number(billing?.remaining_payment ?? billing?.grand_total ?? 0));
      const actualRemainingUsd = billing?.is_paid
        ? 0
        : Number(billing?.remaining_payment_usd) > 0
          ? Number(billing?.remaining_payment_usd)
          : Math.max(0, tagihanUsdVal - totalPaidUsdFromHistory);

      if (inputPaymentIdr > actualRemainingIdr) {
        await Promise.all([refetchCurrentBilling(), refetchBillingHistory()]);
        toast.error(`Nominal pembayaran IDR melebihi sisa tagihan Rupiah aktual (Rp ${actualRemainingIdr.toLocaleString('id-ID')}). Halaman telah diperbarui, silakan sesuaikan nominal.`);
        return;
      }
      if (actualRemainingUsd > 0 && inputPaymentUsd > actualRemainingUsd) {
        await Promise.all([refetchCurrentBilling(), refetchBillingHistory()]);
        toast.error(`Nominal pembayaran USD melebihi sisa tagihan USD aktual ($ ${actualRemainingUsd.toLocaleString('en-US')}). Halaman telah diperbarui, silakan sesuaikan nominal.`);
        return;
      }

      await createBillingHistory.mutateAsync({
        unit_transaction_billing_id: String(billing.id),
        bca_payment_amount: Number(data.bcaPayment2 ?? 0),
        cash_payment_amount: Number(data.cashPayment ?? 0),
        bca_payment_usd_amount: Number(data.bcaPayment ?? 0),
        payment_at: data.paymentDate,
        note: data.note,
        payment_proof: data.paymentProof,
      });

      await Promise.all([refetchCurrentBilling(), refetchBillingHistory(), revalidateAmount()]);
      toast.success('Pembayaran berhasil disimpan ke histori');
    } catch (error: any) {
      const message = readApiError(error);
      if (message.toLowerCase().includes('total payment exceeds grand total')) {
        toast.error('Nominal pembayaran melebihi sisa tagihan saat ini. Silakan refresh lalu gunakan nominal sesuai Sisa Bayar.');
        return;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (purchaseLoading || billingLoading || historyLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!purchase) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Pembelian tidak ditemukan</p>
          <button onClick={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`)}>
            Kembali ke List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <UnitTransactionPaymentPageView
      type="purchase"
      transactionId={purchaseId}
      code={purchase.code}
      totalTagihan={totalTagihan}
      totalPpn={totalPpn}
      totalTagihanUsd={totalTagihanUsd}
      totalTagihanUsdActual={totalTagihanUsdActual}
      billing={currentBilling ?? null}
      histories={billingHistories}
      onSubmitPayment={handleSubmitPayment}
      onDeleteHistory={handleDeleteHistory}
      loading={isSubmitting || createBillingHistory.isPending}
      validationMessage={validationMessage}
    />
  );
}
