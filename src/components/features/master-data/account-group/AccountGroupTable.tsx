import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreVertical, Pencil, Trash, Lock } from 'lucide-react';
import type { AccountGroup } from '@/types/account-group.types';
import type { PaginationMeta } from '@/types/pagination.types';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';

interface AccountGroupTableProps {
  data: AccountGroup[];
  meta?: PaginationMeta;
  isLoading?: boolean;
  onEdit: (accountGroup: AccountGroup) => void;
  onDelete: (accountGroup: AccountGroup) => void;
  page: number;
  perPage: number;
  canEdit: boolean;
  canDelete: boolean;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export const AccountGroupTable = ({ data, meta, isLoading = false, onEdit, onDelete, page, perPage, onPageChange, onPerPageChange, canEdit, canDelete }: AccountGroupTableProps) => {
  const columns = useMemo<ColumnDef<AccountGroup>[]>(
    () => [
      {
        header: 'KODE',
        accessorKey: 'code',
        sortable: true,
        className: 'font-semibold text-gray-900',
        cell: (item) => (
          <div className="flex items-center gap-1.5">
            <CopyBox text={item.code} />
            {item.is_lock && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help p-0.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Grup akun terkunci</TooltipContent>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        header: 'NAMA GRUP',
        accessorKey: 'name',
        sortable: true,
        className: 'max-w-[200px] truncate',
        cell: (item) => (
          <span title={item.name}>
            {item.name.length > 50 ? `${item.name.substring(0, 50)}...` : item.name}
          </span>
        ),
      },
      {
        header: 'DESKRIPSI',
        accessorKey: 'description',
        sortable: true,
        className: 'text-gray-600 max-w-[300px] truncate',
        cell: (item) => (
          <span title={item.description ?? undefined}>
            {item.description ? (item.description.length > 50 ? `${item.description.substring(0, 50)}...` : item.description) : '-'}
          </span>
        ),
      },
      {
        header: 'STATUS',
        accessorKey: 'isActive',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <Badge variant={item.isActive ? 'default' : 'secondary'} className={item.isActive ? '' : 'bg-gray-200 text-gray-700'}>
            {item.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        ),
      },
      {
        header: 'aksi',
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
                onSelect={(e) => {
                  e.preventDefault();
                  onEdit(item);
                }}
                disabled={item.is_lock || !canEdit}
                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  onDelete(item);
                }}
                className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                disabled={item.is_lock || !canDelete}
              >
                <Trash className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onEdit, onDelete, canEdit, canDelete],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      defaultSort={{ key: 'code', direction: 'asc' }}
      meta={{
        currentPage: page,
        perPage,
        lastPage: meta?.lastPage ?? 1,
        total: meta?.total ?? data.length,
      }}
      onPageChange={onPageChange}
    />
  );
};
