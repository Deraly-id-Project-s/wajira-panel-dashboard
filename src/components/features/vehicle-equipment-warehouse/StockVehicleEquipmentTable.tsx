import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import type { StockVehicleEquipment } from '@/@types/stock-vehicle-equipment.types';

interface StockVehicleEquipmentTableProps {
  data: StockVehicleEquipment[];
  slug: string;
  isLoading?: boolean;
}

export default function StockVehicleEquipmentTable({ data, slug, isLoading }: StockVehicleEquipmentTableProps) {
  const columns = useMemo<ColumnDef<StockVehicleEquipment>[]>(() => [
    {
      header: 'Kode Perlengkapan',
      accessorKey: 'vehicleEquipmentCode',
      cell: (item) => <CopyBox text={item.vehicleEquipmentCode} />,
    },
    {
      header: 'Nama Perlengkapan',
      accessorKey: 'vehicleEquipmentName',
      cell: (item) => (
        <ReferenceLink href={`/dashboard/${slug}/master/vehicle-equipment?search=${encodeURIComponent(item.vehicleEquipmentName)}`}>
          {item.vehicleEquipmentName}
        </ReferenceLink>
      ),
    },
    {
      header: 'Stok Tersedia',
      accessorKey: 'stockAvailable',
      cell: (item) => (
        <span className="tabular-nums font-semibold text-emerald-700">{item.stockAvailable}</span>
      ),
    },
    {
      header: 'Stok Terpakai',
      accessorKey: 'stockUsed',
      cell: (item) => (
        <span className="tabular-nums font-semibold text-slate-700">{item.stockUsed}</span>
      ),
    },
    {
      header: 'Total Stok',
      accessorKey: 'totalStock',
      cell: (item) => (
        <span className="tabular-nums font-semibold text-slate-900">{item.totalStock}</span>
      ),
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
    />
  );
}
