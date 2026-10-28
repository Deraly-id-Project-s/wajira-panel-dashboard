import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { TableCell, TableRow } from '@/components/ui/table';
import { CopyBox } from '@/components/ui/copy-box';
import { TextTruncate } from '@/components/ui/text-truncate';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDate } from '@/lib/utils/format';
import type { GeneralJournalReportItem } from '@/@types/general-journal-report.types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LaporanJurnalUmumTableProps {
  data: GeneralJournalReportItem[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
  meta?: {
    currentPage: number;
    perPage: number;
    lastPage: number;
    total: number;
  };
  onPageChange?: (page: number) => void;
}

export function LaporanJurnalUmumTable({
  data,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
  meta,
  onPageChange,
}: LaporanJurnalUmumTableProps) {
  const totals = useMemo(
    () =>
      data.reduce(
        (acc, item) => ({
          debit: acc.debit + (Number(item.debit) || 0),
          credit: acc.credit + (Number(item.credit) || 0),
        }),
        { debit: 0, credit: 0 },
      ),
    [data],
  );

  const columns = useMemo<ColumnDef<GeneralJournalReportItem>[]>(
    () => [
      {
        header: 'Tanggal',
        accessorKey: 'payment_at',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.payment_at),
      },
      {
        header: 'Kode Jurnal',
        accessorKey: 'general_journal.code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.general_journal?.code || '-'} />,
      },
      {
        header: 'Kode Akun',
        accessorKey: 'account.code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.account?.code || '-'} />,
      },
      {
        header: 'Nama Akun',
        accessorKey: 'account.name',
        sortable: true,
        alignment: 'left',
        cell: (item) => {
          const type = item.account?.type ? String(item.account.type).toUpperCase() : null;
          const name = item.account?.name;
          if (type && name) {
            return (
              <span className="font-medium text-slate-900">
                <span className="text-slate-400 font-normal mr-1">[{type}]</span>
                {name}
              </span>
            );
          }
          return <span className="font-medium text-slate-900">{name || '-'}</span>;
        },
      },
      {
        header: 'Keterangan',
        accessorKey: 'note',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <TextTruncate
            text={item.note || item.general_journal?.note || '-'}
            maxLength={36}
          />
        ),
      },
      {
        header: 'Posisi',
        accessorKey: 'type',
        sortable: true,
        alignment: 'center',
        cell: (item) => {
          const isDebet = item.type === 'debet';
          return (
            <Badge
              variant="outline"
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase',
                isDebet
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700',
              )}
            >
              {isDebet ? 'Debet' : 'Kredit'}
            </Badge>
          );
        },
      },
      {
        header: 'Debit (IDR)',
        accessorKey: 'debit',
        sortable: true,
        alignment: 'right',
        cell: (item) => (
          <span className="font-semibold tabular-nums text-emerald-700">
            {Number(item.debit) > 0 ? currenciesFormat('idr', item.debit) : '-'}
          </span>
        ),
      },
      {
        header: 'Kredit (IDR)',
        accessorKey: 'credit',
        sortable: true,
        alignment: 'right',
        cell: (item) => (
          <span className="font-semibold tabular-nums text-rose-700">
            {Number(item.credit) > 0 ? currenciesFormat('idr', item.credit) : '-'}
          </span>
        ),
      },
    ],
    [],
  );

  const footer = (
    <TableRow className="group border-t border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">
      <TableCell colSpan={6} className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
        Grand Total
      </TableCell>
      <TableCell className="px-4 py-4 text-right text-sm font-bold text-slate-900 tabular-nums">
        {currenciesFormat('idr', totals.debit)}
      </TableCell>
      <TableCell className="px-4 py-4 text-right text-sm font-bold text-slate-900 tabular-nums">
        {currenciesFormat('idr', totals.credit)}
      </TableCell>
    </TableRow>
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={loading}
      footer={footer}
      sortBy={sortBy}
      sortDirection={sortOrder}
      onSortChange={onSortChange}
      meta={meta}
      onPageChange={onPageChange}
    />
  );
}
