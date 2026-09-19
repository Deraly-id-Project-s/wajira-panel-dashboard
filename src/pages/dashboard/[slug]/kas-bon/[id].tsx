import * as React from 'react';
import Head from 'next/head';
import { format } from 'date-fns';
import { CheckCircle2, CreditCard, History, Printer } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type {
  DriverCashAdvanceBillingHistory,
  DriverCashAdvanceBillingHistoryPayload,
} from '@/@types/driver-cash-advance.types';
import { KasBonDetailCards } from '@/components/features/kas-bon/KasBonDetailCards';
import { KasBonDetailPrintDocument } from '@/components/features/kas-bon/KasBonDetailPrintDocument';
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
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCompany } from '@/contexts/CompanyContext';
import {
  useCreateDriverCashAdvanceBillingHistory,
  useDeleteDriverCashAdvanceBillingHistory,
  useDriverCashAdvanceBillingDetail,
  useDriverCashAdvanceDetail,
  useUpdateDriverCashAdvanceBillingStatus,
} from '@/hooks/useDriverCashAdvance';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { getCompanyName, getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { formatKasBonDate } from '@/components/features/kas-bon/kas-bon.utils';

export default function KasBonDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(slug, companyId) || 1;
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('transaction:edit');
  const detailQuery = useDriverCashAdvanceDetail(id);
  const billingId = detailQuery.data?.billings[0]?.id ?? null;
  const billingQuery = useDriverCashAdvanceBillingDetail(billingId);
  const updateStatus = useUpdateDriverCashAdvanceBillingStatus();
  const createPayment = useCreateDriverCashAdvanceBillingHistory();
  const deletePayment = useDeleteDriverCashAdvanceBillingHistory();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);

  const backToList = () => void router.push(`/dashboard/${slug}/kas-bon`);

  const handleMarkPaid = async () => {
    const currentBilling = billingQuery.data ?? detailQuery.data?.billings[0];
    const remaining = currentBilling?.remainingPayment ?? detailQuery.data?.remaining_payment ?? detailQuery.data?.remainingPayment ?? detailQuery.data?.billingRemainingNominal;
    if (!billingId || detailQuery.data?.isApprove !== true || remaining !== 0 || currentBilling?.isPaid) return;
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

  const handleDeletePaymentHistory = async (history: DriverCashAdvanceBillingHistory) => {
    try {
      await deletePayment.mutateAsync(history.id);
      toast.success('Riwayat pembayaran berhasil dihapus.');
      await Promise.all([detailQuery.refetch(), billingQuery.refetch()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  };

  const handlePaymentSubmit = async (payload: DriverCashAdvanceBillingHistoryPayload) => {
    const currentBilling = billingQuery.data ?? detailQuery.data?.billings[0];
    const remaining = currentBilling?.remainingPayment ?? detailQuery.data?.remaining_payment ?? detailQuery.data?.remainingPayment ?? detailQuery.data?.billingRemainingNominal;
    if (detailQuery.data?.isApprove !== true || remaining === 0 || currentBilling?.isPaid) {
      toast.error('Pembayaran hanya dapat ditambahkan pada kas bon yang disetujui dan masih memiliki sisa tagihan.');
      return;
    }
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
  const remainingPayment = billing?.remainingPayment ?? data.remaining_payment ?? data.remainingPayment ?? data.billingRemainingNominal;
  const isApproved = data.isApprove === true;
  const paymentActionsUnavailable = !canEdit || !billingId || !isApproved || isPaid;
  const canMarkPaid = canEdit && Boolean(billingId) && isApproved && !isPaid && remainingPayment === 0;

  return (
    <DashboardLayout>
      <Head><title>Detail Kas Bon - Wajira Dashboard</title></Head>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[{ label: 'Kas Bon', onClick: backToList }, { label: 'Detail Kas Bon' }]}
          title="Detail Kas Bon"
          subtitle={
            <div className="flex flex-wrap items-center gap-2">
              <span>Kode Kas Bon:</span>
              <span className="font-semibold text-orange-600">{data.code || `KAS-BON-${data.id}`}</span>
              <Badge variant="outline" className={`rounded-full px-3 py-1 font-semibold ${isPaid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                {isPaid ? 'Lunas' : 'Belum Lunas'}
              </Badge>
              <Badge
                variant="outline"
                className={`rounded-full px-3 py-1 font-semibold ${Boolean(data.is_driver_request ?? data.isDriverRequest)
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-100 text-slate-700'
                  }`}
              >
                {Boolean(data.is_driver_request ?? data.isDriverRequest) ? 'Pengajuan Driver' : 'Input Kantor'}
              </Badge>
              <span className="text-xs text-slate-500">Ditambahkan {formatKasBonDate(data.createdAt)}</span>
            </div>
          }
          onBack={backToList}
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
                onClick={templatePrint.openPrintDialog}
              >
                <Printer className="h-4 w-4" />
                Print Kas Bon
              </Button>
              <Button
                type="button"
                className="min-w-[120px] bg-orange-600 font-medium text-white hover:bg-orange-700"
                disabled={paymentActionsUnavailable || remainingPayment === 0}
                onClick={() => setPaymentOpen(true)}
              >
                <CreditCard className="h-4 w-4" />
                {isPaid ? 'Sudah Dibayar' : 'Bayar'}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      type="button"
                      variant="default"
                      disabled={!canMarkPaid || updateStatus.isPending}
                      onClick={() => setConfirmOpen(true)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isPaid ? 'Sudah Lunas' : 'Tandai Lunas'}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-center text-xs">
                  Mengubah status menjadi lunas maka akan menambah data ke arus transaksi dan ke finance kas harian
                </TooltipContent>
              </Tooltip>
            </>
          }
        />

        <KasBonDetailCards data={data} billing={billing} />
        {billing ? (
          <CollapsibleBox
            title="Riwayat Pembayaran"
            description="Daftar transaksi pembayaran untuk kas bon ini"
            icon={History}
            defaultExpanded
          >
            <KasBonPaymentHistoryTable
              histories={billing.histories}
              onDelete={handleDeletePaymentHistory}
              isDeleting={deletePayment.isPending}
              canDelete={canEdit}
            />
          </CollapsibleBox>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai tagihan sebagai lunas?</AlertDialogTitle>
            <AlertDialogDescription>
              Mengubah status menjadi lunas maka akan menambah data ke arus transaksi dan ke finance kas harian. Aksi ini akan mengubah status billing kas bon menjadi lunas dengan tanggal pembayaran hari ini.
            </AlertDialogDescription>
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

      <KasBonDetailPrintDocument
        data={data}
        billing={billing}
        template={templatePrint.selectedTemplate}
        fallbackBackground={selectedPrintBackground}
        companyName={getCompanyName(resolvedCompanyId)}
        printedAt={templatePrint.printedAt}
      />

      <ReportTemplatePrintDialog
        open={templatePrint.isDialogOpen}
        onOpenChange={templatePrint.setIsDialogOpen}
        selectedTemplateId={templatePrint.selectedTemplateId}
        onTemplateChange={templatePrint.setSelectedTemplateId}
        onPrint={templatePrint.printWithSelectedTemplate}
        isPreparingPrint={templatePrint.isPreparingPrint}
        reportName="kas bon driver"
      />
    </DashboardLayout>
  );
}
