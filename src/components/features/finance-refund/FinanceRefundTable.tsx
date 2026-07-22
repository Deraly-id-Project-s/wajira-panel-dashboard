import { useMemo, useState } from 'react';
import { ColumnDef, SortingState, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2, Search } from 'lucide-react';
import type { FinanceRefundRecord, RefundTransactionType } from '@/@types/finance-refund.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import FinanceRefundApprovalModal from '@/components/features/finance-refund/FinanceRefundApprovalModal';
import { RefundStatusBadge } from '@/components/features/refund/RefundStatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { TextTruncate } from '@/components/ui/text-truncate';

interface FinanceRefundTableProps {
  data: FinanceRefundRecord[];
  meta?: PaginationMeta & { from?: number; to?: number };
  page: number;
  isLoading?: boolean;
  transactionType: RefundTransactionType;
  onPageChange: (page: number) => void;
}

const formatDate = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

const getColumnAlignment = (columnId: string): 'left' | 'center' => {
  if (['refundDate', 'totalTransaction', 'refundAmount', 'status', 'actions'].includes(columnId)) {
    return 'center';
  }
  return 'left';
};

export default function FinanceRefundTable({ data, meta, page, isLoading = false, transactionType, onPageChange }: FinanceRefundTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'refundDate', desc: true }]);
  const [selectedRefund, setSelectedRefund] = useState<FinanceRefundRecord | null>(null);
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  console.log(data);

  const columns = useMemo<ColumnDef<FinanceRefundRecord>[]>(
    () => {
      const baseColumns: ColumnDef<FinanceRefundRecord>[] = [
        {
          accessorKey: 'refundCode',
          header: 'KODE REFUND',
          cell: ({ row }) => <CopyBox text={row.original.refundCode} />,
        },
        {
          accessorKey: 'transactionCode',
          header: transactionType === 'sales' ? 'NO PENJUALAN' : 'NO PEMBELIAN',
          cell: ({ row }) => (
            <ReferenceLink
              href={`/dashboard/${slugStr}/transaksi/pembelian-unit/${row?.original?.transactionId}`}
            >
              {row?.original?.transactionCode}
            </ReferenceLink>
          )
        },
        {
          accessorKey: 'partnerName',
          header: transactionType === 'sales' ? 'NAMA CUSTOMER' : 'NAMA SUPPLIER',
          cell: ({ row }) => <ReferenceLink href={`/dashboard/${slugStr}/master/supplier?search=${row?.original?.partnerName}`}>{row?.original?.partnerName}</ReferenceLink>,
        },
        {
          accessorKey: 'refundDate',
          header: 'TANGGAL',
          cell: ({ row }) => <span className="text-slate-800 font-normal">{formatDate(row.original.refundDate)}</span>,
        },
        {
          accessorKey: 'totalTransaction',
          header: transactionType === 'sales' ? 'TOTAL PENJUALAN' : 'TOTAL PEMBELIAN',
          cell: ({ row }) => (
            <span className="text-slate-800 font-normal">
              {currenciesFormat('idr', row.original.totalTransaction ?? 0)}
            </span>
          ),
        },
        {
          accessorKey: 'refundAmount',
          header: 'TOTAL REFUND',
          cell: ({ row }) => <span className="text-slate-800 font-normal">{currenciesFormat('idr', row.original.refundAmount)}</span>,
        },
        {
          accessorKey: 'cashName',
          header: transactionType === 'sales' ? 'KAS KELUAR' : 'KAS MASUK',
          cell: ({ row }) => row?.original?.cashName ? (
            <ReferenceLink href={`/dashboard/${slugStr}/master/kas?search=${row?.original?.cashName}`}>
              {row?.original?.cashName}
            </ReferenceLink >
          ) : <span>-</span>
        },
        {
          accessorKey: 'note',
          header: 'KETERANGAN',
          cell: ({ row }) => <TextTruncate maxLength={20} text={row.original.note || '-'}></TextTruncate>,
        },
      ];

      baseColumns.push(
        {
          accessorKey: 'status',
          header: 'STATUS',
          cell: ({ row }) => <RefundStatusBadge status={row.original.status} />,
        },
        {
          id: 'actions',
          header: 'aksi',
          cell: ({ row }) => (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold px-3 font-sans border-slate-200 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRefund(row.original);
              }}
            >
              Setujui
            </Button>
          ),
        }
      );

      return baseColumns;
    },
    [transactionType],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const total = meta?.total ?? data.length;
  const perPage = meta?.perPage ?? (data.length || 10);
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = total === 0 ? 0 : Math.min(page * perPage, total);

  return (
    <>
      <div className="space-y-4">
        <div className="text-sm overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-none">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-[#f8f9fa] border-b border-gray-200">
                  {headerGroup.headers.map((header) => {
                    const align = getColumnAlignment(header.column.id);
                    const isSortable = header.column.getCanSort();
                    const isSorted = header.column.getIsSorted();
                    const isSortedActive = !!isSorted;
                    const justifyClass = align === 'center' ? 'justify-center w-full' : 'justify-start';
                    const title = flexRender(header.column.columnDef.header, header.getContext());

                    return (
                      <TableHead key={header.id} className={`p-0 text-left bg-[#f8f9fa] border-b border-gray-200 ${header.column.id === 'actions' ? 'sticky right-0 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)] text-center' : ''}`}>
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            className={`flex items-center gap-1 select-none w-full px-4 py-4 text-xs font-semibold uppercase ${isSortable ? 'cursor-pointer group' : 'cursor-default'
                              } ${isSortedActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'} ${justifyClass}`}
                            onClick={header.column.getToggleSortingHandler()}
                            disabled={!isSortable}
                          >
                            <span>{title}</span>
                            {isSortable ? (
                              isSorted === 'asc' ? (
                                <ArrowUp className="h-3 w-3 text-indigo-500 shrink-0" />
                              ) : isSorted === 'desc' ? (
                                <ArrowDown className="h-3 w-3 text-indigo-500 shrink-0" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity duration-150 shrink-0 text-slate-400" />
                              )
                            ) : null}
                          </button>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="group">
                  <TableCell colSpan={columns.length} className="py-16 h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-0 animate-in fade-in duration-500">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                      <span className="text-sm font-medium text-slate-500">Memuat data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="group border-b hover:bg-gray-50/70 border-slate-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedRefund(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const align = getColumnAlignment(cell.column.id);
                      const alignClass = align === 'center' ? 'text-center' : 'text-left';
                      return (
                        <TableCell key={cell.id} className={`py-4 px-4 ${alignClass} ${cell.column.id === 'actions' ? 'sticky right-0 bg-white z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]' : ''}`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow className="group">
                  <TableCell colSpan={100} className="py-16 h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="rounded-full bg-slate-50 p-4 mb-2">
                        <Search className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-base font-semibold text-slate-900">Tidak ada data ditemukan</p>
                      <p className="text-sm text-slate-500">Belum ada data atau coba gunakan kata kunci pencarian lain.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between py-2">
          <div>
            Showing {start}-{end} of {total} data
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="font-semibold text-slate-600">
              Previous
            </Button>
            {getVisiblePageNumbers(meta?.lastPage ?? 1, page).map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={pageNumber === page ? 'outline' : 'ghost'}
                size="sm"
                className="w-9"
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}
            <Button variant="ghost" size="sm" disabled={meta ? page >= meta.lastPage : true} onClick={() => onPageChange(page + 1)} className="font-semibold text-slate-600">
              Next
            </Button>
          </div>
        </div>
      </div>

      {selectedRefund ? (
        <FinanceRefundApprovalModal
          open={Boolean(selectedRefund)}
          onClose={() => setSelectedRefund(null)}
          refund={selectedRefund}
          transactionType={transactionType}
        />
      ) : null}
    </>
  );
}
