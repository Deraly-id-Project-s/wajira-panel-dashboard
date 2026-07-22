'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { useRefundList } from '@/hooks/useRefundAdministrasi';
import { UnitTransactionRefund } from '@/@types/refund.type';
import { RefundStatusBadge } from '@/components/features/refund/RefundStatusBadge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

export default function TransaksiRefundJualPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const unitTransactionId = typeof router.query.unit_transaction_id === 'string' ? router.query.unit_transaction_id : undefined;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');

  const refundQuery = useRefundList({
    page,
    perPage,
    search: search || undefined,
    unit_transaction_id: unitTransactionId,
  });

  const columns = useMemo<ColumnDef<UnitTransactionRefund>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'left',
        cell: (_, index) => (page - 1) * perPage + index + 1,
      },
      {
        header: 'TANGGAL REFUND',
        accessorKey: 'refund_date',
        sortable: true,
        alignment: 'left',
        cell: (item) => formatDate(item.refund_date),
      },
      {
        header: 'KODE REFUND',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.code} />,
      },
      {
        header: 'NOMINAL REFUND',
        accessorKey: 'refund_amount',
        sortable: true,
        alignment: 'left',
        cell: (item) => currenciesFormat('idr', item.refund_amount),
      },
      {
        header: 'TOTAL DIBAYAR',
        alignment: 'left',
        cell: (item) => {
          const totalPaid = item.total_paid ?? (item.payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0);
          return currenciesFormat('idr', totalPaid);
        },
      },
      {
        header: 'SISA BAYAR',
        alignment: 'left',
        cell: (item) => {
          const totalPaid = item.total_paid ?? (item.payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0);
          const remaining = item.remaining_payment ?? Math.max(0, item.refund_amount - totalPaid);
          return <span className="font-medium text-amber-700">{currenciesFormat('idr', remaining)}</span>;
        },
      },
      {
        header: 'QTY',
        accessorKey: 'total_qty',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.total_qty ?? item.items?.length ?? 0,
      },
      {
        header: 'STATUS',
        accessorKey: 'status',
        sortable: true,
        alignment: 'left',
        cell: (item) => <RefundStatusBadge status={item.status === 'approve' || item.status === 'reject' ? item.status : 'waiting'} />,
      },
      {
        header: 'aksi',
        alignment: 'left',
        sticky: 'right',
        cell: (item) => (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const trxId = item.unit_transaction_id || item.transaction?.id;
              if (trxId) {
                router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${trxId}/refund/${item.id}`);
              }
            }}
          >
            <Eye className="h-4 w-4" />
            Detail
          </Button>
        ),
      },
    ],
    [page, perPage, router, slug],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Refund Penjualan"
          description="Daftar transaksi refund penjualan unit"
        />

        <BaseTable
          data={refundQuery.data?.data ?? []}
          columns={columns}
          loading={refundQuery.isLoading}
          searchPlaceholder="Cari kode refund..."
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          showLimitChange
          perPage={perPage}
          onPerPageChange={(limit) => {
            setPerPage(limit);
            setPage(1);
          }}
          meta={
            refundQuery.data?.meta
              ? {
                currentPage: refundQuery.data.meta.currentPage,
                perPage: refundQuery.data.meta.perPage,
                lastPage: refundQuery.data.meta.lastPage,
                total: refundQuery.data.meta.total,
              }
              : undefined
          }
          onPageChange={setPage}
        />
      </div>
    </DashboardLayout>
  );
}
