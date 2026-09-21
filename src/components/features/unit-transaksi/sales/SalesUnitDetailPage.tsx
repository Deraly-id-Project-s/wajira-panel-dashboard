'use client';


import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Info, CheckCircle2, ListTodo as ListTodoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { WarehouseStockUnit } from '@/@types/unit-transaction.types';
import { StockPickerTable } from '@/components/features/unit-transaksi/sales/detail/StockPickerTable';
import { SalesDetailCards } from '@/components/features/unit-transaksi/sales/detail/SalesDetailCards';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSalesDetail } from '@/hooks/useSales';
import { useStockUnits, useAssignUnitItemSales, useDispatchStockLifecycle } from '@/hooks/useUnitTransactionItemSales';
import { useUpdateUnitTransactionState } from '@/hooks/useUnitTransaction';
import { useTypeUnit } from '@/hooks/useTypeUnit';
import { LoadingState } from '@/components/ui/loading-state';
import { useCompany } from '@/contexts/CompanyContext';
import { getStoredCompanyId } from '@/lib/session/storage';

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

  return error?.message || 'Validation failed';
};

const toNumberId = (value: unknown): number => {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? normalized : 0;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return false;
};

const getReservationTransactionId = (item: WarehouseStockUnit) => {
  return item.unit_transaction_item_sales?.unit_transaction_item?.unit_transaction_id
    ?? item.unit_transaction_item_sales?.unit_transaction_item?.unit_transaction?.id
    ?? null;
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
      unit_transaction_item_details: (hit.unit_transaction_item_details ?? []).map((detail: any) => ({
        id: Number(detail?.id ?? 0),
        color: String(detail?.color ?? '-'),
        machine_number: String(detail?.machine_number ?? '-'),
        chassis_number: String(detail?.chassis_number ?? '-'),
        in_stock: true,
        status: String(detail?.status ?? ''),
        warehouse_sub_block: detail?.warehouse_sub_block,
        stock_state: detail?.stock_state ?? null,
        is_reserved: detail?.is_reserved === true || detail?.is_reserved === 1 || detail?.is_reserved === '1',
        unit_transaction_item_sales: detail?.unit_transaction_item_sales ?? null,
      })),
      unit_transaction_item_sales: (hit.unit_transaction_item_sales ?? []).map((item: any) => ({
        id: Number(item?.id ?? 0),
        unit_transaction_item_id: Number(hit.id ?? 0),
        unit_transaction_item_detail_id: Number(item?.unit_transaction_item_detail_id ?? 0),
      })),
    };
  }, [salesData?.raw?.unit_transaction_items, selectedUnitId, salesId]);

  const { companyId: sessionCompanyId } = useCompany();
  const companyId = String(sessionCompanyId || getStoredCompanyId() || (salesData?.raw as any)?.company_id || '1');
  const fallbackUnitTypeId = String(fallbackUnitItemFromSales?.unit_type_id ?? selectedUnitId ?? '');

  const {
    unitItem,
    stockUnits,
    isUnitItemLoading,
    isStockLoading,
    isUnitItemError,
    isStockError,
    stockError,
  } = useStockUnits(selectedUnitId, { companyId, unitTypeIdFallback: fallbackUnitTypeId });

  const effectiveUnitItem = unitItem ?? fallbackUnitItemFromSales;

  const {
    data: unitTypeData,
    isLoading: unitTypeLoading,
  } = useTypeUnit(fallbackUnitTypeId);

  const isPaid = useMemo(() => {
    const raw = salesData?.raw;
    if (!raw) return false;
    const billingSummary = raw.billing_summary;
    const totalTagihan = Number(billingSummary?.grand_total ?? raw.unit_transaction_bruto_total ?? raw.unit_transaction_item_bruto_total ?? 0);
    const totalPaid = Number(billingSummary?.total_paid ?? 0);
    const isPaidVal = billingSummary?.is_paid ?? (totalPaid >= totalTagihan && totalTagihan > 0);

    if (typeof isPaidVal === 'string') {
      return isPaidVal === 'true' || isPaidVal === '1';
    }
    return Boolean(isPaidVal);
  }, [salesData]);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const assignMutation = useAssignUnitItemSales();
  const dispatchMutation = useDispatchStockLifecycle();
  const updateStateMutation = useUpdateUnitTransactionState();

  const requiredQty = Number(effectiveUnitItem?.qty_total ?? 0);

  const assignedDetailRows = useMemo<WarehouseStockUnit[]>(() => {
    const salesItems = effectiveUnitItem?.unit_transaction_item_sales?.map((item: any) => item.unit_transaction_item_detail);
    const mappedFromItemDetails = (isPaid ? salesItems : effectiveUnitItem?.unit_transaction_item_details ?? []).map((detail: any) => ({
      id: toNumberId(detail?.id),
      color: String(detail?.color ?? '-'),
      machine_number: String(detail?.machine_number ?? '-'),
      chassis_number: String(detail?.chassis_number ?? '-'),
      in_stock: detail?.in_stock,
      status: String(detail?.status ?? ''),
      warehouse_sub_block: detail?.warehouse_sub_block,
      stock_state: detail?.stock_state ?? null,
      is_reserved: detail?.is_reserved === true || detail?.is_reserved === 1 || detail?.is_reserved === '1',
      unit_transaction_item_sales: detail?.unit_transaction_item_sales ?? null,
    }));

    const detailLookup = new Map<number, WarehouseStockUnit>();
    stockUnits.forEach((detail: WarehouseStockUnit) => {
      detailLookup.set(detail.id, detail);
    });
    mappedFromItemDetails.forEach((detail: any) => {
      detailLookup.set(detail.id, detail);
    });

    const assignedBySales = (effectiveUnitItem?.unit_transaction_item_sales ?? [])
      .map((row: any) => toNumberId(row?.unit_transaction_item_detail_id))
      .filter((detailId: number) => detailId > 0)
      .map((detailId: number) =>
        detailLookup.get(detailId) ?? {
          id: detailId,
          color: '-',
          machine_number: '-',
          chassis_number: '-',
          in_stock: false,
          status: '',
          warehouse_sub_block: undefined,
          stock_state: null,
          is_reserved: false,
          unit_transaction_item_sales: null,
        },
      );

    if (mappedFromItemDetails.length > 0) {
      return mappedFromItemDetails;
    }

    return assignedBySales;
  }, [stockUnits, effectiveUnitItem?.unit_transaction_item_details, effectiveUnitItem?.unit_transaction_item_sales, isPaid]);

  const assignedIds = useMemo(() => {
    return assignedDetailRows.map((item: any) => item.id).filter((item: number) => item > 0);
  }, [assignedDetailRows]);

  const pickerRows = useMemo(() => {
    const merged = new Map<number, WarehouseStockUnit>();

    stockUnits.forEach((item: any) => {
      merged.set(item.id, item);
    });

    assignedDetailRows.forEach((item: any) => {
      if (!merged.has(item.id)) {
        merged.set(item.id, item);
      }
    });

    return Array.from(merged.values());
  }, [stockUnits, assignedDetailRows]);

  useEffect(() => {
    const next = new Set(assignedIds);
    setSelectedIds((prev) => {
      if (prev.size === next.size) {
        let isSame = true;
        for (const id of prev) {
          if (!next.has(id)) {
            isSame = false;
            break;
          }
        }
        if (isSame) return prev;
      }

      return next;
    });
  }, [assignedIds]);

  useEffect(() => {
    if (!isStockError) return;
    toast.error(readApiError(stockError));
  }, [isStockError, stockError]);

  const selectedCount = selectedIds.size;
  const canAssignStock = requiredQty > 0 && selectedCount === requiredQty;

  const isSelectionMatchingSaved = useMemo(() => {
    if (selectedIds.size !== assignedIds.length) return false;
    return Array.from(selectedIds).every((id) => assignedIds.includes(id));
  }, [selectedIds, assignedIds]);

  const salesCode = salesData?.raw?.code ?? '-';
  const slugValue = Array.isArray(slug) ? slug[0] : slug || '';
  const salesPath = slugValue ? `/dashboard/${slugValue}/transaksi/penjualan-unit` : '/transaksi/penjualan-unit';
  const hasRequiredRouteParams = Boolean(salesId && selectedUnitId);
  const isStockSelectionLocked = Boolean(salesData?.raw?.warehouse_activity) || toBoolean((salesData?.raw as any)?.has_warehouse_activity);
  const isReservedByOtherTransaction = (item?: WarehouseStockUnit) => {
    if (!item?.is_reserved) return false;

    const reservationTransactionId = getReservationTransactionId(item);
    if (reservationTransactionId == null) return true;

    return String(reservationTransactionId) !== String(salesId ?? '');
  };

  const toggleOne = (stockId: number, checked: boolean) => {
    if (isStockSelectionLocked) {
      toast.error('Unit tidak dapat diubah karena transaksi sudah diproses barang');
      return;
    }

    const target = pickerRows.find((item) => item.id === stockId);
    if (checked && isReservedByOtherTransaction(target)) {
      toast.error('Stock yang sudah reservasi tidak dapat dipilih');
      return;
    }

    if (checked && selectedIds.size >= requiredQty) {
      toast.error(`Maksimal ${requiredQty} unit yang dapat dipilih`);
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(stockId);
      } else {
        next.delete(stockId);
      }
      return next;
    });
  };

  const toggleAllPage = (checked: boolean) => {
    if (isStockSelectionLocked) {
      toast.error('Unit tidak dapat diubah karena transaksi sudah diproses barang');
      return;
    }

    if (checked && selectedIds.size >= requiredQty) {
      toast.error(`Maksimal ${requiredQty} unit yang dapat dipilih`);
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const filteredRows = pickerRows.filter((item: any) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;

        return [item.color, item.machine_number, item.chassis_number].some((field) =>
          String(field ?? '')
            .toLowerCase()
            .includes(query),
        );
      });

      const start = (currentPage - 1) * perPage;
      const pageRows = filteredRows.slice(start, start + perPage);

      if (checked) {
        let remaining = requiredQty - next.size;
        pageRows.forEach((item) => {
          if (!isReservedByOtherTransaction(item) && !next.has(item.id) && remaining > 0) {
            next.add(item.id);
            remaining--;
          }
        });
        if (remaining === 0 && pageRows.length > 0 && next.size === requiredQty) {
          toast.success(`Berhasil memilih ${requiredQty} unit (maksimal)`);
        }
      } else {
        pageRows.forEach((item) => next.delete(item.id));
      }

      return next;
    });
  };

  const handleAssignStock = async () => {
    if (isStockSelectionLocked) {
      toast.error('Unit tidak dapat diubah karena transaksi sudah diproses barang');
      setIsAssignDialogOpen(false);
      return;
    }

    if (!selectedUnitId) {
      toast.error('Unit transaction item tidak valid');
      setIsAssignDialogOpen(false);
      return;
    }

    if (!requiredQty || requiredQty <= 0) {
      toast.error('Qty item tidak valid');
      setIsAssignDialogOpen(false);
      return;
    }

    const ids = Array.from(selectedIds);
    const hasReservedSelection = ids.some((stockId) => pickerRows.some((item) => item.id === stockId && isReservedByOtherTransaction(item)));
    if (hasReservedSelection) {
      toast.error('Stock yang sudah reservasi tidak dapat dipilih');
      setIsAssignDialogOpen(false);
      return;
    }

    if (ids.length === 0) {
      toast.error('Pilih minimal 1 stock unit');
      setIsAssignDialogOpen(false);
      return;
    }

    if (ids.length !== requiredQty) {
      toast.error(`Jumlah unit yang dipilih harus sama dengan qty item (${requiredQty})`);
      setIsAssignDialogOpen(false);
      return;
    }

    try {
      const isUpdate = assignedIds.length > 0;
      await assignMutation.mutateAsync({
        unitTransactionItemId: selectedUnitId,
        unitTransactionDetails: ids,
        isUpdate,
      });

      toast.success('Stock berhasil di-assign ke item sales');
      setIsAssignDialogOpen(false);
    } catch (error: any) {
      toast.error(readApiError(error));
      setIsAssignDialogOpen(false);
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
          title="Data Penjualan"
          subtitle={
            <>
              <span>Kode Jual:</span>
              <span className="font-semibold text-blue-600">{salesCode}</span>
            </>
          }
          onBack={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${salesId}`)}
        />

        <SalesDetailCards data={salesData.ui} billingHistories={resolvedBillingHistories} unitType={unitTypeData} />

        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Data Penjualan Detail Unit Tipe</h2>
                <p className="text-xs text-slate-500 mt-1">Pilih stock unit yang tersedia untuk dijual</p>
              </div>

              <div className={cn(
                "flex items-center gap-4 px-4 py-2.5 rounded-md border",
                selectedCount >= requiredQty
                  ? "bg-emerald-50/50 border-emerald-100"
                  : "bg-blue-50/50 border-blue-100"
              )}>
                <div>
                  <p className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider mb-0.5",
                    selectedCount >= requiredQty ? "text-emerald-600" : "text-blue-600"
                  )}>
                    Status Pemilihan Unit
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-slate-800 leading-none">{selectedCount}</span>
                    <span className="text-sm font-medium text-slate-500">/ {requiredQty}</span>
                    <span className="text-xs text-slate-500 ml-0.5">Unit</span>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-md",
                  selectedCount >= requiredQty ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                )}>
                  {selectedCount >= requiredQty ? <CheckCircle2 className="h-5 w-5" /> : <ListTodoIcon className="h-5 w-5" />}
                </div>
              </div>
            </div>

            <StockPickerTable
              units={pickerRows}
              selectedIds={selectedIds}
              requiredQty={requiredQty}
              unitType={unitTypeData}
              isPaid={isPaid}
              currentTransactionId={salesId}
              isSelectionLocked={isStockSelectionLocked}
              onToggleOne={toggleOne}
              onToggleAllPage={toggleAllPage}
              currentPage={currentPage}
              perPage={perPage}
              onPageChange={setCurrentPage}
              onPerPageChange={setPerPage}
              isLoading={isStockLoading}
              isError={isStockError}
              searchValue={search}
              searchAction={(
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!canAssignStock || isSelectionMatchingSaved || assignMutation.isPending || dispatchMutation.isPending || updateStateMutation.isPending || isPaid || isStockSelectionLocked}
                  onClick={() => setIsAssignDialogOpen(true)}
                >
                  {assignMutation.isPending ? 'Menyimpan...' : `Unit Terjual (${selectedCount}/${requiredQty})`}
                </Button>
              )}
              onSearchChange={(value) => {
                setSearch(value);
                setCurrentPage(1);
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Unit Terjual</DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menetapkan unit ini sebagai barang terjual?
            </DialogDescription>
            <div className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-md p-2 text-justify">
              <div className="flex gap-2">
                <span>
                  <Info />
                </span>
                <span>
                  Dengan memilih <b>Unit Terjual</b>, unit stock ini akan dialokasikan untuk transaksi ini dan tidak bisa dipilih oleh transaksi penjualan lainnya.
                </span>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              disabled={assignMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAssignStock}
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Memproses...' : 'Ya, Tetapkan Unit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
