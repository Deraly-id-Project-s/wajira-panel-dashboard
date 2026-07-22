import { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, LogOut, MoreVertical, Plus, Search } from 'lucide-react';
import type { UnitTransactionRefundPayment } from '@/@types/refund.type';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteRefundPayment, useRefundDetail, useRefundTransactionDetail } from '@/hooks/useRefundAdministrasi';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';
import PurchaseRefundFormModal from './PurchaseRefundFormModal';
import PurchaseRefundPaymentDetailModal from './PurchaseRefundPaymentDetailModal';
import { refundInputClassName, refundPrimaryButtonClassName } from './purchase-refund.styles';
import { RefundPaymentProgressBadge } from '@/components/features/refund/RefundPaymentProgressBadge';
import { getRefundPaymentProgressStatus } from '@/components/features/refund/refund.utils';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function SalesRefundDetailPageContent({ transactionId, refundId }: { transactionId: string; refundId: string }) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [editingRefund, setEditingRefund] = useState(false);
  const [isAddDetailOpen, setIsAddDetailOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<UnitTransactionRefundPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<UnitTransactionRefundPayment | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const deletePaymentMutation = useDeleteRefundPayment();

  const transactionQuery = useRefundTransactionDetail(transactionId);
  const refundQuery = useRefundDetail(refundId);
  const refund = refundQuery.data;

  const totalPaid = (refund?.payments ?? []).reduce((total, item) => total + Number(item.amount), 0);
  const lessPayment = Math.max(0, Number(refund?.refund_amount || 0) - totalPaid);
  const qty = refund?.items?.length ?? 0;

  const toggleItem = (itemId: string, checked: boolean) => {
    setSelectedItemIds((current) => (checked ? [...current, itemId] : current.filter((id) => id !== itemId)));
  };

  const toggleAll = (checked: boolean) => {
    setSelectedItemIds(checked ? (refund?.items ?? []).map((item) => item.id) : []);
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    try {
      await deletePaymentMutation.mutateAsync(deletingPayment.id);
      toast.success('Detail refund penjualan berhasil dihapus');
      setDeletingPayment(null);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus detail refund penjualan');
    }
  };

  if (refundQuery.isLoading || transactionQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center text-[#6B7280]">Memuat detail refund penjualan...</div>
      </DashboardLayout>
    );
  }

  if (!refund) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center text-[#6B7280]">Data refund penjualan tidak ditemukan.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-[#111827]" onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${transactionId}/refund`)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-[22px] font-semibold text-[#111827]">Detail Refund Penjualan</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[14px] font-medium text-[#111827]">Kode Refund</label>
            <Input readOnly value={refund.code || ''} className={refundInputClassName} />
          </div>
          <div>
            <label className="mb-2 block text-[14px] font-medium text-[#111827]">Nominal Refund</label>
            <Input readOnly value={formatCurrency(refund.refund_amount)} className={refundInputClassName} />
          </div>
          <div>
            <label className="mb-2 block text-[14px] font-medium text-[#111827]">Tanggal Refund</label>
            <Input readOnly value={formatDate(refund.refund_date)} className={refundInputClassName} />
          </div>
          <div>
            <label className="mb-2 block text-[14px] font-medium text-[#111827]">Kurang Bayar</label>
            <Input readOnly value={formatCurrency(lessPayment)} className={refundInputClassName} />
          </div>
          <div>
            <label className="mb-2 block text-[14px] font-medium text-[#111827]">Tipe</label>
            <Input readOnly value={refund.items?.[0]?.unit_type_name || refund.note || ''} className={refundInputClassName} />
          </div>
          <div>
            <label className="mb-2 block text-[14px] font-medium text-[#111827]">QTY</label>
            <Input readOnly value={String(qty)} className={refundInputClassName} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3">
          <RefundPaymentProgressBadge status={getRefundPaymentProgressStatus(refund)} />
          <p className="text-sm text-slate-600">Pembayaran refund hanya bisa ditambahkan setelah refund ini tersimpan.</p>
        </div>

        <div className="space-y-5">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddDetailOpen(true)} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
              <Plus className="h-4 w-4" />
              Tambah Pembayaran Refund
            </Button>
          </div>

          <div className="overflow-x-auto rounded-[10px] border border-[#D9DEE8] bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#E9EEF5] hover:bg-[#E9EEF5]">
                  {['NO', 'TANGGAL REFUND', 'NOMINAL BAYAR', 'KETERANGAN', 'aksi'].map((header) => (
                    <TableHead key={header} className="h-12 px-4 text-center text-[14px] font-medium text-[#111827]">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(refund.payments ?? []).length > 0 ? (
                  refund.payments?.map((payment, index) => (
                    <TableRow key={payment.id} className="border-[#E5E7EB] hover:bg-white">
                      <TableCell className="px-4 py-3 text-center text-sm text-[#111827]">{index + 1}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-[#111827]">{formatDate(payment.payment_date)}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-[#111827]">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-[#111827]">{payment.note || 'Terbayar'}</TableCell>
                      <TableCell className="px-4 py-3 text-center">
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
                      </TableCell>
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

        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-[#111827]">Detail Unit yang direfund</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Rincian lengkap unit yang direfund</p>
            </div>
            <Button className="h-10 rounded-[10px] bg-[#EF2B2D] px-5 text-sm font-medium text-white hover:bg-[#D92527]" onClick={() => setIsAddDetailOpen(true)}>
              <LogOut className="h-4 w-4" />
              Refund
            </Button>
          </div>

          <div className="overflow-x-auto bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#EEFCF5] hover:bg-[#EEFCF5]">
                  <TableHead className="w-[56px] px-4 text-center">
                    <Checkbox
                      checked={(refund.items?.length ?? 0) > 0 && selectedItemIds.length === (refund.items?.length ?? 0)}
                      onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                    />
                  </TableHead>
                  {['No', 'WARNA', 'NOMOR MESIN', 'NOMOR RANGKA'].map((header) => (
                    <TableHead key={header} className="h-11 px-4 text-[14px] font-medium text-[#111827]">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(refund.items ?? []).length > 0 ? (
                  refund.items?.map((item, index) => (
                    <TableRow key={item.id} className="border-[#E5E7EB] hover:bg-white">
                      <TableCell className="px-4 py-3 text-center">
                        <Checkbox checked={selectedItemIds.includes(item.id)} onCheckedChange={(checked) => toggleItem(item.id, Boolean(checked))} />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-[#111827]">{index + 1}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-[#111827]">{item.color || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-[#111827]">{item.machine_number || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-[#111827]">{item.chassis_number || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-[#6B7280]">
                      Tidak ada unit refund.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <PurchaseRefundFormModal open={editingRefund} onClose={() => setEditingRefund(false)} transactionId={transactionId} refund={refund} entityLabel="penjualan" />
        <PurchaseRefundPaymentDetailModal open={isAddDetailOpen} onClose={() => setIsAddDetailOpen(false)} refund={refund} entityLabel="Penjualan" />
        <PurchaseRefundPaymentDetailModal open={Boolean(editingPayment)} onClose={() => setEditingPayment(null)} refund={refund} payment={editingPayment} entityLabel="Penjualan" />

        <AlertDialog open={Boolean(deletingPayment)} onOpenChange={(open) => !open && setDeletingPayment(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Detail Refund Penjualan</AlertDialogTitle>
              <AlertDialogDescription>Detail refund penjualan yang dihapus tidak bisa dikembalikan. Lanjutkan?</AlertDialogDescription>
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
