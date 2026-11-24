import { useMemo, useState } from 'react';
import { MoreVertical, CheckCircle2, Clock, Scale } from 'lucide-react';
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
          <div className="flex flex-col items-start gap-1.5 py-0.5">
            <div className="flex items-center gap-1.5">
              <CopyBox text={item.code || '-'} />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Badge Status Lunas */}
              <Badge
                variant="outline"
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide inline-flex items-center gap-1',
                  item.is_paid
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                )}
              >
                {item.is_paid ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                <span>{item.is_paid ? 'Lunas' : 'Belum Lunas'}</span>
              </Badge>

              {/* Badge Status Seimbang */}
              <Badge
                variant="outline"
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide inline-flex items-center gap-1',
                  item.is_balanced
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                )}
              >
                <Scale className="h-3 w-3" />
                <span>{item.is_balanced ? 'Seimbang' : 'Belum Seimbang'}</span>
              </Badge>
            </div>
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
        cell: (item) => {
          const itemType = String(item.type || '').toLowerCase();
          const isDebit = itemType === 'debit' || itemType === 'debet' || (!itemType && Number(item.total_credit || 0) === 0);
          const currency = item.is_usd_transaction ? 'usd' : 'idr';
          const nominal = Number(item.total_debit || item.total_amount || item.amount || 0);

          return currenciesFormat(currency, isDebit ? nominal : 0);
        },
      },
      {
        header: 'KREDIT',
        accessorKey: 'total_credit',
        sortable: true,
        alignment: 'left',
        cell: (item) => {
          const itemType = String(item.type || '').toLowerCase();
          const isCredit = itemType === 'credit' || itemType === 'kredit' || (!itemType && Number(item.total_credit || 0) > 0 && Number(item.total_debit || 0) === 0);
          const currency = item.is_usd_transaction ? 'usd' : 'idr';
          const nominal = Number(item.total_credit || item.total_amount || item.amount || 0);

          return currenciesFormat(currency, isCredit ? nominal : 0);
        },
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
