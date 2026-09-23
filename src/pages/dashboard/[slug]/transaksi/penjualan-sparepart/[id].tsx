'use client';

import { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  CreditCard,
  Edit,
  Info,
  MoreVertical,
  ReceiptText,
  Warehouse,
} from 'lucide-react';
import {
  useSparepartTransaction,
  useCreateSparepartTransactionBillingHistory,
  useUpdateSparepartTransactionBillingHistory,
  useDeleteSparepartTransactionBillingHistory,
  useUpdateSparepartTransactionBillingPaymentStatus,
} from '@/hooks/useSparepartTransaction';
import { useCreateWarehouseActivity } from '@/hooks/useWarehouseActivity';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils/format';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { cn } from '@/lib/utils';
import { SalesSparepartDetailCards } from '@/components/features/sparepart-transaction/SalesSparepartDetailCards';
import { PaymentModal } from '@/components/features/sparepart-transaction/PaymentModal';
import DeletePaymentDialog from '@/components/features/sparepart-transaction/DeletePaymentDialog';

export default function DetailSalesSparepartPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const transactionId = typeof id === 'string' ? id : '';

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const { data: transaction, isLoading, error } = useSparepartTransaction(transactionId, Boolean(transactionId));
  const createPaymentMutation = useCreateSparepartTransactionBillingHistory();
  const updatePaymentMutation = useUpdateSparepartTransactionBillingHistory();
  const deletePaymentMutation = useDeleteSparepartTransactionBillingHistory();
  const updatePaymentStatusMutation = useUpdateSparepartTransactionBillingPaymentStatus();
  const createWarehouseActivityMutation = useCreateWarehouseActivity();
  const queryClient = useQueryClient();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  const handleBack = () => {
    void router.push(`/dashboard/${slug}/transaksi/penjualan-sparepart`);
  };

  const openAddPayment = () => {
    setSelectedPayment(null);
    setPaymentModalOpen(true);
  };

  const openEditPayment = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (data: any) => {
    if (!transaction?.sparepart_transaction_billing?.id) {
      toast.error('Billing ID tidak valid');
      return;
    }

    try {
      if (selectedPayment) {
        await updatePaymentMutation.mutateAsync({
          id: selectedPayment.id,
          payload: {
            sparepart_transaction_billing_id: transaction.sparepart_transaction_billing.id,
            payment_at: data.payment_at,
            cash_payment_amount: data.cash_payment_amount,
            bca_payment_amount: data.bca_payment_amount,
            bca_payment_usd_amount: data.bca_payment_usd_amount,
            note: data.note,
          },
        });
        toast.success('Pembayaran berhasil diubah');
      } else {
        await createPaymentMutation.mutateAsync({
          sparepart_transaction_billing_id: transaction.sparepart_transaction_billing.id,
          payment_at: data.payment_at,
          cash_payment_amount: data.cash_payment_amount,
          bca_payment_amount: data.bca_payment_amount,
          bca_payment_usd_amount: data.bca_payment_usd_amount,
          note: data.note,
        });
        toast.success('Pembayaran berhasil ditambahkan');
      }
      setPaymentModalOpen(false);
    } catch {
      toast.error('Gagal memproses pembayaran');
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentId) return;
    try {
      await deletePaymentMutation.mutateAsync(deletePaymentId);
      toast.success('Pembayaran berhasil dihapus');
      setDeletePaymentId(null);
    } catch {
      toast.error('Gagal menghapus pembayaran');
    }
  };

  const handleMarkAsPaid = async () => {
    const billing = transaction?.sparepart_transaction_billing;
    if (!billing?.id) {
      toast.error('Billing ID tidak valid');
      return;
    }

    try {
      await updatePaymentStatusMutation.mutateAsync({ billingId: String(billing.id), is_paid: true });
      toast.success('Transaksi berhasil ditandai sebagai lunas');
      setIsMarkAsPaidDialogOpen(false);
    } catch {
      toast.error('Gagal menandai transaksi lunas');
    }
  };

  const handleProcessGoods = async () => {
    const warehouseId = transaction?.warehouse_id ?? transaction?.warehouse?.id;
    if (!transaction?.id || !warehouseId || !transaction.person_id) {
      toast.error('Data warehouse atau customer tidak tersedia pada transaksi ini.');
      return;
    }

    try {
      await createWarehouseActivityMutation.mutateAsync({
        warehouse_id: String(warehouseId),
        person_id: String(transaction.person_id),
        sparepart_transaction_id: String(transaction.id),
        type: 'sparepart',
        activity_type: 'issue',
        activity_date: format(new Date(), 'yyyy-MM-dd'),
        description: `Pengeluaran Stok Transaksi Jual Sparepart ${transaction.code} Sebanyak ${transaction.qty} ${transaction.sparepart?.unit_type || ''}`.trim(),
        state: 'draft',
      });
      setIsProcessed(true);
      setProcessDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['sparepart-transactions'] });
      toast.success('Pengeluaran sparepart berhasil dibuat di Warehouse.');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal membuat pengeluaran sparepart di Warehouse.');
    }
  };

  const sparepartBilling = transaction?.sparepart_transaction_billing;
  const histories = sparepartBilling?.sparepart_transaction_billing_histories || [];
  const remainingPayment = Number(
    sparepartBilling?.is_remaining_payment ??
    transaction?.billing_summary?.remaining_payment ??
    0
  );
  const isPaid = sparepartBilling?.is_paid === true;
  const canMarkAsPaid =
    !isPaid &&
    Number.isFinite(remainingPayment) &&
    remainingPayment === 0 &&
    Boolean(sparepartBilling?.id);
  const canProcessGoods = isPaid && !transaction?.is_refunded && !isProcessed;

  const historyColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'Tanggal Pembayaran',
        accessorKey: 'payment_at',
        alignment: 'left',
        cell: (item: any) => formatDate(item.payment_at || item.created_at) || '-',
      },
      {
        header: 'Nominal Dibayar',
        accessorKey: 'grand_total',
        alignment: 'right',
        cell: (item: any) =>
          currenciesFormat(
            'idr',
            item.grand_total || item.cash_payment_amount || item.bca_payment_amount || 0
          ),
      },
      {
        header: 'Keterangan',
        accessorKey: 'note',
        alignment: 'left',
        cell: (item: any) => item.note || '-',
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item: any) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem
                  disabled={!canEdit || isPaid}
                  onClick={() => openEditPayment(item)}
                  className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canDelete || isPaid}
                  className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => setDeletePaymentId(String(item.id))}
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canEdit, canDelete, isPaid]
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" text="Memuat data penjualan sparepart..." />
      </DashboardLayout>
    );
  }

  if (error || !transaction) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            breadcrumbs={[
              { label: 'Penjualan Sparepart', onClick: handleBack },
              { label: 'Detail Penjualan' },
            ]}
            title="Data Penjualan Sparepart"
            subtitle="Data penjualan tidak dapat ditemukan"
            onBack={handleBack}
          />
          <Card className="rounded-md border-red-200 bg-red-50 shadow-none">
            <CardContent className="p-6 text-sm text-red-700">
              Data transaksi penjualan sparepart tidak ditemukan. Silakan periksa kembali URL.
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Detail Penjualan Sparepart - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Penjualan Sparepart', onClick: handleBack },
            { label: 'Detail Penjualan' },
          ]}
          title="Data Penjualan Sparepart"
          subtitle={
            <div className="flex flex-wrap items-center gap-2">
              <span>Kode Jual:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">
                {transaction.code}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'font-semibold',
                  isPaid
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                )}
              >
                {isPaid ? 'Lunas' : 'Belum Lunas'}
              </Badge>
            </div>
          }
          onBack={handleBack}
          actions={
            <TooltipProvider>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="default"
                  disabled={!canEdit || isPaid}
                  onClick={openAddPayment}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isPaid ? 'Sudah Dibayar' : 'Bayar'}
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button
                        type="button"
                        variant="success"
                        disabled={
                          !canEdit ||
                          !canMarkAsPaid ||
                          updatePaymentStatusMutation.isPending
                        }
                        onClick={() => setIsMarkAsPaidDialogOpen(true)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {isPaid ? 'Sudah Lunas' : 'Tandai Lunas'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-center text-xs">
                    {canMarkAsPaid
                      ? 'Tandai transaksi lunas dan catat ke kas harian'
                      : isPaid
                        ? 'Transaksi sudah lunas'
                        : 'Pastikan seluruh sisa tagihan sudah dibayar lunas untuk menandai'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button
                        variant="default"
                        disabled={
                          !canEdit ||
                          !canProcessGoods ||
                          createWarehouseActivityMutation.isPending
                        }
                        onClick={() => setProcessDialogOpen(true)}
                      >
                        <Warehouse className="mr-2 h-4 w-4" />
                        {createWarehouseActivityMutation.isPending
                          ? 'Memproses...'
                          : isProcessed
                            ? 'Sudah Diproses'
                            : 'Proses Barang'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-center text-xs">
                    {canProcessGoods
                      ? 'Kirim data pengeluaran stok sparepart ke Warehouse'
                      : isProcessed
                        ? 'Stok sudah diproses di Warehouse'
                        : 'Transaksi harus berstatus lunas sebelum memproses barang'}
                  </TooltipContent>
                </Tooltip>

                <Button
                  variant="outline"
                  disabled={!canEdit || isPaid}
                  onClick={() =>
                    router.push(
                      `/dashboard/${slug}/transaksi/penjualan-sparepart/edit/${transaction.id}`
                    )
                  }
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Data
                </Button>
              </div>
            </TooltipProvider>
          }
        />

        {/* 3 Overview Detail Cards */}
        <SalesSparepartDetailCards transaction={transaction} />

        {/* Collapsible Riwayat Pembayaran */}
        <div className="space-y-3">
          <CollapsibleBox
            title="Riwayat Pembayaran"
            description="Rincian catatan dan riwayat pembayaran transaksi penjualan sparepart"
            icon={ReceiptText}
            defaultExpanded
          >
            <BaseTable
              data={histories}
              columns={historyColumns}
              loading={isLoading}
              headerRowClassName="bg-green-100"
            />
          </CollapsibleBox>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT PEMBAYARAN */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        defaultValues={selectedPayment}
        loading={createPaymentMutation.isPending || updatePaymentMutation.isPending}
        remainingPayment={remainingPayment}
      />

      {/* DIALOG HAPUS PEMBAYARAN */}
      <DeletePaymentDialog
        open={Boolean(deletePaymentId)}
        onClose={() => setDeletePaymentId(null)}
        onConfirm={handleDeletePayment}
        loading={deletePaymentMutation.isPending}
      />

      {/* CONFIRMATION DIALOG TANDAI LUNAS */}
      <Dialog
        open={isMarkAsPaidDialogOpen}
        onOpenChange={setIsMarkAsPaidDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Tandai Lunas</DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menandai transaksi ini sebagai <strong>Lunas</strong>?
            </DialogDescription>
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-justify text-sm text-slate-700">
              <div className="flex gap-2">
                <Info className="h-5 w-5 shrink-0 text-blue-600" />
                <span>
                  Proses ini akan mencatat transaksi ke <b>Finance Kas Harian</b>.
                </span>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMarkAsPaidDialogOpen(false)}
              disabled={updatePaymentStatusMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleMarkAsPaid}
              disabled={updatePaymentStatusMutation.isPending}
            >
              {updatePaymentStatusMutation.isPending ? 'Memproses...' : 'Ya, Tandai Lunas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG PROSES BARANG */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Proses Barang</DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin memproses pengeluaran sparepart ini ke Warehouse?
            </DialogDescription>
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-justify text-sm text-slate-700">
              <div className="flex gap-2">
                <Info className="h-5 w-5 shrink-0 text-blue-600" />
                <span>
                  Proses ini akan membuat dokumen pengeluaran stok sparepart pada <b>Warehouse Activity</b>.
                </span>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProcessDialogOpen(false)}
              disabled={createWarehouseActivityMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleProcessGoods}
              disabled={createWarehouseActivityMutation.isPending}
            >
              {createWarehouseActivityMutation.isPending ? 'Memproses...' : 'Ya, Proses Barang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
