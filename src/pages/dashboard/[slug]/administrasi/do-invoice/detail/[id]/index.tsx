import * as React from 'react';
import { useRouter } from 'next/router';
import { CreditCard, FileText, Pencil, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DoInvoiceBillingHistory, DoInvoiceBillingHistoryPayload } from '@/@types/do-invoice.types';
import { DoInvoicePaymentDialog } from '@/components/features/do-invoice/DoInvoicePaymentDialog';
import { DoInvoicePrintDocument } from '@/components/features/do-invoice/DoInvoicePrintDocument';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/features/do-invoice/do-invoice.utils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { useCreateDoInvoiceBillingHistory, useDeleteDoInvoiceBillingHistory, useDoInvoiceDetail, useUpdateDoInvoiceBilling, useUpdateDoInvoiceBillingHistory } from '@/hooks/useDoInvoice';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { getCompanyName, getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';

function PaymentProofLink({ path }: { path?: string | null }) {
  const url = getObjectStorageUrl(path);
  if (!/^https?:\/\//i.test(url)) return null;
  return <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs font-medium text-orange-700 hover:underline">Lihat bukti bayar</a>;
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
  const invoice = detailQuery.data;
  const billing = invoice?.billing;

  const backToList = () => void router.push(`/dashboard/${slug}/administrasi/do-invoice`);
  const submitPayment = async (payload: DoInvoiceBillingHistoryPayload) => {
    try {
      if (editingHistory) await updatePayment.mutateAsync({ id: editingHistory.id, payload });
      else await createPayment.mutateAsync(payload);
      toast.success(editingHistory ? 'Pembayaran berhasil diperbarui' : 'Pembayaran berhasil ditambahkan');
      setPaymentOpen(false);
      setEditingHistory(null);
    } catch (error) { toast.error(getApiErrorMessage(error)); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePayment.mutateAsync(deleteTarget.id);
      toast.success('Riwayat pembayaran berhasil dihapus');
      setDeleteTarget(null);
    } catch (error) { toast.error(getApiErrorMessage(error)); }
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
    } catch (error) { toast.error(getApiErrorMessage(error)); }
  };

  if (!router.isReady || detailQuery.isLoading) return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
  if (!invoice) return <DashboardLayout><div className="py-20 text-center text-sm text-slate-500">Data DO invoice tidak ditemukan.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <PageHeader
          breadcrumbs={[{ label: 'DO Invoice', onClick: backToList }, { label: 'Detail Invoice' }]}
          title="Detail DO Invoice"
          onBack={backToList}
          subtitle={<div className="flex flex-wrap items-center gap-2"><span>{invoice.code}</span><Badge variant="outline" className={invoice.isPaid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>{invoice.isPaid ? 'Lunas' : 'Belum Lunas'}</Badge></div>}
          actions={<><Button type="button" variant="outline" onClick={templatePrint.openPrintDialog}><Printer className="mr-2 h-4 w-4" />Print</Button><Button type="button" disabled={!canEdit || !billing || billing.isPaid} onClick={() => { setEditingHistory(null); setPaymentOpen(true); }}><CreditCard className="mr-2 h-4 w-4" />Tambah Pembayaran</Button>{billing ? <Button type="button" variant="outline" disabled={!canEdit || updateBilling.isPending} onClick={() => setPaidConfirmOpen(true)}>{billing.isPaid ? 'Tandai Belum Lunas' : 'Tandai Lunas'}</Button> : null}</>}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[['Nominal Invoice', formatInvoiceMoney(invoice.nominal || billing?.grandTotal)], ['Total Dibayar', formatInvoiceMoney(billing?.totalPaid ?? invoice.paidNominal)], ['Sisa Tagihan', formatInvoiceMoney(billing?.remainingPayment ?? invoice.billingRemainingNominal)], ['Jumlah Pembayaran', `${billing?.totalPaymentCount ?? billing?.histories.length ?? 0} transaksi`]].map(([label, value]) => <Card key={label}><CardContent className="p-5"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-950">{value}</p></CardContent></Card>)}
        </div>

        <Card><CardContent className="space-y-5 p-5 sm:p-6"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-orange-600" /><h2 className="font-semibold">Informasi Invoice</h2></div><dl className="grid gap-5 border-t pt-5 sm:grid-cols-2 lg:grid-cols-4">{[['Kode Order', invoice.orderList?.code], ['Customer', invoice.customer?.name || invoice.orderList?.customer?.name], ['Tanggal', formatInvoiceDate(invoice.date)], ['Perihal', invoice.subject], ['Biaya Lain', formatInvoiceMoney(invoice.other_fee)], ['Biaya Tambahan', formatInvoiceMoney(invoice.additional_fee)], ['Terakhir Bayar', formatInvoiceDate(billing?.lastPaymentAt)], ['Status Print', invoice.isAlreadyPrint ? 'Sudah diprint' : 'Belum diprint']].map(([label, value]) => <div key={label}><dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-950">{value || '-'}</dd></div>)}</dl>{invoice.description ? <p className="whitespace-pre-line rounded-md bg-slate-50 p-4 text-sm text-slate-700">{invoice.description}</p> : null}</CardContent></Card>

        <Card><CardContent className="p-0"><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-semibold">Riwayat Pembayaran</h2><p className="text-xs text-slate-500">Kas, BCA IDR, dan BCA USD.</p></div></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3 text-left">Tanggal</th><th className="px-5 py-3 text-right">Kas</th><th className="px-5 py-3 text-right">BCA IDR</th><th className="px-5 py-3 text-right">BCA USD</th><th className="px-5 py-3 text-left">Catatan / Bukti</th><th className="px-5 py-3 text-center">Aksi</th></tr></thead><tbody>{billing?.histories.length ? billing.histories.map((history) => <tr key={history.id} className="border-t"><td className="px-5 py-3">{formatInvoiceDate(history.paymentAt)}</td><td className="px-5 py-3 text-right">{formatInvoiceMoney(history.cashPaymentAmount)}</td><td className="px-5 py-3 text-right">{formatInvoiceMoney(history.bcaPaymentAmount)}</td><td className="px-5 py-3 text-right">{formatInvoiceMoney(history.bcaPaymentUsdAmount, 'USD')}</td><td className="max-w-[260px] px-5 py-3 break-words"><span>{history.note || '-'}</span><PaymentProofLink path={history.paymentProof} /></td><td className="px-5 py-3"><div className="flex justify-center gap-1"><Button type="button" size="icon" variant="ghost" disabled={!canEdit} aria-label="Edit pembayaran" onClick={() => { setEditingHistory(history); setPaymentOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" disabled={!canEdit} aria-label="Hapus pembayaran" className="text-red-600" onClick={() => setDeleteTarget(history)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>) : <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">Belum ada pembayaran.</td></tr>}</tbody></table></div></CardContent></Card>
      </div>

      {billing ? <DoInvoicePaymentDialog open={paymentOpen} billingId={billing.id} history={editingHistory} isSubmitting={createPayment.isPending || updatePayment.isPending} onOpenChange={(open) => { setPaymentOpen(open); if (!open) setEditingHistory(null); }} onSubmit={submitPayment} /> : null}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}><DialogContent closeOnInteractOutside={!deletePayment.isPending}><DialogHeader><DialogTitle>Hapus riwayat pembayaran?</DialogTitle><DialogDescription>Data pembayaran ini akan dihapus dan saldo billing akan dihitung ulang.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" disabled={deletePayment.isPending} onClick={() => setDeleteTarget(null)}>Batal</Button><Button type="button" variant="destructive" loading={deletePayment.isPending} onClick={() => void confirmDelete()}>Hapus</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={paidConfirmOpen} onOpenChange={setPaidConfirmOpen}><DialogContent closeOnInteractOutside={!updateBilling.isPending}><DialogHeader><DialogTitle>Ubah status billing?</DialogTitle><DialogDescription>Billing {invoice.code} akan ditandai {billing?.isPaid ? 'belum lunas' : 'lunas'} secara manual.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" disabled={updateBilling.isPending} onClick={() => setPaidConfirmOpen(false)}>Batal</Button><Button type="button" loading={updateBilling.isPending} onClick={() => void confirmPaidStatus()}>Konfirmasi</Button></DialogFooter></DialogContent></Dialog>
      <DoInvoicePrintDocument invoice={invoice} template={templatePrint.selectedTemplate} fallbackBackground={fallbackBackground} companyName={getCompanyName(resolvedCompanyId)} printedAt={templatePrint.printedAt} />
      <ReportTemplatePrintDialog open={templatePrint.isDialogOpen} onOpenChange={templatePrint.setIsDialogOpen} selectedTemplateId={templatePrint.selectedTemplateId} onTemplateChange={templatePrint.setSelectedTemplateId} onPrint={templatePrint.printWithSelectedTemplate} isPreparingPrint={templatePrint.isPreparingPrint} reportName="DO invoice" />
    </DashboardLayout>
  );
}
