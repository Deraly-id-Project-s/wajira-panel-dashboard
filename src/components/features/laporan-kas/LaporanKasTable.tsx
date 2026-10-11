import React, { useMemo } from 'react';
import { CashFlowItem } from '@/services/cashFlow.service';
import { TableRow, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { TextTruncate } from '@/components/ui/text-truncate';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

interface LaporanKasTableProps {
  data: CashFlowItem[];
  totalPemasukan?: number;
  totalPengeluaran?: number;
  totalDebetIdr?: number;
  totalCreditIdr?: number;
  totalDebetUsd?: number;
  totalCreditUsd?: number;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return format(date, 'dd MMMM yyyy', { locale: id });
};

export function LaporanKasTable({
  data,
  totalPemasukan,
  totalPengeluaran,
  totalDebetIdr,
  totalCreditIdr,
  totalDebetUsd,
  totalCreditUsd,
  onSort,
  sortKey,
  sortOrder,
}: LaporanKasTableProps) {
  const totals = useMemo(() => {
    return {
      debitIdr: totalDebetIdr !== undefined ? totalDebetIdr : (totalPemasukan !== undefined ? totalPemasukan : data.reduce((sum, item) => sum + (Number(item.debet_total ?? item.debet) || 0), 0)),
      creditIdr: totalCreditIdr !== undefined ? totalCreditIdr : (totalPengeluaran !== undefined ? totalPengeluaran : data.reduce((sum, item) => sum + (Number(item.kredit_total ?? item.credit_total ?? item.credit) || 0), 0)),
      debitUsd: totalDebetUsd !== undefined ? totalDebetUsd : data.reduce((sum, item) => sum + (Number(item.debet_usd_total ?? item.debet_usd) || 0), 0),
      creditUsd: totalCreditUsd !== undefined ? totalCreditUsd : data.reduce((sum, item) => sum + (Number(item.kredit_usd_total ?? item.credit_usd_total ?? item.credit_usd) || 0), 0),
    };
  }, [data, totalDebetIdr, totalCreditIdr, totalDebetUsd, totalCreditUsd, totalPemasukan, totalPengeluaran]);

  const columns = useMemo<ColumnDef<CashFlowItem>[]>(
    () => [
      {
        header: 'Tanggal',
        accessorKey: 'date',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.date),
      },
      {
        header: 'Nota Reff',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item?.code} />,
      },
      {
        header: 'Keterangan',
        accessorKey: 'note',
        sortable: true,
        alignment: 'left',
        cell: (item) => <TextTruncate text={item.note || '-'} maxLength={20} />,
      },
      {
        header: 'Debit (IDR)',
        accessorKey: 'debet_total',
        sortable: true,
        alignment: 'right',
        cell: (item) => {
          const val = Number(item.debet_total ?? item.debet ?? 0);
          return (
            <span className="font-semibold tabular-nums text-emerald-700">
              {val > 0 ? currenciesFormat('idr', val) : '-'}
            </span>
          );
        },
      },
      {
        header: 'Kredit (IDR)',
        accessorKey: 'credit_total',
        sortable: true,
        alignment: 'right',
        cell: (item) => {
          const val = Number(item.kredit_total ?? item.credit_total ?? item.credit ?? 0);
          return (
            <span className="font-semibold tabular-nums text-rose-700">
              {val > 0 ? currenciesFormat('idr', val) : '-'}
            </span>
          );
        },
      },
      {
        header: 'Debit (USD)',
        accessorKey: 'debet_usd_total',
        sortable: true,
        alignment: 'right',
        cell: (item) => {
          const val = Number(item.debet_usd_total ?? item.debet_usd ?? 0);
          return (
            <span className="font-semibold tabular-nums text-emerald-700">
              {val > 0 ? currenciesFormat('usd', val) : '-'}
            </span>
          );
        },
      },
      {
        header: 'Kredit (USD)',
        accessorKey: 'credit_usd_total',
        sortable: true,
        alignment: 'right',
        cell: (item) => {
          const val = Number(item.kredit_usd_total ?? item.credit_usd_total ?? item.credit_usd ?? 0);
          return (
            <span className="font-semibold tabular-nums text-rose-700">
              {val > 0 ? currenciesFormat('usd', val) : '-'}
            </span>
          );
        },
      },
    ],
    [],
  );

  const footerRow = useMemo(
    () => (
      <TableRow className="group bg-slate-50/50 hover:bg-slate-50/50 border-t border-slate-200">
        <TableCell colSpan={3} className="px-4 py-4 text-right">
          <span className="text-sm font-semibold text-slate-900 pr-12">Grand Total</span>
        </TableCell>
        <TableCell className="px-4 py-4 text-sm font-bold text-slate-900 text-right tabular-nums">
          {currenciesFormat('idr', totals.debitIdr)}
        </TableCell>
        <TableCell className="px-4 py-4 text-sm font-bold text-slate-900 text-right tabular-nums">
          {currenciesFormat('idr', totals.creditIdr)}
        </TableCell>
        <TableCell className="px-4 py-4 text-sm font-bold text-slate-900 text-right tabular-nums">
          {currenciesFormat('usd', totals.debitUsd)}
        </TableCell>
        <TableCell className="px-4 py-4 text-sm font-bold text-slate-900 text-right tabular-nums">
          {currenciesFormat('usd', totals.creditUsd)}
        </TableCell>
      </TableRow>
    ),
    [totals],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      footer={footerRow}
      sortBy={sortKey}
      sortDirection={sortOrder}
      onSortChange={onSort ? (key, direction) => onSort(key) : undefined}
    />
  );
}
