import { useMemo } from 'react';

import type { BalanceColumnReportItem } from '@/@types/balance-column-report.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { TableCell, TableRow } from '@/components/ui/table';

interface LaporanNeracaLajurTableProps {
  data: BalanceColumnReportItem[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
}

const formatCurrency = (
  value: number | null | undefined,
  currency: 'idr' | 'usd',
) => currenciesFormat(currency, Number(value) || 0);

export function LaporanNeracaLajurTable({
  data,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
}: LaporanNeracaLajurTableProps) {
  const totals = useMemo(() => data.reduce(
    (result, item) => {
      result.openingBalance += Number(item.opening_balance) || 0;
      result.debit += Number(item.debit) || 0;
      result.credit += Number(item.credit) || 0;
      result.debitUsd += Number(item.debit_usd) || 0;
      result.creditUsd += Number(item.credit_usd) || 0;
      result.endingBalance += Number(item.ending_balance) || 0;
      result.total += Number(item.total) || 0;
      return result;
    },
    { openingBalance: 0, debit: 0, credit: 0, debitUsd: 0, creditUsd: 0, endingBalance: 0, total: 0 },
  ), [data]);

  const columns = useMemo<ColumnDef<BalanceColumnReportItem>[]>(() => [
    {
      header: 'Kode Kelompok',
      accessorKey: 'account_group_code',
      sortable: true,
      alignment: 'left',
      cell: (item) => <CopyBox text={item.account_group_code || '-'} />,
    },
    {
      header: 'Kelompok Akun',
      accessorKey: 'account_group_name',
      sortable: true,
      alignment: 'left',
      cell: (item) => item.account_group_name || item.account_group || '-',
    },
    {
      header: 'Kode Akun',
      accessorKey: 'account_code',
      sortable: true,
      alignment: 'left',
      cell: (item) => <CopyBox text={item.account_code || '-'} />,
    },
    {
      header: 'Nama Akun',
      accessorKey: 'account_name',
      sortable: true,
      alignment: 'left',
      cell: (item) => item.account_name || '-',
    },
    {
      header: 'Saldo Normal',
      accessorKey: 'normal_balance',
      sortable: true,
      alignment: 'center',
      cell: (item) => <Badge variant="outline">{item.normal_balance || '-'}</Badge>,
    },
    {
      header: 'Saldo Awal (IDR)',
      accessorKey: 'opening_balance',
      sortable: true,
      alignment: 'right',
      cell: (item) => formatCurrency(item.opening_balance, 'idr'),
    },
    {
      header: 'Debit (IDR)',
      accessorKey: 'debit',
      sortable: true,
      alignment: 'right',
      cell: (item) => <span className="font-semibold text-emerald-700">{formatCurrency(item.debit, 'idr')}</span>,
    },
    {
      header: 'Kredit (IDR)',
      accessorKey: 'credit',
      sortable: true,
      alignment: 'right',
      cell: (item) => <span className="font-semibold text-rose-700">{formatCurrency(item.credit, 'idr')}</span>,
    },
    {
      header: 'Debit (USD)',
      accessorKey: 'debit_usd',
      sortable: true,
      alignment: 'right',
      cell: (item) => <span className="font-semibold text-emerald-700">{formatCurrency(item.debit_usd, 'usd')}</span>,
    },
    {
      header: 'Kredit (USD)',
      accessorKey: 'credit_usd',
      sortable: true,
      alignment: 'right',
      cell: (item) => <span className="font-semibold text-rose-700">{formatCurrency(item.credit_usd, 'usd')}</span>,
    },
    {
      header: 'Saldo Akhir (IDR)',
      accessorKey: 'ending_balance',
      sortable: true,
      alignment: 'right',
      cell: (item) => formatCurrency(item.ending_balance, 'idr'),
    },
    {
      header: 'Total (IDR)',
      accessorKey: 'total',
      sortable: true,
      alignment: 'right',
      cell: (item) => <span className="font-bold text-slate-900">{formatCurrency(item.total, 'idr')}</span>,
    },
  ], []);

  const footer = (
    <TableRow className="border-t border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">
      <TableCell colSpan={5} className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
        Total Halaman
      </TableCell>
      {[
        { value: totals.openingBalance, currency: 'idr' as const },
        { value: totals.debit, currency: 'idr' as const },
        { value: totals.credit, currency: 'idr' as const },
        { value: totals.debitUsd, currency: 'usd' as const },
        { value: totals.creditUsd, currency: 'usd' as const },
        { value: totals.endingBalance, currency: 'idr' as const },
        { value: totals.total, currency: 'idr' as const },
      ].map(({ value, currency }, index) => (
        <TableCell key={index} className="px-4 py-4 text-right text-sm font-bold tabular-nums text-slate-900">
          {formatCurrency(value, currency)}
        </TableCell>
      ))}
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
    />
  );
}
