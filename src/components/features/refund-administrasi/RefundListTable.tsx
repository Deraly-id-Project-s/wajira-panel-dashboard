import { useMemo } from 'react';
import { useRouter } from 'next/router';
import type { PaginationMeta } from '@/types/pagination.types';
import type { UnitTransactionRefund } from '@/types/refund.type';
import { RefundStatusBadge } from '@/components/features/refund/RefundStatusBadge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

interface RefundListTableProps {
  data: UnitTransactionRefund[];
  meta?: PaginationMeta;
  isLoading?: boolean;
  slug: string;
  transactionId: string;
  basePath: string;
  page: number;
  onPageChange: (page: number) => void;
}

const formatDate = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

export default function RefundListTable({ data, meta, isLoading = false, slug, transactionId, basePath, page, onPageChange }: RefundListTableProps) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<UnitTransactionRefund>[]>(
    () => [
      {
        header: 'Kode Refund',
        accessorKey: 'code',
        sortable: true,
        cell: (item) => <span className="font-medium text-slate-900">{item.code}</span>,
      },
      {
        header: 'Tanggal Refund',
        accessorKey: 'refund_date',
        sortable: true,
        cell: (item) => <span className="font-medium text-slate-900">{formatDate(item.refund_date)}</span>,
      },
      {
        header: 'Qty Unit',
        accessorKey: 'total_qty',
        sortable: true,
        cell: (item) => <span>{item.total_qty ?? item.items?.length ?? 0}</span>,
      },
      {
        header: 'Nominal Refund',
        accessorKey: 'refund_amount',
        sortable: true,
        cell: (item) => <span className="font-medium text-slate-900">{formatCurrency(item.refund_amount)}</span>,
      },
      {
        header: 'Total Dibayar',
        cell: (item) => {
          const totalPaid = item.total_paid ?? (item.payments ?? []).reduce((total, p) => total + Number(p.amount), 0);
          return <span>{formatCurrency(totalPaid)}</span>;
        },
      },
      {
        header: 'Sisa Bayar',
        cell: (item) => {
          const remainingAmount = item.remaining_payment ?? Math.max(0, item.refund_amount - (item.total_paid ?? 0));
          return <span className="font-medium text-amber-700">{formatCurrency(remainingAmount)}</span>;
        },
      },
      {
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (item) => <RefundStatusBadge status={item.status === 'approve' || item.status === 'reject' ? item.status : 'waiting'} />,
      },
      {
        header: 'Aksi',
        alignment: 'right',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => router.push(`/dashboard/${slug}/${basePath}/${transactionId}/refund/${item.id}`)}
            >
              <Eye className="h-4 w-4" />
              Detail
            </Button>
          </div>
        ),
      },
    ],
    [basePath, router, slug, transactionId],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      meta={
        meta
          ? {
            currentPage: page,
            perPage: meta.perPage,
            lastPage: meta.lastPage,
            total: meta.total,
          }
          : undefined
      }
      onPageChange={onPageChange}
    />
  );
}
