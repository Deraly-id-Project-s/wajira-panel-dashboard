import React, { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDateUI } from '@/lib/utils/date';
import type { WithholdingTaxItem } from '@/types/withholding-tax.types';
import { CopyBox } from '@/components/ui/copy-box';
import { TextTruncate } from '@/components/ui/text-truncate';

interface LaporanBuktiPotongTableProps {
  data: WithholdingTaxItem[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  isLoading?: boolean;
  page?: number;
  perPage?: number;
  total?: number;
  lastPage?: number;
  onPageChange?: (page: number) => void;
}

export function LaporanBuktiPotongTable({
  data,
  onSort,
  sortKey,
  sortOrder,
  isLoading = false,
  page = 1,
  perPage = 25,
  total,
  lastPage,
  onPageChange,
}: LaporanBuktiPotongTableProps) {
  const columns = useMemo<ColumnDef<WithholdingTaxItem>[]>(
    () => [
      {
        header: 'No',
        alignment: 'left',
        className: 'w-[60px]',
        cell: (_, index) => (page - 1) * perPage + index + 1,
      },
      {
        header: 'No Bukti Potong',
        accessorKey: 'withholding_number',
        alignment: 'left',
        sortable: true,
        cell: (item) => <CopyBox text={item.withholding_number || '-'} />,
      },
      {
        header: 'No Invoice',
        accessorKey: 'no_invoice',
        alignment: 'left',
        sortable: true,
        cell: (item) => <CopyBox text={item.no_invoice || '-'} />,
      },
      {
        header: 'Sumber',
        alignment: 'left',
        cell: (item) => (
          <span className={`${item.source === 'internal' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} rounded-md px-2 py-1 text-gray-700`}>
            {item.source === 'internal' ? 'internal' : 'Client / Supplier'}
          </span>
        ),
      },
      {
        header: 'Cash',
        alignment: 'left',
        cell: (item) =>
          item.cash ? (
            <div className="flex flex-col">
              <span className="text-xs text-slate-500">{item.cash.cash_name || item.cash.description || '-'}</span>
            </div>
          ) : (
            '-'
          ),
      },
      {
        header: 'Nilai PPh',
        alignment: 'left',
        accessorKey: 'pph_amount',
        sortable: true,
        className: 'font-semibold text-slate-900',
        cell: (item) => (item.pph_amount != null ? currenciesFormat('idr', item.pph_amount) : '-'),
      },
      {
        header: 'Nominal Bayar',
        alignment: 'left',
        cell: (item) => (item.payment_amount != null ? currenciesFormat('idr', item.payment_amount) : '-'),
      },
      {
        header: 'Tgl Bayar',
        alignment: 'left',
        cell: (item) => (item.payment_date ? formatDateUI(item.payment_date) : '-'),
      },
      {
        header: 'Keterangan',
        alignment: 'left',

        cell: (item) => <TextTruncate text={item.pph_description || '-'} maxLength={10} />,
      },
      {
        header: 'Umur BP (Masa)',
        alignment: 'left',
        cell: (item) => (item.withholding_age != null ? item.withholding_age + ' Bulan' : '-'),
      },
      {
        header: 'Tanggal Dibuat',
        accessorKey: 'created_at',
        sortable: true,
        alignment: 'left',
        cell: (item) => (item.created_at ? formatDateUI(item.created_at) : '-'),
      },
    ],
    [page, perPage]
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      sortBy={sortKey}
      sortDirection={sortOrder}
      onSortChange={(key) => onSort?.(key)}
      meta={{
        currentPage: page,
        perPage,
        lastPage: lastPage ?? 1,
        total: total ?? data.length,
      }}
      onPageChange={onPageChange}
    />
  );
}
