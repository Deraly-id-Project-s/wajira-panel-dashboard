import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { useAssignUnitItemSales, useUnassignedStockUnits } from '@/hooks/useUnitTransactionItemSales';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Package, AlertCircle } from 'lucide-react';

interface AssignStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitTypeId: string | number;
  unitTypeName?: string;
  unitTransactionItemId: string | number;
  companyId: string | number;
  remainingQty: number;
  onSuccess?: () => void;
}

interface UnassignedStockRow {
  id: number;
  color: string;
  machine_number: string;
  chassis_number: string;
  in_stock: boolean;
  status: string;
  warehouse_sub_block: any;
  stock_state: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
  minor_damage: { label: 'Minor Damage', className: 'border-amber-200 bg-amber-50 text-amber-700 font-semibold' },
  major_damage: { label: 'Major Damage', className: 'border-red-200 bg-red-50 text-red-700 font-semibold' },
  returned: { label: 'Returned', className: 'border-purple-200 bg-purple-50 text-purple-700 font-semibold' },
  refunded: { label: 'Refunded', className: 'border-orange-200 bg-orange-50 text-orange-700 font-semibold' },
  lost: { label: 'Lost', className: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' },
  in_repair: { label: 'In Repair', className: 'border-blue-200 bg-blue-50 text-blue-700 font-semibold' },
};

const stockStateConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600' },
  cancel: { label: 'Batal', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  prepare: { label: 'Disiapkan', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  purchase_order: { label: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  in_transit: { label: 'Dalam Perjalanan', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  receipt: { label: 'Diterima', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

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
  return error?.message || 'Gagal menambahkan unit';
};

export function AssignStockModal({
  open,
  onOpenChange,
  unitTypeId,
  unitTypeName,
  unitTransactionItemId,
  companyId,
  remainingQty,
  onSuccess,
}: AssignStockModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedDetailIds, setSelectedDetailIds] = useState<Set<number>>(new Set());

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset selection on modal toggle
  useEffect(() => {
    if (!open) {
      setSelectedDetailIds(new Set());
      setSearch('');
      setDebouncedSearch('');
      setCurrentPage(1);
    }
  }, [open]);

  const { data: stockData, isLoading, isError } = useUnassignedStockUnits({
    unitTypeId,
    companyId,
    unitTransactionItemId,
    search: debouncedSearch,
    page: currentPage,
    perPage,
    enabled: open && Boolean(unitTypeId) && Boolean(unitTransactionItemId),
  });

  const assignMutation = useAssignUnitItemSales();

  const detailsContainer = stockData?.unit_item_details;
  const rows = useMemo<UnassignedStockRow[]>(() => {
    return (detailsContainer?.data ?? []).map((detail: any) => ({
      id: Number(detail?.id ?? 0),
      color: String(detail?.color ?? '-'),
      machine_number: String(detail?.machine_number ?? '-'),
      chassis_number: String(detail?.chassis_number ?? '-'),
      in_stock: Boolean(detail?.in_stock),
      status: String(detail?.status ?? 'normal'),
      warehouse_sub_block: detail?.warehouse_sub_block,
      stock_state: detail?.stock_state ?? 'receipt',
    }));
  }, [detailsContainer?.data]);

  const total = detailsContainer?.total ?? rows.length;
  const lastPage = detailsContainer?.last_page ?? 1;

  const stringSelectedIds = useMemo(() => {
    return new Set<string>(Array.from(selectedDetailIds).map(String));
  }, [selectedDetailIds]);

  const isLimitReached = remainingQty > 0 && selectedDetailIds.size >= remainingQty;

  const isCheckboxDisabled = useCallback(
    (item: UnassignedStockRow) => {
      if (isLimitReached && !selectedDetailIds.has(item.id)) {
        return true;
      }
      return false;
    },
    [isLimitReached, selectedDetailIds]
  );

  const handleSelectedIdsChange = useCallback(
    (newStringIds: Set<string>) => {
      const newNumIds = new Set<number>(Array.from(newStringIds).map(Number));
      const allCurrentPageIds = new Set<number>(rows.map((r) => r.id));

      const added = Array.from(newNumIds).filter((id: number) => !selectedDetailIds.has(id));
      const removed = Array.from(allCurrentPageIds).filter(
        (id: number) => selectedDetailIds.has(id) && !newNumIds.has(id)
      );

      setSelectedDetailIds((prev) => {
        const next = new Set(prev);
        removed.forEach((id) => next.delete(id));

        let currentCount = next.size;
        for (const id of added) {
          if (remainingQty > 0 && currentCount >= remainingQty) {
            toast.error(`Maksimal ${remainingQty} unit yang dapat dipilih`);
            break;
          }
          next.add(id);
          currentCount++;
        }
        return next;
      });
    },
    [rows, selectedDetailIds, remainingQty]
  );

  const handleAssign = async () => {
    if (selectedDetailIds.size === 0) {
      toast.error('Pilih minimal satu unit');
      return;
    }

    if (remainingQty > 0 && selectedDetailIds.size > remainingQty) {
      toast.error(`Maksimal ${remainingQty} unit yang dapat dipilih`);
      return;
    }

    try {
      await assignMutation.mutateAsync({
        unitTransactionItemId,
        unitTransactionDetails: Array.from(selectedDetailIds),
      });

      toast.success(`Berhasil menambahkan ${selectedDetailIds.size} unit ke penjualan`);
      setSelectedDetailIds(new Set());
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(readApiError(err));
    }
  };

  const columns = useMemo<ColumnDef<UnassignedStockRow>[]>(
    () => [
      {
        header: 'Warna',
        accessorKey: 'color',
        sortable: false,
        alignment: 'left',
        cell: (item) => item?.color ?? '-',
      },
      {
        header: 'Nomor Mesin',
        accessorKey: 'machine_number',
        sortable: false,
        alignment: 'left',
        cell: (item) => <CopyBox text={item?.machine_number ?? '-'} />,
      },
      {
        header: 'Nomor Rangka',
        accessorKey: 'chassis_number',
        sortable: false,
        alignment: 'left',
        cell: (item) => <CopyBox text={item?.chassis_number ?? '-'} />,
      },
      {
        header: 'Sub Blok',
        accessorKey: 'warehouse_sub_block',
        sortable: false,
        alignment: 'center',
        cell: (item) =>
          item?.warehouse_sub_block?.name ? (
            item?.warehouse_sub_block?.name
          ) : (
            <Badge variant="outline" className="font-medium bg-slate-50 text-slate-500">
              Belum Ditambahkan
            </Badge>
          ),
      },
      {
        header: 'Kondisi Stok',
        accessorKey: 'status',
        sortable: false,
        alignment: 'center',
        cell: (item) => {
          const cfg = statusConfig[item?.status] ?? {
            label: item?.status ? String(item.status).replace(/_/g, ' ') : '-',
            className: 'border-slate-200 bg-slate-50 text-slate-700',
          };
          return (
            <Badge variant="outline" className={cn('capitalize font-semibold', cfg.className)}>
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        header: 'Posisi Stok',
        accessorKey: 'stock_state',
        sortable: false,
        alignment: 'center',
        cell: (item) => {
          const stateVal = item?.stock_state ?? 'receipt';
          const cfg = stockStateConfig[stateVal] ?? {
            label: stateVal.replace(/_/g, ' '),
            className: 'border-slate-200 bg-slate-50 text-slate-700',
          };
          return (
            <Badge variant="outline" className={cn('capitalize font-semibold', cfg.className)}>
              {cfg.label}
            </Badge>
          );
        },
      },
    ],
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <div className="flex items-center justify-between pr-4">
            <div>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Tambah Unit Tipe ke Penjualan
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {unitTypeName ? `Tipe: ${unitTypeName} • ` : ''}Pilih stok unit fisik yang tersedia untuk dialokasikan ke transaksi penjualan ini.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs">
                Sisa Kuota: {remainingQty} Unit
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {remainingQty <= 0 && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Kuota unit untuk item penjualan ini sudah terpenuhi. Anda tidak dapat memilih unit tambahan.</span>
            </div>
          )}

          <BaseTable
            data={rows}
            columns={columns}
            loading={isLoading}
            searchPlaceholder="Cari warna, no mesin, atau no rangka..."
            search={search}
            onSearchChange={setSearch}
            showLimitChange
            perPage={perPage}
            onPerPageChange={(val) => {
              setPerPage(val);
              setCurrentPage(1);
            }}
            showCheckbox
            selectedIds={stringSelectedIds}
            onSelectedIdsChange={handleSelectedIdsChange}
            getRowId={(item) => String(item.id)}
            isCheckboxDisabled={isCheckboxDisabled}
            meta={{
              currentPage,
              perPage,
              lastPage,
              total,
            }}
            onPageChange={setCurrentPage}
          />
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-slate-500">
            Terpilih: <span className="font-semibold text-slate-800">{selectedDetailIds.size}</span>
            {remainingQty > 0 ? ` / ${remainingQty}` : ''} Unit
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={selectedDetailIds.size === 0 || assignMutation.isPending || remainingQty <= 0}
              onClick={handleAssign}
            >
              {assignMutation.isPending ? 'Menambahkan...' : `Tambahkan Unit (${selectedDetailIds.size})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
