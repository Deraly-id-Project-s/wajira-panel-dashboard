import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, MoreVertical, Plus, Loader2, Search } from 'lucide-react';
import type { UnitTransactionRefund } from '@/@types/refund.type';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteRefund, useRefundList, useRefundTransactionDetail } from '@/hooks/useRefundAdministrasi';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';
import PurchaseRefundFormModal from './PurchaseRefundFormModal';
import { refundInputClassName, refundPrimaryButtonClassName } from './purchase-refund.styles';
import { RefundPaymentProgressBadge } from '@/components/features/refund/RefundPaymentProgressBadge';
import { getRefundPaymentProgressStatus } from '@/components/features/refund/refund.utils';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
};

export default function SalesRefundPageContent({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRefund, setEditingRefund] = useState<UnitTransactionRefund | null>(null);
  const [deletingRefund, setDeletingRefund] = useState<UnitTransactionRefund | null>(null);
  const deleteMutation = useDeleteRefund();

  const transactionQuery = useRefundTransactionDetail(transactionId);
  const refundQuery = useRefundList({ page: 1, perPage: 100, search: transactionQuery.data?.code });

  const refunds = useMemo(
    () => (refundQuery.data?.data ?? []).filter((item) => item.unit_transaction_id === transactionId || item.transaction?.id === transactionId),
    [refundQuery.data?.data, transactionId],
  );
  const totalRefund = refunds.reduce((total, item) => total + Number(item.refund_amount), 0);

  const historyRows = useMemo(
    () =>
      refunds.map((refund) => ({
        id: refund.id,
        tanggal: formatDate(refund.refund_date),
        tipeUnit: refund.items?.[0]?.unit_type_name || '-',
        qty: refund.items?.length ?? 0,
        nominalRefund: refund.refund_amount,
        keterangan: refund.note || 'Telah direfund',
      })),
    [refunds],
  );

  const handleDelete = async () => {
    if (!deletingRefund) return;

    try {
      await deleteMutation.mutateAsync(deletingRefund.id);
      toast.success('Data refund penjualan berhasil dihapus');
      setDeletingRefund(null);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus data refund penjualan');
    }
  };

  const handleEditRefund = (refund: UnitTransactionRefund) => {
    const hasPayments = (refund.total_paid ?? (refund.payments ?? []).reduce((total, item) => total + Number(item.amount), 0)) > 0;
    if (hasPayments) {
      toast.warning('Refund yang sudah memiliki pembayaran sebaiknya tidak diubah. Hapus atau sesuaikan pembayaran refund terlebih dahulu.');
      return;
    }

    setEditingRefund(refund);
  };

  const handleDeletePrompt = (refund: UnitTransactionRefund) => {
    const hasPayments = (refund.total_paid ?? (refund.payments ?? []).reduce((total, item) => total + Number(item.amount), 0)) > 0;
    if (hasPayments) {
      toast.warning('Refund yang sudah memiliki pembayaran tidak dapat dihapus langsung. Hapus pembayaran refund terlebih dahulu.');
      return;
    }

    setDeletingRefund(refund);
  };

  return (
    <DashboardLayout>
      <div className="space-y-12 p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-[#111827]" onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${transactionId}`)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-[22px] font-semibold text-[#111827]">Refund Penjualan</h1>
        </div>

        <div className="rounded-[14px] border border-[#D9DEE8] bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#111827]">Kode Penjualan</label>
              <Input readOnly value={transactionQuery.data?.code || ''} className={refundInputClassName} />
            </div>
            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#111827]">Total Refund</label>
              <Input readOnly value={formatCurrency(totalRefund)} className={refundInputClassName} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>

        <div className="overflow-x-auto rounded-[10px] border border-[#D9DEE8] bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#E9EEF5] hover:bg-[#E9EEF5]">
                {['NO', 'TANGGAL REFUND', 'KODE REFUND', 'NOMINAL REFUND', 'KURANG BAYAR', 'QTY', 'STATUS', 'aksi'].map((header) => (
                  <TableHead key={header} className="h-12 px-4 text-center text-[14px] font-medium text-[#111827]">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {refundQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 h-32 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-0 animate-in fade-in duration-500">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                      <span className="text-sm font-medium text-slate-500">Memuat data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : refunds.length > 0 ? (
                refunds.map((refund, index) => {
                  const totalPaid = refund.total_paid ?? (refund.payments ?? []).reduce((total, item) => total + Number(item.amount), 0);
                  const lessPayment = refund.remaining_payment ?? Math.max(0, Number(refund.refund_amount || 0) - totalPaid);
                  return (
                    <TableRow key={refund.id} className="border-[#E5E7EB] hover:bg-white">
                      <TableCell className="px-4 py-3 text-center text-sm text-[#111827]">{index + 1}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-[#111827]">{formatDate(refund.refund_date)}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm leading-5 text-[#111827]">{refund.code}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-[#111827]">{formatCurrency(refund.refund_amount)}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-[#111827]">{formatCurrency(lessPayment)}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-[#111827]">{refund.total_qty ?? refund.items?.length ?? 0}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-[#111827]">
                        <RefundPaymentProgressBadge status={getRefundPaymentProgressStatus(refund)} />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#111827]">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[162px] rounded-[14px] border border-[#E5E7EB] p-2 shadow-[0_12px_35px_rgba(15,23,42,0.14)]">
                            <DropdownMenuItem className="rounded-[10px] px-4 py-3 text-sm text-[#111827]" onClick={() => handleEditRefund(refund)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-[10px] px-4 py-3 text-sm text-[#111827]"
                              onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${transactionId}/refund/${refund.id}`)}
                            >
                              Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-[10px] px-4 py-3 text-sm text-[#EF4444]" onClick={() => handleDeletePrompt(refund)}>
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={100} className="py-16 h-28 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="rounded-full bg-slate-50 p-4 mb-2">
                        <Search className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-base font-semibold text-slate-900">Tidak ada data ditemukan</p>
                      <p className="text-sm text-slate-500">Belum ada data atau coba gunakan kata kunci pencarian lain.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-4">
          <div className="px-8">
            <h2 className="text-[18px] font-semibold text-[#111827]">History Pembayaran Refund</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Rincian lengkap unit yang direfund</p>
          </div>

          <div className="overflow-x-auto bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#EEFCF5] hover:bg-[#EEFCF5]">
                  {['Tanggal', 'TIPE UNIT', 'QTY', 'NOMINAL REFUND', 'KETERANGAN'].map((header) => (
                    <TableHead key={header} className="h-11 px-4 text-[14px] font-medium text-[#111827]">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRows.length > 0 ? (
                  historyRows.map((row) => (
                    <TableRow key={row.id} className="border-[#E5E7EB] hover:bg-white">
                      <TableCell className="px-4 py-3 text-sm text-[#111827]">{row.tanggal}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-[#111827]">{row.tipeUnit}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-[#111827]">{row.qty}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-[#111827]">{formatCurrency(row.nominalRefund)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-[#111827]">{row.keterangan}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={100} className="py-16 h-24 text-center text-[#6B7280]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="rounded-full bg-slate-50 p-4 mb-2">
                          <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-base font-semibold text-slate-900">Tidak ada data ditemukan</p>
                        <p className="text-sm text-slate-500">Belum ada data atau coba gunakan kata kunci pencarian lain.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Pembayaran refund hanya bisa dibuat setelah refund berhasil disimpan. Jika refund sudah memiliki pembayaran, ubah atau hapus refund sebaiknya dilakukan setelah pembayaran refund disesuaikan terlebih dahulu.
        </div>

        <PurchaseRefundFormModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} transactionId={transactionId} entityLabel="penjualan" />
        <PurchaseRefundFormModal open={Boolean(editingRefund)} onClose={() => setEditingRefund(null)} transactionId={transactionId} refund={editingRefund} entityLabel="penjualan" />

        <AlertDialog open={Boolean(deletingRefund)} onOpenChange={(open) => !open && setDeletingRefund(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Refund Penjualan</AlertDialogTitle>
              <AlertDialogDescription>Data refund yang dihapus tidak bisa dikembalikan. Lanjutkan penghapusan?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
