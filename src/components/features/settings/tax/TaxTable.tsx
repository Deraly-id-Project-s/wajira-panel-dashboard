import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreVertical, Lock } from 'lucide-react';
import type { Tax } from '@/services/tax.service';
import { CopyBox } from '@/components/ui/copy-box';

interface TaxTableProps {
  data: Tax[];
  isLoading?: boolean;
  onEdit: (tax: Tax) => void;
  onDelete: (tax: Tax) => void;
  onViewDetail: (tax: Tax) => void;
}

export const TaxTable = ({ data, isLoading = false, onEdit, onDelete, onViewDetail }: TaxTableProps) => {
  const columns = useMemo<ColumnDef<Tax>[]>(
    () => [
      {
        header: 'KODE',
        accessorKey: 'code',
        sortable: true,
        cell: (item) => (
          <div className="flex items-center gap-1.5">
            <CopyBox text={item.code} />
            {item.is_lock === 1 || item.is_lock === true ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help p-0.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Pajak ini merupakan data default yang tidak bisa diedit kodenya atau dihapus!
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ),
      },
      {
        header: 'NAMA',
        accessorKey: 'name',
        sortable: true,
        cell: (item) => <span className="text-sm text-gray-900">{item.name}</span>,
      },
      {
        header: 'JUMLAH VERSI PAJAK',
        accessorKey: 'tax_version_count',
        sortable: true,
        cell: (item) => <span className="text-sm text-gray-900">{item.tax_version_count || 0} Versi</span>,
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
                onClick={() => onViewDetail(item)}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                Lihat Detail
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(item)}
                disabled={item.is_lock === 1 || item.is_lock === true}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                disabled={item.is_lock === 1 || item.is_lock === true}
              >
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onEdit, onDelete, onViewDetail],
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
