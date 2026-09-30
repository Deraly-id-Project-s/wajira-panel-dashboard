'use client';

import { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CreditCard, Edit, Info, MoreVertical, ReceiptText, Warehouse } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaymentModal } from '@/components/features/sparepart-transaction/PaymentModal';
import DeletePaymentDialog from '@/components/features/sparepart-transaction/DeletePaymentDialog';
import VehicleEquipmentTransactionCards from '@/components/features/vehicle-equipment-transaction/VehicleEquipmentTransactionCards';
import {
  useCreateVehicleEquipmentBillingHistory,
  useDeleteVehicleEquipmentBillingHistory,
  useUpdateVehicleEquipmentBillingHistory,
  useUpdateVehicleEquipmentBillingPaymentStatus,
  useVehicleEquipmentTransaction,
  vehicleEquipmentTransactionKeys,
} from '@/hooks/useVehicleEquipmentTransaction';
import { useCreateWarehouseActivity } from '@/hooks/useWarehouseActivity';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface VehicleEquipmentTransactionDetailPageProps {
  type: 'purchase' | 'sales';
}

export default function VehicleEquipmentTransactionDetailPage({ type }: VehicleEquipmentTransactionDetailPageProps) {
  const router = useRouter();
  const { slug, id } = router.query;
  const transactionId = typeof id === 'string' ? id : '';
  const isSales = type === 'sales';
  const baseRoute = isSales ? 'penjualan-perlengkapan' : 'pembelian-perlengkapan';
  const title = isSales ? 'Data Penjualan Perlengkapan' : 'Data Pembelian Perlengkapan';
  const listTitle = isSales ? 'Penjualan Perlengkapan' : 'Pembelian Perlengkapan';
  const partyLabel = isSales ? 'Customer' : 'Vendor';

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const { data: transaction, isLoading, error } = useVehicleEquipmentTransaction(transactionId, Boolean(transactionId));
  const createPaymentMutation = useCreateVehicleEquipmentBillingHistory();
  const updatePaymentMutation = useUpdateVehicleEquipmentBillingHistory();
  const deletePaymentMutation = useDeleteVehicleEquipmentBillingHistory();
  const updatePaymentStatusMutation = useUpdateVehicleEquipmentBillingPaymentStatus();
  const createWarehouseActivityMutation = useCreateWarehouseActivity();
  const queryClient = useQueryClient();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);

  const handleBack = () => router.push(`/dashboard/${slug}/transaksi/${baseRoute}`);

  const handlePaymentSubmit = async (data: any) => {
    if (!transaction?.goods_transaction_billing?.id) {
      toast.error('Billing ID tidak valid');
      return;
    }

    try {
      if (selectedPayment) {
        await updatePaymentMutation.mutateAsync({
          id: String(selectedPayment.id),
          payload: {
            goods_transaction_billing_id: transaction.goods_transaction_billing.id,
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
          goods_transaction_billing_id: transaction.goods_transaction_billing.id,
          payment_at: data.payment_at,
          cash_payment_amount: data.cash_payment_amount,
          bca_payment_amount: data.bca_payment_amount,
          bca_payment_usd_amount: data.bca_payment_usd_amount,
          note: data.note,
        });
        toast.success('Pembayaran berhasil ditambahkan');
      }
      setPaymentModalOpen(false);
      setSelectedPayment(null);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memproses pembayaran');
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentId) return;
    try {
      await deletePaymentMutation.mutateAsync(deletePaymentId);
      toast.success('Pembayaran berhasil dihapus');
      setDeletePaymentId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus pembayaran');
    }
  };

  const handleMarkAsPaid = async () => {
    const billing = transaction?.goods_transaction_billing;
    if (!billing?.id) {
      toast.error('Billing ID tidak valid');
      return;
    }

    try {
      await updatePaymentStatusMutation.mutateAsync({ billingId: String(billing.id), is_paid: true });
      toast.success('Transaksi berhasil ditandai lunas');
      setIsMarkAsPaidDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menandai transaksi lunas');
    }
  };

  const handleProcessGoods = async () => {
    const warehouseId = transaction?.warehouse_id ?? transaction?.warehouse?.id;
    if (!transaction?.id || !warehouseId || !transaction.person_id) {
      toast.error(`Data warehouse atau ${partyLabel.toLowerCase()} tidak tersedia pada transaksi ini.`);
      return;
    }

    try {
      await createWarehouseActivityMutation.mutateAsync({
        warehouse_id: String(warehouseId),
        person_id: String(transaction.person_id),
        goods_transaction_id: String(transaction.id),
        type: 'vehicle-equipment',
        activity_type: isSales ? 'issue' : 'receipt',
        activity_date: format(new Date(), 'yyyy-MM-dd'),
        description: `${isSales ? 'Pengeluaran' : 'Penerimaan'} perlengkapan ${transaction.code} sebanyak ${transaction.qty}`,
        state: 'draft',
      });
      setProcessDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: vehicleEquipmentTransactionKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['warehouse-activities'] });
      await queryClient.invalidateQueries({ queryKey: ['stock-vehicle-equipment'] });
      toast.success(`${isSales ? 'Pengeluaran' : 'Penerimaan'} perlengkapan berhasil dibuat di Warehouse.`);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal membuat aktivitas Warehouse.');
    }
  };

  const billing = transaction?.goods_transaction_billing;
  const histories = billing?.goods_transaction_billing_histories || [];
  const remainingPayment = Number(billing?.is_remaining_payment ?? transaction?.billing_summary?.remaining_payment ?? 0);
  const isPaid = Boolean(billing?.is_paid ?? transaction?.billing_summary?.is_paid);
  const hasWarehouseActivity = Boolean(transaction?.has_warehouse_activity);
  const canMarkAsPaid = !isPaid && Number.isFinite(remainingPayment) && remainingPayment === 0 && Boolean(billing?.id);
  const canProcessGoods = isPaid && !transaction?.is_refunded && !hasWarehouseActivity;

  const historyColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      header: 'Tanggal Pembayaran',
      accessorKey: 'payment_at',
      alignment: 'left',
      cell: (item) => formatDate(item.payment_at || item.created_at) || '-',
    },
    {
      header: 'Nominal Dibayar',
      accessorKey: 'grand_total',
      alignment: 'right',
      cell: (item) => currenciesFormat('idr', item.grand_total || item.cash_payment_amount || item.bca_payment_amount || 0),
    },
    {
      header: 'Keterangan',
      accessorKey: 'note',
      alignment: 'left',
      cell: (item) => item.note || '-',
    },
    {
      header: 'Aksi',
      alignment: 'center',
      sticky: 'right',
      cell: (item) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                disabled={!canEdit || isPaid}
                onClick={() => {
                  setSelectedPayment(item);
                  setPaymentModalOpen(true);
                }}
                className="cursor-pointer rounded-md px-3 py-2 text-sm"
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canDelete || isPaid}
                onClick={() => setDeletePaymentId(String(item.id))}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [canDelete, canEdit, isPaid]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" text={`Memuat ${listTitle.toLowerCase()}...`} />
      </DashboardLayout>
    );
  }

  if (error || !transaction) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader title={title} subtitle="Data transaksi tidak dapat ditemukan" onBack={handleBack} />
          <Card className="rounded-md border-red-200 bg-red-50 shadow-none">
            <CardContent className="p-6 text-sm text-red-700">Data transaksi perlengkapan tidak ditemukan.</CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head><title>{title} - Wajira Dashboard</title></Head>

      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: listTitle, onClick: handleBack },
            { label: 'Detail' },
          ]}
          title={title}
          subtitle={(
            <div className="flex flex-wrap items-center gap-2">
              <span>Kode:</span>
              <span className="font-semibold text-orange-600">{transaction.code}</span>
              <Badge
                variant="outline"
                className={cn('font-semibold', isPaid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700')}
              >
                {isPaid ? 'Lunas' : 'Belum Lunas'}
              </Badge>
            </div>
          )}
          onBack={handleBack}
          actions={(
            <TooltipProvider>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="default"
                  disabled={!canEdit || isPaid}
                  onClick={() => {
                    setSelectedPayment(null);
                    setPaymentModalOpen(true);
                  }}
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
                        disabled={!canEdit || !canMarkAsPaid || updatePaymentStatusMutation.isPending}
                        onClick={() => setIsMarkAsPaidDialogOpen(true)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {isPaid ? 'Sudah Lunas' : 'Tandai Lunas'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-center text-xs">
                    {canMarkAsPaid ? 'Tandai transaksi lunas' : isPaid ? 'Transaksi sudah lunas' : 'Pastikan sisa tagihan sudah nol'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button
                        variant="default"
                        disabled={!canEdit || !canProcessGoods || createWarehouseActivityMutation.isPending}
                        onClick={() => setProcessDialogOpen(true)}
                      >
                        <Warehouse className="mr-2 h-4 w-4" />
                        {hasWarehouseActivity ? 'Sudah Diproses' : createWarehouseActivityMutation.isPending ? 'Memproses...' : 'Proses Barang'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-center text-xs">
                    {canProcessGoods
                      ? `Kirim data ${isSales ? 'pengeluaran' : 'penerimaan'} perlengkapan ke Warehouse`
                      : hasWarehouseActivity
                        ? 'Barang sudah diproses di Warehouse'
                        : 'Transaksi harus lunas sebelum memproses barang'}
                  </TooltipContent>
                </Tooltip>

                <Button
                  variant="outline"
                  disabled={!canEdit || isPaid}
                  onClick={() => router.push(`/dashboard/${slug}/transaksi/${baseRoute}/edit/${transaction.id}`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Data
                </Button>
              </div>
            </TooltipProvider>
          )}
        />

        <VehicleEquipmentTransactionCards transaction={transaction} partyLabel={partyLabel} />

        <CollapsibleBox
          title="Riwayat Pembayaran"
          description="Rincian pembayaran transaksi perlengkapan"
          icon={ReceiptText}
          defaultExpanded
        >
          <BaseTable data={histories} columns={historyColumns} loading={isLoading} headerRowClassName="bg-green-100" />
        </CollapsibleBox>
      </div>

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        defaultValues={selectedPayment}
        loading={createPaymentMutation.isPending || updatePaymentMutation.isPending}
        remainingPayment={remainingPayment}
      />

      <DeletePaymentDialog
        open={Boolean(deletePaymentId)}
        onClose={() => setDeletePaymentId(null)}
        onConfirm={handleDeletePayment}
        loading={deletePaymentMutation.isPending}
      />

      <Dialog open={isMarkAsPaidDialogOpen} onOpenChange={setIsMarkAsPaidDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Tandai Lunas</DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menandai transaksi ini sebagai <strong>Lunas</strong>?
            </DialogDescription>
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="flex gap-2">
                <Info className="h-5 w-5 shrink-0 text-blue-600" />
                <span>Proses ini akan memperbarui status billing transaksi.</span>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsMarkAsPaidDialogOpen(false)} disabled={updatePaymentStatusMutation.isPending}>Batal</Button>
            <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleMarkAsPaid} disabled={updatePaymentStatusMutation.isPending}>
              {updatePaymentStatusMutation.isPending ? 'Memproses...' : 'Ya, Tandai Lunas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Proses Barang</DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin memproses transaksi ini ke Warehouse?
            </DialogDescription>
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="flex gap-2">
                <Info className="h-5 w-5 shrink-0 text-blue-600" />
                <span>Proses ini akan membuat dokumen {isSales ? 'pengeluaran' : 'penerimaan'} perlengkapan pada Warehouse Activity.</span>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setProcessDialogOpen(false)} disabled={createWarehouseActivityMutation.isPending}>Batal</Button>
            <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleProcessGoods} disabled={createWarehouseActivityMutation.isPending}>
              {createWarehouseActivityMutation.isPending ? 'Memproses...' : 'Ya, Proses Barang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
