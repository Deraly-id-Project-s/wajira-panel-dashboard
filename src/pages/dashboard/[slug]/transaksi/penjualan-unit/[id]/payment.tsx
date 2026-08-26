import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { SalesPaymentForm, PaymentFormData } from '@/components/features/sales/SalesPaymentForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
import { salesService } from '@/services/sales.service';
import { unitTransactionItemSalesService } from '@/services/unitTransactionItemSales.service';
import { Button } from '@/components/ui/button';
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

const getInvalidItemIds = (error: any): string[] => {
  const payload = error?.response?.data ?? {};
  const errors = payload?.errors ?? error?.details;

  const invalidItems = Array.isArray(errors?.invalid_items) ? errors.invalid_items : [];
  const summaryItems = Array.isArray(errors?.summary)
    ? errors.summary.filter((item: any) => item?.is_valid === false)
    : [];

  const idsFromInvalid = invalidItems
    .map((item: any) => item?.item_id ?? item?.unit_transaction_item_id)
    .filter((item: any) => item !== undefined && item !== null)
    .map((item: any) => String(item));

  const idsFromSummary = summaryItems
    .map((item: any) => item?.item_id ?? item?.unit_transaction_item_id)
    .filter((item: any) => item !== undefined && item !== null)
    .map((item: any) => String(item));

  return Array.from(new Set([...idsFromInvalid, ...idsFromSummary]));
};

const hasCompleteSalesAssignmentsForInvalidItems = (salesDetailRaw: any, invalidItemIds: string[]): boolean => {
  if (!salesDetailRaw || invalidItemIds.length === 0) return false;

  const items = Array.isArray(salesDetailRaw?.unit_transaction_items) ? salesDetailRaw.unit_transaction_items : [];
  if (items.length === 0) return false;

  return invalidItemIds.every((invalidId) => {
    const row = items.find((item: any) => String(item?.id ?? '') === String(invalidId));
    if (!row) return false;

    const requiredQty = Number(row?.qty_total ?? 0);
    const assignedBySales = Array.isArray(row?.unit_transaction_item_sales) ? row.unit_transaction_item_sales.length : 0;

    return requiredQty > 0 && assignedBySales >= requiredQty;
  });
};

const hasCompleteSalesAssignmentsFromLatestSnapshot = async (salesId: string, fallbackRaw: any, invalidItemIds: string[]): Promise<boolean> => {
  if (invalidItemIds.length === 0) return false;

  if (hasCompleteSalesAssignmentsForInvalidItems(fallbackRaw, invalidItemIds)) {
    return true;
  }

  try {
    const latest = await salesService.getSalesDetail(salesId);
    return hasCompleteSalesAssignmentsForInvalidItems(latest, invalidItemIds);
  } catch {
    return false;
  }
};

const hasCompleteAssignmentsFromUnitItems = async (invalidItemIds: string[]): Promise<boolean> => {
  if (invalidItemIds.length === 0) return false;

  const checks = await Promise.allSettled(
    invalidItemIds.map(async (itemId) => {
      const unitItem = await unitTransactionItemSalesService.getUnitItemById(String(itemId));
      const requiredQty = Number(unitItem?.qty_total ?? 0);
      const assignedBySales = Array.isArray(unitItem?.unit_transaction_item_sales) ? unitItem.unit_transaction_item_sales.length : 0;
      const assignedByDetails = Array.isArray(unitItem?.unit_transaction_item_details) ? unitItem.unit_transaction_item_details.length : 0;
      const assigned = Math.max(assignedBySales, assignedByDetails);

      return requiredQty > 0 && assigned >= requiredQty;
    }),
  );

  return checks.every((result) => result.status === 'fulfilled' && result.value === true);
};

/**
 * Pembayaran Unit Page
 */
export default function PaymentPage() {
  const router = useRouter();
  const { id, slug } = router.query;
  const salesId = Array.isArray(id) ? id[0] : id;
  const slugValue = Array.isArray(slug) ? slug[0] : slug || '';
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
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const salesData = salesDetail?.ui ?? null;

  const handleDeleteHistory = async (id: string | number) => {
    try {
      await deleteBillingHistory.mutateAsync(id);
      toast.success('Histori pembayaran berhasil dihapus');
      setDeleteId(null);
      await Promise.all([refetchCurrentBilling(), refetchBillingHistory(), revalidateAmount()]);
    } catch (error: any) {
      toast.error(readApiError(error));
    }
  };

  // Billing harus mengikuti total transaksi utama (unit transaction),
  // bukan agregasi item detail yang bisa berbeda kontrak datanya.
  const totalTagihan = Number(existingBilling?.grand_total ?? salesData?.totalJual ?? 0);

  const totalDpp = Number(salesData?.totalDpp ?? 0);
  const totalPpn = Number(salesData?.totalPpn ?? 0);

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

      const latestRemainingUsd = Number(billing?.remaining_payment_usd ?? 0);
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

      // RE-CHECK against the actual billing generated by backend
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
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Penjualan Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/penjualan-unit`) },
            { label: 'Detail Penjualan', onClick: () => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${salesId}`) },
            { label: 'Billing Penjualan Unit' }
          ]}
          title="Billing Penjualan Unit"
          subtitle={
            <>
              <span>Kode Jual:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{salesData.kodeJual}</span>
            </>
          }
          onBack={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${salesId}`)}
        />

        <Card className="rounded-md">
          <CardContent className="p-6">
            <SalesPaymentForm
              salesCode={salesData.kodeJual}
              totalTagihan={totalTagihan}
              totalPpn={totalPpn}
              totalDpp={totalDpp}
              billing={existingBilling ?? null}
              histories={billingHistories}
              onSubmitPayment={handleSubmitPayment}
              onDeleteHistory={handleDeleteHistory}
              onCancel={() => router.back()}
              loading={isSubmitting || createBillingHistory.isPending}
              canSubmit={true}
              validationMessage={validationMessage}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
