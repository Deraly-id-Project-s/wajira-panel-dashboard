import { useMemo, useState } from 'react';
import type { UnitTransactionTypeDetail } from '@/@types/unit-transaction.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { useUnitTransactionTypeDetails } from '@/hooks/useUnitTransaction';
import { cn } from '@/lib/utils';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';

const stockStateConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600' },
  cancel: { label: 'Batal', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  prepare: { label: 'Disiapkan', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  purchase_order: { label: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  in_transit: { label: 'Dalam Perjalanan', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  receipt: { label: 'Diterima', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

type UnitTypeDetailTableProps = {
  transactionId: string;
};

export function UnitTypeDetailTable({ transactionId }: UnitTypeDetailTableProps) {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const { data, isLoading, isFetching } = useUnitTransactionTypeDetails(transactionId, { page, perPage });

  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const columns = useMemo<ColumnDef<UnitTransactionTypeDetail>[]>(
    () => [
      {
        header: 'No',
        alignment: 'center',
        cell: (_item, index) =>
          ((data?.meta.currentPage ?? page) - 1) * (data?.meta.perPage ?? perPage) + index + 1,
      },
      {
        header: 'Kode Unit',
        accessorKey: 'unit_transaction_item.unit_type.code',
        sortable: true,
        cell: (item) => item.unit_transaction_item?.unit_type?.code ? <CopyBox text={item.unit_transaction_item?.unit_type?.code} /> : '-',
      },
      {
        header: 'Tipe Unit',
        accessorKey: 'unit_transaction_item.unit_type.name',
        sortable: true,
        cell: (item) => item.unit_transaction_item?.unit_type?.name ? <ReferenceLink target='_blank' href={`/dashboard/${slug}/master/type-unit/${item.unit_transaction_item?.unit_type?.id}`}>{item.unit_transaction_item?.unit_type?.name}</ReferenceLink> : '-',
      },
      {
        header: 'Warna',
        accessorKey: 'color',
        sortable: true,
        cell: (item) => item.color || '-',
      },
      {
        header: 'Nomor Mesin',
        accessorKey: 'machine_number',
        sortable: true,
        cell: (item) => item?.machine_number ? <CopyBox text={item.machine_number} /> : '-',
      },
      {
        header: 'Nomor Rangka',
        accessorKey: 'chassis_number',
        sortable: true,
        cell: (item) => item?.chassis_number ? <CopyBox text={item.chassis_number} /> : '-',
      },
      {
        header: 'Sub Blok Warehouse',
        accessorKey: 'warehouse_sub_block.name',
        cell: (item) => item.warehouse_sub_block?.name ? <CopyBox text={item.warehouse_sub_block?.name} /> : '-',
      },
      {
        header: 'Stok',
        alignment: 'center',
        cell: (item) => (
          <Badge
            variant="outline"
            className={
              item.in_stock
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold'
                : 'border-rose-200 bg-rose-50 text-rose-700 font-semibold'
            }
          >
            {item.in_stock ? 'Tersedia' : 'Tidak Tersedia'}
          </Badge>
        ),
      },
      {
        header: 'Kondisi',
        accessorKey: 'status',
        alignment: 'center',
        cell: (item) => (
          <Badge
            variant="outline"
            className="capitalize border-slate-200 bg-slate-50 text-slate-700 font-semibold"
          >
            {item.status?.replace(/_/g, ' ') || '-'}
          </Badge>
        ),
      },
      {
        header: 'Posisi Stok',
        accessorKey: 'stock_state',
        alignment: 'center',
        cell: (item) => {
          const state = item.stock_state || 'draft';
          const config = stockStateConfig[state] ?? {
            label: state.replace(/_/g, ' '),
            className: 'border-slate-200 bg-slate-50 text-slate-700',
          };

          return (
            <Badge variant="outline" className={cn('capitalize font-semibold', config.className)}>
              {config.label}
            </Badge>
          );
        },
      },
    ],
    [data?.meta.currentPage, data?.meta.perPage, page, perPage],
  );

  return (
    <div className="overflow-hidden rounded-md border bg-white">
      <div className="border-b px-6 py-5">
        <h3 className="text-xl font-semibold">Detail Unit Tipe</h3>
        <p className="text-sm text-muted-foreground">Rincian identitas dan status setiap unit pada transaksi</p>
      </div>

      <div className="p-6">
        <BaseTable
          data={data?.data ?? []}
          columns={columns}
          loading={isLoading || isFetching}
          meta={data?.meta}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
