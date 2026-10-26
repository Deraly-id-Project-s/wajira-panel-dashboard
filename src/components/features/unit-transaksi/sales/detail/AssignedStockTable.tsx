import { ReactNode, useCallback, useMemo, useState } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { TableFooter, TableRow, TableCell } from '@/components/ui/table';
import { CopyBox } from '@/components/ui/copy-box';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ArrowRightLeft } from 'lucide-react';

export interface AssignedSaleItem {
  id: number; // unit_transaction_item_sales.id
  uuid?: string;
  unit_transaction_item_id: number;
  unit_transaction_item_detail_id: number;
  unit_transaction_item_detail?: {
    id: number;
    color?: string;
    machine_number?: string;
    chassis_number?: string;
    in_stock?: boolean;
    status?: string;
    stock_state?: string;
    is_reserved?: boolean;
    warehouse_sub_block?: {
      id?: number;
      name?: string;
    } | null;
    source_transaction_before?: {
      id?: number;
      code?: string;
    } | null;
  };
}

interface AssignedStockTableProps {
  assignedSales: AssignedSaleItem[];
  selectedSalesIds: Set<number>;
  onSelectedSalesIdsChange: (ids: Set<number>) => void;
  onOpenAddModal: () => void;
  onBulkDelete: () => void;
  onMoveUnit?: () => void;
  requiredQty: number;
  isPaid?: boolean;
  isSelectionLocked?: boolean;
  isDeleting?: boolean;
  isLoading?: boolean;
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

export function AssignedStockTable({
  assignedSales,
  selectedSalesIds,
  onSelectedSalesIdsChange,
  onOpenAddModal,
  onBulkDelete,
  onMoveUnit,
  requiredQty,
  isPaid,
  isSelectionLocked,
  isDeleting,
  isLoading,
}: AssignedStockTableProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return assignedSales;

    return assignedSales.filter((item) => {
      const detail = item.unit_transaction_item_detail;
      const searchableFields = [
        detail?.color,
        detail?.machine_number,
        detail?.chassis_number,
        detail?.source_transaction_before?.code,
      ];
      return searchableFields.some((f) => String(f ?? '').toLowerCase().includes(query));
    });
  }, [assignedSales, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, currentPage, perPage]);

  const stringSelectedIds = useMemo(() => {
    return new Set<string>(Array.from(selectedSalesIds).map(String));
  }, [selectedSalesIds]);

  const handleSelectedIdsChange = useCallback(
    (newStringIds: Set<string>) => {
      const newNumIds = new Set<number>(Array.from(newStringIds).map(Number));
      const allCurrentPageIds = new Set(pagedRows.map((r) => r.id));

      const added = Array.from(newNumIds).filter((id) => !selectedSalesIds.has(id));
      const removed = Array.from(allCurrentPageIds).filter(
        (id) => selectedSalesIds.has(id) && !newNumIds.has(id)
      );

      const next = new Set(selectedSalesIds);
      removed.forEach((id) => next.delete(id));
      added.forEach((id) => next.add(id));
      onSelectedSalesIdsChange(next);
    },
    [pagedRows, selectedSalesIds, onSelectedSalesIdsChange]
  );

  const isCheckboxDisabled = useCallback(() => {
    return Boolean(isPaid || isSelectionLocked || isDeleting);
  }, [isPaid, isSelectionLocked, isDeleting]);

  const columns = useMemo<ColumnDef<AssignedSaleItem>[]>(
    () => [
      {
        header: 'Warna',
        accessorKey: 'color',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.unit_transaction_item_detail?.color ?? '-',
      },
      {
        header: 'Nomor Mesin',
        accessorKey: 'machine_number',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.unit_transaction_item_detail?.machine_number ?? '-'} />,
      },
      {
        header: 'Nomor Rangka',
        accessorKey: 'chassis_number',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.unit_transaction_item_detail?.chassis_number ?? '-'} />,
      },
      {
        header: 'Unit Transaksi Sebelumnya',
        accessorKey: 'source_transaction_before',
        sortable: true,
        alignment: 'left',
        tooltip: 'Kode unit transaksi asal sebelum unit dipindahkan',
        cell: (item) =>
          item.unit_transaction_item_detail?.source_transaction_before?.code ? (
            <CopyBox text={`${item.unit_transaction_item_detail.source_transaction_before.code}`} />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        header: 'Sub Blok',
        accessorKey: 'warehouse_sub_block',
        alignment: 'center',
        sortable: true,
        tooltip: 'Lokasi sub-blok penyimpanan unit di dalam gudang',
        cell: (item) =>
          item.unit_transaction_item_detail?.warehouse_sub_block?.name ? (
            item.unit_transaction_item_detail.warehouse_sub_block.name
          ) : (
            <Badge variant="outline" className="font-semibold bg-white text-slate-500">
              Belum Ditambahkan
            </Badge>
          ),
      },
      {
        header: 'Status Stok',
        accessorKey: 'in_stock',
        sortable: true,
        alignment: 'center',
        tooltip: 'Status ketersediaan unit fisik di gudang',
        cell: (item) =>
          item.unit_transaction_item_detail?.in_stock ? (
            <Badge
              variant="outline"
              className={cn('capitalize border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold')}
            >
              Tersedia
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className={cn('capitalize border-rose-200 bg-rose-50 text-rose-700 font-semibold')}
            >
              Tidak Tersedia
            </Badge>
          ),
      },
      {
        header: 'Kondisi Stok',
        accessorKey: 'status',
        sortable: true,
        alignment: 'center',
        tooltip: 'Kondisi fisik unit saat ini',
        cell: (item) => {
          const status = item.unit_transaction_item_detail?.status ?? 'normal';
          const cfg = statusConfig[status] ?? {
            label: status ? status.replace(/_/g, ' ') : '-',
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
        sortable: true,
        alignment: 'center',
        tooltip: 'Posisi alur stok unit',
        cell: (item) => {
          const stateVal = item.unit_transaction_item_detail?.stock_state ?? 'receipt';
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

  const canAddMore = assignedSales.length < requiredQty;

  const headerActionsNode = (
    <div className="flex flex-wrap items-center gap-2">
      {selectedSalesIds.size > 0 && !isPaid && !isSelectionLocked && (
        <>
          {onMoveUnit && (
            <Button
              size="sm"
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={onMoveUnit}
              disabled={isDeleting}
            >
              <ArrowRightLeft className="mr-1.5 h-4 w-4" />
              Pindahkan Unit ({selectedSalesIds.size})
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
            onClick={onBulkDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-1.5 h-4 w-4 text-rose-600" />
            {isDeleting ? 'Membatalkan...' : `Batalkan Unit (${selectedSalesIds.size})`}
          </Button>
        </>
      )}

      {!isPaid && !isSelectionLocked && (
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onOpenAddModal}
          disabled={!canAddMore}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Tambah Unit
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <BaseTable
        data={pagedRows}
        columns={columns}
        headerRowClassName="bg-[#f8f9fa] border-b border-gray-200"
        loading={isLoading}
        searchPlaceholder="Cari warna, nomor mesin, atau nomor rangka..."
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        showLimitChange
        perPage={perPage}
        onPerPageChange={(val) => {
          setPerPage(val);
          setCurrentPage(1);
        }}
        showCheckbox={!isPaid && !isSelectionLocked}
        selectedIds={stringSelectedIds}
        onSelectedIdsChange={handleSelectedIdsChange}
        getRowId={(item) => String(item.id)}
        isCheckboxDisabled={isCheckboxDisabled}
        meta={{
          currentPage,
          perPage,
          lastPage: totalPages,
          total: filteredItems.length,
        }}
        onPageChange={setCurrentPage}
        headerActions={headerActionsNode}
        emptyMessage={
          search
            ? `Tidak ada unit yang cocok dengan pencarian "${search}"`
            : 'Belum ada unit yang di-assign untuk transaksi penjualan ini. Klik "Tambah Unit" untuk menetapkan unit stok.'
        }
      />
    </div>
  );
}
