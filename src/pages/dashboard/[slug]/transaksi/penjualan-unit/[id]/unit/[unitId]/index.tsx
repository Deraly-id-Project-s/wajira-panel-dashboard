import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle2, ListTodo as ListTodoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { AssignedStockTable } from '@/components/features/unit-transaksi/sales/detail/AssignedStockTable';
import { AssignStockModal } from '@/components/features/unit-transaksi/sales/detail/AssignStockModal';
import { SalesDetailCards } from '@/components/features/unit-transaksi/sales/detail/SalesDetailCards';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSalesDetail } from '@/hooks/useSales';
import {
  useStockUnits,
  useBulkDeleteUnitItemSales,
} from '@/hooks/useUnitTransactionItemSales';
import { useTypeUnit } from '@/hooks/useTypeUnit';
import { LoadingState } from '@/components/ui/loading-state';
import { useCompany } from '@/contexts/CompanyContext';
import { getStoredCompanyId } from '@/lib/session/storage';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { MoveUnitStockModal } from '@/components/features/unit-transaksi/MoveUnitStockModal';

const readApiError = (error: any): string => {
  const statusCode = error?.statusCode ?? error?.response?.status;

  if (statusCode === 422) {
    return 'Stock tidak mencukupi atau unit yang dipilih sudah tidak tersedia';
  }

  if (statusCode === 403) {
    return 'State transaksi tidak valid untuk aksi ini';
  }

  if (statusCode === 500) {
    return 'Terjadi kesalahan server. Silakan coba beberapa saat lagi';
  }

  const details = error?.details ?? error?.response?.data?.errors;
  if (typeof details === 'string' && details.trim()) return details;

  if (details && typeof details === 'object') {
    const text = Object.entries(details)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value[0] : String(value)}`)
      .join(', ')
      .trim();
    if (text) return text;
  }

  return error?.message || 'Terjadi kesalahan saat memproses data';
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return false;
};

export default function SalesUnitDetailPage() {
  const router = useRouter();
  const { id, unitId, slug } = router.query;

  const pathParts = String(router.asPath ?? '')
    .split('?')[0]
    .split('/')
    .filter(Boolean);
  const fallbackSalesId = pathParts[3];
  const fallbackUnitId = pathParts[5];

  const salesId = (Array.isArray(id) ? id[0] : id) ?? fallbackSalesId;
  const selectedUnitId = (Array.isArray(unitId) ? unitId[0] : unitId) ?? fallbackUnitId;

  const {
    data: salesData,
    isLoading: salesLoading,
    isError: salesError,
  } = useSalesDetail(salesId);

  const fallbackUnitItemFromSales = useMemo(() => {
    const rows = salesData?.raw?.unit_transaction_items ?? [];
    const hit = rows.find((item) => String(item?.id ?? '') === String(selectedUnitId ?? ''));
    if (!hit) return null;

    return {
      id: String(hit.id ?? ''),
      unit_transaction_id: String(salesId ?? ''),
      unit_type_id: String(hit.unit_type_id ?? ''),
      qty_total: Number(hit.qty_total ?? 0),
      unit_transaction_item_details: hit.unit_transaction_item_details ?? [],
      unit_transaction_item_sales: (hit.unit_transaction_item_sales ?? []).map((item: any) => ({
        id: Number(item?.id ?? 0),
        unit_transaction_item_id: Number(hit.id ?? 0),
        unit_transaction_item_detail_id: Number(item?.unit_transaction_item_detail_id ?? 0),
        unit_transaction_item_detail: item?.unit_transaction_item_detail,
      })),
      unit_type: hit.unit_type,
    };
  }, [salesData?.raw?.unit_transaction_items, selectedUnitId, salesId]);

  const { companyId: sessionCompanyId } = useCompany();
  const companyId = String(sessionCompanyId || getStoredCompanyId() || (salesData?.raw as any)?.company_id || '1');
  const fallbackUnitTypeId = String(fallbackUnitItemFromSales?.unit_type_id ?? selectedUnitId ?? '');

  const {
    unitItem,
    isUnitItemLoading,
    isUnitItemError,
  } = useStockUnits(selectedUnitId, { companyId, unitTypeIdFallback: fallbackUnitTypeId });

  const effectiveUnitItem = unitItem ?? fallbackUnitItemFromSales;

  const { data: unitTypeData } = useTypeUnit(fallbackUnitTypeId);

  const isPaid = useMemo(() => {
    const raw = salesData?.raw;
    if (!raw) return false;
    const billingSummary = raw.billing_summary;
    const totalTagihan = Number(
      billingSummary?.grand_total ??
      raw.unit_transaction_bruto_total ??
      raw.unit_transaction_item_bruto_total ??
      0
    );
    const totalPaid = Number(billingSummary?.total_paid ?? 0);
    const isPaidVal = billingSummary?.is_paid ?? (totalPaid >= totalTagihan && totalTagihan > 0);

    if (typeof isPaidVal === 'string') {
      return isPaidVal === 'true' || isPaidVal === '1';
    }
    return Boolean(isPaidVal);
  }, [salesData]);

  const [selectedSalesIds, setSelectedSalesIds] = useState<Set<number>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  const bulkDeleteMutation = useBulkDeleteUnitItemSales();

  const requiredQty = Number(effectiveUnitItem?.qty_total ?? 0);

  const assignedSalesList = useMemo(() => {
    const list = effectiveUnitItem?.unit_transaction_item_sales ?? [];
    return list.map((item: any) => ({
      id: Number(item?.id ?? 0),
      uuid: item?.uuid,
      unit_transaction_item_id: Number(item?.unit_transaction_item_id ?? effectiveUnitItem?.id ?? 0),
      unit_transaction_item_detail_id: Number(
        item?.unit_transaction_item_detail_id ?? item?.unit_transaction_item_detail?.id ?? 0
      ),
      unit_transaction_item_detail: item?.unit_transaction_item_detail,
    }));
  }, [effectiveUnitItem]);

  const selectedDetailIds = useMemo(() => {
    return assignedSalesList
      .filter((item: any) => selectedSalesIds.has(item.id))
      .map((item: any) => item.unit_transaction_item_detail_id || item.unit_transaction_item_detail?.id)
      .filter(Boolean);
  }, [assignedSalesList, selectedSalesIds]);

  const remainingQty = Math.max(0, requiredQty - assignedSalesList.length);

  const salesCode = salesData?.raw?.code ?? '-';
  const slugValue = Array.isArray(slug) ? slug[0] : slug || '';
  const salesPath = slugValue ? `/dashboard/${slugValue}/transaksi/penjualan-unit` : '/transaksi/penjualan-unit';
  const hasRequiredRouteParams = Boolean(salesId && selectedUnitId);
  const isStockSelectionLocked = Boolean(salesData?.raw?.warehouse_activity) || toBoolean((salesData?.raw as any)?.has_warehouse_activity);

  const handleConfirmBulkDelete = async () => {
    if (selectedSalesIds.size === 0) return;
    try {
      await bulkDeleteMutation.mutateAsync({
        salesIds: Array.from(selectedSalesIds),
        unitTransactionItemId: selectedUnitId,
      });
      toast.success(`Berhasil membatalkan ${selectedSalesIds.size} unit dari penjualan`);
      setSelectedSalesIds(new Set());
      setIsBulkDeleteAlertOpen(false);
    } catch (error: any) {
      toast.error(readApiError(error));
    }
  };

  if (!router.isReady && !hasRequiredRouteParams) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!hasRequiredRouteParams) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">URL detail penjualan tidak valid</p>
          <Button onClick={() => router.push(salesPath)}>Kembali ke List Penjualan</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (salesLoading || isUnitItemLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (salesError || !salesData?.ui || !salesData?.raw || (isUnitItemError && !fallbackUnitItemFromSales) || !effectiveUnitItem) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Data penjualan atau item unit tidak ditemukan</p>
          <Button onClick={() => router.push(salesPath)}>Kembali ke List Penjualan</Button>
        </div>
      </DashboardLayout>
    );
  }

  const resolvedBillingHistories = (salesData?.raw?.unit_transaction_billing?.unit_transaction_billing_histories ?? []).map((history: any) => ({
    id: String((history as any).id ?? ''),
    unit_transaction_billing_id: String((history as any).unit_transaction_billing_id ?? salesData?.raw?.unit_transaction_billing?.id ?? ''),
    unit_transaction_id: String(salesId ?? ''),
    payment_proof: (history as any).payment_proof ?? null,
    bca_payment_amount: Number((history as any).bca_payment_amount ?? (history as any).bca_payment ?? 0),
    cash_payment_amount: Number((history as any).cash_payment_amount ?? (history as any).cash_payment ?? 0),
    bca_payment_usd_amount: Number((history as any).bca_payment_usd_amount ?? (history as any).bca_payment_2 ?? 0),
    payment_at: String((history as any).payment_at ?? ''),
    note: (history as any).note,
    created_at: (history as any).created_at,
    updated_at: (history as any).updated_at,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Penjualan Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/penjualan-unit`) },
            { label: 'Detail Penjualan', onClick: () => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${salesId}`) },
            { label: 'Detail Unit' }
          ]}
          title="Detail Data Penjualan Unit Tipe"
          subtitle={
            <>
              <span>Kode Jual:</span>
              <span className="font-semibold text-blue-600">{salesCode}</span>
            </>
          }
          onBack={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${salesId}`)}
        />

        <SalesDetailCards
          data={salesData.ui}
          billingHistories={resolvedBillingHistories}
          unitType={unitTypeData ?? effectiveUnitItem?.unit_type}
          stockQty={requiredQty}
        />

        <Card className="border border-slate-200 shadow-sm">
          <CollapsibleBox
            title="Data Penjualan Detail Unit Tipe"
            description="Daftar unit yang telah di-assign untuk transaksi penjualan ini"
          >
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col md:items-end justify-between border-b border-slate-100 pb-4 gap-4">
                <div
                  className={cn(
                    'flex items-center gap-4 px-4 py-2.5 rounded-md border',
                    assignedSalesList.length >= requiredQty && requiredQty > 0
                      ? 'bg-emerald-50/50 border-emerald-100'
                      : 'bg-blue-50/50 border-blue-100'
                  )}
                >
                  <div>
                    <p
                      className={cn(
                        'text-[11px] font-semibold uppercase tracking-wider mb-0.5',
                        assignedSalesList.length >= requiredQty && requiredQty > 0
                          ? 'text-emerald-600'
                          : 'text-blue-600'
                      )}
                    >
                      Status Pemilihan Unit
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold text-slate-800 leading-none">
                        {assignedSalesList.length}
                      </span>
                      <span className="text-sm font-medium text-slate-500">/ {requiredQty}</span>
                      <span className="text-xs text-slate-500 ml-0.5">Unit</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex items-center justify-center h-10 w-10 rounded-md',
                      assignedSalesList.length >= requiredQty && requiredQty > 0
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-blue-100 text-blue-600'
                    )}
                  >
                    {assignedSalesList.length >= requiredQty && requiredQty > 0 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <ListTodoIcon className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>

              <AssignedStockTable
                assignedSales={assignedSalesList}
                selectedSalesIds={selectedSalesIds}
                onSelectedSalesIdsChange={setSelectedSalesIds}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onBulkDelete={() => setIsBulkDeleteAlertOpen(true)}
                onMoveUnit={() => setIsMoveModalOpen(true)}
                requiredQty={requiredQty}
                isPaid={isPaid}
                isSelectionLocked={isStockSelectionLocked}
                isDeleting={bulkDeleteMutation.isPending}
                isLoading={salesLoading || isUnitItemLoading}
              />
            </CardContent>
          </CollapsibleBox>
        </Card>
      </div>

      <AssignStockModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        unitTypeId={fallbackUnitTypeId}
        unitTypeName={unitTypeData?.name ?? effectiveUnitItem?.unit_type?.name}
        unitTransactionItemId={selectedUnitId}
        companyId={companyId}
        remainingQty={remainingQty}
        onSuccess={() => setSelectedSalesIds(new Set())}
      />

      <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Unit Terjual</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan/menghapus {selectedSalesIds.size} unit yang dipilih dari penjualan ini? Unit akan kembali tersedia pada stok gudang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleConfirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Membatalkan...' : 'Ya, Batalkan Unit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MoveUnitStockModal
        open={isMoveModalOpen}
        onOpenChange={setIsMoveModalOpen}
        sourceTransactionId={salesId}
        sourceTransactionCode={salesCode}
        transactionType="sales"
        unitTypeId={fallbackUnitTypeId}
        unitTypeName={unitTypeData?.name}
        selectedDetailIds={selectedDetailIds}
        onSuccess={() => setSelectedSalesIds(new Set())}
      />
    </DashboardLayout>
  );
}
