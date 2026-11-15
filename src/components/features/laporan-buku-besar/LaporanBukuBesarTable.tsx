import { useMemo } from 'react';
import { useRouter } from 'next/router';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { TableCell, TableRow } from '@/components/ui/table';
import { CopyBox } from '@/components/ui/copy-box';
import { TextTruncate } from '@/components/ui/text-truncate';
import { ReferenceLink } from '@/components/ui/reference-link';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDate } from '@/components/ui/format-date';
import type { LedgerReportItem } from '@/@types/ledger-report.types';

interface LaporanBukuBesarTableProps {
  data: LedgerReportItem[];
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
  totalDebit?: number | null;
  totalCredit?: number | null;
}

export function LaporanBukuBesarTable({
  data,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
  meta,
  onPageChange,
  totalDebit,
  totalCredit,
}: LaporanBukuBesarTableProps) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

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

  const displayTotalDebit = totalDebit ?? totals.debit;
  const displayTotalCredit = totalCredit ?? totals.credit;

  const columns = useMemo<ColumnDef<LedgerReportItem>[]>(
    () => [
      {
        header: 'Tanggal',
        accessorKey: 'payment_at',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.payment_at),
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
          const name = item.account?.name;
          if (!name) return '-';

          const type = item.account?.type === 'credit' ? 'KREDIT' : 'DEBIT';
          const label = type ? `[${type}] ${name}` : name;
          const searchParam = item.account?.code || name;
          const href = slug
            ? `/dashboard/${slug}/master/account?search=${encodeURIComponent(searchParam)}`
            : `/master/account?search=${encodeURIComponent(searchParam)}`;

          return (
            <ReferenceLink target="_blank" href={href}>
              {label}
            </ReferenceLink>
          );
        },
      },
      {
        header: 'Kode Transaksi',
        accessorKey: 'cash_flow.code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.cash_flow?.code || '-'} />,
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
    ],
    [slug],
  );

  const footer = (
    <TableRow className="group border-t border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">
      <TableCell colSpan={6} className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
        Grand Total
      </TableCell>
      <TableCell className="px-4 py-4 text-right text-sm font-bold text-slate-900">
        {currenciesFormat('idr', displayTotalDebit)}
      </TableCell>
      <TableCell className="px-4 py-4 text-right text-sm font-bold text-slate-900">
        {currenciesFormat('idr', displayTotalCredit)}
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
