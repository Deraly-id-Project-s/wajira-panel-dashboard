import { useMemo } from 'react';
import { PurchaseTransactionItem } from '@/services/laporan-pembelian.service';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { formatDate } from '@/components/ui/format-date';
import { useRouter } from 'next/router';

interface Props {
  data: PurchaseTransactionItem[];
  pagination: { currentPage: number; lastPage: number; total: number; from: number; to: number; perPage: number; };
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

const formatCurrency = (val: number) => `Rp ${Number(val).toLocaleString('id-ID')}`;

export default function LaporanPembelianPerSupplier({ data, pagination, isLoading, onPageChange }: Props) {
  const router = useRouter();
  const slug = router.query.slug as string;

  const columns = useMemo<ColumnDef<PurchaseTransactionItem>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'center',
        cell: (_, idx) => idx + 1 + (pagination.currentPage - 1) * pagination.perPage,
      },
      {
        header: 'NO PEMBELIAN',
        accessorKey: 'transaction_code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.transaction_code} />
      },
      {
        header: 'TGL BELI',
        accessorKey: 'transaction_date',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.transaction_date),
      },
      {
        header: 'NAMA SUPPLIER',
        accessorKey: 'person_name',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <ReferenceLink href={`/dashboard/${slug}/master/supplier?search=${encodeURIComponent(item.person_name || '')}`}>
            {item.person_name || '-'}
          </ReferenceLink>
        ),
      },
      {
        header: 'QTY',
        accessorKey: 'qty',
        alignment: 'center',
      },
      {
        header: 'HARGA',
        accessorKey: 'price',
        alignment: 'center',
        cell: (item) => formatCurrency(item.price),
      },
      {
        header: 'BIAYA BBN',
        accessorKey: 'bbn',
        alignment: 'center',
        cell: (item) => formatCurrency(item.bbn),
      },
      {
        header: 'BIAYA EKSPEDISI',
        accessorKey: 'expedition_fee',
        alignment: 'center',
        cell: (item) => formatCurrency(item.expedition_fee),
      },
      {
        header: 'BIAYA LAIN',
        accessorKey: 'other_fee',
        alignment: 'center',
        cell: (item) => formatCurrency(item.other_fee),
      },
      {
        header: 'TOTAL BELI',
        accessorKey: 'total',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <span className="font-semibold text-slate-900">
            {formatCurrency(item.total)}
          </span>
        ),
      },
    ],
    [pagination.currentPage, pagination.perPage, slug]
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      meta={{
        currentPage: pagination.currentPage,
        perPage: pagination.perPage,
        lastPage: pagination.lastPage,
        total: pagination.total,
      }}
      onPageChange={onPageChange}
    />
  );
}
