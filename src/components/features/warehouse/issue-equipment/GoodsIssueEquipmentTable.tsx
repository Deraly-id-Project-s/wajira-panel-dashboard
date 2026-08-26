import Link from 'next/link';
import { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { GoodsIssueEquipment } from '@/types/goods-issue-equipment.types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface GoodsIssueEquipmentTableProps {
  data: GoodsIssueEquipment[];
  isLoading: boolean;
  slug: string;
  onUploadInvoice: (item: GoodsIssueEquipment) => void;
  onDelete: (item: GoodsIssueEquipment) => void;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'dd MMMM yyyy', { locale: id });
};

const getCategoryLabel = (category: string) => {
  if (category === 'equipped') return 'Perlengkapan Armada';
  if (category === 'maintenance') return 'Maintenance Armada';
  return category;
};

export function GoodsIssueEquipmentTable({
  data,
  isLoading,
  slug,
  onUploadInvoice,
  onDelete,
}: GoodsIssueEquipmentTableProps) {
  const columns = useMemo<ColumnDef<GoodsIssueEquipment>[]>(
    () => [
      {
        header: 'KODE PENGELUARAN',
        accessorKey: 'code',
        className: 'font-medium text-slate-900',
        cell: (item) => item.code || '-',
      },
      {
        header: 'TANGGAL',
        accessorKey: 'transactionDate',
        className: 'text-slate-700',
        cell: (item) => formatDate(item.transactionDate),
      },
      {
        header: 'DRIVER',
        accessorKey: 'driver.name',
        className: 'text-slate-700',
        cell: (item) => item.driver?.name || '-',
      },
      {
        header: 'NOMOR POLISI',
        accessorKey: 'vehicleFleet.registrationNumber',
        className: 'text-slate-700',
        cell: (item) => item.vehicleFleet?.registrationNumber || '-',
      },
      {
        header: 'KATEGORI',
        accessorKey: 'category',
        className: 'text-slate-700',
        cell: (item) => getCategoryLabel(item.category),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  <Link href={`/dashboard/${slug}/warehouse/pengeluaran-perlengkapan/${item.id}/edit`}>Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  <Link href={`/dashboard/${slug}/warehouse/pengeluaran-perlengkapan/${item.id}`}>Detail</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUploadInvoice(item)}
                  className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                >
                  Upload Invoice
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(item)}
                  className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onDelete, onUploadInvoice, slug],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
    />
  );
}
