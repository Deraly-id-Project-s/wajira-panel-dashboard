import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ReferenceLink } from '@/components/ui/reference-link';
import { cn } from '@/lib/utils';
import type { StockVehicleEquipment } from '@/@types/stock-vehicle-equipment.types';

interface StockVehicleEquipmentTableProps {
  data: StockVehicleEquipment[];
  slug: string;
  isLoading?: boolean;
}

const stateLabel: Record<string, string> = {
  receipt: 'Masuk',
  issue: 'Keluar',
  draft: 'Draft',
  process: 'Proses',
  done: 'Selesai',
};

export default function StockVehicleEquipmentTable({ data, slug, isLoading }: StockVehicleEquipmentTableProps) {
  const columns = useMemo<ColumnDef<StockVehicleEquipment>[]>(() => [
    {
      header: 'Kode Perlengkapan',
      accessorKey: 'vehicleEquipmentCode',
      sortable: true,
      sticky: 'left',
      cell: (item) => <CopyBox text={item.vehicleEquipmentCode} />,
    },
    {
      header: 'Nama Perlengkapan',
      accessorKey: 'vehicleEquipmentName',
      sortable: true,
      cell: (item) => (
        <ReferenceLink href={`/dashboard/${slug}/master/vehicle-equipment?search=${encodeURIComponent(item.vehicleEquipmentName)}`}>
          {item.vehicleEquipmentName}
        </ReferenceLink>
      ),
    },
    {
      header: 'Stok Tersedia',
      accessorKey: 'qty',
      sortable: true,
      cell: (item) => (
        <Badge
          variant="outline"
          className={cn('min-w-14 justify-center font-semibold tabular-nums', item.qty > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700')}
        >
          {item.qty > 0 ? item.qty : 'Kosong'}
        </Badge>
      ),
    },
    {
      header: 'Forecast',
      accessorKey: 'forecastQty',
      sortable: true,
      cell: (item) => item.forecastQty,
    },
    {
      header: 'Harga',
      accessorKey: 'price',
      sortable: true,
      cell: (item) => <span className="whitespace-nowrap font-medium tabular-nums">{currenciesFormat('idr', item.price)}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (item) => <Badge variant="outline" className="border-slate-200 bg-slate-50 font-semibold capitalize text-slate-700">{stateLabel[item.status] ?? item.status}</Badge>,
    },
    {
      header: 'Kondisi Stok',
      accessorKey: 'stockState',
      sortable: true,
      cell: (item) => <Badge variant="outline" className="border-blue-200 bg-blue-50 font-semibold capitalize text-blue-700">{stateLabel[item.stockState] ?? item.stockState}</Badge>,
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
      getRowMark={(item) => (item.qty <= 0 ? 'alert' : 'success')}
    />
  );
}
