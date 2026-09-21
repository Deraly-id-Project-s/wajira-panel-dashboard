import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Pencil, Trash, CheckCircle, PowerOff, Power } from 'lucide-react';
import { CopyBox } from '@/components/ui/copy-box';
import type { WarehouseSubBlock } from '@/services/warehouseBlock.service';

interface WarehouseSubBlockTableProps {
  data: WarehouseSubBlock[];
  isLoading?: boolean;
  onEdit: (subBlock: WarehouseSubBlock) => void;
  onDelete: (subBlock: WarehouseSubBlock) => void;
  onMakeDefault: (subBlock: WarehouseSubBlock) => void;
  onToggleActive: (subBlock: WarehouseSubBlock) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const WarehouseSubBlockTable = ({
  data,
  isLoading = false,
  onEdit,
  onDelete,
  onMakeDefault,
  onToggleActive,
  canEdit,
  canDelete,
}: WarehouseSubBlockTableProps) => {
  const columns = useMemo<ColumnDef<WarehouseSubBlock>[]>(
    () => [
      {
        header: 'NAMA SUB BLOK',
        accessorKey: 'name',
        sortable: true,
        cell: (item) => <CopyBox text={item.name} className="font-medium text-slate-900" />,
      },
      {
        header: 'DESKRIPSI',
        accessorKey: 'description',
        sortable: false,
        cell: (item) => <span className="text-sm text-slate-600">{item.description || '-'}</span>,
      },
      {
        header: 'STATUS',
        accessorKey: 'is_active',
        sortable: true,
        cell: (item) => {
          const isActive = String(item.is_active) === '1' || String(item.is_active) === 'true' || item.is_active === true;
          return (
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={isActive ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-none'}
            >
              {isActive ? 'Aktif' : 'Tidak Aktif'}
            </Badge>
          );
        },
      },
      {
        header: 'DEFAULT',
        accessorKey: 'is_default',
        sortable: true,
        cell: (item) => {
          const isDefault = String(item.is_default) === '1' || String(item.is_default) === 'true' || item.is_default === true;
          return isDefault ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Default
            </Badge>
          ) : (
            <span className="text-slate-400">-</span>
          );
        },
      },
      {
        header: 'ACTION',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onClick={() => onMakeDefault(item)}
                disabled={String(item.is_default) === '1' || String(item.is_default) === 'true' || item.is_default === true && !canEdit}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Jadikan Default
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleActive(item)}
                disabled={!canEdit}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                {String(item.is_active) === '1' || String(item.is_active) === 'true' || item.is_active === true ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4 text-orange-500" />
                    Jadikan Tidak Aktif
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4 text-green-500" />
                    Jadikan Aktif
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(item)}
                disabled={!canEdit}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                disabled={!canDelete}
                className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
              >
                <Trash className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onEdit, onDelete, onMakeDefault, onToggleActive, canEdit, canDelete],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      defaultSort={{ key: 'id', direction: 'desc' }}
    />
  );
};
