import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SalesDetailCards } from '@/components/features/sales/detail/SalesDetailCards';
import { SalesUnitTable } from '@/components/features/sales/detail/SalesUnitTable';
import { toast } from 'sonner';
import { useSalesById } from '@/hooks/useSales';
import { useCurrentBilling, useBillingHistory, useUpdateBillingIsPaid, useUnitBillings } from '@/hooks/useUnitBilling';
import { mapSalesDetailToUI } from '@/services/sales.mapper';
import { warehouseActivityService } from '@/services/warehouseActivity.service';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryClient } from '@tanstack/react-query';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils/format';
import { LoadingState } from '@/components/ui/loading-state';
import { useCompany } from '@/contexts/CompanyContext';
import { CreditCard, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { TextTruncate } from '@/components/ui/text-truncate';
import { UnitTypeDetailTable } from '@/components/features/unit-transaction/UnitTypeDetailTable';
import { useDocumentTemplate } from '@/hooks/useDocumentTemplate';

export default function SalesDetailPage() {
  const router = useRouter();
  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');
  const canCreate = hasPermission('transaction:create');

  const { slug, id } = router.query;
  const { data: sales, isLoading, isError, refetch: refetchSales } = useSalesById(id as string);
  const { data: documentTemplate } = useDocumentTemplate(sales?.documentTemplateId ?? null);
  const { data: billings = [] } = useUnitBillings(sales?.id);
  const { data: currentBilling, isLoading: billingLoading } = useCurrentBilling(String(sales?.id ?? ''));
  const billingId = String(currentBilling?.id ?? '');
  const { data: billingHistories = [], isLoading: historyLoading } = useBillingHistory(billingId || undefined, String(sales?.id ?? ''));
  const updateBillingIsPaid = useUpdateBillingIsPaid();

  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isWarehouseProcessing, setIsWarehouseProcessing] = useState(false);
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && sales && sales?.type !== 'sales') {
      router.push(`/dashboard/${slug}/transaksi/penjualan-unit`);
    }
  }, [sales, isLoading, router, slug]);

  const salesData = useMemo(() => {
    return sales ? mapSalesDetailToUI(sales as any) : null;
  }, [sales]);

  const basePath = slug ? `/dashboard/${slug}/transaksi/penjualan-unit` : '/transaksi/penjualan-unit';

  const billingSummary = sales?.billing_summary;
  const totalTagihan = Number(billingSummary?.grand_total ?? sales?.unit_transaction_bruto_total ?? sales?.unit_transaction_item_bruto_total ?? 0);
  const totalPaid = Number(billingSummary?.total_paid ?? billings.reduce(
    (acc: number, item: any) => acc + Number(item.bca_payment ?? 0) + Number(item.cash_payment ?? 0) + Number(item.bca_payment_2 ?? 0),
    0,
  ));
  const hasPaidBilling = billings.some((item: any) => Boolean(item.is_paid));
  const isPaid = billingSummary?.is_paid ?? (hasPaidBilling || (totalPaid >= totalTagihan && totalTagihan > 0));
  const isRefunded = sales?.has_refund_transaction;

  const deliveryButtonText = useMemo(() => {
    if (isWarehouseProcessing) return 'Memproses...';
    if (sales?.warehouse_activity?.state === 'done') return 'Selesai Diproses';
    if (sales?.warehouse_activity?.state === 'process') return 'Sedang Diproses';
    if (sales?.warehouse_activity?.state === 'draft') return 'Proses Pengiriman';
    if (sales?.warehouse_activity) return 'Sudah Diproses';
    return 'Proses Barang';
  }, [isWarehouseProcessing, sales?.warehouse_activity]);
  const canDeliver = isPaid
    && sales?.isUnitTypeDetailValid === true
    && deliveryButtonText === 'Proses Barang';

  const resolvedBillingHistories =
    billingHistories.length > 0
      ? billingHistories
      : (sales?.unit_transaction_billing?.unit_transaction_billing_histories ?? []).map((history) => ({
        id: String(history.id ?? ''),
        unit_transaction_billing_id: String(history.unit_transaction_billing_id ?? sales?.unit_transaction_billing?.id ?? ''),
        unit_transaction_id: sales?.id,
        payment_proof: history.payment_proof ?? null,
        bca_payment_amount: Number((history as any).bca_payment_amount ?? (history as any).bca_payment ?? 0),
        cash_payment_amount: Number((history as any).cash_payment_amount ?? (history as any).cash_payment ?? 0),
        bca_payment_usd_amount: Number((history as any).bca_payment_usd_amount ?? (history as any).bca_payment_2 ?? 0),
        payment_at: String(history.payment_at ?? ''),
        note: history.note,
        created_at: history.created_at,
        updated_at: history.updated_at,
        cashes: (history as any).cashes,
      }));

  useEffect(() => {
    if (router.query.print === 'true' && !isLoading && sales?.documentTemplateId) {
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [router.query.print, isLoading, sales]);

  const historyColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'Tanggal',
        alignment: 'left',
        cell: (history) =>
          history.payment_at
            ? formatDate(history?.payment_at)
            : '-',
      },
      {
        header: 'Keterangan Bayar',
        alignment: 'left',
        cell: (history) => (
          <TextTruncate text={history?.note ?? '-'} maxLength={20} className="break-all" />
        ),
      },
      {
        header: 'Bukti Pembayaran',
        alignment: 'left',
        cell: (history) =>
          history.payment_proof ? (
            <a
              href={history.payment_proof}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline text-xs font-medium"
            >
              Lihat Bukti
            </a>
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        header: 'Nominal Pembayaran BCA USD',
        alignment: 'right',
        cell: (history) => {
          const usdPayment = Number(history.bca_payment_usd_amount ?? 0);
          return usdPayment > 0 ? `$ ${usdPayment.toLocaleString('id-ID')}` : '-';
        },
      },
      {
        header: 'Nominal Pembayaran BCA IDR',
        alignment: 'right',
        cell: (history) => {
          const bcaPayment = Number(history.bca_payment_amount ?? 0);
          return bcaPayment > 0 ? `Rp ${bcaPayment.toLocaleString('id-ID')}` : '-';
        },
      },
      {
        header: 'Nominal Pembayaran CASH IDR',
        alignment: 'right',
        cell: (history) => {
          const cashPayment = Number(history.cash_payment_amount ?? 0);
          return cashPayment > 0 ? `Rp ${cashPayment.toLocaleString('id-ID')}` : '-';
        },
      },
    ],
    []
  );

  const handleCreateUnit = () => {
    router.push(`${basePath}/${id}/create-unit`);
  };

  const handlePayment = () => {
    router.push(`${basePath}/${id}/payment`);
  };

  const handleMarkAsPaid = async () => {
    const targetBillingId = String(currentBilling?.id || sales?.unit_transaction_billing?.id || billings[0]?.id || '');
    if (!targetBillingId) {
      toast.error('Data billing tidak ditemukan pada transaksi ini.');
      return;
    }

    try {
      await updateBillingIsPaid.mutateAsync({ billingId: targetBillingId, isPaid: 'true' });
      toast.success('Transaksi berhasil ditandai sebagai Lunas.');
      setIsMarkAsPaidDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menandai transaksi sebagai Lunas.');
    }
  };

  const handleDelivery = async () => {
    if (!sales?.id) return;
    if (sales.warehouse_activity) {
      setIsDeliveryDialogOpen(false);
      return;
    }

    setIsWarehouseProcessing(true);
    try {
      const warehouseId = String(sales.warehouse?.id ?? '').trim();
      const personId = String(sales.person?.id ?? '').trim();

      if (!warehouseId) {
        toast.error('warehouse_id belum tersedia pada transaksi ini.');
        setIsDeliveryDialogOpen(false);
        return;
      }
      if (!personId) {
        toast.error('person_id belum tersedia pada transaksi ini.');
        setIsDeliveryDialogOpen(false);
        return;
      }

      const items = sales?.unit_transaction_items ?? [];
      if (items.length === 0) {
        toast.error('Item transaksi belum tersedia. Tidak dapat melakukan Proses Barang.');
        setIsDeliveryDialogOpen(false);
        return;
      }

      // Check if all items are fully assigned
      const incompleteItems: string[] = [];
      items.forEach((item: any) => {
        const qty = Number(item.qty_total ?? 0);
        const assignedCount = (item.unit_type_sold_details ?? []).length;
        if (qty !== assignedCount) {
          const typeName = item.unit_type?.name || `Tipe #${item.unit_type_id}`;
          incompleteItems.push(`${typeName} (Qty: ${qty}, Assigned: ${assignedCount})`);
        }
      });

      if (incompleteItems.length > 0) {
        toast.error(
          `Belum semua unit dialokasikan:\n- ${incompleteItems.join('\n- ')}\n\nSilakan klik tombol Action > Detail pada tabel di bawah untuk memilih stock unit yang ingin dialokasikan.`,
          { duration: 8000 }
        );
        setIsDeliveryDialogOpen(false);
        return;
      }

      const detailIds = items
        .flatMap((item: any) => item.unit_type_sold_details ?? [])
        .map((row: any) => Number(row.id ?? row.unit_transaction_item_detail_id))
        .filter((val: number) => Number.isFinite(val) && val > 0);

      if (detailIds.length === 0) {
        toast.error('Belum ada unit terpilih untuk dikirim.');
        setIsDeliveryDialogOpen(false);
        return;
      }

      const description = String(`Pengiriman Stok Transaksi beli ${sales?.code} Sebanyak ${detailIds?.length} Unit`);

      const activityId = await warehouseActivityService.createIssueActivity({
        unitTransactionId: String(sales.id),
        warehouseId,
        personId,
        description,
        unitTransactionItemId: String(items[0]?.id ?? ''),
      });

      await warehouseActivityService.dispatchStock(activityId, detailIds);

      await queryClient.invalidateQueries({ queryKey: ['sales-by-id', companyId, sales.id] });
      await queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['sales-unit-items', sales.id] });
      await queryClient.invalidateQueries({ queryKey: ['stock-units'] });

      await refetchSales();
      toast.success('Stok berhasil dikirim.');
      setIsDeliveryDialogOpen(false);
    } catch (error: any) {
      await refetchSales();
      toast.error(error?.message || 'Gagal mengirim barang.');
      setIsDeliveryDialogOpen(false);
    } finally {
      setIsWarehouseProcessing(false);
    }
  };

  if (isLoading || billingLoading || historyLoading || !salesData) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (isError || !sales) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Penjualan tidak ditemukan</p>
          <Button onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit`)}>Kembali ke List</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Penjualan Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/penjualan-unit`) },
            { label: 'Detail Penjualan' }
          ]}
          title="Data Penjualan"
          onBack={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit`)}
          subtitle={
            <>
              <span>Kode Jual:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{sales.code}</span>
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
          actions={
            <>
              <Button disabled={isRefunded || !canCreate} className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={handlePayment}>
                <CreditCard className="mr-2 h-4 w-4" />
                {isPaid ? 'Sudah Dibayar' : 'Bayar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPaid || isRefunded || updateBillingIsPaid.isPending || sales?.unit_transaction_billing == null || !canCreate}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setIsMarkAsPaidDialogOpen(true)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isPaid ? 'Sudah Lunas' : 'Tandai Lunas'}
              </Button>
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-50 border-gray-200"
                disabled={!canDeliver || !canCreate}
                onClick={() => setIsDeliveryDialogOpen(true)}
              >
                {deliveryButtonText}
              </Button>
            </>
          }
        />

        <div className="rounded-md border bg-white px-4 py-3 text-sm shadow-sm">
          <span className="text-muted-foreground">Document Template:</span>{' '}
          <span className="font-medium">{documentTemplate?.name ?? 'Tidak ada template'}</span>
        </div>

        {isRefunded ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-655 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Transaksi Sudah Direfund</p>
              <p className="text-xs mt-0.5 text-amber-700/95">
                Status stok saat ini adalah <span className="font-mono font-medium bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">outbound_return</span>. Proses Proses Barang dinonaktifkan.
              </p>
            </div>
          </div>
        ) : null}

        {/* 3-COLUMN CARDS */}
        <SalesDetailCards data={salesData} billingHistories={resolvedBillingHistories} />

        {/* UNIT TABLE */}
        <SalesUnitTable lineItems={salesData.lineItems} salesId={sales.id} onAddUnit={handleCreateUnit} canEdit={canEdit} canDelete={canDelete} canCreate={canCreate} isPaid={isPaid} />

        <UnitTypeDetailTable transactionId={sales.id} />

        {/* PAYMENT HISTORY TABLE */}
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">History Pembayaran</h2>
            <p className="text-xs text-muted-foreground">Rincian lengkap unit yang terjual</p>
          </div>

          <BaseTable
            data={resolvedBillingHistories}
            columns={historyColumns}
            loading={historyLoading}
          />
        </div>
      </div>

      {/* CONFIRMATION DIALOG TANDAI LUNAS */}
      <Dialog open={isMarkAsPaidDialogOpen} onOpenChange={setIsMarkAsPaidDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Tandai Lunas</DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menandai transaksi ini sebagai <strong>Lunas</strong>?
            </DialogDescription>
            <div className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-md p-2 text-justify">
              <div className="flex gap-2">
                <span>
                  <Info />
                </span>
                <span>
                  Proses ini akan menambah data baru pada <b>Administrasi Arus Transaksi</b> dan <b>Finance Transaksi Kas Harian</b>, dan data <b>Administrasi</b> yang sudah dibilling tidak bisa dirubah data didalamnya.
                </span>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMarkAsPaidDialogOpen(false)}
              disabled={updateBillingIsPaid.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleMarkAsPaid}
              disabled={updateBillingIsPaid.isPending || !canCreate}
            >
              {updateBillingIsPaid.isPending ? 'Memproses...' : 'Ya, Tandai Lunas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG Proses Barang */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Proses Barang</DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin mengirim barang ini?
            </DialogDescription>
            <div className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-md p-2 text-justify">
              <div className="flex gap-2">
                <span>
                  <Info />
                </span>
                <span>
                  Dengan klik Proses Barang maka akan mengurangi stock <b>Warehouse</b> dan barang akan dikirim ke pembeli.
                </span>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeliveryDialogOpen(false)}
              disabled={isWarehouseProcessing}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleDelivery}
              disabled={isWarehouseProcessing}
            >
              {isWarehouseProcessing ? 'Memproses...' : 'Ya, Proses Barang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
