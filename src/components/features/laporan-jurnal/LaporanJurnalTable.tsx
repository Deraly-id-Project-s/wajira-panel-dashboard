import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { TableCell, TableRow } from '@/components/ui/table';
import { CopyBox } from '@/components/ui/copy-box';
import { TextTruncate } from '@/components/ui/text-truncate';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDate } from '@/lib/utils/format';
import { JournalReportItem } from '@/@types/journal-report.types';

interface LaporanJurnalTableProps {
  data: JournalReportItem[];
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

export function LaporanJurnalTable({
  data,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
  meta,
  onPageChange,
}: LaporanJurnalTableProps) {
  const totals = useMemo(
    () =>
      data.reduce(
        (acc, item) => ({
          debit: acc.debit + (Number(item.debit) || 0),
          credit: acc.credit + (Number(item.credit) || 0),
          debitUsd: acc.debitUsd + (Number(item.debit_usd) || 0),
          creditUsd: acc.creditUsd + (Number(item.credit_usd) || 0),
        }),
        { debit: 0, credit: 0, debitUsd: 0, creditUsd: 0 },
      ),
    [data],
  );

  const columns = useMemo<ColumnDef<JournalReportItem>[]>(
    () => [
      {
        header: 'Tanggal',
        accessorKey: 'payment_at',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.payment_at),
      },
      {
        header: 'Kode Transaksi',
        accessorKey: 'cash_flow.code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.cash_flow?.code || '-'} />,
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
        cell: (item) => item.account?.name || '-',
      },
      {
        header: 'Keterangan',
        accessorKey: 'note',
        sortable: true,
        alignment: 'left',
        cell: (item) => <TextTruncate text={item.note || '-'} maxLength={32} />,
      },
      {
        header: 'Jenis Transaksi',
        accessorKey: 'cash_flow.note',
        sortable: true,
        alignment: 'left',
        cell: (item) => <TextTruncate text={item.cash_flow?.note || '-'} maxLength={32} />,
      },
      {
        header: 'Debit (IDR)',
        accessorKey: 'debit',
        sortable: true,
        alignment: 'right',
        cell: (item) => (
          <span className="font-semibold text-emerald-700">
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
          <span className="font-semibold text-rose-700">
            {Number(item.credit) > 0 ? currenciesFormat('idr', item.credit) : '-'}
          </span>
        ),
      },
      {
        header: 'Debit (USD)',
        accessorKey: 'debit_usd',
        sortable: true,
        alignment: 'right',
        cell: (item) => (
          <span className="font-semibold text-emerald-700">
            {Number(item.debit_usd) > 0 ? currenciesFormat('usd', item.debit_usd) : '-'}
          </span>
        ),
      },
      {
        header: 'Kredit (USD)',
        accessorKey: 'credit_usd',
        sortable: true,
        alignment: 'right',
        cell: (item) => (
          <span className="font-semibold text-rose-700">
            {Number(item.credit_usd) > 0 ? currenciesFormat('usd', item.credit_usd) : '-'}
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
      <TableCell className="px-4 py-4 text-right text-sm font-bold text-slate-900">
        {currenciesFormat('idr', totals.debit)}
      </TableCell>
      <TableCell className="px-4 py-4 text-right text-sm font-bold text-slate-900">
        {currenciesFormat('idr', totals.credit)}
      </TableCell>
      <TableCell className="px-4 py-4 text-right text-sm font-bold text-slate-900">
        {currenciesFormat('usd', totals.debitUsd)}
      </TableCell>
      <TableCell className="px-4 py-4 text-right text-sm font-bold text-slate-900">
        {currenciesFormat('usd', totals.creditUsd)}
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
