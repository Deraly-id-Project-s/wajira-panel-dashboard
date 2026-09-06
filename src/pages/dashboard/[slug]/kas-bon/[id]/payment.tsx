import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { DriverCashAdvanceBillingHistoryPayload } from '@/@types/driver-cash-advance.types';
import { KasBonPaymentForm } from '@/components/features/kas-bon/KasBonPaymentForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import {
  useCreateDriverCashAdvanceBillingHistory,
  useDriverCashAdvanceBillingDetail,
  useDriverCashAdvanceDetail,
} from '@/hooks/useDriverCashAdvance';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

export default function KasBonPaymentPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const detailQuery = useDriverCashAdvanceDetail(id);
  const billingId = detailQuery.data?.billings[0]?.id ?? null;
  const billingQuery = useDriverCashAdvanceBillingDetail(billingId);
  const createPayment = useCreateDriverCashAdvanceBillingHistory();
  const detailPath = `/dashboard/${slug}/kas-bon/${id ?? ''}`;

  const handleSubmit = async (payload: DriverCashAdvanceBillingHistoryPayload) => {
    try {
      await createPayment.mutateAsync(payload);
      toast.success('Pembayaran kas bon berhasil disimpan.');
      await Promise.all([detailQuery.refetch(), billingQuery.refetch()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  };

  if (detailQuery.isLoading || (billingId && billingQuery.isLoading)) {
    return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
  }

  if (!detailQuery.data || !billingQuery.data) {
    return (
      <DashboardLayout>
        <div className="flex min-h-64 items-center justify-center text-slate-600">Data billing kas bon tidak ditemukan.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head><title>Pembayaran Kas Bon - Wajira Dashboard</title></Head>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Kas Bon', onClick: () => void router.push(`/dashboard/${slug}/kas-bon`) },
            { label: 'Detail Kas Bon', onClick: () => void router.push(detailPath) },
            { label: 'Pembayaran' },
          ]}
          title="Pembayaran Kas Bon"
          subtitle={<><span>Subjek:</span><span className="font-semibold text-orange-600">{detailQuery.data.subject}</span></>}
          onBack={() => void router.push(detailPath)}
        />

        <Card className="rounded-md">
          <CardContent className="p-4 sm:p-6">
            <KasBonPaymentForm
              billing={billingQuery.data}
              onSubmit={handleSubmit}
              onCancel={() => void router.push(detailPath)}
              isSubmitting={createPayment.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
