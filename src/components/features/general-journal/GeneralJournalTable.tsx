import { useMemo, useState } from 'react';
import { MoreVertical, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '@/components/ui/format-date';
import type { GeneralJournalListItem } from '@/@types/general-journal.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';
import { TextTruncate } from '@/components/ui/text-truncate';
import { cn } from '@/lib/utils';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

interface Props {
  data: GeneralJournalListItem[];
  meta: PaginationMeta;
  isLoading?: boolean;
  onView: (item: GeneralJournalListItem) => void;
  onEdit: (item: GeneralJournalListItem) => void;
  onDelete: (item: GeneralJournalListItem) => void;
  onToggleStatus?: (item: GeneralJournalListItem) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function GeneralJournalTable({
  data,
  meta,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  canEdit = true,
  canDelete = true,
}: Props) {
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedData = useMemo(() => {
    if (!sortBy) return data;
    return [...data].sort((a, b) => {
      let aVal = (a as any)[sortBy];
      let bVal = (b as any)[sortBy];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortBy, sortDirection]);

  const columns = useMemo<ColumnDef<GeneralJournalListItem>[]>(
    () => [
      {
        header: 'KODE JURNAL',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <div className="flex items-center gap-1.5">
            <CopyBox text={item.code || '-'} />
          </div>
        ),
      },
      {
        header: 'TANGGAL',
        accessorKey: 'date',
        sortable: true,
        alignment: 'left',
        cell: (item) => formatDate(item.date),
      },
      {
        header: 'DEBET',
        accessorKey: 'total_debit',
        sortable: true,
        alignment: 'left',
        cell: (item) => currenciesFormat(item.is_usd_transaction ? 'usd' : 'idr', item.total_debit),
      },
      {
        header: 'KREDIT',
        accessorKey: 'total_credit',
        sortable: true,
        alignment: 'left',
        cell: (item) => currenciesFormat(item.is_usd_transaction ? 'usd' : 'idr', item.total_credit),
      },
      {
        header: 'STATUS',
        accessorKey: 'is_paid',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <Badge
            variant="outline"
            className={cn(
              'rounded-full px-2.5 py-0.5 font-semibold text-xs whitespace-nowrap',
              item.is_paid
                ? item.is_balanced
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-rose-200 bg-rose-50 text-rose-700',
            )}
          >
            {item.is_paid
              ? item.is_balanced
                ? 'LUNAS & SEIMBANG'
                : 'LUNAS (BELUM SEIMBANG)'
              : 'BELUM LUNAS'}
          </Badge>
        ),
      },
      {
        header: 'KETERANGAN',
        accessorKey: 'note',
        sortable: true,
        alignment: 'left',
        cell: (item) => <TextTruncate text={item.note || '-'} maxLength={30} />,
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onClick={() => onView(item)}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                Detail
              </DropdownMenuItem>

              {!item.is_paid && canEdit ? (
                <DropdownMenuItem
                  onClick={() => onEdit(item)}
                  className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                >
                  Edit
                </DropdownMenuItem>
              ) : null}

              {onToggleStatus && canEdit ? (
                <DropdownMenuItem
                  onClick={() => onToggleStatus(item)}
                  className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer font-medium"
                  disabled={!item.is_paid && (!item.is_balanced || item.total_debit <= 0)}
                >
                  {item.is_paid ? 'Batal Tandai Lunas' : 'Tandai Lunas'}
                </DropdownMenuItem>
              ) : null}

              {!item.is_paid && canDelete ? (
                <DropdownMenuItem
                  onClick={() => onDelete(item)}
                  className="rounded-md px-3 py-2 text-sm text-rose-600 focus:bg-rose-50 cursor-pointer"
                >
                  Hapus
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canDelete, canEdit, onDelete, onEdit, onToggleStatus, onView],
  );

  return (
    <BaseTable
      data={sortedData}
      columns={columns}
      loading={isLoading}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onSortChange={(key, dir) => {
        setSortBy(key);
        setSortDirection(dir);
      }}
    />
  );
}
