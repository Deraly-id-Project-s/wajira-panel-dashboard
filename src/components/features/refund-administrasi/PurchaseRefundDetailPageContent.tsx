import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, MoreVertical, Plus, ArrowLeft, FileText, DollarSign, Package, CheckCircle2 } from 'lucide-react';
import type { UnitTransactionRefundPayment } from '@/@types/refund.type';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { TextTruncate } from '@/components/ui/text-truncate';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteRefundPayment, useRefundDetail, useUpdateRefundPaidStatus } from '@/hooks/useRefundAdministrasi';
import { toast } from 'sonner';
import PurchaseRefundPaymentDetailModal from './PurchaseRefundPaymentDetailModal';
import { RefundPaymentProgressBadge } from '@/components/features/refund/RefundPaymentProgressBadge';
import { getRefundPaymentProgressStatus } from '@/components/features/refund/refund.utils';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { formatDate } from '@/components/ui/format-date';
import { LoadingState } from '@/components/ui/loading-state';
import { usePurchaseById } from '@/hooks/usePurchase';
import { isUnitUsdTransaction } from '@/utils/payment-helpers';

export default function PurchaseRefundDetailPageContent({ transactionId, refundId }: { transactionId: string; refundId: string }) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [isAddDetailOpen, setIsAddDetailOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<UnitTransactionRefundPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<UnitTransactionRefundPayment | null>(null);
  const [isMarkAsPaidOpen, setIsMarkAsPaidOpen] = useState(false);
  const deletePaymentMutation = useDeleteRefundPayment();
  const updatePaidStatusMutation = useUpdateRefundPaidStatus();

  const refundQuery = useRefundDetail(refundId);
  const refund = refundQuery.data;

  const targetPurchaseId = transactionId || refund?.unit_transaction_id || '';
  const { data: purchase } = usePurchaseById(targetPurchaseId);
  const isUsdTransaction = isUnitUsdTransaction(refund?.transaction ?? (refund as any)?.unit_transaction ?? refund ?? purchase);
  const currencyCode = isUsdTransaction ? 'usd' : 'idr';

  const totalPaid = (refund?.payments ?? []).reduce((total, item) => total + Number(item.amount), 0);
  const lessPayment = Math.max(0, Number(refund?.refund_amount || 0) - totalPaid);
  const isPaid = Boolean(refund?.is_paid || (lessPayment === 0 && Number(refund?.refund_amount || 0) > 0));
  const qty = refund?.items?.length ?? 0;

  const handleTogglePaidStatus = async () => {
    if (!refund) return;
    try {
      await updatePaidStatusMutation.mutateAsync({
        id: refund.id,
        payload: {
          is_paid: !refund.is_paid,
          note: !refund.is_paid ? 'Pelunasan penuh refund unit' : 'Batal pelunasan refund unit',
        },
      });
      toast.success(!refund.is_paid ? 'Refund berhasil ditandai lunas' : 'Status lunas refund berhasil dibatalkan');
      setIsMarkAsPaidOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal mengubah status lunas refund');
    }
  };

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
        cell: (payment) => currenciesFormat(currencyCode, payment.amount),
      },
      {
        header: 'KETERANGAN',
        accessorKey: 'note',
        sortable: true,
        alignment: 'left',
        cell: (payment) => (
          <TextTruncate
            text={payment.note || 'Terbayar'}
            maxWords={35}
            className="text-sm text-slate-700"
          />
        ),
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
    [currencyCode],
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
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${transactionId || refund.unit_transaction_id}`)}>
            Pembelian Unit
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => router.push(`/dashboard/${slug}/transaksi/refund-beli?unit_transaction_id=${transactionId || refund.unit_transaction_id}`)}>
            Data Refund Pembelian
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-medium text-slate-800">Detail Data Refund Pembelian</span>
        </div>

        {/* HEADLINE & ACTIONS */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push(`/dashboard/${slug}/transaksi/refund-beli?unit_transaction_id=${transactionId || refund.unit_transaction_id}`)} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900">Detail Data Refund Pembelian</h1>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>Kode Refund:</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{refund.code}</span>
                <Badge
                  variant="outline"
                  className={
                    refund.is_paid
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold'
                      : 'border-rose-200 bg-rose-50 text-rose-700 font-semibold'
                  }
                >
                  {refund.is_paid ? 'Lunas' : 'Belum Lunas'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={refund.is_paid ? 'outline' : 'default'}
              className={refund.is_paid ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
              disabled={updatePaidStatusMutation.isPending || (!refund.is_paid && lessPayment > 0)}
              onClick={() => setIsMarkAsPaidOpen(true)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {refund.is_paid ? 'Sudah Lunas' : 'Tandai Lunas'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3">
          <RefundPaymentProgressBadge status={getRefundPaymentProgressStatus(refund)} />
          <p className="text-sm text-slate-600">Pembayaran refund hanya bisa ditambahkan setelah refund ini tersimpan.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Section 1: Informasi Refund */}
          <CollapsibleBox
            title="Informasi Refund"
            description="Rincian informasi transaksi refund"
            icon={FileText}
          >
            <div className="text-sm text-slate-600 space-y-2">
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
                <span className="font-semibold text-slate-900">{currenciesFormat(currencyCode, refund.refund_amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Total Terbayar</span>
                <span className="font-semibold text-slate-900">{currenciesFormat(currencyCode, totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Kurang Bayar</span>
                <span className="font-bold text-emerald-600">{currenciesFormat(currencyCode, lessPayment)}</span>
              </div>
            </div>
          </CollapsibleBox>

          {/* Section 2: Informasi Unit */}
          <CollapsibleBox
            title="Informasi Unit"
            description="Rincian jumlah unit dan alasan refund"
            icon={Package}
          >
            <div className="text-sm text-slate-600 space-y-2">
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
          </CollapsibleBox>
        </div>

        {/* Section 3: Detail Unit yang Direfund */}
        <CollapsibleBox
          title="Detail Unit yang Direfund"
          description="Rincian item detail unit yang termasuk dalam refund ini"
          icon={Package}
        >
          <BaseTable
            data={refund.items ?? []}
            columns={unitColumns}
            headerRowClassName="bg-[#f8f9fa] border-b border-gray-200"
          />
        </CollapsibleBox>

        {/* Section 4: Riwayat Pembayaran Refund */}
        <CollapsibleBox
          title="Riwayat Pembayaran Refund"
          description="Daftar transaksi pembayaran refund yang telah dicatat"
          icon={DollarSign}
          actions={
            <Button
              size="sm"
              onClick={() => setIsAddDetailOpen(true)}
              disabled={lessPayment === 0}
              className="btn-primary!"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data Pembayaran
            </Button>
          }
        >
          <BaseTable
            data={refund.payments ?? []}
            columns={columns}
            headerRowClassName="bg-[#f8f9fa] border-b border-gray-200"
            defaultSort={{ key: 'payment_date', direction: 'desc' }}
          />
        </CollapsibleBox>

        <PurchaseRefundPaymentDetailModal open={isAddDetailOpen} onClose={() => setIsAddDetailOpen(false)} refund={refund} isUsdTransaction={isUsdTransaction} />
        <PurchaseRefundPaymentDetailModal open={Boolean(editingPayment)} onClose={() => setEditingPayment(null)} refund={refund} payment={editingPayment} isUsdTransaction={isUsdTransaction} />

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

        {/* Modal Konfirmasi Tandai Lunas */}
        <AlertDialog open={isMarkAsPaidOpen} onOpenChange={setIsMarkAsPaidOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{refund.is_paid ? 'Batal Tandai Lunas Refund?' : 'Tandai Lunas Refund?'}</AlertDialogTitle>
              <AlertDialogDescription>
                {refund.is_paid
                  ? 'Status lunas refund akan dibatalkan dan pencatatan Finance Refund terkait akan disesuaikan.'
                  : 'Menandai lunas refund akan otomatis membuat record Finance Refund & Finance Refund Cash di modul finance.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updatePaidStatusMutation.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                className={refund.is_paid ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}
                disabled={updatePaidStatusMutation.isPending}
                onClick={handleTogglePaidStatus}
              >
                {updatePaidStatusMutation.isPending ? 'Memproses...' : refund.is_paid ? 'Ya, Batal Lunas' : 'Ya, Tandai Lunas'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
