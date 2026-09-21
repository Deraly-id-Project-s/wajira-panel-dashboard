import { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import type { DoEkspedisiItem } from '@/@types/do-ekspedisi.types';
import { formatCurrency } from '@/lib/utils/currency';

interface DOEkspedisiDetailTableProps {
  data: DoEkspedisiItem[];
  page: number;
  perPage: number;
  isLoading?: boolean;
  onView: (item: DoEkspedisiItem) => void;
  onEdit: (item: DoEkspedisiItem) => void;
  onDelete: (item: DoEkspedisiItem) => void;
}

export function DOEkspedisiDetailTable({
  data,
  page,
  perPage,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
}: DOEkspedisiDetailTableProps) {
  const getDestinationSummary = (item: DoEkspedisiItem) => {
    if (item.destinations && item.destinations.length > 0) {
      return item.destinations.map((destination) => destination.destination).filter(Boolean).join(', ');
    }

    return item.destination || '-';
  };

  const columns = useMemo<ColumnDef<DoEkspedisiItem>[]>(
    () => [
      {
        header: 'No',
        alignment: 'center',
        cell: (_, index) => (page - 1) * perPage + index + 1,
      },
      {
        header: 'Customer',
        accessorKey: 'customerName',
        alignment: 'center',
        cell: (item) => item.customerName || '-',
      },
      {
        header: 'Loading In',
        accessorKey: 'loadingIn',
        alignment: 'center',
        cell: (item) => item.loadingIn || '-',
      },
      {
        header: 'Tujuan Kirim',
        alignment: 'center',
        cell: (item) => getDestinationSummary(item),
      },
      {
        header: 'Loading Out',
        accessorKey: 'loadingOut',
        alignment: 'center',
        cell: (item) => item.loadingOut || '-',
      },
      {
        header: 'Keterangan',
        accessorKey: 'driverNote',
        alignment: 'center',
        cell: (item) => item.driverNote || '-',
      },
      {
        header: 'UJ Driver',
        accessorKey: 'driverFee',
        alignment: 'center',
        cell: (item) => formatCurrency(item.driverFee),
      },
      {
        header: 'UJ Lainnya',
        accessorKey: 'otherFee',
        alignment: 'center',
        cell: (item) => formatCurrency(item.otherFee),
      },
      {
        header: 'Invoice',
        accessorKey: 'invoiceFee',
        alignment: 'center',
        cell: (item) => formatCurrency(item.invoiceFee),
      },
      {
        header: 'Invoice Tambahan',
        accessorKey: 'additionalCostFee',
        alignment: 'center',
        cell: (item) => formatCurrency(item.additionalCostFee),
      },
      {
        header: 'PPN',
        accessorKey: 'ppnFee',
        alignment: 'center',
        cell: (item) => formatCurrency(item.ppnFee),
      },
      {
        header: 'Fee',
        accessorKey: 'serviceFee',
        alignment: 'center',
        cell: (item) => formatCurrency(item.serviceFee),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem onClick={() => onView(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(item)} className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onDelete, onEdit, onView, page, perPage],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
    />
  );
}
