import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import type { MaintenanceItem } from '@/@types/maintenance.types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface MaintenanceTableProps {
  data: MaintenanceItem[];
  isLoading: boolean;
  onViewDetail: (item: MaintenanceItem) => void;
  startIndex: number;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'dd MMMM yyyy', { locale: id });
};

export function MaintenanceTable({
  data,
  isLoading,
  onViewDetail,
  startIndex,
}: MaintenanceTableProps) {
  const columns = useMemo<ColumnDef<MaintenanceItem>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'left',
        className: 'font-medium text-slate-900',
        cell: (_, index) => startIndex + index,
      },
      {
        header: 'TANGGAL',
        accessorKey: 'transactionDate',
        className: 'text-slate-700',
        cell: (item) => formatDate(item.transactionDate),
      },
      {
        header: 'DRIVER/PIC',
        accessorKey: 'driver.name',
        className: 'text-slate-700 font-medium',
        cell: (item) => item.driver?.name || '-',
      },
      {
        header: 'NO POLISI',
        accessorKey: 'vehicleFleet.registrationNumber',
        className: 'text-slate-700',
        cell: (item) => item.vehicleFleet?.registrationNumber || '-',
      },
      {
        header: 'ARMADA',
        accessorKey: 'vehicleFleet.type',
        className: 'uppercase text-slate-700',
        cell: (item) => item.vehicleFleet?.type || '-',
      },
      {
        header: 'KETERANGAN',
        accessorKey: 'description',
        className: 'text-slate-700',
        cell: (item) => item.description || '-',
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(item)}
              className="h-8 rounded-lg border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            >
              Detail
            </Button>
          </div>
        ),
      },
    ],
    [onViewDetail, startIndex],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
    />
  );
}
