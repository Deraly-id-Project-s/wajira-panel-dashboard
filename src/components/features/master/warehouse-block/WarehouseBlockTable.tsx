import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Plus, Trash, Eye } from 'lucide-react';
import { CopyBox } from '@/components/ui/copy-box';
import type { WarehouseBlock } from '@/services/warehouseBlock.service';
import type { PaginationMeta } from '@/types/pagination.types';

interface WarehouseBlockTableProps {
  data: WarehouseBlock[];
  meta?: PaginationMeta;
  search: string;
  page: number;
  perPage: number;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (block: WarehouseBlock) => void;
  onDelete: (block: WarehouseBlock) => void;
  onViewDetail: (block: WarehouseBlock) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export const WarehouseBlockTable = ({
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
  onViewDetail,
  onPageChange,
  onPerPageChange,
  canCreate,
  canEdit,
  canDelete,
}: WarehouseBlockTableProps) => {
  const columns = useMemo<ColumnDef<WarehouseBlock>[]>(
    () => [
      {
        header: 'NAMA BLOK',
        accessorKey: 'name',
        sortable: true,
        cell: (item) => <CopyBox text={item.name} className="font-medium text-slate-900" />,
      },
      {
        header: 'GUDANG UTAMA',
        accessorKey: 'warehouse',
        sortable: true,
        cell: (item) => <span className="text-sm text-slate-600">{item.warehouse?.name || '-'}</span>,
      },
      {
        header: 'DESKRIPSI',
        accessorKey: 'description',
        sortable: false,
        cell: (item) => <span className="text-sm text-slate-600">{item.description || '-'}</span>,
      },
      {
        header: 'JUMLAH SUB BLOK',
        accessorKey: 'warehouse_sub_block_count',
        sortable: false,
        cell: (item) => <span className="text-sm text-slate-600">{item.warehouse_sub_block_count || '-'}</span>,
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
                onClick={() => onViewDetail(item)}
                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
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
    [onEdit, onDelete, onViewDetail, canEdit, canDelete],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      searchPlaceholder="Cari blok gudang..."
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
        <Button onClick={canCreate ? onAdd : undefined}
          className="button-theme-1!" disabled={!canCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Data
        </Button>
      }
    />
  );
};
