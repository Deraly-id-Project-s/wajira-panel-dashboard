import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useRefundList, useRefundTransactionDetail } from '@/hooks/useRefundAdministrasi';
import { formatCurrency } from '@/lib/utils/currency';
import RefundListTable from '@/components/features/refund-administrasi/RefundListTable';
import CreateRefundModal from '@/components/features/refund-administrasi/CreateRefundModal';

interface AdminRefundPageProps {
  title: string;
  description: string;
  basePath: string;
  backHref: string;
  transactionId: string;
}

export function AdminRefundPage({ title, description, basePath, backHref, transactionId }: AdminRefundPageProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { page, perPage, search, setPage, setPerPage, setSearch } = useQueryParamsTable({
    defaultPage: 1,
    defaultPerPage: 25,
  });
  const debouncedSearch = useDebouncedValue(search, 400);

  const transactionQuery = useRefundTransactionDetail(transactionId);
  const transactionCode = transactionQuery.data?.code ?? '';
  const refundQuery = useRefundList({
    page,
    perPage,
    search: debouncedSearch || transactionCode || undefined,
  });

  const refunds = useMemo(
    () => (refundQuery.data?.data ?? []).filter((item) => item.unit_transaction_id === transactionId || item.transaction?.id === transactionId),
    [refundQuery.data?.data, transactionId],
  );
  const totalRefund = refunds.reduce((total, item) => total + Number(item.refund_amount), 0);
  const totalPaid = refunds.reduce(
    (total, item) => total + (item.payments ?? []).reduce((paymentTotal, payment) => paymentTotal + Number(payment.amount), 0),
    0,
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-start gap-4">
          <Button onClick={() => router.push(backHref)} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader title={title} description={description} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Kode Transaksi</Label>
            <p className="mt-2 text-lg font-semibold text-slate-900">{transactionCode || 'Memuat...'}</p>
            <p className="mt-1 text-sm text-slate-500">{transactionQuery.data?.person?.name || '-'}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Refund</Label>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(totalRefund)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Pembayaran Refund</Label>
            <p className="mt-2 text-lg font-semibold text-emerald-700">{formatCurrency(totalPaid)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kode refund atau catatan"
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Tampilkan</span>
              <Select value={String(perPage)} onValueChange={(value) => setPerPage(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>data</span>
            </div>
          </div>

          <Button onClick={() => setIsCreateModalOpen(true)} className="button-theme-1!">
            <Plus className="h-4 w-4" />
            Tambah Refund
          </Button>
        </div>

        <RefundListTable
          data={refunds}
          meta={refundQuery.data?.meta}
          isLoading={refundQuery.isLoading || transactionQuery.isLoading}
          slug={String(router.query.slug ?? '')}
          transactionId={transactionId}
          basePath={basePath}
          page={page}
          onPageChange={setPage}
        />

        <CreateRefundModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} transactionId={transactionId} />
      </div>
    </DashboardLayout>
  );
}
