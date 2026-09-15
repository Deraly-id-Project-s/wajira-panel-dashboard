import * as React from 'react';
import { useRouter } from 'next/router';
import {
  CreditCard,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Printer,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  DoInvoiceBillingHistory,
  DoInvoiceBillingHistoryPayload,
} from '@/@types/do-invoice.types';
import { DoInvoicePaymentDialog } from '@/components/features/do-invoice/DoInvoicePaymentDialog';
import { DoInvoicePrintDocument } from '@/components/features/do-invoice/DoInvoicePrintDocument';
import {
  formatInvoiceDate,
  formatInvoiceMoney,
} from '@/components/features/do-invoice/do-invoice.utils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompany } from '@/contexts/CompanyContext';
import {
  useCreateDoInvoiceBillingHistory,
  useDeleteDoInvoiceBillingHistory,
  useDoInvoiceDetail,
  useUpdateDoInvoiceBilling,
  useUpdateDoInvoiceBillingHistory,
} from '@/hooks/useDoInvoice';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import {
  getCompanyName,
  getLetterheadByCompanyId,
  resolveCompanyId,
} from '@/lib/print-letterhead';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { Badge } from '@/components/ui/badge';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImagePreview } from '@/components/ui/image-preview';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { getObjectStorageUrl } from '@/components/ui/storage-image';

interface PaymentProofLinkProps {
  path?: string | null;
  onPreviewImage?: (url: string) => void;
}

function PaymentProofLink({ path, onPreviewImage }: PaymentProofLinkProps) {
  const url = getObjectStorageUrl(path);
  if (!/^https?:\/\//i.test(url)) return null;

  const isPdf = /\.pdf($|\?)/i.test(url);

  if (isPdf || !onPreviewImage) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-800 hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        <span>Lihat bukti bayar</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPreviewImage(url)}
      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-800 hover:underline cursor-pointer"
    >
      <ImageIcon className="h-3.5 w-3.5" />
      <span>Lihat bukti bayar</span>
    </button>
  );
}

export default function DoInvoiceDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = router.isReady && typeof router.query.id === 'string' ? router.query.id : '';
  const { companyId } = useCompany();
  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('transaction:edit');
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId) || 1;
  const fallbackBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(fallbackBackground);
  const detailQuery = useDoInvoiceDetail(id || null);
  const createPayment = useCreateDoInvoiceBillingHistory(id);
  const updatePayment = useUpdateDoInvoiceBillingHistory(id);
  const deletePayment = useDeleteDoInvoiceBillingHistory(id);
  const updateBilling = useUpdateDoInvoiceBilling(id);

  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [editingHistory, setEditingHistory] = React.useState<DoInvoiceBillingHistory | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DoInvoiceBillingHistory | null>(null);
  const [paidConfirmOpen, setPaidConfirmOpen] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  const invoice = detailQuery.data;
  const billing = invoice?.billing;

  const backToList = () => void router.push(`/dashboard/${slug}/administrasi/do-invoice`);

  const handleOpenCreatePayment = () => {
    setEditingHistory(null);
    setPaymentOpen(true);
  };

  const handleOpenEditPayment = (history: DoInvoiceBillingHistory) => {
    setEditingHistory(history);
    setPaymentOpen(true);
  };

  const submitPayment = async (payload: DoInvoiceBillingHistoryPayload) => {
    try {
      if (editingHistory) {
        await updatePayment.mutateAsync({ id: editingHistory.id, payload });
      } else {
        await createPayment.mutateAsync(payload);
      }
      toast.success(
        editingHistory
          ? 'Pembayaran berhasil diperbarui'
          : 'Pembayaran berhasil ditambahkan',
      );
      setPaymentOpen(false);
      setEditingHistory(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePayment.mutateAsync(deleteTarget.id);
      toast.success('Riwayat pembayaran berhasil dihapus');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const confirmPaidStatus = async () => {
    if (!billing) return;
    try {
      await updateBilling.mutateAsync({
        id: billing.id,
        payload: {
          is_paid: !billing.isPaid,
          last_payment_at: billing.isPaid
            ? billing.lastPaymentAt?.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
        },
      });
      toast.success(`Billing ditandai ${billing.isPaid ? 'belum lunas' : 'lunas'}`);
      setPaidConfirmOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const paymentColumns = React.useMemo<ColumnDef<DoInvoiceBillingHistory>[]>(
    () => [
      {
        header: 'Tanggal',
        accessorKey: 'paymentAt',
        sortable: true,
        cell: (item) => (
          <span className="font-medium text-slate-900">
            {formatInvoiceDate(item.paymentAt)}
          </span>
        ),
      },
      {
        header: 'Kas',
        accessorKey: 'cashPaymentAmount',
        alignment: 'right',
        sortable: true,
        cell: (item) => (
          <span className="font-medium text-slate-900">
            {formatInvoiceMoney(item.cashPaymentAmount)}
          </span>
        ),
      },
      {
        header: 'BCA IDR',
        accessorKey: 'bcaPaymentAmount',
        alignment: 'right',
        sortable: true,
        cell: (item) => (
          <span className="font-medium text-slate-900">
            {formatInvoiceMoney(item.bcaPaymentAmount)}
          </span>
        ),
      },
      {
        header: 'BCA USD',
        accessorKey: 'bcaPaymentUsdAmount',
        alignment: 'right',
        sortable: true,
        cell: (item) => (
          <span className="font-medium text-slate-900">
            {formatInvoiceMoney(item.bcaPaymentUsdAmount, 'USD')}
          </span>
        ),
      },
      {
        header: 'Catatan / Bukti',
        className: 'max-w-[260px] break-words',
        cell: (item) => (
          <div className="space-y-1">
            <p className="text-slate-800">{item.note || '-'}</p>
            <PaymentProofLink
              path={item.paymentProof}
              onPreviewImage={setPreviewImage}
            />
          </div>
        ),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={!canEdit && !item.paymentProof}
                  className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg"
              >
                {item.paymentProof && (
                  <DropdownMenuItem
                    onClick={() => {
                      const url = getObjectStorageUrl(item.paymentProof);
                      if (url) {
                        if (/\.pdf($|\?)/i.test(url)) {
                          window.open(url, '_blank');
                        } else {
                          setPreviewImage(url);
                        }
                      }
                    }}
                    className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                  >
                    Lihat Bukti
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  disabled={!canEdit}
                  onClick={() => handleOpenEditPayment(item)}
                  className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canEdit}
                  onClick={() => setDeleteTarget(item)}
                  className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canEdit],
  );

  if (!router.isReady || detailQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-slate-500">Data DO invoice tidak ditemukan.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={backToList}
          >
            Kembali ke Daftar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const summaryCards = [
    {
      label: 'Nominal Invoice',
      value: formatInvoiceMoney(invoice.nominal || billing?.grandTotal),
      valueClass: 'text-slate-950',
    },
    {
      label: 'Total Dibayar',
      value: formatInvoiceMoney(billing?.totalPaid ?? invoice.paidNominal),
      valueClass: 'text-emerald-600',
    },
    {
      label: 'Sisa Tagihan',
      value: formatInvoiceMoney(billing?.remainingPayment ?? invoice.billingRemainingNominal),
      valueClass: 'text-rose-600',
    },
    {
      label: 'Jumlah Pembayaran',
      value: `${billing?.totalPaymentCount ?? billing?.histories.length ?? 0} transaksi`,
      valueClass: 'text-slate-950',
    },
  ];

  const invoiceInfo = [
    { label: 'Kode Order', value: invoice.orderList?.code },
    { label: 'Customer', value: invoice.customer?.name || invoice.orderList?.customer?.name },
    { label: 'Tanggal', value: formatInvoiceDate(invoice.date) },
    { label: 'Perihal', value: invoice.subject },
    { label: 'Biaya Lain', value: formatInvoiceMoney(invoice.otherFee) },
    { label: 'Biaya Tambahan', value: formatInvoiceMoney(invoice.additionalFee) },
    { label: 'Terakhir Bayar', value: formatInvoiceDate(billing?.lastPaymentAt) },
    { label: 'Status Print', value: invoice.isAlreadyPrint ? 'Sudah diprint' : 'Belum diprint' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Page Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'DO Invoice', onClick: backToList },
            { label: 'Detail Invoice' },
          ]}
          title="Detail DO Invoice"
          onBack={backToList}
          subtitle={
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-600">{invoice.code}</span>
              <Badge
                variant="outline"
                className={
                  invoice.isPaid
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }
              >
                {invoice.isPaid ? 'Lunas' : 'Belum Lunas'}
              </Badge>
            </div>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={templatePrint.openPrintDialog}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
              {billing && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canEdit || updateBilling.isPending}
                  onClick={() => setPaidConfirmOpen(true)}
                >
                  {billing.isPaid ? 'Tandai Belum Lunas' : 'Tandai Lunas'}
                </Button>
              )}
            </div>
          }
        />

        {/* Metric Cards */}
        <section aria-label="Statistik Tagihan dan Pembayaran">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label} className="border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <p className={`mt-1 text-lg font-bold sm:text-xl ${card.valueClass}`}>
                    {card.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Informasi Invoice */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
            <div className="rounded-md bg-orange-100 p-2 text-orange-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-950">
                Informasi Invoice
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Rincian informasi data DO invoice dan pemesanan
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-5 sm:p-6">
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {invoiceInfo.map((info) => (
                <div key={info.label} className="space-y-1">
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {info.label}
                  </dt>
                  <dd className="text-sm font-semibold text-slate-950">
                    {info.value || '-'}
                  </dd>
                </div>
              ))}
            </dl>

            {invoice.description && (
              <div className="rounded-md border border-slate-200/60 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Keterangan
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {invoice.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Riwayat Pembayaran */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-orange-100 p-2 text-orange-700">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-950">
                  Riwayat Pembayaran
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Kas, BCA IDR, dan BCA USD.
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!canEdit || !billing || billing.isPaid}
              onClick={handleOpenCreatePayment}
              className="gap-2 self-start sm:self-auto"
            >
              <CreditCard className="h-4 w-4" />
              <span>Tambah Pembayaran</span>
            </Button>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <BaseTable<DoInvoiceBillingHistory>
              data={billing?.histories ?? []}
              columns={paymentColumns}
              defaultSort={{ key: 'paymentAt', direction: 'desc' }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialog Form Tambah / Edit Pembayaran */}
      {billing && (
        <DoInvoicePaymentDialog
          open={paymentOpen}
          billingId={billing.id}
          history={editingHistory}
          isSubmitting={createPayment.isPending || updatePayment.isPending}
          onOpenChange={(open) => {
            setPaymentOpen(open);
            if (!open) setEditingHistory(null);
          }}
          onSubmit={submitPayment}
        />
      )}

      {/* Dialog Konfirmasi Hapus Pembayaran */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent closeOnInteractOutside={!deletePayment.isPending}>
          <DialogHeader>
            <DialogTitle>Hapus riwayat pembayaran?</DialogTitle>
            <DialogDescription>
              Data pembayaran ini akan dihapus dan saldo billing akan dihitung ulang.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deletePayment.isPending}
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={deletePayment.isPending}
              onClick={() => void confirmDelete()}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Ubah Status Billing */}
      <Dialog open={paidConfirmOpen} onOpenChange={setPaidConfirmOpen}>
        <DialogContent closeOnInteractOutside={!updateBilling.isPending}>
          <DialogHeader>
            <DialogTitle>Ubah status billing?</DialogTitle>
            <DialogDescription>
              Billing {invoice.code} akan ditandai{' '}
              {billing?.isPaid ? 'belum lunas' : 'lunas'} secara manual.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={updateBilling.isPending}
              onClick={() => setPaidConfirmOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              loading={updateBilling.isPending}
              onClick={() => void confirmPaidStatus()}
            >
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Gambar Bukti Pembayaran */}
      <ImagePreview
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        src={previewImage}
      />

      <DoInvoicePrintDocument
        invoice={invoice}
        template={templatePrint.selectedTemplate}
        fallbackBackground={fallbackBackground}
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
        reportName="DO invoice"
      />
    </DashboardLayout>
  );
}

