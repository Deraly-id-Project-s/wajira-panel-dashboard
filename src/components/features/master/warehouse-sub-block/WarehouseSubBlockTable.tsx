import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Pencil, Plus, Trash, CheckCircle, PowerOff, Power, Upload, Download } from 'lucide-react';
import { CopyBox } from '@/components/ui/copy-box';
import type { WarehouseSubBlock } from '@/services/warehouseBlock.service';
import type { PaginationMeta } from '@/@types/pagination.types';

interface WarehouseSubBlockTableProps {
  data: WarehouseSubBlock[];
  meta?: PaginationMeta;
  search: string;
  page: number;
  perPage: number;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (subBlock: WarehouseSubBlock) => void;
  onDelete: (subBlock: WarehouseSubBlock) => void;
  onMakeDefault: (subBlock: WarehouseSubBlock) => void;
  onToggleActive: (subBlock: WarehouseSubBlock) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onImport?: () => void;
  onExport?: () => void;
  isExporting?: boolean;
}

export const WarehouseSubBlockTable = ({
  data,
  meta,
  search,
  page,
  perPage,
  isLoading = false,
  onSearchChange,
  onAdd,
  onEdit,
  onDelete,
  onMakeDefault,
  onToggleActive,
  onPageChange,
  onPerPageChange,
  canCreate,
  canEdit,
  canDelete,
  onImport,
  onExport,
  isExporting,
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
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-xl border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onClick={() => onMakeDefault(item)}
                disabled={String(item.is_default) === '1' || String(item.is_default) === 'true' || item.is_default === true && !canEdit}
                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Jadikan Default
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleActive(item)}
                disabled={!canEdit}
                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
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
                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                disabled={!canDelete}
                className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
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
      searchPlaceholder="Cari sub blok gudang..."
      search={search}
      onSearchChange={onSearchChange}
      showLimitChange
      perPage={perPage}
      onPerPageChange={onPerPageChange}
      defaultSort={{ key: 'id', direction: 'desc' }}
      meta={{
        currentPage: page,
        perPage,
        lastPage: meta?.lastPage ?? 1,
        total: meta?.total ?? data.length,
      }}
      onPageChange={onPageChange}
      headerActions={
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onExport && (
            <Button variant="outline" className="w-full sm:w-auto" onClick={onExport} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Proses...' : 'Export'}
            </Button>
          )}
          {canCreate && onImport && (
            <Button variant="outline" className="w-full sm:w-auto" onClick={onImport}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          )}
          <Button onClick={canCreate ? onAdd : undefined} className="btn-primary!" disabled={!canCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Data
          </Button>
        </div>
      }
    />
  );
};
