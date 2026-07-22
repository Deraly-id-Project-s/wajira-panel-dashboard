import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreVertical, Pencil, Plus, Trash, Lock } from 'lucide-react';
import type { Account } from '@/@types/account.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import { Badge } from '@/components/ui/badge';

interface AccountTableProps {
  data: Account[];
  meta?: PaginationMeta;
  search: string;
  page: number;
  perPage: number;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const AccountTable = ({ data, meta, search, page, perPage, isLoading = false, onSearchChange, onAdd, onEdit, onDelete, onPageChange, onPerPageChange, canEdit, canDelete }: AccountTableProps) => {
  const columns = useMemo<ColumnDef<Account>[]>(
    () => [
      {
        header: 'KODE',
        accessorKey: 'code',
        sortable: true,
        cell: (item) => (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-gray-900">{item.code}</span>
            {item.is_lock && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help p-0.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Akun ini merupakan data default yang tidak bisa dihapus!
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        header: 'NAMA AKUN',
        accessorKey: 'name',
        sortable: true,
        cell: (item) => <span className="text-sm text-gray-900">{item.name}</span>,
      },
      {
        header: 'GRUP',
        accessorKey: 'accountGroupCode',
        sortable: true,
        cell: (item) => <span className="text-sm text-gray-600">{item.accountGroupCode ?? '-'}</span>,
      },
      {
        header: 'DESKRIPSI',
        accessorKey: 'description',
        sortable: true,
        cell: (item) => <span className="text-sm text-gray-600">{item.description ?? '-'}</span>,
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
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-xl border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onClick={() => onEdit(item)}
                disabled={item.is_lock || !canEdit}
                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item)}
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
      searchPlaceholder="Cari akun"
      search={search}
      onSearchChange={onSearchChange}
      showLimitChange
      perPage={perPage}
      onPerPageChange={onPerPageChange}
      defaultSort={{ key: 'code', direction: 'asc' }}
      meta={{
        currentPage: page,
        perPage,
        lastPage: meta?.lastPage ?? 1,
        total: meta?.total ?? data.length,
      }}
      onPageChange={onPageChange}
      headerActions={
        <Button onClick={onAdd} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Data
        </Button>
      }
    />
  );
};
