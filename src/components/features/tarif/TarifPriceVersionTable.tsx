import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Lock, MoreVertical, Pencil, Plus, Trash } from 'lucide-react';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import type { PaginationMeta } from '@/@types/pagination.types';
import type { TarifPriceVersion } from '@/@types/tarif-price-version.types';
import { formatDate } from '@/lib/utils/format';

interface Props {
  data: TarifPriceVersion[];
  meta?: PaginationMeta;
  search: string;
  page: number;
  perPage: number;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (version: TarifPriceVersion) => void;
  onDelete: (version: TarifPriceVersion) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function TarifPriceVersionTable({ data, meta, search, page, perPage, isLoading, onSearchChange, onAdd, onEdit, onDelete, onPageChange, onPerPageChange, canCreate, canEdit, canDelete }: Props) {
  const columns = useMemo<ColumnDef<TarifPriceVersion>[]>(() => [
    { header: 'NAMA VERSI', accessorKey: 'name', sortable: true, cell: (item) => <div className="flex items-center gap-1.5"><span className="font-semibold text-sm text-gray-900">{item.name}</span>{item.is_lock === 1 || item.is_lock === true ? <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help p-0.5"><Lock className="h-3.5 w-3.5 text-slate-400" /></span></TooltipTrigger><TooltipContent>Versi tarif ini terkunci.</TooltipContent></Tooltip> : null}</div> },
    { header: 'UJ TOWING', accessorKey: 'uj_towing', sortable: true, cell: (item) => currenciesFormat('idr', item.uj_towing) },
    { header: 'UJ CDD', accessorKey: 'uj_cdd', sortable: true, cell: (item) => currenciesFormat('idr', item.uj_cdd) },
    { header: 'UJ FUSO', accessorKey: 'uj_fuso', sortable: true, cell: (item) => currenciesFormat('idr', item.uj_fuso) },
    { header: 'BERLAKU DARI', accessorKey: 'effective_from', sortable: true, cell: (item) => formatDate(item.effective_from) || '-' },
    { header: 'BERLAKU SAMPAI', accessorKey: 'effective_until', sortable: true, cell: (item) => formatDate(item.effective_until) || '-' },
    { header: 'DEFAULT', accessorKey: 'is_default', sortable: true, alignment: 'center', cell: (item) => item.is_default === 1 || item.is_default === true ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none gap-1"><CheckCircle2 className="h-3 w-3" /> Default</Badge> : <span className="text-gray-400">-</span> },
    {
      header: 'ACTION',
      alignment: 'center',
      sticky: 'right',
      cell: (item) => <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(item)} disabled={item.is_lock === 1 || item.is_lock === true && canEdit}><Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(item)} disabled={item.is_default === 1 || item.is_default === true || item.is_lock === 1 || item.is_lock === true && canDelete} className="text-red-600">
            <Trash className="mr-2 h-4 w-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    },
  ], [onDelete, onEdit]);
  return <BaseTable data={data} columns={columns} loading={isLoading} searchPlaceholder="Cari versi tarif..." search={search} onSearchChange={onSearchChange} showLimitChange perPage={perPage} onPerPageChange={onPerPageChange} defaultSort={{ key: 'id', direction: 'desc' }} meta={{ currentPage: page, perPage, lastPage: meta?.lastPage ?? 1, total: meta?.total ?? data.length }} onPageChange={onPageChange} headerActions={<Button onClick={onAdd} disabled={!canCreate} className="bg-[#1e3a5f] hover:bg-[#152e4d]">
    <Plus className="mr-2 h-4 w-4" />
    Tambah Versi
  </Button>} />;
}
