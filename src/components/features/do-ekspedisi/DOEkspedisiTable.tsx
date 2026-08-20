import React, { useMemo } from 'react';
import { MoreVertical, Printer, Edit, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import { CopyBox } from '@/components/ui/copy-box';
import { formatDate } from '@/lib/utils/format';
import { useRouter } from 'next/router';
import { ReferenceLink } from '@/components/ui/reference-link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

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

const getDoStatusBadgeClassName = (status: string) => {
  switch (String(status).toLowerCase()) {
    case 'draft':
      return 'border-slate-200 bg-slate-50 text-slate-700';
    case 'process':
      return 'border-blue-200 bg-blue-50 text-blue-700 font-semibold';
    case 'done':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold';
    case 'failed':
      return 'border-rose-200 bg-rose-50 text-rose-700 font-semibold';
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700 font-semibold';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getDoStatusLabel = (status: string) => {
  switch (String(status).toLowerCase()) {
    case 'draft':
      return 'Draft';
    case 'process':
      return 'Proses';
    case 'done':
      return 'Selesai';
    case 'failed':
      return 'Gagal';
    case 'pending':
      return 'Tertunda';
    default:
      return status || '-';
  }
};

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
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const columns = useMemo<ColumnDef<DoEkspedisi>[]>(
    () => [
      {
        header: 'Kode DO',
        accessorKey: 'doCode',
        alignment: 'center',
        className: 'font-medium text-slate-800',
        cell: (item) => item?.doCode ? <CopyBox text={item?.doCode} /> : '-',
      },
      {
        header: 'Kode Order',
        alignment: 'center',
        cell: (item) => item?.orderCode ? <CopyBox text={item?.orderCode} /> : '-',
      },
      {
        header: 'Tanggal',
        accessorKey: 'date',
        alignment: 'center',
        cell: (item) => (item?.date ? formatDate(item?.date) : '-'),
      },
      {
        header: 'Nama Driver',
        accessorKey: 'driver.name',
        alignment: 'center',
        cell: (item) => item?.driver ? <ReferenceLink href={`/dashboard/${slug}/master/driver?search=${item?.driver?.name}`}>{item?.driver?.name}</ReferenceLink> : '-',
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
        header: 'Uang Jalan',
        accessorKey: 'ujNominal',
        alignment: 'right',
        cell: (item) => <span className="font-semibold text-slate-800">{currenciesFormat('idr', item.ujNominal)}</span>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        alignment: 'center',
        cell: (item) => (
          <Badge variant="outline" className={cn('rounded-full px-2.5 py-0.5 text-xs', getDoStatusBadgeClassName(item.status))}>
            {getDoStatusLabel(item.status)}
          </Badge>
        ),
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
