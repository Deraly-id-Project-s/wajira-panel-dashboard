import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, MoreVertical, Plus, ArrowLeft, FileText, DollarSign, Package } from 'lucide-react';
import type { UnitTransactionRefundPayment } from '@/types/refund.type';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteRefundPayment, useRefundDetail } from '@/hooks/useRefundAdministrasi';
import { toast } from 'sonner';
import PurchaseRefundPaymentDetailModal from './PurchaseRefundPaymentDetailModal';
import { RefundPaymentProgressBadge } from '@/components/features/refund/RefundPaymentProgressBadge';
import { getRefundPaymentProgressStatus } from '@/components/features/refund/refund.utils';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { LoadingState } from '@/components/ui/loading-state';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PurchaseRefundDetailPageContent({ transactionId, refundId }: { transactionId: string; refundId: string }) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [isAddDetailOpen, setIsAddDetailOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<UnitTransactionRefundPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<UnitTransactionRefundPayment | null>(null);
  const deletePaymentMutation = useDeleteRefundPayment();

  const refundQuery = useRefundDetail(refundId);
  const refund = refundQuery.data;

  const totalPaid = (refund?.payments ?? []).reduce((total, item) => total + Number(item.amount), 0);
  const lessPayment = Math.max(0, Number(refund?.refund_amount || 0) - totalPaid);
  const qty = refund?.items?.length ?? 0;

  const unitColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'TIPE UNIT',
        alignment: 'left',
        cell: (item) => (
          <ReferenceLink href={`/dashboard/${slug}/master/type-unit?search=${item?.unit_transaction_item?.unit_type?.name}`}>
            {item?.unit_transaction_item?.unit_type?.name || '-'}
          </ReferenceLink>
        )
      },
      {
        header: 'WARNA',
        alignment: 'left',
        cell: (item) => item.color || '-',
      },
      {
        header: 'NO. MESIN',
        alignment: 'left',
        cell: (item) => <CopyBox text={item.machine_number || '-'} />,
      },
      {
        header: 'NO. RANGKA',
        alignment: 'left',
        cell: (item) => <CopyBox text={item.chassis_number || '-'} />,
      },
      {
        header: 'STATUS UNIT',
        alignment: 'left',
        cell: (item) => (
          <Badge variant="outline" className={`${item.status === 'refunded' || item.status === 'returned' ? 'border-orange-200 bg-orange-50 text-orange-700' : item.status === 'receive' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-700'} font-semibold`}>
            {item.status}
          </Badge>
        ),
      },
      {
        header: 'TANGGAL DIBUAT',
        alignment: 'left',
        cell: (item) => formatDate(item.created_at),
      },
    ],
    [slug],
  );


  const columns = useMemo<ColumnDef<UnitTransactionRefundPayment>[]>(
    () => [
      {
        header: 'KODE REFUND',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left',
        cell: (payment) => <CopyBox text={payment.code || '-'} />,
      },
      {
        header: 'TANGGAL BAYAR REFUND',
        accessorKey: 'payment_date',
        sortable: true,
        alignment: 'left',
        cell: (payment) => formatDate(payment.payment_date),
      },
      {
        header: 'NOMINAL BAYAR',
        accessorKey: 'amount',
        sortable: true,
        alignment: 'left',
        cell: (payment) => currenciesFormat('idr', payment.amount),
      },
      {
        header: 'KETERANGAN',
        accessorKey: 'note',
        sortable: true,
        alignment: 'left',
        cell: (payment) => (
          <Badge variant="outline" className={`${payment.note ? 'border-gray-200 bg-gray-50 text-gray-700' : 'border-gray-200 bg-gray-50 text-gray-700'} font-semibold`}>
            {payment.note || 'Terbayar'}
          </Badge>
        )
      },
      {
        header: 'aksi',
        alignment: 'left',
        sticky: 'right',
        cell: (payment) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#111827]">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[162px] rounded-[14px] border border-[#E5E7EB] p-2 shadow-[0_12px_35px_rgba(15,23,42,0.14)]">
              <DropdownMenuItem className="rounded-[10px] px-4 py-3 text-sm text-[#111827]" onClick={() => setEditingPayment(payment)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-[10px] px-4 py-3 text-sm text-[#EF4444]" onClick={() => setDeletingPayment(payment)}>
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    try {
      await deletePaymentMutation.mutateAsync(deletingPayment.id);
      toast.success('Detail refund pembelian berhasil dihapus');
      setDeletingPayment(null);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus detail refund pembelian');
    }
  };

  if (refundQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!refund) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center text-[#6B7280]">Data refund pembelian tidak ditemukan.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* BREADCRUMB HEADER */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => router.push(`/dashboard/${slug}/transaksi//${transactionId}`)}>
            Penjualan Unit
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => router.push(`/dashboard/${slug}/transaksi/refund-beli?unit_transaction_id=${transactionId}`)}>
            Data Refund Pembelian
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-medium text-slate-800">Detail Data Refund Pembelian</span>
        </div>

        {/* HEADLINE & ACTIONS */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push(`/dashboard/${slug}/transaksi/refund-beli?unit_transaction_id=${transactionId}`)} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900">Detail Data Refund Pembelian</h1>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>Kode Refund:</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{refund.code}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3">
          <RefundPaymentProgressBadge status={getRefundPaymentProgressStatus(refund)} />
          <p className="text-sm text-slate-600">Pembayaran refund hanya bisa ditambahkan setelah refund ini tersimpan.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Card 1: Informasi Refund */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-50">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Informasi Refund</h3>
              </div>
              <div className="text-sm text-slate-600 mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Kode Refund</p>
                    <p className="font-semibold text-slate-900">
                      <CopyBox text={refund.code || '-'} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Tanggal Refund</p>
                    <p className="font-semibold text-slate-900">{formatDate(refund.refund_date)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Nominal Refund</span>
                  <span className="font-semibold text-slate-900">{currenciesFormat('idr', refund.refund_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total Terbayar</span>
                  <span className="font-semibold text-slate-900">{currenciesFormat('idr', totalPaid)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Kurang Bayar</span>
                  <span className="font-bold text-emerald-600">{currenciesFormat('idr', lessPayment)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Informasi Unit */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-yellow-50">
                  <Package className="h-5 w-5 text-yellow-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Informasi Unit</h3>
              </div>
              <div className="text-sm text-slate-600 mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Quantity</span>
                  <span className="font-semibold text-slate-900">{qty}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-slate-400">Alasan Refund</span>
                  <p className="text-slate-900 p-2 rounded-md bg-slate-50 w-full">
                    {refund?.note || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Detail Unit yang Direfund */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Detail Unit yang Direfund</h2>
            <p className="text-xs text-slate-500">Rincian item detail unit yang termasuk dalam refund ini</p>
          </div>
          <BaseTable
            data={refund.items ?? []}
            columns={unitColumns}
            headerRowClassName="bg-[#f8f9fa] border-b border-gray-200"
          />
        </div>

        {/* Tabel Pembayaran Refund */}
        <div className="space-y-4">
          <BaseTable
            data={refund.payments ?? []}
            columns={columns}
            headerRowClassName="bg-[#f8f9fa] border-b border-gray-200"
            defaultSort={{ key: 'payment_date', direction: 'desc' }}
            headerActions={
              <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Riwayat Pembayaran Refund</h2>
                  <p className="text-xs text-slate-500">Daftar transaksi pembayaran refund yang telah dicatat</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <Button onClick={() => setIsAddDetailOpen(true)} disabled={lessPayment === 0} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data Pembayaran Refund
                  </Button>
                </div>
              </div>
            }
          />
        </div>

        <PurchaseRefundPaymentDetailModal open={isAddDetailOpen} onClose={() => setIsAddDetailOpen(false)} refund={refund} />
        <PurchaseRefundPaymentDetailModal open={Boolean(editingPayment)} onClose={() => setEditingPayment(null)} refund={refund} payment={editingPayment} />

        <AlertDialog open={Boolean(deletingPayment)} onOpenChange={(open) => !open && setDeletingPayment(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Detail Refund Pembelian</AlertDialogTitle>
              <AlertDialogDescription>Detail refund pembelian yang dihapus tidak bisa dikembalikan. Lanjutkan?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeletePayment}>
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
