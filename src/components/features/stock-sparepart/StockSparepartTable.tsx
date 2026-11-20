import { useMemo } from 'react';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { cn } from '@/lib/utils';

interface StockSparepartRow {
  sparepartCode: string;
  sparepartName: string;
  qty: number;
  stockStatus?: string | null;
  price?: number;
  status?: string | null;
  warehouseSubBlock?: { name?: string | null } | null;
}

interface StockSparepartTableProps {
  data: StockSparepartRow[];
  slug: string;
  isLoading?: boolean;
}

const stockStatusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600' },
  cancel: { label: 'Dibatalkan', className: 'border-red-200 bg-red-50 text-red-700' },
  rejected: { label: 'Ditolak', className: 'border-red-200 bg-red-50 text-red-700' },
  prepare: { label: 'Disiapkan', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  inbound_receipt: { label: 'Tersedia', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

const fallbackStatus = (value?: string | null) => ({
  label: value ? value.replace(/_/g, ' ') : '-',
  className: 'border-slate-200 bg-slate-50 text-slate-700',
});

export default function StockSparepartTable({ data, slug, isLoading }: StockSparepartTableProps) {
  const columns = useMemo<ColumnDef<StockSparepartRow>[]>(() => [
    {
      header: 'Kode Sparepart',
      accessorKey: 'sparepartCode',
      sortable: true,
      alignment: 'left',
      sticky: 'left',
      cell: (item) => <CopyBox text={item.sparepartCode} />,
    },
    {
      header: 'Nama Sparepart',
      accessorKey: 'sparepartName',
      sortable: true,
      alignment: 'left',
      cell: (item) => (
        <ReferenceLink href={`/dashboard/${slug}/master/sparepart?search=${encodeURIComponent(item.sparepartName)}`}>
          {item.sparepartName}
        </ReferenceLink>
      ),
    },
    {
      header: 'Kuantitas',
      accessorKey: 'qty',
      sortable: true,
      alignment: 'center',
      cell: (item) => {
        const qtyInt = Math.round(Number(item.qty || 0));
        return (
          <Badge
            variant="outline"
            className={cn(
              'min-w-14 justify-center tabular-nums font-semibold',
              qtyInt > 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700',
            )}
          >
            {qtyInt > 0 ? qtyInt : 'Kosong'}
          </Badge>
        );
      },
    },
    {
      header: 'Kondisi Stok',
      accessorKey: 'stockStatus',
      sortable: true,
      alignment: 'left',
      cell: (item) => {
        const config = stockStatusConfig[item.stockStatus ?? ''] ?? fallbackStatus(item.stockStatus);
        return <Badge variant="outline" className={cn('capitalize font-semibold', config.className)}>{config.label}</Badge>;
      },
    },
  ], [slug]);

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      showColumnVisibility
      headerRowClassName="bg-slate-50/80"
      containerClassName="rounded-lg border border-slate-200 bg-white shadow-sm"
      getRowMark={(item) => (Math.round(Number(item.qty || 0)) <= 0 ? 'alert' : 'success')}
    />
  );
}
