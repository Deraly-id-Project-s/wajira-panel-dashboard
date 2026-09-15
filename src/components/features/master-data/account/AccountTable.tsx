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
        header: 'KATEGORI',
        accessorKey: 'category',
        sortable: true,
        cell: (item) => {
          if (!item.category) return <span className="text-gray-400">-</span>;

          let badgeClass = '';
          let label = item.category;

          switch (item.category) {
            case 'general':
              badgeClass = 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50';
              label = 'Umum';
              break;
            case 'operational':
              badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50';
              label = 'Operasional';
              break;
            case 'director_receivable':
              badgeClass = 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50';
              label = 'Piutang Direksi';
              break;
            case 'shareholder_receivable':
              badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50';
              label = 'Piutang Pemegang Saham';
              break;
            case 'receivable':
              badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50';
              label = 'Piutang';
              break;
            case 'inventory':
              badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50';
              label = 'Persediaan';
              break;
            default:
              badgeClass = 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50';
          }

          return (
            <Badge variant="outline" className={badgeClass}>
              {label}
            </Badge>
          );
        },
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
                onClick={() => onEdit(item)}
                disabled={!canEdit}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
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
        <Button onClick={onAdd} className="btn-primary!">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Data
        </Button>
      }
    />
  );
};
