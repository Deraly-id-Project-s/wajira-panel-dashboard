'use client';


import { useState } from 'react';
import { useRouter } from 'next/router';
import { type PaymentFormData } from '@/components/features/unit-transaksi/UnitTransactionPaymentForm';
import { UnitTransactionPaymentPageView } from '@/components/features/unit-transaksi/UnitTransactionPaymentPageView';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { useSalesDetail } from '@/hooks/useSales';
import {
  useBillingValidation,
  useCreateBillingHistory,
  useCreateBillingV2,
  useCurrentBilling,
  useBillingHistory,
  useDeleteBillingHistory,
} from '@/hooks/useUnitBilling';
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

  return error?.response?.data?.message || error?.message || 'Gagal menyimpan pembayaran.';
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
      const diff = item?.difference_total ?? item?.difference ?? (Number(item?.qty_input ?? 0) - Number(item?.qty_actual ?? 0));
      return `Item ${itemId}: kurang ${Number(diff) > 0 ? Number(diff) : 0} unit`;
    })
    .join('; ');

  return `Data pada Detail Unit Tipe belum lengkap ${detailText}.`;
};

export default function SalesPaymentPage() {
  const router = useRouter();
  const { id } = router.query;
  const salesId = Array.isArray(id) ? id[0] : id;
  const { companyId } = useCompany();
  const { data: salesDetail, isLoading: salesLoading } = useSalesDetail(salesId);
  const { refetch: revalidateAmount } = useBillingValidation(
    companyId ? String(companyId) : undefined,
    salesId ? String(salesId) : undefined,
    { enabled: false },
  );
  const {
    data: existingBilling,
    isLoading: billingLoading,
    refetch: refetchCurrentBilling,
  } = useCurrentBilling(salesId ? String(salesId) : undefined);
  const billingId = String(existingBilling?.id ?? '');
  const {
    data: billingHistories = [],
    isLoading: historyLoading,
    refetch: refetchBillingHistory,
  } = useBillingHistory(billingId || undefined, salesId ? String(salesId) : undefined);
  const createBilling = useCreateBillingV2();
  const createBillingHistory = useCreateBillingHistory();
  const deleteBillingHistory = useDeleteBillingHistory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | undefined>(undefined);

  const salesData = salesDetail?.ui ?? null;

  const handleDeleteHistory = async (id: string | number) => {
    try {
      await deleteBillingHistory.mutateAsync(id);
      toast.success('Histori pembayaran berhasil dihapus');
      await Promise.all([refetchCurrentBilling(), refetchBillingHistory(), revalidateAmount()]);
    } catch (error: any) {
      toast.error(readApiError(error));
    }
  };

  const totalTagihan = Number(existingBilling?.grand_total ?? salesData?.totalJual ?? 0);
  const totalDpp = Number(salesData?.totalDpp ?? 0);
  const totalPpn = Number(salesData?.totalPpn ?? 0);
  const totalTagihanUsd = Number(salesDetail?.raw?.unit_transaction_price_usd_total ?? 0);
  const totalTagihanUsdActual = Number(salesDetail?.raw?.unit_transaction_price_usd_total_actual ?? 0);

  const handleSubmitPayment = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      if (!salesId) {
        toast.error('Data penjualan tidak valid');
        return;
      }
      if (!companyId) {
        toast.error('Company belum dipilih');
        return;
      }

      const inputPaymentIdr = Number(data.cashPayment ?? 0) + Number(data.bcaPayment2 ?? 0);
      const inputPaymentUsd = Number(data.bcaPayment ?? 0);

      if (inputPaymentIdr <= 0 && inputPaymentUsd <= 0) {
        toast.error('Minimal salah satu nominal pembayaran harus lebih dari 0.');
        return;
      }

      setValidationMessage(undefined);

      const validationResult = await revalidateAmount();
      if (validationResult.error) {
        const message = readCheckRightAmountError(validationResult.error);
        setValidationMessage(message);
      }

      const refreshedBilling = await refetchCurrentBilling();
      let billing = refreshedBilling.data ?? existingBilling ?? null;

      const totalPaidUsdFromHistory = (billingHistories ?? []).reduce((acc, item) => acc + (item.bca_payment_usd_amount ?? 0), 0);
      const tagihanUsdVal = totalTagihanUsdActual > 0 ? totalTagihanUsdActual : totalTagihanUsd;
      const latestRemainingUsd = billing?.is_paid
        ? 0
        : Number(billing?.remaining_payment_usd) > 0
          ? Number(billing?.remaining_payment_usd)
          : Math.max(0, tagihanUsdVal - totalPaidUsdFromHistory);
      const latestGrandTotal = Number(billing?.grand_total ?? totalTagihan);
      const latestPaid = Number(billing?.total_paid ?? 0);
      const latestRemaining = billing?.is_paid
        ? 0
        : Math.max(0, Number(billing?.remaining_payment ?? (latestGrandTotal - latestPaid)));

      if (inputPaymentIdr > latestRemaining && latestRemaining > 0) {
        toast.error('Nominal pembayaran IDR melebihi sisa tagihan saat ini.');
        return;
      }
      if (latestRemainingUsd > 0 && inputPaymentUsd > latestRemainingUsd) {
        toast.error('Nominal pembayaran USD melebihi sisa tagihan USD saat ini.');
        return;
      }

      if (!billing?.id) {
        const newBillingResponse = await createBilling.mutateAsync({
          company_id: String(companyId),
          unit_transaction_id: salesId as string,
        });

        const createdSnapshot = await refetchCurrentBilling();
        billing = createdSnapshot.data ?? (newBillingResponse as any)?.data ?? newBillingResponse ?? null;
      }

      if (!billing?.id) {
        throw new Error('Gagal membuat billing otomatis. Silakan coba lagi atau buat billing manual.');
      }

      const actualRemainingIdr = billing?.is_paid
        ? 0
        : Math.max(0, Number(billing?.remaining_payment ?? billing?.grand_total ?? 0));
      const actualRemainingUsd = billing?.is_paid
        ? 0
        : Math.max(0, Number(billing?.remaining_payment_usd ?? 0));

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
      toast.success('Pembayaran berhasil disimpan!');
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

  if (salesLoading || billingLoading || historyLoading || !salesData) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  return (
    <UnitTransactionPaymentPageView
      type="sales"
      transactionId={String(salesId)}
      code={salesData.kodeJual}
      totalTagihan={totalTagihan}
      totalPpn={totalPpn}
      totalDpp={totalDpp}
      totalTagihanUsd={totalTagihanUsd}
      totalTagihanUsdActual={totalTagihanUsdActual}
      billing={existingBilling ?? null}
      histories={billingHistories}
      onSubmitPayment={handleSubmitPayment}
      onDeleteHistory={handleDeleteHistory}
      loading={isSubmitting || createBillingHistory.isPending}
      validationMessage={validationMessage}
    />
  );
}
