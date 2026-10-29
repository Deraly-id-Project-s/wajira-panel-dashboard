import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { MoreVertical, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GeneralJournalListItem } from '@/@types/general-journal.types';
import type { PaginationMeta } from '@/@types/pagination.types';
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

const formatDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'dd MMM yyyy');
};

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
            {item.is_usd_transaction ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                USD
              </span>
            ) : null}
          </div>
        ),
      },
      {
        header: 'MATA UANG',
        accessorKey: 'is_usd_transaction',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-semibold uppercase',
              item.is_usd_transaction
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200',
            )}
          >
            {item.is_usd_transaction ? 'USD ($)' : 'IDR (Rp)'}
          </span>
        ),
      },
      {
        header: 'NOMINAL TRANSAKSI',
        accessorKey: 'amount',
        sortable: true,
        alignment: 'right',
        cell: (item) => (
          <div className="text-right">
            <span className={cn('font-bold', item.is_usd_transaction ? 'text-blue-700' : 'text-slate-800')}>
              {item.is_usd_transaction
                ? currenciesFormat('usd', item.amount)
                : currenciesFormat('idr', item.amount || item.total_debit)}
            </span>
            {item.is_usd_transaction && item.amount_original ? (
              <span className="text-[11px] text-slate-400 block">
                ~ {currenciesFormat('idr', item.amount_original)}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        header: 'STATUS POSTING',
        accessorKey: 'is_paid',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1',
              item.is_paid
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200',
            )}
          >
            {item.is_paid ? <CheckCircle2 className="h-3 w-3" /> : null}
            {item.is_paid ? 'Posted' : 'Draft'}
          </span>
        ),
      },
      {
        header: 'TANGGAL',
        accessorKey: 'date',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.date),
      },
      {
        header: 'KETERANGAN',
        accessorKey: 'note',
        sortable: true,
        alignment: 'left',
        cell: (item) => <TextTruncate text={item.note || '-'} maxLength={30} />,
      },
      {
        header: 'TOTAL DEBET',
        accessorKey: 'total_debit',
        sortable: true,
        alignment: 'right',
        cell: (item) => (
          <span className="font-semibold text-emerald-600">
            {currenciesFormat('idr', item.total_debit)}
          </span>
        ),
      },
      {
        header: 'TOTAL KREDIT',
        accessorKey: 'total_credit',
        sortable: true,
        alignment: 'right',
        cell: (item) => (
          <span className="font-semibold text-rose-600">
            {currenciesFormat('idr', item.total_credit)}
          </span>
        ),
      },
      {
        header: 'KESEIMBANGAN',
        accessorKey: 'is_balanced',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <span
            className={cn(
              'px-2 py-0.5 rounded text-[11px] font-medium inline-flex items-center gap-1',
              item.is_balanced
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200',
            )}
          >
            {item.is_balanced ? 'Balanced' : (
              <>
                <AlertCircle className="h-3 w-3" /> Tidak Seimbang
              </>
            )}
          </span>
        ),
      },
      {
        header: 'BARIS ITEM',
        accessorKey: 'billingsCount',
        sortable: true,
        alignment: 'center',
        cell: (item) => `${item.billingsCount} baris`,
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
                  {item.is_paid ? 'Batal Posting Jurnal' : 'Posting Jurnal'}
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
