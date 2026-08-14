'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PurchaseDetailCards } from '@/components/features/purchase/PurchaseDetailCards';
import PurchaseUnitTable from '@/components/features/purchase/PurchaseUnitTable';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { usePurchaseById, useUpdateUnitTransactionState } from '@/hooks/useUnitTransaction';
import { useUnitBillings, useCurrentBilling, useBillingHistory, useUpdateBillingIsPaid } from '@/hooks/useUnitBilling';
import { usePurchaseUnitItems } from '@/hooks/useUnitTransactionItem';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import { unitItemDetailService } from '@/services/unitItemDetail.service';
import { warehouseActivityService } from '@/services/warehouseActivity.service';
import { CreditCard, AlertTriangle, CheckCircle2, Info, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { TextTruncate } from '@/components/ui/text-truncate';
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

const PURCHASE_PREPARE_STOCK_STATE = 'inbound_incoming_goods';
const PURCHASE_RECEIVED_STOCK_STATE = 'inbound_receipt';

const readApiError = (error: any): string => {
  const details = error?.details ?? error?.response?.data?.errors;
  if (typeof details === 'string' && details.trim()) return details;

  if (details && typeof details === 'object') {
    const text = Object.entries(details)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value[0] : String(value)}`)
      .join(', ')
      .trim();
    if (text) return text;
  }

  return error?.response?.data?.message || error?.message || 'Unexpected server error';
};

export default function PurchaseDetailPage() {
  const router = useRouter();
  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const { slug, id } = router.query;
  const { data: purchase, isLoading, isError } = usePurchaseById(id as string);
  const { data: billings = [] } = useUnitBillings(purchase?.id);
  const { data: currentBilling, isLoading: billingLoading } = useCurrentBilling(String(purchase?.id ?? ''));
  const billingId = String(currentBilling?.id ?? '');
  const { data: billingHistories = [], isLoading: historyLoading } = useBillingHistory(billingId || undefined, String(purchase?.id ?? ''));
  const { data: unitItemsResponse, isLoading: unitItemsLoading } = usePurchaseUnitItems(purchase?.id);
  const updateState = useUpdateUnitTransactionState();
  const updateBillingIsPaid = useUpdateBillingIsPaid();
  const { data: typeUnits } = useTypeUnits();

  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && purchase && purchase?.type !== 'purchase') {
      router.push(`/dashboard/${slug}/transaksi/pembelian-unit`);
    }
  }, [purchase, isLoading, router, slug]);

  const billingSummary = purchase?.billing_summary;
  const totalTagihan = Number(billingSummary?.grand_total ?? purchase?.unit_transaction_bruto_total ?? purchase?.unit_transaction_item_bruto_total ?? 0);
  const totalPaid = Number(billingSummary?.total_paid ?? billings.reduce(
    (acc: number, item: any) => acc + Number(item.bca_payment ?? 0) + Number(item.cash_payment ?? 0) + Number(item.bca_payment_2 ?? 0),
    0,
  ));
  const hasPaidBilling = billings.some((item: any) => Boolean(item.is_paid));
  const isPaid = billingSummary?.is_paid ?? (hasPaidBilling || (totalPaid >= totalTagihan && totalTagihan > 0));
  const currentStockState = String(purchase?.stock_state ?? '').toLowerCase();
  const isRefunded = purchase?.has_refund_transaction;
  const canReceive = isPaid && purchase?.isUnitTypeDetailValid === true && (purchase?.warehouse_activity ? purchase?.warehouse_activity?.state === 'draft' : true);

  const receiveButtonText = useMemo(() => {
    if (updateState.isPending) return 'Memproses...';
    if (purchase?.warehouse_activity?.state === 'done') return 'Selesai Diproses';
    if (purchase?.warehouse_activity?.state === 'process') return 'Sedang Diproses';
    if (purchase?.warehouse_activity?.state === 'draft') return 'Proses Penerimaan';
    return 'Proses Barang';
  }, [updateState.isPending, purchase?.warehouse_activity?.state]);
  const unitItems = unitItemsResponse?.data ?? [];
  const resolvedBillingHistories =
    billingHistories.length > 0
      ? billingHistories
      : (purchase?.unit_transaction_billing?.unit_transaction_billing_histories ?? []).map((history) => ({
        id: String(history.id ?? ''),
        unit_transaction_billing_id: String(history.unit_transaction_billing_id ?? purchase?.unit_transaction_billing?.id ?? ''),
        unit_transaction_id: purchase?.id,
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
    if (router.query.print === 'true' && !isLoading && purchase) {
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [router.query.print, isLoading, purchase]);

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

  const handleMarkAsPaid = async () => {
    const targetBillingId = String(currentBilling?.id || purchase?.unit_transaction_billing?.id || billings[0]?.id || '');
    if (!targetBillingId) {
      toast.error('Data billing tidak ditemukan pada transaksi ini.');
      return;
    }

    try {
      await updateBillingIsPaid.mutateAsync({ billingId: targetBillingId, isPaid: 'true' });
      toast.success('Transaksi berhasil ditandai sebagai Lunas.');
      setIsMarkAsPaidDialogOpen(false);
    } catch (error: any) {
      toast.error(readApiError(error));
    }
  };

  console.log(purchase)


  const handleReceipt = async () => {
    if (!purchase?.id) return;

    try {
      const warehouseId = String(purchase.warehouse?.id ?? '').trim();
      const personId = String(purchase.person?.id ?? '').trim();
      const purchaseId = String(purchase?.id);

      if (!warehouseId) {
        toast.error('warehouse_id belum tersedia pada transaksi ini.');
        setIsReceiveDialogOpen(false);
        return;
      }
      if (!personId) {
        toast.error('person_id belum tersedia pada transaksi ini.');
        setIsReceiveDialogOpen(false);
        return;
      }
      if (unitItems.length === 0) {
        toast.error('Item transaksi belum tersedia. Tidak dapat melakukan Proses Barang.');
        setIsReceiveDialogOpen(false);
        return;
      }

      const getUnitTypeName = (typeId?: string | number) => {
        if (!typeId) return '-';
        return typeUnits?.data?.find((type) => String(type.id) === String(typeId))?.name ?? String(typeId);
      };

      const incompleteItems: string[] = [];
      const detailRows = await Promise.all(
        unitItems.map(async (item) => {
          const res = await unitItemDetailService.getDetails(String(item.id), { page: 1, perPage: 200 });
          const qty = Number(item.qty_total ?? 0);
          const detailsCount = res.data?.length ?? 0;
          if (qty !== detailsCount) {
            incompleteItems.push(`${getUnitTypeName(item.unit_type_id)} (Qty: ${qty}, Detail Terisi: ${detailsCount})`);
          }
          return res;
        }),
      );

      if (incompleteItems.length > 0) {
        toast.error(
          `Detail unit belum lengkap:\n- ${incompleteItems.join('\n- ')}\n\nSilakan klik tombol Action > Detail / Kelola Unit pada tabel di bawah untuk melengkapi nomor rangka, nomor mesin, dan warna setiap unit.`,
          { duration: 8000 }
        );
        setIsReceiveDialogOpen(false);
        return;
      }

      const detailIds = detailRows
        .flatMap((row) => row.data)
        .map((detail) => Number(detail.id ?? 0))
        .filter((value) => Number.isFinite(value) && value > 0);

      if (detailIds.length === 0) {
        toast.error('Detail unit transaksi belum tersedia. Tidak dapat melakukan Proses Barang.');
        setIsReceiveDialogOpen(false);
        return;
      }

      let stockStateForWarehouse = currentStockState;
      if (stockStateForWarehouse !== PURCHASE_PREPARE_STOCK_STATE) {
        await updateState.mutateAsync({
          id: purchase.id,
          stockState: PURCHASE_PREPARE_STOCK_STATE,
          unitTransactionDetails: detailIds,
        });
        stockStateForWarehouse = PURCHASE_PREPARE_STOCK_STATE;
      }

      if (stockStateForWarehouse !== PURCHASE_PREPARE_STOCK_STATE) {
        toast.error('State transaksi harus inbound_incoming_goods sebelum membuat warehouse activity.');
        setIsReceiveDialogOpen(false);
        return;
      }

      const description = String(`Penerimaan Stok Transaksi beli ${purchase?.code} Sebanyak ${detailIds?.length} Unit`);

      const activityId = await warehouseActivityService.createReceiptActivity({
        unitTransactionId: String(purchase.id),
        warehouseId,
        description,
        personId,
        unitTransactionItemId: String(unitItems[0]?.id ?? ''),
      });

      await warehouseActivityService.receiptStock(activityId, detailIds);

      await updateState.mutateAsync({
        id: purchase.id,
        stockState: PURCHASE_RECEIVED_STOCK_STATE,
      });

      toast.success('Status pembelian diperbarui ke receipt dan stok warehouse berhasil diproses.');
      setIsReceiveDialogOpen(false);
    } catch (error: any) {
      const message = readApiError(error);

      toast.error(message || 'Gagal update state ke receipt', {
        action: {
          label: 'Retry',
          onClick: () => {
            void handleReceipt();
          },
        },
      });
      setIsReceiveDialogOpen(false);
    }
  };

  if (isLoading || unitItemsLoading || billingLoading || historyLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (isError || !purchase) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Pembelian tidak ditemukan</p>
          <Button onClick={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`)}>Kembali ke List</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Pembelian Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`) },
            { label: 'Detail Pembelian' }
          ]}
          title="Data Pembelian"
          onBack={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`)}
          subtitle={
            <>
              <span>Kode Beli:</span>
              <span className="text-blue-600 font-semibold">{purchase.code}</span>
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
              <Button disabled={isRefunded || !canEdit} className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${purchase.id}/payment`)}>
                <CreditCard className="mr-2 h-4 w-4" />
                {isPaid ? 'Sudah Dibayar' : 'Bayar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canEdit || isPaid || isRefunded || updateBillingIsPaid.isPending || purchase?.unit_transaction_billing == null}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setIsMarkAsPaidDialogOpen(true)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isPaid ? 'Sudah Lunas' : 'Tandai Lunas'}
              </Button>
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-50 border-gray-200"
                disabled={!canReceive || !canEdit}
                onClick={() => setIsReceiveDialogOpen(true)}
              >
                {receiveButtonText}
              </Button>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit/edit/${purchase?.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Data
              </Button>
            </>
          }
        />

        {isRefunded ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-655 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Transaksi Sudah Direfund</p>
              <p className="text-xs mt-0.5 text-amber-700/95">
                Status stok saat ini adalah <span className="font-mono font-medium bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">inbound_return</span>. Proses Proses Barang dinonaktifkan.
              </p>
            </div>
          </div>
        ) : null}

        <PurchaseDetailCards data={purchase} billingHistories={resolvedBillingHistories} />

        <PurchaseUnitTable purchaseId={purchase.id} slug={slug as string} isPaid={isPaid} canEdit={canEdit} canDelete={canDelete} />

        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">History Pembayaran</h2>
            <p className="text-xs text-muted-foreground">Rincian lengkap unit yang dibeli</p>
          </div>

          <BaseTable
            data={resolvedBillingHistories}
            columns={historyColumns}
            loading={historyLoading}
            headerRowClassName="bg-green-100"
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
              disabled={updateBillingIsPaid.isPending}
            >
              {updateBillingIsPaid.isPending ? 'Memproses...' : 'Ya, Tandai Lunas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG Proses Barang */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Proses Barang</DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menerima barang ini?
            </DialogDescription>
            <div className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-md p-2 text-justify">
              <div className="flex gap-2">
                <span>
                  <Info />
                </span>
                <span>
                  Dengan klik Proses Barang maka akan <b>Masuk ke Warehouse</b>.
                </span>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReceiveDialogOpen(false)}
              disabled={updateState.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleReceipt}
              disabled={updateState.isPending}
            >
              {updateState.isPending ? 'Memproses...' : 'Ya, Proses Barang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
