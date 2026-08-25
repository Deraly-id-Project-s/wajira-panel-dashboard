import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefundStatusBadge } from '@/components/features/refund/RefundStatusBadge';
import RefundPaymentModal from '@/components/features/refund-administrasi/RefundPaymentModal';
import { useRefundDetail, useRefundTransactionDetail } from '@/hooks/useRefundAdministrasi';
import { formatCurrency } from '@/lib/utils/currency';
import { LoadingState } from '@/components/ui/loading-state';

interface AdminRefundDetailPageProps {
  title: string;
  refundId: string;
  transactionId: string;
  backHref: string;
}

const formatDate = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

export function AdminRefundDetailPage({ title, refundId, transactionId, backHref }: AdminRefundDetailPageProps) {
  const router = useRouter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const transactionQuery = useRefundTransactionDetail(transactionId);
  const refundQuery = useRefundDetail(refundId);
  const refund = refundQuery.data;

  if (refundQuery.isLoading || transactionQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!refund) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-500">Data refund tidak ditemukan.</div>
      </DashboardLayout>
    );
  }

  const totalPaid = refund.total_paid ?? (refund.payments ?? []).reduce((total, item) => total + Number(item.amount), 0);
  const remainingAmount = refund.remaining_payment ?? Math.max(0, Number(refund.refund_amount) - totalPaid);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-start gap-4">
          <Button onClick={() => router.push(backHref)} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader title={title} description="Detail refund, histori pembayaran, dan item yang direfund." />
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Kode Refund</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{refund.code}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tanggal Refund</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(refund.refund_date)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Nominal Refund</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(refund.refund_amount)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-2">
              <RefundStatusBadge status={refund.status === 'approve' || refund.status === 'reject' ? refund.status : 'waiting'} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Catatan Refund</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{refund.note || 'Tidak ada catatan refund.'}</p>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Ringkasan Pembayaran</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Dibayar</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sisa Bayar</span>
                <span className="font-semibold text-amber-700">{formatCurrency(remainingAmount)}</span>
              </div>
            </div>
            <Button onClick={() => setIsPaymentModalOpen(true)} disabled={remainingAmount <= 0} className="button-theme-1!">
              <Plus className="h-4 w-4" />
              Tambah Pembayaran
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Histori Pembayaran Refund</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(refund.payments ?? []).length > 0 ? (
                  refund.payments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date || payment.created_at)}</TableCell>
                      <TableCell className="font-medium text-slate-900">{formatCurrency(payment.amount)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={100} className="py-16 h-32 text-center text-slate-500">
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

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Unit yang Direfund</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Tipe Unit</TableHead>
                  <TableHead>Warna</TableHead>
                  <TableHead>No. Mesin</TableHead>
                  <TableHead>No. Rangka</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(refund.items ?? []).length > 0 ? (
                  refund.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-slate-900">{item.unit_type_name || '-'}</TableCell>
                      <TableCell>{item.color || '-'}</TableCell>
                      <TableCell>{item.machine_number || '-'}</TableCell>
                      <TableCell>{item.chassis_number || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                      Tidak ada item refund.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <RefundPaymentModal open={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} refund={refund} />
      </div>
    </DashboardLayout>
  );
}
