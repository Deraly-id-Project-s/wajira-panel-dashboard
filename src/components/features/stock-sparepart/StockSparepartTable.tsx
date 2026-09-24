import { useMemo } from 'react';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ReferenceLink } from '@/components/ui/reference-link';
import { cn } from '@/lib/utils';

interface StockSparepartRow {
  sparepartCode: string;
  sparepartName: string;
  qty: number;
  price: number;
  status?: string | null;
  stockStatus?: string | null;
  warehouseSubBlock?: { name?: string | null } | null;
}

interface StockSparepartTableProps {
  data: StockSparepartRow[];
  slug: string;
  isLoading?: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  minor_damage: { label: 'Minor Damage', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  major_damage: { label: 'Major Damage', className: 'border-red-200 bg-red-50 text-red-700' },
  returned: { label: 'Retur Beli', className: 'border-purple-200 bg-purple-50 text-purple-700' },
  refunded: { label: 'Refund Jual', className: 'border-orange-200 bg-orange-50 text-orange-700' },
  lost: { label: 'Lost', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  in_repair: { label: 'In Repair', className: 'border-blue-200 bg-blue-50 text-blue-700' },
};

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
      cell: (item) => (
        <Badge
          variant="outline"
          className={cn(
            'min-w-14 justify-center tabular-nums',
            item.qty > 0
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700',
          )}
        >
          {item.qty > 0 ? item.qty : 'Kosong'}
        </Badge>
      ),
    },
    {
      header: 'Harga Estimasi',
      accessorKey: 'price',
      sortable: true,
      alignment: 'right',
      cell: (item) => <span className="whitespace-nowrap font-medium tabular-nums">{currenciesFormat('idr', item.price)}</span>,
    },
    {
      header: 'Status Kondisi',
      accessorKey: 'status',
      sortable: true,
      alignment: 'left',
      cell: (item) => {
        const config = statusConfig[item.status ?? ''] ?? fallbackStatus(item.status);
        return <Badge variant="outline" className={cn('capitalize font-semibold', config.className)}>{config.label}</Badge>;
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
    {
      header: 'Sub Blok Gudang',
      accessorKey: 'warehouseSubBlock.name',
      sortable: true,
      alignment: 'left',
      cell: (item) => item.warehouseSubBlock?.name || <span className="text-slate-400">Belum ditempatkan</span>,
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
      getRowMark={(item) => (item.qty <= 0 ? 'alert' : item.qty > 0 ? 'success' : 'base')}
    />
  );
}
