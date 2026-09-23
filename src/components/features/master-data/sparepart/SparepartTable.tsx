import { useMemo } from 'react';
import type { Sparepart } from '@/@types/sparepart.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

interface SparepartTableProps {
  data: Sparepart[];
  isLoading?: boolean;
  onEdit: (item: Sparepart) => void;
  onDelete: (item: Sparepart) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const SparepartTable = ({
  data,
  isLoading = false,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: SparepartTableProps) => {
  const columns = useMemo<ColumnDef<Sparepart>[]>(
    () => [
      {
        header: 'KODE',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.code} />,
      },
      {
        header: 'NAMA SPAREPART',
        accessorKey: 'name',
        sortable: true,
        alignment: 'left',
      },
      {
        header: 'Grup',
        accessorKey: 'category.name',
        sortable: true,
        alignment: 'left',
        cell: (item) => item?.category?.name || item.group || '-',
      },
      {
        header: 'Satuan',
        accessorKey: 'unit_type',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.unit_type || '-',
      },
      {
        header: 'HARGA BELI',
        accessorKey: 'purchasePrice',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.purchasePrice ?? item.price ?? 0),
      },
      {
        header: 'HARGA JUAL',
        accessorKey: 'sellingPrice',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.sellingPrice ?? item.price ?? 0),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onClick={() => onEdit(item)}
                disabled={!canEdit}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                disabled={!canDelete}
                className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
              >
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canEdit, canDelete, onEdit, onDelete]
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      defaultSort={{ key: 'code', direction: 'asc' }}
    />
  );
};
