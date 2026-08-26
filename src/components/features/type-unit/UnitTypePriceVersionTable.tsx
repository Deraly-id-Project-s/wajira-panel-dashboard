import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreVertical, Pencil, Plus, Trash, CheckCircle2, Lock } from 'lucide-react';
import type { UnitTypePriceVersion } from '@/@types/unit-type-price-version.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import { Badge } from '@/components/ui/badge';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

interface UnitTypePriceVersionTableProps {
  data: UnitTypePriceVersion[];
  meta?: PaginationMeta;
  search: string;
  page: number;
  perPage: number;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (version: UnitTypePriceVersion) => void;
  onDelete: (version: UnitTypePriceVersion) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const UnitTypePriceVersionTable = ({
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
  onPageChange,
  onPerPageChange,
  canCreate,
  canEdit,
  canDelete,
}: UnitTypePriceVersionTableProps) => {
  const columns = useMemo<ColumnDef<UnitTypePriceVersion>[]>(
    () => [
      {
        header: 'NAMA VERSI',
        accessorKey: 'name',
        sortable: true,
        cell: (item) => (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-gray-900">{item.name}</span>
            {item.is_lock === 1 || item.is_lock === true ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help p-0.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Versi harga ini tidak bisa dihapus atau diubah secara bebas!
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        )
      },
      {
        header: 'HARGA BELI',
        accessorKey: 'buy_price',
        sortable: true,
        cell: (item) => <span className="text-sm text-gray-900">{currenciesFormat('idr', item.buy_price)}</span>,
      },
      {
        header: 'HARGA JUAL',
        accessorKey: 'sell_price',
        sortable: true,
        cell: (item) => <span className="text-sm text-gray-900">{currenciesFormat('idr', item.sell_price)}</span>,
      },
      {
        header: 'BERLAKU DARI',
        accessorKey: 'effective_from',
        sortable: true,
        cell: (item) => <span className="text-sm text-gray-600">{item.effective_from || '-'}</span>,
      },
      {
        header: 'BERLAKU SAMPAI',
        accessorKey: 'effective_until',
        sortable: true,
        cell: (item) => <span className="text-sm text-gray-600">{item.effective_until || '-'}</span>,
      },
      {
        header: 'DEFAULT',
        accessorKey: 'is_default',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          item.is_default === 1 || item.is_default === true ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-help p-0.5">
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Default
                  </Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Hanya 1 data yang bisa diset default. Data default tidak bisa dihapus kecuali digantikan oleh yang lain.
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-gray-400">-</span>
          )
        ),
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
                onClick={() => onEdit(item)}
                disabled={!canEdit || item.is_lock === 1 || item.is_lock === true}
                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                disabled={!canDelete || item.is_default === 1 || item.is_default === true || item.is_lock === 1 || item.is_lock === true}
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
      searchPlaceholder="Cari versi harga..."
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
        <Button onClick={onAdd} disabled={!canCreate} className="button-theme-1!">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Versi
        </Button>
      }
    />
  );
};
