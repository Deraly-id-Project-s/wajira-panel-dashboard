import { ReactNode, useMemo, useCallback } from 'react';

import { WarehouseStockUnit } from '@/@types/unit-transaction.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TypeUnit } from '@/@types/type-unit.types';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';

interface StockPickerTableProps {
  units: WarehouseStockUnit[];
  selectedIds: Set<number>;
  unitType?: TypeUnit;
  isPaid?: boolean;
  onToggleOne: (id: number, checked: boolean) => void;
  onToggleAllPage: (checked: boolean) => void;
  currentPage: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (value: number) => void;
  isLoading?: boolean;
  isError?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchAction?: ReactNode;
  requiredQty?: number;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Backend enum statuses
  normal: { label: 'Normal', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
  minor_damage: { label: 'Minor Damage', className: 'border-amber-200 bg-amber-50 text-amber-700 font-semibold' },
  major_damage: { label: 'Major Damage', className: 'border-red-200 bg-red-50 text-red-700 font-semibold' },
  returned: { label: 'Returned', className: 'border-purple-200 bg-purple-50 text-purple-700 font-semibold' },
  refunded: { label: 'Refunded', className: 'border-orange-200 bg-orange-50 text-orange-700 font-semibold' },
  lost: { label: 'Lost', className: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' },
  in_repair: { label: 'In Repair', className: 'border-blue-200 bg-blue-50 text-blue-700 font-semibold' },

  // Fallback / legacy statuses
  draft: { label: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600 font-medium' },
  cancel: { label: 'Cancel', className: 'border-red-200 bg-red-50 text-red-700 font-medium' },
  rejected: { label: 'Rejected', className: 'border-red-200 bg-red-50 text-red-700 font-medium' },
  prepare: { label: 'Prepare', className: 'border-amber-200 bg-amber-50 text-amber-700 font-medium' },
  inbound_purcase_order: { label: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700 font-medium' },
  inbound_incoming_goods: { label: 'In Transit', className: 'border-blue-200 bg-blue-50 text-blue-700 font-medium' },
  inbound_receipt: { label: 'Available', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
  inbound_return: { label: 'Refund', className: 'border-orange-200 bg-orange-50 text-orange-700 font-medium' },
  outbound_reserved: { label: 'Reserved', className: 'border-orange-200 bg-orange-50 text-orange-700 font-medium' },
  outbound_in_transit: { label: 'In Transit', className: 'border-indigo-200 bg-indigo-50 text-indigo-700 font-medium' },
  outbound_delivered: { label: 'Delivered', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-medium' },
  outbound_return: { label: 'Return', className: 'border-rose-200 bg-rose-50 text-rose-700 font-medium' },
};

const renderStatus = (status: string) => {
  const config = statusConfig[status] ?? {
    label: status ? status.replace(/_/g, ' ') : '-',
    className: 'border-slate-200 bg-slate-50 text-slate-700 font-medium',
  };

  return (
    <Badge variant="outline" className={cn('capitalize', config.className)}>
      {config.label}
    </Badge>
  );
};

const stockStateConfig: Record<string, { name: string; className: string }> = {
  draft: { name: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600' },
  cancel: { name: 'Batal', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  prepare: { name: 'Disiapkan', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  purchase_order: { name: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  in_transit: { name: 'Dalam Perjalanan', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  receipt: { name: 'Diterima', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

const renderStockState = (state: string) => {
  const s = state ? state.toLowerCase() : 'draft';
  const match = stockStateConfig[s] ?? {
    name: state ? state.replace(/_/g, ' ') : '-',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  };
  return (
    <Badge variant="outline" className={cn('capitalize font-semibold', match.className)}>
      {match.name}
    </Badge>
  );
};

export function StockPickerTable({
  units,
  selectedIds,
  onToggleOne,
  currentPage,
  perPage,
  onPageChange,
  onPerPageChange,
  isLoading,
  searchValue,
  onSearchChange,
  searchAction,
  requiredQty,
}: StockPickerTableProps) {
  const filteredUnits = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return units;

    return units.filter((item) => {
      return [item.color, item.machine_number, item.chassis_number].some((field) => String(field ?? '').toLowerCase().includes(query));
    });
  }, [units, searchValue]);

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / perPage));
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredUnits.slice(start, start + perPage);
  }, [filteredUnits, currentPage, perPage]);

  const stringSelectedIds = useMemo(() => {
    return new Set<string>(Array.from(selectedIds).map(String));
  }, [selectedIds]);

  const isLimitReached = requiredQty !== undefined && requiredQty > 0 && selectedIds.size >= requiredQty;

  const isCheckboxDisabled = useCallback((item: WarehouseStockUnit) => {
    if (isLimitReached && !selectedIds.has(item.id)) {
      return true;
    }
    return false;
  }, [isLimitReached, selectedIds]);

  const handleSelectedIdsChange = useCallback((ids: Set<string>) => {
    const numIds = new Set<number>(Array.from(ids).map(Number));
    const allPageIds = new Set(pagedRows.map((r) => r.id));

    const added = Array.from(numIds).filter((id) => !selectedIds.has(id));
    const removed = Array.from(allPageIds).filter((id) => selectedIds.has(id) && !numIds.has(id));

    if (removed.length > 0) {
      removed.forEach((id) => onToggleOne(id, false));
    }

    if (added.length > 0) {
      let currentSelectedSize = selectedIds.size - removed.length;
      for (const id of added) {
        if (requiredQty !== undefined && requiredQty > 0 && currentSelectedSize >= requiredQty) {
          break;
        }
        onToggleOne(id, true);
        currentSelectedSize++;
      }
    }
  }, [pagedRows, selectedIds, onToggleOne, requiredQty]);

  const columns = useMemo<ColumnDef<WarehouseStockUnit>[]>(() => [
    {
      header: 'Warna',
      accessorKey: 'color',
      sortable: true,
      alignment: 'left' as const,
      cell: (item) => item?.color ?? '-',
    },
    {
      header: 'Nomor Mesin',
      accessorKey: 'machine_number',
      sortable: true,
      alignment: 'left' as const,
      cell: (item) => (
        <CopyBox text={item?.machine_number ?? '-'} />
      ),
    },
    {
      header: 'Nomor Rangka',
      accessorKey: 'chassis_number',
      sortable: true,
      alignment: 'left' as const,
      cell: (item) => (
        <CopyBox text={item?.chassis_number ?? '-'} />
      ),
    },
    {
      header: 'Sub Blok',
      accessorKey: 'warehouseSubBlock',
      alignment: 'center' as const,
      sortable: true,
      tooltip: 'Lokasi sub-blok penyimpanan unit di dalam gudang',
      cell: (item) => item?.warehouse_sub_block?.name ? item?.warehouse_sub_block?.name : <Badge variant='outline' className="font-semibold bg-white">Belum Ditambahkan</Badge>,
    },
    {
      header: 'Status Stok',
      accessorKey: 'in_stock',
      sortable: true,
      alignment: 'center' as const,
      tooltip: 'Status ketersediaan unit fisik di gudang',
      cell: (item) => item?.in_stock ? <Badge variant="outline" className={cn('capitalize', 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold')}>Tersedia</Badge> : <Badge variant="outline" className={cn('capitalize', 'border-rose-200 bg-rose-50 text-rose-700 font-semibold')}>Tidak Tersedia</Badge>
    },
    {
      header: 'Kondisi Stok',
      accessorKey: 'status',
      sortable: true,
      alignment: 'center' as const,
      tooltip: 'Kondisi fisik unit saat ini',
      cell: (item) => renderStatus(item?.status ?? ''),
    },
    {
      header: 'Posisi Stok',
      accessorKey: 'stock_state',
      sortable: true,
      alignment: 'center' as const,
      tooltip: 'Posisi logistik atau status alur stok unit',
      cell: (item) => {
        const config: Record<string, { label: string; name: string; className: string }> = {
          draft: { label: 'Draft', name: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600' },
          cancel: { label: 'Cancel', name: 'Batal', className: 'border-rose-200 bg-rose-50 text-rose-700' },
          prepare: { label: 'Prepare', name: 'Disiapkan', className: 'border-amber-200 bg-amber-50 text-amber-700' },
          purchase_order: { label: 'Purchase Order', name: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700' },
          in_transit: { label: 'In Transit', name: 'Dalam Perjalanan', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
          receipt: { label: 'Receipt', name: 'Diterima', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
        };
        const stateVal = item?.stock_state ?? 'draft';
        const match = config[stateVal] ?? {
          label: stateVal.replace(/_/g, ' '),
          className: 'border-slate-200 bg-slate-50 text-slate-700',
        };
        const isRefund = item?.status === 'returned' || item?.status === 'refunded';

        return (
          <Badge variant="outline" className={cn('capitalize font-semibold', match.className)}>
            {stateVal === 'receipt' ? (isRefund ? 'Dikembalikan' : 'Diterima') : match.label}
          </Badge>
        );
      }
    },
  ], []);

  return (
    <div className="space-y-4">
      <BaseTable
        data={pagedRows}
        columns={columns}
        headerRowClassName="bg-[#f8f9fa] border-b border-gray-200"
        loading={isLoading}
        searchPlaceholder="Cari warna/nomor mesin/nomor rangka"
        search={searchValue}
        onSearchChange={onSearchChange}
        showLimitChange
        perPage={perPage}
        onPerPageChange={(val) => {
          onPerPageChange(val);
          onPageChange(1);
        }}
        showCheckbox
        selectedIds={stringSelectedIds}
        onSelectedIdsChange={handleSelectedIdsChange}
        getRowId={(item) => String(item.id)}
        isCheckboxDisabled={isCheckboxDisabled}
        meta={{
          currentPage,
          perPage,
          lastPage: totalPages,
          total: filteredUnits.length,
        }}
        onPageChange={onPageChange}
        headerActions={searchAction ? <div>{searchAction}</div> : undefined}
      />
    </div>
  );
}
