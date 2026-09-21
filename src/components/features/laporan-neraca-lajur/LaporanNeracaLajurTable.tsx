import { useMemo } from 'react';

import type { BalanceColumnReportItem } from '@/@types/balance-column-report.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { TableCell, TableRow, TableHead } from '@/components/ui/table';

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

// Helper for splitting balance to Debit/Credit
const calculateDebetKredit = (item: BalanceColumnReportItem) => {
  const normal = item.normal_balance?.toLowerCase() === 'debit';
  const lr = /^[456789]/.test(String(item.account_code || ''));
  const nrc = /^[123]/.test(String(item.account_code || ''));

  const opening = Number(item.opening_balance) || 0;
  const openingDebit = normal ? (opening > 0 ? opening : 0) : (opening < 0 ? Math.abs(opening) : 0);
  const openingCredit = !normal ? (opening > 0 ? opening : 0) : (opening < 0 ? Math.abs(opening) : 0);

  const mutasiDebit = Number(item.debit) || 0;
  const mutasiCredit = Number(item.credit) || 0;

  const ending = Number(item.ending_balance) || 0;
  const endingDebit = normal ? (ending > 0 ? ending : 0) : (ending < 0 ? Math.abs(ending) : 0);
  const endingCredit = !normal ? (ending > 0 ? ending : 0) : (ending < 0 ? Math.abs(ending) : 0);

  const labaRugiDebit = lr ? endingDebit : 0;
  const labaRugiCredit = lr ? endingCredit : 0;

  const neracaDebit = nrc ? endingDebit : 0;
  const neracaCredit = nrc ? endingCredit : 0;

  return {
    openingDebit, openingCredit,
    mutasiDebit, mutasiCredit,
    endingDebit, endingCredit,
    labaRugiDebit, labaRugiCredit,
    neracaDebit, neracaCredit
  };
};

export function LaporanNeracaLajurTable({
  data,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
}: LaporanNeracaLajurTableProps) {
  const totals = useMemo(() => data.reduce(
    (result, item) => {
      const calc = calculateDebetKredit(item);
      result.openingDebit += calc.openingDebit;
      result.openingCredit += calc.openingCredit;
      result.mutasiDebit += calc.mutasiDebit;
      result.mutasiCredit += calc.mutasiCredit;
      result.endingDebit += calc.endingDebit;
      result.endingCredit += calc.endingCredit;
      result.labaRugiDebit += calc.labaRugiDebit;
      result.labaRugiCredit += calc.labaRugiCredit;
      result.neracaDebit += calc.neracaDebit;
      result.neracaCredit += calc.neracaCredit;

      return result;
    },
    { 
      openingDebit: 0, openingCredit: 0,
      mutasiDebit: 0, mutasiCredit: 0,
      endingDebit: 0, endingCredit: 0,
      labaRugiDebit: 0, labaRugiCredit: 0,
      neracaDebit: 0, neracaCredit: 0 
    },
  ), [data]);

  const headerGroups = (
    <TableRow className="border-b border-gray-200 bg-[#f8f9fa] hover:bg-[#f8f9fa]">
      <TableHead colSpan={5} className="border-r border-slate-200" />
      <TableHead colSpan={2} className="text-center font-bold text-slate-700 border-r border-slate-200 bg-emerald-50/50">SALDO AWAL</TableHead>
      <TableHead colSpan={2} className="text-center font-bold text-slate-700 border-r border-slate-200 bg-blue-50/50">PERGERAKAN</TableHead>
      <TableHead colSpan={2} className="text-center font-bold text-slate-700 border-r border-slate-200 bg-emerald-50/50">SALDO AKHIR</TableHead>
      <TableHead colSpan={2} className="text-center font-bold text-slate-700 border-r border-slate-200 bg-amber-50/50">LABA RUGI</TableHead>
      <TableHead colSpan={2} className="text-center font-bold text-slate-700 border-slate-200 bg-indigo-50/50">NERACA</TableHead>
    </TableRow>
  );

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
      header: 'Debet',
      accessorKey: 'opening_debit',
      headerClassName: 'bg-emerald-50/50',
      alignment: 'right',
      cell: (item) => <span className="font-medium text-slate-700">{formatCurrency(calculateDebetKredit(item).openingDebit, 'idr')}</span>,
    },
    {
      header: 'Kredit',
      accessorKey: 'opening_credit',
      headerClassName: 'border-r border-slate-200 bg-emerald-50/50',
      className: 'border-r border-slate-200',
      alignment: 'right',
      cell: (item) => <span className="font-medium text-slate-700">{formatCurrency(calculateDebetKredit(item).openingCredit, 'idr')}</span>,
    },
    {
      header: 'Debet',
      accessorKey: 'mutasi_debit',
      headerClassName: 'bg-blue-50/50',
      alignment: 'right',
      cell: (item) => <span className="font-medium text-emerald-700">{formatCurrency(calculateDebetKredit(item).mutasiDebit, 'idr')}</span>,
    },
    {
      header: 'Kredit',
      accessorKey: 'mutasi_credit',
      headerClassName: 'border-r border-slate-200 bg-blue-50/50',
      className: 'border-r border-slate-200',
      alignment: 'right',
      cell: (item) => <span className="font-medium text-rose-700">{formatCurrency(calculateDebetKredit(item).mutasiCredit, 'idr')}</span>,
    },
    {
      header: 'Debet',
      accessorKey: 'ending_debit',
      headerClassName: 'bg-emerald-50/50',
      alignment: 'right',
      cell: (item) => <span className="font-semibold text-slate-900">{formatCurrency(calculateDebetKredit(item).endingDebit, 'idr')}</span>,
    },
    {
      header: 'Kredit',
      accessorKey: 'ending_credit',
      headerClassName: 'border-r border-slate-200 bg-emerald-50/50',
      className: 'border-r border-slate-200',
      alignment: 'right',
      cell: (item) => <span className="font-semibold text-slate-900">{formatCurrency(calculateDebetKredit(item).endingCredit, 'idr')}</span>,
    },
    {
      header: 'Debet',
      accessorKey: 'laba_rugi_debit',
      headerClassName: 'bg-amber-50/50',
      alignment: 'right',
      cell: (item) => <span className="font-medium text-amber-900">{formatCurrency(calculateDebetKredit(item).labaRugiDebit, 'idr')}</span>,
    },
    {
      header: 'Kredit',
      accessorKey: 'laba_rugi_credit',
      headerClassName: 'border-r border-slate-200 bg-amber-50/50',
      className: 'border-r border-slate-200',
      alignment: 'right',
      cell: (item) => <span className="font-medium text-amber-900">{formatCurrency(calculateDebetKredit(item).labaRugiCredit, 'idr')}</span>,
    },
    {
      header: 'Debet',
      accessorKey: 'neraca_debit',
      headerClassName: 'bg-indigo-50/50',
      alignment: 'right',
      cell: (item) => <span className="font-medium text-indigo-900">{formatCurrency(calculateDebetKredit(item).neracaDebit, 'idr')}</span>,
    },
    {
      header: 'Kredit',
      accessorKey: 'neraca_credit',
      headerClassName: 'bg-indigo-50/50',
      alignment: 'right',
      cell: (item) => <span className="font-medium text-indigo-900">{formatCurrency(calculateDebetKredit(item).neracaCredit, 'idr')}</span>,
    },
  ], []);

  const footer = (
    <TableRow className="border-t border-slate-200 bg-slate-100 hover:bg-slate-100">
      <TableCell colSpan={5} className="px-4 py-4 text-right text-sm font-bold text-slate-900 uppercase tracking-wide">
        Total Halaman
      </TableCell>
      {[
        { value: totals.openingDebit, className: '' },
        { value: totals.openingCredit, className: 'border-r border-slate-200' },
        { value: totals.mutasiDebit, className: 'text-emerald-700' },
        { value: totals.mutasiCredit, className: 'border-r border-slate-200 text-rose-700' },
        { value: totals.endingDebit, className: '' },
        { value: totals.endingCredit, className: 'border-r border-slate-200' },
        { value: totals.labaRugiDebit, className: 'text-amber-900' },
        { value: totals.labaRugiCredit, className: 'border-r border-slate-200 text-amber-900' },
        { value: totals.neracaDebit, className: 'text-indigo-900' },
        { value: totals.neracaCredit, className: 'text-indigo-900' },
      ].map(({ value, className }, index) => (
        <TableCell key={index} className={`px-4 py-4 text-right text-sm font-bold tabular-nums ${className}`}>
          {formatCurrency(value, 'idr')}
        </TableCell>
      ))}
    </TableRow>
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={loading}
      headerGroups={headerGroups}
      footer={footer}
      sortBy={sortBy}
      sortDirection={sortOrder}
      onSortChange={onSortChange}
    />
  );
}
