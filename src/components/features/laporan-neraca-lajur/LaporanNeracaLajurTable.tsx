import { useMemo } from 'react';
import { useRouter } from 'next/router';

import type { BalanceColumnReportItem } from '@/@types/balance-column-report.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
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
  currency: 'idr' | 'usd' = 'idr',
) => currenciesFormat(currency, Number(value) || 0);

const getRowData = (item: BalanceColumnReportItem) => {
  const kodeAkun = item.kode_akun || item.account_code || '-';
  const namaAkun = item.nama_akun || item.account_name || '-';
  const posAkun = (item.pos_akun || item.pos_code || '').toUpperCase();
  const saldoNormal = (item.saldo_normal || item.normal_balance || '-').toUpperCase();
  const saldoAkun = Number(item.saldo_akun ?? item.amount ?? 0);

  const pergerakanDebit = Number(item.pergerakan?.debit ?? item.debit ?? 0);
  const pergerakanKredit = Number(item.pergerakan?.kredit ?? item.pergerakan?.credit ?? item.credit ?? 0);

  const saldoAkhirDebit = Number(
    item.saldo_akhir?.debit ??
    (saldoNormal === 'DB' ? (item.ending_balance ?? 0) : 0),
  );
  const saldoAkhirKredit = Number(
    item.saldo_akhir?.kredit ?? item.saldo_akhir?.credit ??
    (saldoNormal === 'KR' ? (item.ending_balance ?? 0) : 0),
  );

  const labaRugiDebit = Number(
    item.laba_rugi?.debit !== undefined
      ? item.laba_rugi.debit
      : (posAkun === 'LR' ? saldoAkhirDebit : 0),
  );
  const labaRugiKredit = Number(
    (item.laba_rugi?.kredit ?? item.laba_rugi?.credit) !== undefined
      ? (item.laba_rugi?.kredit ?? item.laba_rugi?.credit)
      : (posAkun === 'LR' ? saldoAkhirKredit : 0),
  );

  const neracaDebit = Number(
    item.neraca?.debit !== undefined
      ? item.neraca.debit
      : (posAkun === 'NRC' ? saldoAkhirDebit : 0),
  );
  const neracaKredit = Number(
    (item.neraca?.kredit ?? item.neraca?.credit) !== undefined
      ? (item.neraca?.kredit ?? item.neraca?.credit)
      : (posAkun === 'NRC' ? saldoAkhirKredit : 0),
  );

  return {
    kodeAkun,
    namaAkun,
    posAkun,
    saldoNormal,
    saldoAkun,
    pergerakanDebit,
    pergerakanKredit,
    saldoAkhirDebit,
    saldoAkhirKredit,
    labaRugiDebit,
    labaRugiKredit,
    neracaDebit,
    neracaKredit,
  };
};

export function LaporanNeracaLajurTable({
  data,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
}: LaporanNeracaLajurTableProps) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const totals = useMemo(() => data.reduce(
    (result, item) => {
      const row = getRowData(item);
      result.saldoAkun += row.saldoAkun;
      result.pergerakanDebit += row.pergerakanDebit;
      result.pergerakanKredit += row.pergerakanKredit;
      result.saldoAkhirDebit += row.saldoAkhirDebit;
      result.saldoAkhirKredit += row.saldoAkhirKredit;
      result.labaRugiDebit += row.labaRugiDebit;
      result.labaRugiKredit += row.labaRugiKredit;
      result.neracaDebit += row.neracaDebit;
      result.neracaKredit += row.neracaKredit;
      return result;
    },
    {
      saldoAkun: 0,
      pergerakanDebit: 0,
      pergerakanKredit: 0,
      saldoAkhirDebit: 0,
      saldoAkhirKredit: 0,
      labaRugiDebit: 0,
      labaRugiKredit: 0,
      neracaDebit: 0,
      neracaKredit: 0,
    },
  ), [data]);

  const columns = useMemo<ColumnDef<BalanceColumnReportItem>[]>(() => [
    {
      header: 'Kode Akun',
      id: 'account_code',
      accessorKey: 'kode_akun',
      sortable: true,
      rowSpan: 2,
      alignment: 'left',
      cell: (item) => <CopyBox text={item.kode_akun || item.account_code || '-'} />,
    },
    {
      header: 'Nama Akun',
      id: 'account_name',
      accessorKey: 'nama_akun',
      sortable: true,
      rowSpan: 2,
      alignment: 'left',
      cell: (item) => {
        const name = item.nama_akun || item.account_name;
        if (!name) return '-';
        const searchParam = item.kode_akun || item.account_code || name;
        const href = slug
          ? `/dashboard/${slug}/master/account?search=${encodeURIComponent(searchParam)}`
          : `/master/account?search=${encodeURIComponent(searchParam)}`;

        return (
          <ReferenceLink target="_blank" href={href}>
            {name}
          </ReferenceLink>
        );
      },
    },
    {
      header: 'Pos Akun',
      id: 'pos_code',
      accessorKey: 'pos_akun',
      sortable: true,
      rowSpan: 2,
      alignment: 'center',
      cell: (item) => {
        const pos = (item.pos_akun || item.pos_code || '').toUpperCase();
        return (
          <Badge
            variant={pos === 'NRC' ? 'default' : 'secondary'}
            className="text-[11px] font-semibold"
          >
            {pos || '-'}
          </Badge>
        );
      },
    },
    {
      header: 'Saldo Normal',
      id: 'type',
      accessorKey: 'saldo_normal',
      sortable: true,
      rowSpan: 2,
      alignment: 'center',
      cell: (item) => {
        const sn = item.saldo_normal || item.normal_balance || '-';
        return <Badge variant="outline" className="font-bold">{sn}</Badge>;
      },
    },
    {
      header: 'Saldo Akun',
      id: 'amount',
      accessorKey: 'saldo_akun',
      sortable: true,
      rowSpan: 2,
      alignment: 'right',
      cell: (item) => formatCurrency(item.saldo_akun ?? item.amount, 'idr'),
    },

    // Pergerakan (Debit, Kredit)
    {
      header: 'Debit',
      id: 'pergerakan_debit',
      group: 'Pergerakan',
      accessorKey: 'pergerakan.debit',
      alignment: 'right',
      cell: (item) => {
        const row = getRowData(item);
        return (
          <span className="font-semibold text-emerald-700">
            {formatCurrency(row.pergerakanDebit, 'idr')}
          </span>
        );
      },
    },
    {
      header: 'Kredit',
      id: 'pergerakan_kredit',
      group: 'Pergerakan',
      accessorKey: 'pergerakan.kredit',
      alignment: 'right',
      cell: (item) => {
        const row = getRowData(item);
        return (
          <span className="font-semibold text-rose-700">
            {formatCurrency(row.pergerakanKredit, 'idr')}
          </span>
        );
      },
    },

    // Saldo Akhir (Debit, Kredit)
    {
      header: 'Debit',
      id: 'saldo_akhir_debit',
      group: 'Saldo Akhir',
      accessorKey: 'saldo_akhir.debit',
      alignment: 'right',
      cell: (item) => {
        const row = getRowData(item);
        return (
          <span className="font-semibold text-slate-900">
            {formatCurrency(row.saldoAkhirDebit, 'idr')}
          </span>
        );
      },
    },
    {
      header: 'Kredit',
      id: 'saldo_akhir_kredit',
      group: 'Saldo Akhir',
      accessorKey: 'saldo_akhir.kredit',
      alignment: 'right',
      cell: (item) => {
        const row = getRowData(item);
        return (
          <span className="font-semibold text-slate-900">
            {formatCurrency(row.saldoAkhirKredit, 'idr')}
          </span>
        );
      },
    },

    // Laba Rugi (Debit, Kredit)
    {
      header: 'Debit',
      id: 'laba_rugi_debit',
      group: 'Laba Rugi',
      accessorKey: 'laba_rugi.debit',
      alignment: 'right',
      cell: (item) => {
        const row = getRowData(item);
        return (
          <span className="font-semibold text-purple-700">
            {formatCurrency(row.labaRugiDebit, 'idr')}
          </span>
        );
      },
    },
    {
      header: 'Kredit',
      id: 'laba_rugi_kredit',
      group: 'Laba Rugi',
      accessorKey: 'laba_rugi.kredit',
      alignment: 'right',
      cell: (item) => {
        const row = getRowData(item);
        return (
          <span className="font-semibold text-purple-700">
            {formatCurrency(row.labaRugiKredit, 'idr')}
          </span>
        );
      },
    },

    // Neraca (Debit, Kredit)
    {
      header: 'Debit',
      id: 'neraca_debit',
      group: 'Neraca',
      accessorKey: 'neraca.debit',
      alignment: 'right',
      cell: (item) => {
        const row = getRowData(item);
        return (
          <span className="font-semibold text-indigo-700">
            {formatCurrency(row.neracaDebit, 'idr')}
          </span>
        );
      },
    },
    {
      header: 'Kredit',
      id: 'neraca_kredit',
      group: 'Neraca',
      accessorKey: 'neraca.kredit',
      alignment: 'right',
      cell: (item) => {
        const row = getRowData(item);
        return (
          <span className="font-semibold text-indigo-700">
            {formatCurrency(row.neracaKredit, 'idr')}
          </span>
        );
      },
    },
  ], [slug]);

  const footer = (
    <TableRow className="border-t border-slate-200 bg-slate-50/80 hover:bg-slate-50/80 font-bold">
      <TableCell colSpan={4} className="px-4 py-3 text-right text-xs font-semibold text-slate-900 border-r border-slate-200">
        Total Halaman
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-xs font-bold tabular-nums text-slate-900 border-r border-slate-200">
        {formatCurrency(totals.saldoAkun, 'idr')}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-xs font-bold tabular-nums text-emerald-800 border-r border-slate-200">
        {formatCurrency(totals.pergerakanDebit, 'idr')}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-xs font-bold tabular-nums text-rose-800 border-r border-slate-200">
        {formatCurrency(totals.pergerakanKredit, 'idr')}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-xs font-bold tabular-nums text-slate-900 border-r border-slate-200">
        {formatCurrency(totals.saldoAkhirDebit, 'idr')}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-xs font-bold tabular-nums text-slate-900 border-r border-slate-200">
        {formatCurrency(totals.saldoAkhirKredit, 'idr')}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-xs font-bold tabular-nums text-purple-800 border-r border-slate-200">
        {formatCurrency(totals.labaRugiDebit, 'idr')}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-xs font-bold tabular-nums text-purple-800 border-r border-slate-200">
        {formatCurrency(totals.labaRugiKredit, 'idr')}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-xs font-bold tabular-nums text-indigo-800 border-r border-slate-200">
        {formatCurrency(totals.neracaDebit, 'idr')}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-xs font-bold tabular-nums text-indigo-800">
        {formatCurrency(totals.neracaKredit, 'idr')}
      </TableCell>
    </TableRow>
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={loading}
      bordered
      dense
      striped
      footer={footer}
      sortBy={sortBy}
      sortDirection={sortOrder}
      onSortChange={onSortChange}
    />
  );
}
