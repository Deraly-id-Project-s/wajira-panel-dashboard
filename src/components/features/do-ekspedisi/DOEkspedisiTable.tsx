import React, { useMemo } from 'react';
import { MoreVertical, Printer, Edit, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';

interface DOEkspedisiTableProps {
  data: DoEkspedisi[];
  search: string;
  page: number;
  perPage: number;
  totalData: number;
  totalPages: number;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onEdit: (item: DoEkspedisi) => void;
  onDetail: (item: DoEkspedisi) => void;
  onDelete: (item: DoEkspedisi) => void;
  onPrint: (item: DoEkspedisi) => void;
}

export const DOEkspedisiTable = React.memo(function DOEkspedisiTable({
  data,
  search,
  page,
  perPage,
  totalData,
  totalPages,
  isLoading = false,
  onSearchChange,
  onPageChange,
  onPerPageChange,
  onEdit,
  onDetail,
  onDelete,
  onPrint,
}: DOEkspedisiTableProps) {
  const columns = useMemo<ColumnDef<DoEkspedisi>[]>(
    () => [
      {
        header: 'Kode DO',
        accessorKey: 'doCode',
        alignment: 'center',
        className: 'font-medium text-slate-800',
        cell: (item) => item.doCode || '-',
      },
      {
        header: 'Kode Order',
        alignment: 'center',
        cell: (item) => item.orderCode || item.orderList?.code || '-',
      },
      {
        header: 'Tanggal',
        accessorKey: 'date',
        alignment: 'center',
        cell: (item) => (item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'),
      },
      {
        header: 'Nama Driver',
        accessorKey: 'driver.name',
        alignment: 'center',
        cell: (item) => item.driver?.name || '-',
      },
      {
        header: 'No Polisi',
        accessorKey: 'vehicle.registrationNumber',
        alignment: 'center',
        cell: (item) => item.vehicle?.registrationNumber || '-',
      },
      {
        header: 'Tipe',
        accessorKey: 'vehicle.type',
        alignment: 'center',
        cell: (item) => item.vehicle?.type || '-',
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
                <DropdownMenuItem onClick={() => onEdit(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDetail(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrint(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(item)} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onDelete, onDetail, onEdit, onPrint],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      searchPlaceholder="Search here"
      search={search}
      onSearchChange={onSearchChange}
      showLimitChange
      perPage={perPage}
      onPerPageChange={onPerPageChange}
      meta={{
        currentPage: page,
        perPage,
        lastPage: totalPages,
        total: totalData,
      }}
      onPageChange={onPageChange}
    />
  );
});
