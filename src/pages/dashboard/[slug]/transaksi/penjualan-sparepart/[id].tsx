import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/format';
import { useSparepartTransaction, useCreateSparepartTransactionBillingHistory, useUpdateSparepartTransactionBillingHistory, useDeleteSparepartTransactionBillingHistory, useUpdateSparepartTransactionBillingPaymentStatus } from '@/hooks/useSparepartTransaction';
import { Button } from '@/components/ui/button';
import { CheckCircle, Eye, Edit, Trash2, Plus, MoreVertical, CreditCard, Info } from 'lucide-react';
import { PaymentModal } from '@/components/features/sparepart-transaction/PaymentModal';
import DeletePaymentDialog from '@/components/features/sparepart-transaction/DeletePaymentDialog';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useCreateWarehouseActivity } from '@/hooks/useWarehouseActivity';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DetailSalesSparepartPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const { data: transaction, isLoading } = useSparepartTransaction(id as string, !!id);
  const createPaymentMutation = useCreateSparepartTransactionBillingHistory();
  const updatePaymentMutation = useUpdateSparepartTransactionBillingHistory();
  const deletePaymentMutation = useDeleteSparepartTransactionBillingHistory();
  const updatePaymentStatusMutation = useUpdateSparepartTransactionBillingPaymentStatus();
  const createWarehouseActivityMutation = useCreateWarehouseActivity();
  const queryClient = useQueryClient();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  const handleBack = () => router.push(`/dashboard/${slug}/transaksi/penjualan-sparepart`);

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
      toast.error("Billing ID tidak valid");
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
          }
        });
        toast.success("Pembayaran berhasil diubah");
      } else {
        await createPaymentMutation.mutateAsync({
          sparepart_transaction_billing_id: transaction.sparepart_transaction_billing.id,
          payment_at: data.payment_at,
          cash_payment_amount: data.cash_payment_amount,
          bca_payment_amount: data.bca_payment_amount,
          bca_payment_usd_amount: data.bca_payment_usd_amount,
          note: data.note,
        });
        toast.success("Pembayaran berhasil ditambahkan");
      }
      setPaymentModalOpen(false);
    } catch {
      toast.error("Gagal memproses pembayaran");
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentId) return;
    try {
      await deletePaymentMutation.mutateAsync(deletePaymentId);
      toast.success("Pembayaran berhasil dihapus");
      setDeletePaymentId(null);
    } catch {
      toast.error("Gagal menghapus pembayaran");
    }
  }

  const handleMarkAsPaid = async () => {
    const billing = transaction?.sparepart_transaction_billing;
    const remainingPayment = Number(billing?.is_remaining_payment ?? transaction?.billing_summary?.remaining_payment);

    if (billing?.is_paid) return;
    if (!Number.isFinite(remainingPayment) || remainingPayment !== 0) {
      toast.error("Transaksi masih memiliki sisa pembayaran");
      return;
    }
    if (!billing?.id) {
      toast.error("Billing ID tidak valid");
      return;
    }

    try {
      await updatePaymentStatusMutation.mutateAsync({ billingId: String(billing.id), is_paid: true });
      toast.success("Transaksi berhasil ditandai lunas");
    } catch {
      toast.error("Gagal menandai transaksi lunas");
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center">Data tidak ditemukan</div>
      </DashboardLayout>
    )
  }

  const sparepartBilling = transaction?.sparepart_transaction_billing;
  const histories = sparepartBilling?.sparepart_transaction_billing_histories || [];
  const totalTagihan = Number(sparepartBilling?.grand_total ?? transaction.billing_summary?.grand_total ?? transaction.transaction_netto_total ?? 0);
  const totalPaid = Number(transaction.billing_summary?.total_paid ?? 0);
  const remainingPayment = Number(sparepartBilling?.is_remaining_payment ?? transaction.billing_summary?.remaining_payment);
  const isPaid = sparepartBilling?.is_paid === true;
  const canMarkAsPaid = !isPaid && Number.isFinite(remainingPayment) && remainingPayment === 0 && Boolean(sparepartBilling?.id);
  const canProcessGoods = isPaid && !transaction.is_refunded && !isProcessed;

  const billingStatusLabel = isPaid ? 'Lunas' : 'Belum Lunas';

  const columns: ColumnDef<any>[] = [
    {
      header: 'Tanggal Pembayaran',
      accessorKey: 'payment_at',
      sortable: false,
      cell: (item: any) => formatDate(item.payment_at || item.created_at) || '-'
    },
    {
      header: 'Nominal Dibayar',
      accessorKey: 'grand_total',
      alignment: 'center',
      sortable: false,
      cell: (item: any) => currenciesFormat('idr', item.grand_total || item.cash_payment_amount || item.bca_payment_amount || 0)
    },
    {
      header: 'Keterangan',
      accessorKey: 'note',
      sortable: false,
      cell: (item: any) => item.note || '-'
    },
    {
      header: 'Aksi',
      alignment: 'center',
      sticky: 'right',
      cell: (item: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditPayment(item)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              onClick={() => setDeletePaymentId(String(item.id))}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  // histories is already computed above

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Detail Penjualan Sparepart"
          subtitle={
            <>
              <span>Kode Jual:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{transaction.code}</span>
              {isPaid ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">
                  Lunas
                </Badge>
              ) : (
                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 font-semibold">
                  Belum Lunas
                </Badge>
              )}
            </>
          }
          onBack={handleBack}
          breadcrumbs={[
            { label: 'Penjualan Sparepart', onClick: handleBack },
            { label: 'Detail Penjualan' },
          ]}
          actions={
            <>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canEdit || isPaid}
                onClick={openAddPayment} >
                <CreditCard className="mr-2 h-4 w-4" />
                {isPaid ? 'Sudah Dibayar' : 'Bayar'}
              </Button>
              <Button
                onClick={handleMarkAsPaid}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={updatePaymentStatusMutation.isPending || !canEdit || !canMarkAsPaid}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Tandai Lunas
              </Button>
              <Button
                onClick={() => setProcessDialogOpen(true)}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canEdit || !canProcessGoods || createWarehouseActivityMutation.isPending}
              >
                {createWarehouseActivityMutation.isPending ? 'Memproses...' : isProcessed ? 'Sudah Diproses' : 'Proses Barang'}
              </Button>
              <Button
                variant="outline"
                disabled={isPaid}
                onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-sparepart/edit/${transaction.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Data
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-none border-gray-200">
              <CardHeader className="bg-slate-50/50 border-b border-gray-100 py-4 px-6">
                <CardTitle className="text-lg font-semibold">Informasi Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-700 p-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Tanggal Transaksi</p>
                    <p className="text-base text-slate-900 font-medium">{formatDate(transaction.transaction_date || transaction.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">No Nota</p>
                    <p className="text-base text-slate-900 font-medium">{transaction.nota_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Customer</p>
                    <p className="text-base text-slate-900 font-medium">{transaction.person?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Gudang Penyimpanan</p>
                    <p className="text-base text-slate-900 font-medium">{transaction.warehouse?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Sparepart</p>
                    <p className="text-base text-slate-900 font-medium">{transaction.sparepart?.name || '-'} ({transaction.sparepart?.code})</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Kuantitas</p>
                    <p className="text-base text-slate-900 font-medium">{transaction.qty} {transaction.sparepart?.unit_type || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Tipe Pembayaran</p>
                    <p className="text-base text-slate-900 font-medium capitalize">{transaction.billing_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Catatan</p>
                    <p className="text-base text-slate-900 font-medium">{transaction.note || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-gray-200">
              <CardHeader className="bg-slate-50/50 border-b border-gray-100 py-4 px-6 flex flex-row items-center justify-between">
                <CardTitle className=" text-lg font-semibold">Riwayat Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-6">
                <div className="overflow-x-auto">
                  <BaseTable
                    data={histories}
                    columns={columns}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-none border-gray-200">
              <CardHeader className="bg-slate-50/50 border-b border-gray-100 py-4 px-6">
                <CardTitle className="text-lg font-semibold">Rincian Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Harga Satuan</span>
                  <span className="font-medium text-slate-900">{currenciesFormat('idr', transaction.price)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Kuantitas</span>
                  <span className="font-medium text-slate-900">{transaction.qty}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total Bruto</span>
                  <span className="font-medium text-slate-900">{currenciesFormat('idr', transaction.transaction_bruto_total)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Diskon</span>
                  <span className="font-medium text-slate-900">{transaction.discount}%</span>
                </div>

                <div className="h-px bg-slate-200 my-2"></div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">TOTAL PENJUALAN</span>
                  <span className="font-bold text-base text-slate-900">{currenciesFormat('idr', transaction.transaction_netto_total)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-gray-200">
              <CardHeader className="bg-slate-50/50 border-b border-gray-100 py-4 px-6">
                <CardTitle className="text-lg font-semibold">Rincian Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total Tagihan</span>
                  <span className="font-medium text-slate-900">{currenciesFormat('idr', totalTagihan)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total Dibayar</span>
                  <span className="font-medium text-emerald-600">{currenciesFormat('idr', totalPaid)}</span>
                </div>

                <div className="h-px bg-slate-200 my-2"></div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">KURANG BAYAR</span>
                  <span className="font-bold text-base text-red-600">{currenciesFormat('idr', remainingPayment)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
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
          open={!!deletePaymentId}
          onClose={() => setDeletePaymentId(null)}
          onConfirm={handleDeletePayment}
          loading={deletePaymentMutation.isPending}
        />

        <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Konfirmasi Proses Barang</DialogTitle>
              <DialogDescription className="pt-2">Apakah Anda yakin ingin memproses pengeluaran sparepart ini?</DialogDescription>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700">
                <div className="flex gap-2"><Info className="h-5 w-5 shrink-0" /><span>Proses ini akan membuat data pengeluaran sparepart pada Warehouse.</span></div>
              </div>
            </DialogHeader>
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setProcessDialogOpen(false)} disabled={createWarehouseActivityMutation.isPending}>Batal</Button>
              <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleProcessGoods} disabled={createWarehouseActivityMutation.isPending}>
                {createWarehouseActivityMutation.isPending ? 'Memproses...' : 'Ya, Proses Barang'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
