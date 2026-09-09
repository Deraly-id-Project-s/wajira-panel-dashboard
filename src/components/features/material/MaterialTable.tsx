import { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Material } from '@/@types/material.types';

interface MaterialTableProps {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function MaterialTable({
  materials,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: MaterialTableProps) {
  const columns = useMemo<ColumnDef<Material>[]>(
    () => [
      {
        header: 'KODE MATERIAL',
        accessorKey: 'code',
        className: 'text-slate-700 font-medium',
        cell: (item) => item.code || '-',
      },
      {
        header: 'DESKRIPSI',
        accessorKey: 'name',
        className: 'text-gray-900 font-medium',
        cell: (item) => item.name || '-',
      },
      {
        header: 'HARGA',
        accessorKey: 'price',
        alignment: 'right',
        className: 'text-gray-600',
        cell: (item) => formatCurrency(item.price),
      },
      {
        header: 'SATUAN',
        accessorKey: 'type',
        alignment: 'center',
        className: 'uppercase text-gray-600',
        cell: (item) => item.type || '-',
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem onClick={() => onEdit(item)} disabled={!canEdit} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(item)} disabled={!canDelete} className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canDelete, canEdit, onDelete, onEdit],
  );

  return (
    <BaseTable
      data={materials}
      columns={columns}
      getRowId={(item) => item.uuid || String(item.id || '')}
    />
  );
}
