import * as React from 'react';
import Head from 'next/head';
import { format } from 'date-fns';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { DriverCashAdvanceBillingHistoryPayload } from '@/@types/driver-cash-advance.types';
import { KasBonDetailCards } from '@/components/features/kas-bon/KasBonDetailCards';
import { KasBonPaymentDialog } from '@/components/features/kas-bon/KasBonPaymentDialog';
import { KasBonPaymentHistoryTable } from '@/components/features/kas-bon/KasBonPaymentHistoryTable';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/common/SectionCard';
import {
  useCreateDriverCashAdvanceBillingHistory,
  useDriverCashAdvanceBillingDetail,
  useDriverCashAdvanceDetail,
  useUpdateDriverCashAdvanceBillingStatus,
} from '@/hooks/useDriverCashAdvance';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

export default function KasBonDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('transaction:edit');
  const detailQuery = useDriverCashAdvanceDetail(id);
  const billingId = detailQuery.data?.billings[0]?.id ?? null;
  const billingQuery = useDriverCashAdvanceBillingDetail(billingId);
  const updateStatus = useUpdateDriverCashAdvanceBillingStatus();
  const createPayment = useCreateDriverCashAdvanceBillingHistory();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);

  const backToList = () => void router.push(`/dashboard/${slug}/kas-bon`);

  const handleMarkPaid = async () => {
    if (!billingId) return;
    try {
      await updateStatus.mutateAsync({
        id: billingId,
        payload: { last_payment_at: format(new Date(), 'yyyy-MM-dd'), is_paid: true },
      });
      toast.success('Tagihan kas bon berhasil ditandai lunas.');
      setConfirmOpen(false);
      await Promise.all([detailQuery.refetch(), billingQuery.refetch()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handlePaymentSubmit = async (payload: DriverCashAdvanceBillingHistoryPayload) => {
    try {
      await createPayment.mutateAsync(payload);
      toast.success('Pembayaran kas bon berhasil disimpan.');
      setPaymentOpen(false);
      await Promise.all([detailQuery.refetch(), billingQuery.refetch()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  };

  if (detailQuery.isLoading || (billingId && billingQuery.isLoading)) {
    return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <DashboardLayout>
        <div className="flex min-h-64 flex-col items-center justify-center gap-4">
          <p className="text-slate-600">Data kas bon tidak ditemukan.</p>
          <Button type="button" onClick={backToList}>Kembali ke Daftar</Button>
        </div>
      </DashboardLayout>
    );
  }

  const data = detailQuery.data;
  const billing = billingQuery.data ?? data.billings[0] ?? null;
  const isPaid = billing?.isPaid ?? false;

  return (
    <DashboardLayout>
      <Head><title>Detail Kas Bon - Wajira Dashboard</title></Head>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[{ label: 'Kas Bon', onClick: backToList }, { label: 'Detail Kas Bon' }]}
          title="Detail Kas Bon"
          subtitle={
            <>
              <span>{data.code || `KAS-BON-${data.id}`}</span>
              <Badge variant="outline" className={isPaid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}>
                {isPaid ? 'Lunas' : 'Belum Lunas'}
              </Badge>
            </>
          }
          onBack={backToList}
          actions={
            <>
              <Button
                type="button"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={!canEdit || !billingId || isPaid}
                onClick={() => setPaymentOpen(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" />{isPaid ? 'Sudah Dibayar' : 'Bayar'}
              </Button>
              <Button type="button" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" disabled={!canEdit || !billingId || isPaid || updateStatus.isPending} onClick={() => setConfirmOpen(true)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />{isPaid ? 'Sudah Lunas' : 'Tandai Lunas'}
              </Button>
            </>
          }
        />

        <KasBonDetailCards data={data} billing={billing} />
        {billing ? (
          <SectionCard title="Riwayat Pembayaran">
            <KasBonPaymentHistoryTable histories={billing.histories} />
          </SectionCard>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai tagihan sebagai lunas?</AlertDialogTitle>
            <AlertDialogDescription>Aksi ini akan mengubah status billing kas bon menjadi lunas dengan tanggal pembayaran hari ini.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatus.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void handleMarkPaid(); }} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" /> : 'Tandai Lunas'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {billing ? (
        <KasBonPaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          billing={billing}
          subject={data.subject}
          code={data.code}
          onSubmit={handlePaymentSubmit}
          isSubmitting={createPayment.isPending}
        />
      ) : null}
    </DashboardLayout>
  );
}
