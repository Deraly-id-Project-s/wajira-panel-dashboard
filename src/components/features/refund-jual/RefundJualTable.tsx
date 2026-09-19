import React, { useMemo, useState } from 'react';
import type { RefundJual, RefundJualPagination } from '@/@types/refund-jual.types';
import { Button } from '@/components/ui/button';
import type { SortOrder } from '@/hooks/useTableSort';
import { MoreVertical } from 'lucide-react';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import FinanceRefundApprovalModal from '../refund-beli/FinanceRefundApprovalModal';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';

interface Props {
  data: RefundJual[];
  pagination: RefundJualPagination;
  sortKey: string | undefined;
  sortOrder: SortOrder;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSort: (key: keyof RefundJual) => void;
  onPageChange: (page: number) => void;
}

const formatDate = (value: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('id-ID');
};

export default function RefundJualTable({
  data,
  pagination,
  sortKey,
  sortOrder,
  isLoading,
  isFetching,
  error,
  onRetry,
  onSort,
  onPageChange,
}: Props) {
  const [selectedRefundId, setSelectedRefundId] = useState<number | null>(null);
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const columns = useMemo<ColumnDef<RefundJual>[]>(
    () => [
      {
        header: 'No Penjualan',
        accessorKey: 'noPenjualan',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item?.noPenjualan ?? '-'} />
      },
      {
        header: 'Tanggal',
        accessorKey: 'tanggal',
        sortable: true,
        alignment: 'left',
        cell: (item) => formatDate(item.tanggal),
      },
      {
        header: 'Nama Customer',
        accessorKey: 'namaCustomer',
        sortable: true,
        alignment: 'left',
        cell: (item) => item?.namaCustomer ? <ReferenceLink href={`/dashboard/${slugStr}/master/customer?search=${item?.namaCustomer}`}>{item?.namaCustomer}</ReferenceLink> : '-'
      },
      {
        header: 'Total Penjualan',
        accessorKey: 'totalPenjualan',
        sortable: true,
        alignment: 'right',
        cell: (item) => currenciesFormat('idr', item.totalPenjualan),
      },
      {
        header: 'Total Refund',
        accessorKey: 'totalRefund',
        sortable: true,
        alignment: 'right',
        cell: (item) => (
          <span className="font-medium text-red-600">
            {currenciesFormat('idr', item.totalRefund)}
          </span>
        ),
      },
      {
        header: 'Kas Keluar',
        accessorKey: 'kasKeluar',
        sortable: true,
        alignment: 'left',
      },
      {
        header: 'Keterangan',
        accessorKey: 'keterangan',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <span className="text-gray-500">{item.keterangan || '-'}</span>
        ),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onClick={() => setSelectedRefundId(item.id)}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                Approval
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [slugStr]
  );

  return (
    <div className="space-y-4">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
          {onRetry ? (
            <Button type="button" variant="outline" onClick={onRetry} className="mt-3">
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      <BaseTable
        data={data}
        columns={columns}
        loading={isLoading}
        sortBy={sortKey}
        sortDirection={sortOrder === 'asc' ? 'asc' : 'desc'}
        onSortChange={onSort ? (key) => onSort(key as keyof RefundJual) : undefined}
        meta={{
          currentPage: pagination.currentPage,
          perPage: pagination.perPage,
          lastPage: pagination.lastPage,
          total: pagination.total,
        }}
        onPageChange={onPageChange}
      />

      {selectedRefundId !== null && (
        <FinanceRefundApprovalModal
          open={true}
          onClose={() => setSelectedRefundId(null)}
          refundId={selectedRefundId}
          onSuccess={() => {
            setSelectedRefundId(null);
            if (onRetry) onRetry();
          }}
        />
      )}
    </div>
  );
}
