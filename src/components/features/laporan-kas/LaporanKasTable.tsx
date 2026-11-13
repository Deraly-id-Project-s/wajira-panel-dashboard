import React, { useMemo } from 'react';
import type { CashFlowReportItem } from '@/@types/cash-flow-report.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { TableRow, TableCell } from '@/components/ui/table';
import { TextTruncate } from '@/components/ui/text-truncate';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDate } from '@/components/ui/format-date';

export interface LaporanKasTableProps {
  data: CashFlowReportItem[];
  totalDebitCashIdr?: number;
  totalKreditCashIdr?: number;
  totalDebitBankIdr?: number;
  totalKreditBankIdr?: number;
  totalDebitBankUsd?: number;
  totalKreditBankUsd?: number;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  isLoading?: boolean;
}

export function LaporanKasTable({
  data,
  totalDebitCashIdr,
  totalKreditCashIdr,
  totalDebitBankIdr,
  totalKreditBankIdr,
  totalDebitBankUsd,
  totalKreditBankUsd,
  onSort,
  sortKey,
  sortOrder,
  isLoading = false,
}: LaporanKasTableProps) {
  const totals = useMemo(() => {
    return {
      debitCashIdr:
        totalDebitCashIdr !== undefined
          ? totalDebitCashIdr
          : data.reduce((sum, item) => sum + (Number(item.debit_cash_idr ?? item['DEBIT (CASH IDR)']) || 0), 0),
      kreditCashIdr:
        totalKreditCashIdr !== undefined
          ? totalKreditCashIdr
          : data.reduce((sum, item) => sum + (Number(item.kredit_cash_idr ?? item['KREDIT (CASH IDR)']) || 0), 0),
      debitBankIdr:
        totalDebitBankIdr !== undefined
          ? totalDebitBankIdr
          : data.reduce((sum, item) => sum + (Number(item.debit_bank_idr ?? item['DEBIT (BANK IDR)']) || 0), 0),
      kreditBankIdr:
        totalKreditBankIdr !== undefined
          ? totalKreditBankIdr
          : data.reduce((sum, item) => sum + (Number(item.kredit_bank_idr ?? item['KREDIT (BANK IDR)']) || 0), 0),
      debitBankUsd:
        totalDebitBankUsd !== undefined
          ? totalDebitBankUsd
          : data.reduce((sum, item) => sum + (Number(item.debit_bank_usd ?? item['DEBIT (BANK USD)']) || 0), 0),
      kreditBankUsd:
        totalKreditBankUsd !== undefined
          ? totalKreditBankUsd
          : data.reduce((sum, item) => sum + (Number(item.kredit_bank_usd ?? item['KREDIT (BANK USD)']) || 0), 0),
    };
  }, [
    data,
    totalDebitCashIdr,
    totalKreditCashIdr,
    totalDebitBankIdr,
    totalKreditBankIdr,
    totalDebitBankUsd,
    totalKreditBankUsd,
  ]);

  const columns = useMemo<ColumnDef<CashFlowReportItem>[]>(
    () => [
      {
        header: 'Tanggal',
        accessorKey: 'tanggal',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.tanggal),
      },
      {
        header: 'Nota / Ref',
        accessorKey: 'nota_ref',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.nota_ref || '-'} />,
      },
      {
        header: 'Keterangan',
        accessorKey: 'keterangan',
        sortable: true,
        alignment: 'left',
        cell: (item) => <TextTruncate text={item.keterangan || '-'} maxLength={30} />,
      },
      {
        header: 'DEBIT (CASH IDR)',
        accessorKey: 'debit_cash_idr',
        sortable: true,
        alignment: 'left',
        cell: (item) => {
          const val = Number(item.debit_cash_idr ?? item['DEBIT (CASH IDR)'] ?? 0);
          return (
            <span className="font-semibold tabular-nums text-emerald-700">
              {val > 0 ? currenciesFormat('idr', val) : '-'}
            </span>
          );
        },
      },
      {
        header: 'KREDIT (CASH IDR)',
        accessorKey: 'kredit_cash_idr',
        sortable: true,
        alignment: 'left',
        cell: (item) => {
          const val = Number(item.kredit_cash_idr ?? item['KREDIT (CASH IDR)'] ?? 0);
          return (
            <span className="font-semibold tabular-nums text-rose-700">
              {val > 0 ? currenciesFormat('idr', val) : '-'}
            </span>
          );
        },
      },
      {
        header: 'DEBIT (BANK IDR)',
        accessorKey: 'debit_bank_idr',
        sortable: true,
        alignment: 'left',
        cell: (item) => {
          const val = Number(item.debit_bank_idr ?? item['DEBIT (BANK IDR)'] ?? 0);
          return (
            <span className="font-semibold tabular-nums text-emerald-700">
              {val > 0 ? currenciesFormat('idr', val) : '-'}
            </span>
          );
        },
      },
      {
        header: 'KREDIT (BANK IDR)',
        accessorKey: 'kredit_bank_idr',
        sortable: true,
        alignment: 'left',
        cell: (item) => {
          const val = Number(item.kredit_bank_idr ?? item['KREDIT (BANK IDR)'] ?? 0);
          return (
            <span className="font-semibold tabular-nums text-rose-700">
              {val > 0 ? currenciesFormat('idr', val) : '-'}
            </span>
          );
        },
      },
      {
        header: 'DEBIT (BANK USD)',
        accessorKey: 'debit_bank_usd',
        sortable: true,
        alignment: 'left',
        cell: (item) => {
          const val = Number(item.debit_bank_usd ?? item['DEBIT (BANK USD)'] ?? 0);
          return (
            <span className="font-semibold tabular-nums text-emerald-700">
              {val > 0 ? currenciesFormat('usd', val) : '-'}
            </span>
          );
        },
      },
      {
        header: 'KREDIT (BANK USD)',
        accessorKey: 'kredit_bank_usd',
        sortable: true,
        alignment: 'left',
        cell: (item) => {
          const val = Number(item.kredit_bank_usd ?? item['KREDIT (BANK USD)'] ?? 0);
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
      <TableRow className="group bg-slate-50/70 hover:bg-slate-50/70 border-t-2 border-slate-300 font-bold">
        <TableCell colSpan={3} className="px-4 py-3 text-right">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-700">Grand Total</span>
        </TableCell>
        <TableCell className="px-4 py-3 text-xs font-bold text-slate-900 text-left tabular-nums">
          {currenciesFormat('idr', totals.debitCashIdr)}
        </TableCell>
        <TableCell className="px-4 py-3 text-xs font-bold text-slate-900 text-left tabular-nums">
          {currenciesFormat('idr', totals.kreditCashIdr)}
        </TableCell>
        <TableCell className="px-4 py-3 text-xs font-bold text-slate-900 text-left tabular-nums">
          {currenciesFormat('idr', totals.debitBankIdr)}
        </TableCell>
        <TableCell className="px-4 py-3 text-xs font-bold text-slate-900 text-left tabular-nums">
          {currenciesFormat('idr', totals.kreditBankIdr)}
        </TableCell>
        <TableCell className="px-4 py-3 text-xs font-bold text-slate-900 text-left tabular-nums">
          {currenciesFormat('usd', totals.debitBankUsd)}
        </TableCell>
        <TableCell className="px-4 py-3 text-xs font-bold text-slate-900 text-left tabular-nums">
          {currenciesFormat('usd', totals.kreditBankUsd)}
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
      onSortChange={onSort ? (key, direction) => onSort(key, direction) : undefined}
      loading={isLoading}
    />
  );
}
