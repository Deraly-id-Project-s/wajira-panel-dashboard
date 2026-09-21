import { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { GoodsTransactionDetailEquipment } from '@/@types/goods-issue-equipment.types';

interface GoodsIssueEquipmentDetailTableProps {
  data: GoodsTransactionDetailEquipment[];
  selectedIds: number[];
  onSelectedIdsChange: (ids: number[]) => void;
  onEdit: (item: GoodsTransactionDetailEquipment) => void;
  onDelete: (item: GoodsTransactionDetailEquipment) => void;
}

export function GoodsIssueEquipmentDetailTable({
  data,
  selectedIds,
  onSelectedIdsChange,
  onEdit,
  onDelete,
}: GoodsIssueEquipmentDetailTableProps) {
  const columns = useMemo<ColumnDef<GoodsTransactionDetailEquipment>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'left',
        cell: (_, index) => index + 1,
      },
      {
        header: 'KODE BARANG',
        accessorKey: 'vehicleEquipment.code',
        className: 'text-slate-700 font-medium',
        cell: (item) => item.vehicleEquipment?.code || '-',
      },
      {
        header: 'NAMA BARANG',
        accessorKey: 'vehicleEquipment.name',
        className: 'text-slate-700 font-medium',
        cell: (item) => item.vehicleEquipment?.name || '-',
      },
      {
        header: 'QTY',
        accessorKey: 'qty',
        alignment: 'center',
        className: 'font-semibold text-slate-900',
        cell: (item) => item.qty,
      },
      {
        header: 'KETERANGAN',
        accessorKey: 'description',
        className: 'text-slate-700',
        cell: (item) => item.description || '-',
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4 text-slate-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem
                  onClick={() => onEdit(item)}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(item)}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600"
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onDelete, onEdit],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      showCheckbox
      selectedIds={new Set(selectedIds.map(String))}
      onSelectedIdsChange={(set) => onSelectedIdsChange(Array.from(set).map(Number))}
      getRowId={(item) => String(item.id)}
    />
  );
}
