import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  MoreVertical,
  Plus,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import type { UnitTransactionRefund } from '@/@types/refund.type';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteRefund, useRefundList, useRefundTransactionDetail } from '@/hooks/useRefundAdministrasi';
import { toast } from 'sonner';
import PurchaseRefundFormModal from './PurchaseRefundFormModal';
import { refundPrimaryButtonClassName } from './purchase-refund.styles';
import { RefundPaymentProgressBadge } from '@/components/features/refund/RefundPaymentProgressBadge';
import { getRefundPaymentProgressStatus } from '@/components/features/refund/refund.utils';
import { useUnitBillings, useCurrentBilling, useBillingHistory } from '@/hooks/useUnitBilling';
import { useUpdateUnitTransactionState } from '@/hooks/useUnitTransaction';
import { usePurchaseUnitItems } from '@/hooks/useUnitTransactionItem';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import { unitItemDetailService } from '@/services/unitItemDetail.service';
import { warehouseActivityService } from '@/services/warehouseActivity.service';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

const PURCHASE_PREPARE_STOCK_STATE = 'inbound_incoming_goods';
const PURCHASE_RECEIVED_STOCK_STATE = 'inbound_receipt';
const PURCHASE_RECEIVED_STATE_SET = new Set(['receipt', 'inbound_receipt']);

import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { LoadingState } from '@/components/ui/loading-state';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
};

export default function PurchaseRefundPageContent({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRefund, setEditingRefund] = useState<UnitTransactionRefund | null>(null);
  const [deletingRefund, setDeletingRefund] = useState<UnitTransactionRefund | null>(null);
  const deleteMutation = useDeleteRefund();

  const transactionQuery = useRefundTransactionDetail(transactionId);
  const purchase = transactionQuery.data;

  const { data: billings = [] } = useUnitBillings(purchase?.id);
  const { data: currentBilling, isLoading: billingLoading } = useCurrentBilling(String(purchase?.id ?? ''));
  const billingId = String(currentBilling?.id ?? '');
  const { data: billingHistories = [], isLoading: historyLoading } = useBillingHistory(billingId || undefined, String(purchase?.id ?? ''));
  const { data: unitItemsResponse, isLoading: unitItemsLoading } = usePurchaseUnitItems(purchase?.id);
  const updateState = useUpdateUnitTransactionState();
  const { data: typeUnits } = useTypeUnits();

  const refundQuery = useRefundList({ page: 1, perPage: 100, search: purchase?.code });

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

  const billingSummary = purchase?.billing_summary;
  const totalTagihan = Number(billingSummary?.grand_total ?? purchase?.unit_transaction_bruto_total ?? purchase?.unit_transaction_item_bruto_total ?? 0);
  const totalPaid = Number(billingSummary?.total_paid ?? billings.reduce(
    (acc: number, item: any) => acc + Number(item.bca_payment ?? 0) + Number(item.cash_payment ?? 0) + Number(item.bca_payment_2 ?? 0),
    0,
  ));
  const hasPaidBilling = billings.some((item: any) => Boolean(item.is_paid));
  const isPaid = billingSummary?.is_paid ?? (hasPaidBilling || (totalPaid >= totalTagihan && totalTagihan > 0));
  const currentStockState = String(purchase?.stock_state ?? '').toLowerCase();
  const isRefunded = currentStockState === 'inbound_return';
  const isAlreadyReceived = PURCHASE_RECEIVED_STATE_SET.has(currentStockState);
  const canReceive = isPaid && !isAlreadyReceived && !isRefunded;
  const unitItems = unitItemsResponse?.data ?? [];
  const resolvedBillingHistories =
    billingHistories.length > 0
      ? billingHistories
      : (purchase?.unit_transaction_billing?.unit_transaction_billing_histories ?? []).map((history: any) => ({
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

  const columns = useMemo(
    () => [
      {
        header: 'NO',
        alignment: 'left' as const,
        cell: (_: any, index: number) => index + 1,
      },
      {
        header: 'TANGGAL REFUND',
        accessorKey: 'refund_date',
        sortable: true,
        alignment: 'left' as const,
        cell: (payment: any) => formatDate(payment.refund_date),
      },
      {
        header: 'Kode Refund',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left' as const,
        cell: (payment: any) => (
          <CopyBox text={payment.code} />
        )
      },
      {
        header: 'Nominal Refund',
        accessorKey: 'refund_amount',
        sortable: true,
        alignment: 'left' as const,
        cell: (payment: any) => currenciesFormat('idr', payment.refund_amount),
      },
      {
        header: 'Refund QTY',
        accessorKey: 'total_qty',
        sortable: true,
        alignment: 'left' as const,
        cell: (payment: any) => payment.total_qty ?? payment.items?.length ?? 0,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        alignment: 'left' as const,
        cell: (payment: any) => (
          <RefundPaymentProgressBadge status={getRefundPaymentProgressStatus(payment)} />
        ),
      },
      {
        header: 'aksi',
        alignment: 'left' as const,
        sticky: 'right' as const,
        cell: (payment: any) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#111827]">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[162px] rounded-[14px] border border-[#E5E7EB] p-2 shadow-[0_12px_35px_rgba(15,23,42,0.14)]">
              <DropdownMenuItem className="rounded-[10px] px-4 py-3 text-sm text-[#111827]" onClick={() => handleEditRefund(payment)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-[10px] px-4 py-3 text-sm text-[#111827]"
                onClick={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${transactionId}/refund/${payment.id}`)}
              >
                Bayar Refund
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-[10px] px-4 py-3 text-sm text-[#EF4444]" onClick={() => handleDeletePrompt(payment)}>
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router, slug, transactionId],
  );

  const handleReceipt = async () => {
    if (!purchase?.id) return;

    try {
      const warehouseId = String(purchase.warehouse?.id ?? '').trim();
      const personId = String(purchase.person?.id ?? '').trim();

      if (!warehouseId) {
        toast.error('warehouse_id belum tersedia pada transaksi ini.');
        return;
      }
      if (!personId) {
        toast.error('person_id belum tersedia pada transaksi ini.');
        return;
      }
      if (unitItems.length === 0) {
        toast.error('Item transaksi belum tersedia. Tidak dapat melakukan Terima Barang.');
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
        return;
      }

      const detailIds = detailRows
        .flatMap((row) => row.data)
        .map((detail) => Number(detail.id ?? 0))
        .filter((value) => Number.isFinite(value) && value > 0);

      if (detailIds.length === 0) {
        toast.error('Detail unit transaksi belum tersedia. Tidak dapat melakukan Terima Barang.');
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
        return;
      }

      const activityId = await warehouseActivityService.createReceiptActivity({
        unitTransactionId: String(purchase.id),
        warehouseId,
        personId,
        unitTransactionItemId: String(unitItems[0]?.id ?? ''),
      });

      await warehouseActivityService.receiptStock(activityId, detailIds);

      await updateState.mutateAsync({
        id: purchase.id,
        stockState: PURCHASE_RECEIVED_STOCK_STATE,
      });

      toast.success('Status pembelian diperbarui ke receipt dan stok warehouse berhasil diproses.');
    } catch (error: any) {
      const readApiError = (err: any): string => {
        const details = err?.details ?? err?.response?.data?.errors;
        if (typeof details === 'string' && details.trim()) return details;

        if (details && typeof details === 'object') {
          const text = Object.entries(details)
            .map(([field, value]) => `${field}: ${Array.isArray(value) ? value[0] : String(value)}`)
            .join(', ')
            .trim();
          if (text) return text;
        }

        return err?.response?.data?.message || err?.message || 'Unexpected server error';
      };

      const message = readApiError(error);
      console.error('[purchase.handleReceipt] failed', {
        purchaseId: purchase.id,
        stockState: currentStockState,
        error: message,
        raw: error,
      });

      toast.error(message || 'Gagal update state ke receipt', {
        action: {
          label: 'Retry',
          onClick: () => {
            void handleReceipt();
          },
        },
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingRefund) return;

    try {
      await deleteMutation.mutateAsync(deletingRefund.id);
      toast.success('Data refund pembelian berhasil dihapus');
      setDeletingRefund(null);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus data refund pembelian');
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

  if (transactionQuery.isLoading || refundQuery.isLoading || billingLoading || historyLoading || unitItemsLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingState variant="page" />
        </div>
      </DashboardLayout>
    );
  }

  if (transactionQuery.isError || !purchase) {
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
        {/* BREADCRUMB HEADER */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`)}>
            Pembelian Unit
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-medium text-slate-800">Refund Pembelian</span>
        </div>

        {/* HEADLINE & ACTIONS */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`)} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900">Data Pembelian</h1>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>Kode Beli:</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{purchase.code}</span>
                {isPaid ? (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">
                    Lunas
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 font-semibold">
                    Belum Lunas
                  </Badge>
                )}
                {isAlreadyReceived ? (
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 font-semibold">
                    Stok Diterima
                  </Badge>
                ) : null}
                {isRefunded ? (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 font-semibold">
                    Sudah Refund
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Pembayaran refund hanya bisa dibuat setelah refund berhasil disimpan. Jika refund sudah memiliki pembayaran, ubah atau hapus refund sebaiknya dilakukan setelah pembayaran refund disesuaikan terlebih dahulu.
        </div>

        {isRefunded ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-655 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Transaksi Sudah Direfund</p>
              <p className="text-xs mt-0.5 text-amber-700/95">
                Status stok saat ini adalah <span className="font-mono font-medium bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">inbound_return</span>. Proses terima barang dinonaktifkan.
              </p>
            </div>
          </div>
        ) : null}

        <BaseTable
          data={refunds ?? []}
          columns={columns}
          headerRowClassName="bg-[#f8f9fa] border-b border-gray-200"
          defaultSort={{ key: 'payment_date', direction: 'desc' }}
          headerActions={
            <div className='w-full flex items-end justify-end'>
              <Button onClick={() => setIsCreateOpen(true)} className="button-theme-1!">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data
              </Button>
            </div>
          }
        />

        <PurchaseRefundFormModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} transactionId={transactionId} />
        <PurchaseRefundFormModal open={Boolean(editingRefund)} onClose={() => setEditingRefund(null)} transactionId={transactionId} refund={editingRefund} />

        <AlertDialog open={Boolean(deletingRefund)} onOpenChange={(open) => !open && setDeletingRefund(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Refund Pembelian</AlertDialogTitle>
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
