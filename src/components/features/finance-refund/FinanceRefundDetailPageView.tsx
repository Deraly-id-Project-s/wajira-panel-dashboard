'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Coins,
  CreditCard,
  FileCheck2,
  MoreVertical,
  Plus,
  ReceiptText,
  RotateCcw,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CopyBox } from '@/components/ui/copy-box';
import { LoadingState } from '@/components/ui/loading-state';
import { FormDialog } from '@/components/ui/form-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoneyInput } from '@/components/ui/money-input';
import { InputDate } from '@/components/ui/input-date';
import { Textarea } from '@/components/ui/textarea';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useCompany } from '@/contexts/CompanyContext';
import { useKas } from '@/hooks/useKas';
import { useAccounts } from '@/hooks/useAccount';
import { useFinanceRefundDetail, useUpdateFinanceRefundPaidStatus } from '@/hooks/useFinanceRefund';
import { useCreateFinanceBilling, useDeleteFinanceBilling } from '@/hooks/useFinanceBilling';
import type { FinanceBilling } from '@/@types/finance-billing.types';
import type { RefundTransactionType } from '@/@types/finance-refund.types';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { cn } from '@/lib/utils';

interface FinanceRefundDetailPageViewProps {
  id: string | number;
  transactionType: RefundTransactionType;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface BillingFormState {
  cash_id: number;
  account_id: number;
  amount: number;
  payment_at: string;
  note: string;
}

const EMPTY_BILLING_FORM: BillingFormState = {
  cash_id: 0,
  account_id: 0,
  amount: 0,
  payment_at: new Date().toISOString().slice(0, 10),
  note: '',
};

export default function FinanceRefundDetailPageView({ id, transactionType }: FinanceRefundDetailPageViewProps) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();

  const isSales = transactionType === 'sales';
  const parentMenuTitle = isSales ? 'Refund Penjualan' : 'Refund Pembelian';
  const parentMenuHref = `/dashboard/${slug}/finance/${isSales ? 'refund-jual' : 'refund-beli'}`;

  const { data: refundDetail, isLoading, isError, refetch } = useFinanceRefundDetail(id);

  const kasQuery = useKas(companyId ?? 1);
  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: companyId ?? undefined,
    enabled: Boolean(companyId),
  });

  const kasOptions = useMemo(() => kasQuery.data?.data ?? [], [kasQuery.data?.data]);
  const akunOptions = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);

  const createBillingMutation = useCreateFinanceBilling();
  const deleteBillingMutation = useDeleteFinanceBilling();
  const updatePaidStatusMutation = useUpdateFinanceRefundPaidStatus();

  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingForm, setBillingForm] = useState<BillingFormState>({ ...EMPTY_BILLING_FORM });
  const [deleteTarget, setDeleteTarget] = useState<FinanceBilling | null>(null);
  const [isTogglePaidOpen, setIsTogglePaidOpen] = useState(false);

  const remainingPayment = Number(refundDetail?.remaining_payment ?? 0);
  const isPaid = Boolean(refundDetail?.is_paid);
  const financeBillings = refundDetail?.financeBillings ?? [];
  const financeRefundCashes = refundDetail?.financeRefundCashes ?? [];

  const handleOpenBillingForm = () => {
    setBillingForm({
      cash_id: kasOptions[0]?.id ? Number(kasOptions[0].id) : 0,
      account_id: 0,
      amount: remainingPayment > 0 ? remainingPayment : 0,
      payment_at: new Date().toISOString().slice(0, 10),
      note: `Pembayaran finance refund ${refundDetail?.code ?? ''}`,
    });
    setIsBillingModalOpen(true);
  };

  const handleSaveBilling = async () => {
    if (!refundDetail) return;
    if (!billingForm.cash_id || billingForm.cash_id <= 0) {
      toast.error('Pilih akun kas terlebih dahulu.');
      return;
    }
    if (billingForm.amount <= 0) {
      toast.error('Nominal pembayaran harus lebih dari 0.');
      return;
    }
    if (billingForm.amount > remainingPayment) {
      toast.error(`Nominal tidak boleh melebihi sisa tagihan (${currenciesFormat('idr', remainingPayment)})`);
      return;
    }

    try {
      await createBillingMutation.mutateAsync({
        finance_refund_id: Number(refundDetail.id),
        cash_id: billingForm.cash_id,
        account_id: billingForm.account_id > 0 ? billingForm.account_id : 1,
        amount: billingForm.amount,
        payment_at: billingForm.payment_at || new Date().toISOString().slice(0, 10),
        note: billingForm.note || 'Pembayaran finance refund',
      });
      toast.success('Pembayaran finance refund berhasil ditambahkan');
      setIsBillingModalOpen(false);
      void refetch();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err) || 'Gagal menambahkan pembayaran');
    }
  };

  const handleDeleteBilling = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBillingMutation.mutateAsync(deleteTarget.id);
      toast.success('Pembayaran berhasil dihapus');
      setDeleteTarget(null);
      void refetch();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err) || 'Gagal menghapus pembayaran');
    }
  };

  const handleTogglePaidStatus = async () => {
    if (!refundDetail) return;
    try {
      await updatePaidStatusMutation.mutateAsync({
        id: refundDetail.id,
        payload: {
          is_paid: !refundDetail.is_paid,
          note: !refundDetail.is_paid ? 'Pelunasan penuh tagihan refund finance' : 'Batal pelunasan tagihan refund finance',
        },
      });
      toast.success(!refundDetail.is_paid ? 'Finance refund berhasil ditandai lunas' : 'Status lunas berhasil dibatalkan');
      setIsTogglePaidOpen(false);
      void refetch();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err) || 'Gagal mengubah status lunas');
    }
  };

  const billingColumns = useMemo<ColumnDef<FinanceBilling>[]>(
    () => [
      {
        header: 'TANGGAL BAYAR',
        accessorKey: 'payment_at',
        sortable: true,
        alignment: 'left',
        cell: (item) => formatDate(item.payment_at),
      },
      {
        header: 'KAS / BANK',
        accessorKey: 'cash',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <span className="font-medium text-slate-800">
            {item.cash?.cash_name || item.cash?.code || '-'}
          </span>
        ),
      },
      {
        header: 'NOMINAL',
        accessorKey: 'amount',
        sortable: true,
        alignment: 'right',
        cell: (item) => (
          <span className="font-semibold text-slate-900">
            {currenciesFormat('idr', item.amount)}
          </span>
        ),
      },
      {
        header: 'CATATAN',
        accessorKey: 'note',
        sortable: true,
        alignment: 'left',
        cell: (item) => <span className="text-sm text-slate-600">{item.note || '-'}</span>,
      },
      {
        header: 'AKSI',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <Button
            size="sm"
            variant="ghost"
            disabled={isPaid}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setDeleteTarget(item)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [isPaid],
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (isError || !refundDetail) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-500">
          Data Finance Refund tidak ditemukan atau terjadi kesalahan saat memuat data.
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push(parentMenuHref)}>
              Kembali ke Daftar
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Detail {parentMenuTitle} - {refundDetail.code} - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: parentMenuTitle, onClick: () => router.push(parentMenuHref) },
            { label: `Detail ${refundDetail.code}` },
          ]}
          title={`Detail ${parentMenuTitle}`}
          subtitle={
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-slate-800">{refundDetail.code}</span>
              <Badge
                variant="outline"
                className={
                  isPaid
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold'
                    : 'border-rose-200 bg-rose-50 text-rose-700 font-semibold'
                }
              >
                {isPaid ? 'Lunas' : 'Belum Lunas'}
              </Badge>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 font-semibold">
                {refundDetail.transaction_of || 'Unit Kendaraan'}
              </Badge>
            </div>
          }
          onBack={() => router.push(parentMenuHref)}
          actions={
            <div className="flex items-center gap-2">
              {remainingPayment > 0 && !isPaid ? (
                <Button className="btn-primary" onClick={handleOpenBillingForm}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Tambah Pembayaran
                </Button>
              ) : null}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button
                        type="button"
                        variant="outline"
                        className={
                          isPaid
                            ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                        }
                        disabled={updatePaidStatusMutation.isPending || (!isPaid && remainingPayment > 0)}
                        onClick={() => setIsTogglePaidOpen(true)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {isPaid ? 'Batal Lunas' : 'Tandai Lunas'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!isPaid && remainingPayment > 0 ? (
                    <TooltipContent side="bottom" className="max-w-xs text-center text-xs">
                      Pelunasan hanya dapat dilakukan jika sisa tagihan telah habis (0).
                    </TooltipContent>
                  ) : null}
                </Tooltip>
              </TooltipProvider>
            </div>
          }
        />

        {/* Ringkasan Posisi Kas & Tagihan */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sisa Tagihan
              </CardDescription>
              <CardTitle className={cn('text-2xl font-bold', remainingPayment > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                {currenciesFormat('idr', remainingPayment)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">
                {remainingPayment === 0 ? 'Seluruh kewajiban tagihan telah terbayarkan.' : 'Wajib diselesaikan melalui Finance Billing.'}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tanggal Dokumen
              </CardDescription>
              <CardTitle className="text-lg font-semibold text-slate-800">
                {formatDate(refundDetail.date)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Tanggal pengakuan transaksi refund</p>
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Realisasi Pembayaran
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {currenciesFormat(
                  'idr',
                  financeBillings.reduce((sum, b) => sum + Number(b.amount || 0), 0),
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">{financeBillings.length} transaksi pembayaran tercatat</p>
            </CardContent>
          </Card>
        </div>

        {/* Detail Catatan & Posisi Kas Asal */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardHeader className="py-4 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900">Keterangan / Catatan Refund</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{refundDetail.note || 'Tidak ada catatan khusus.'}</p>
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardHeader className="py-4 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900">Alokasi Kas Asal (Finance Refund Cashes)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {financeRefundCashes.length > 0 ? (
                <div className="space-y-3">
                  {financeRefundCashes.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-md border border-slate-100 bg-slate-50">
                      <div>
                        <p className="font-semibold text-slate-800">{c.cash?.cash_name || `Kas #${c.cash_id}`}</p>
                        <p className="text-xs text-slate-500 uppercase">{c.type}</p>
                      </div>
                      <p className="font-bold text-slate-900">{currenciesFormat('idr', c.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Tidak ada alokasi kas spesifik.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabel Finance Billing */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Riwayat Pembayaran (Finance Billing)</h2>
              <p className="text-xs text-slate-500">Daftar transaksi realisasi kas / pengeluaran refund</p>
            </div>
            {remainingPayment > 0 && !isPaid ? (
              <Button size="sm" className="btn-primary" onClick={handleOpenBillingForm}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pembayaran
              </Button>
            ) : null}
          </div>

          <BaseTable
            data={financeBillings}
            columns={billingColumns}
            headerRowClassName="bg-[#f8f9fa] border-b border-gray-200"
          />
        </div>

        {/* Modal Form Tambah Finance Billing */}
        <FormDialog
          open={isBillingModalOpen}
          onOpenChange={setIsBillingModalOpen}
          title="Tambah Pembayaran Finance Refund"
          description={`Sisa tagihan yang harus dibayar: ${currenciesFormat('idr', remainingPayment)}`}
          onSubmit={() => void handleSaveBilling()}
          loading={createBillingMutation.isPending}
          disabled={createBillingMutation.isPending}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Akun Kas / Bank</label>
              <Select
                value={billingForm.cash_id ? String(billingForm.cash_id) : ''}
                onValueChange={(val) => setBillingForm((prev) => ({ ...prev, cash_id: Number(val) }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih akun kas/bank" />
                </SelectTrigger>
                <SelectContent>
                  {kasOptions.map((k) => (
                    <SelectItem key={k.id} value={String(k.id)}>
                      {k.cash_name || `${k.code} - ${k.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">Nominal Pembayaran</label>
                <MoneyInput
                  value={billingForm.amount}
                  onChangeValue={(val) => {
                    const clamped = Math.min(val, remainingPayment);
                    setBillingForm((prev) => ({ ...prev, amount: clamped }));
                  }}
                  currency="IDR"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">Tanggal Bayar</label>
                <InputDate
                  value={billingForm.payment_at}
                  onChange={(e) => setBillingForm((prev) => ({ ...prev, payment_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Catatan</label>
              <Textarea
                value={billingForm.note}
                onChange={(e) => setBillingForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Catatan pembayaran refund..."
                className="min-h-20 resize-none"
              />
            </div>
          </div>
        </FormDialog>

        {/* Delete Confirmation Billing */}
        <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Pembayaran?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda yakin ingin menghapus pembayaran sebesar{' '}
                <span className="font-semibold">
                  {deleteTarget ? currenciesFormat('idr', deleteTarget.amount) : ''}
                </span>? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteBillingMutation.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={deleteBillingMutation.isPending}
                onClick={() => void handleDeleteBilling()}
              >
                {deleteBillingMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal Toggle Paid Status */}
        <AlertDialog open={isTogglePaidOpen} onOpenChange={setIsTogglePaidOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{isPaid ? 'Batal Tandai Lunas Finance Refund?' : 'Tandai Lunas Finance Refund?'}</AlertDialogTitle>
              <AlertDialogDescription>
                {isPaid
                  ? 'Status pelunasan finance refund akan dibuka kembali.'
                  : 'Seluruh sisa tagihan telah lunas. Mengunci status lunas akan menandai dokumen ini selesai secara akuntansi.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updatePaidStatusMutation.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                className={isPaid ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}
                disabled={updatePaidStatusMutation.isPending}
                onClick={() => void handleTogglePaidStatus()}
              >
                {updatePaidStatusMutation.isPending ? 'Memproses...' : isPaid ? 'Ya, Batal Lunas' : 'Ya, Tandai Lunas'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
