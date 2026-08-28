import { useMemo } from 'react';
import { format } from 'date-fns';
import { MoreVertical, Plus } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { LPJRecord } from './lpj-perjalanan.data';

interface LPJTableProps {
  data: LPJRecord[];
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  perPage: number;
  totalData: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (value: number) => void;
  onAdd: () => void;
  onEdit: (item: LPJRecord) => void;
  onDetail: (item: LPJRecord) => void;
  onDelete: (item: LPJRecord) => void;
}

export function LPJTable({
  data,
  search,
  onSearchChange,
  page,
  perPage,
  totalData,
  onPageChange,
  onPerPageChange,
  onAdd,
  onEdit,
  onDetail,
  onDelete,
}: LPJTableProps) {
  const columns = useMemo<ColumnDef<LPJRecord>[]>(
    () => [
      {
        header: 'KODE LPJ',
        accessorKey: 'kodeLPJ',
        alignment: 'center',
        cell: (item) => item.kodeLPJ || '-',
      },
      {
        header: 'DRIVER',
        accessorKey: 'driver',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => item.driver || '-',
      },
      {
        header: 'NO POLISI',
        accessorKey: 'noPolisi',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => item.noPolisi || '-',
      },
      {
        header: 'TGL BERANGKAT',
        accessorKey: 'tglBerangkat',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => (item.tglBerangkat ? format(new Date(item.tglBerangkat), 'dd/MM/yyyy') : '-'),
      },
      {
        header: 'TGL KEMBALI',
        accessorKey: 'tglKembali',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => (item.tglKembali ? format(new Date(item.tglKembali), 'dd/MM/yyyy') : '-'),
      },
      {
        header: 'RUTE',
        alignment: 'center',
        cell: (item) => (
          <span className="inline-flex flex-col items-center gap-1">
            <span>{item.ruteAsal}</span>
            <span>{item.ruteTujuan}</span>
          </span>
        ),
      },
      {
        header: 'MUATAN',
        accessorKey: 'muatan',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => item.muatan || '-',
      },
      {
        header: 'TOTAL KM',
        accessorKey: 'totalKM',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => `${item.totalKM} km`,
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
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem onClick={() => onEdit(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDetail(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(item)} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onDelete, onDetail, onEdit],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      searchPlaceholder="Search here"
      search={search}
      onSearchChange={onSearchChange}
      showLimitChange
      perPage={perPage}
      onPerPageChange={onPerPageChange}
      meta={{
        currentPage: page,
        perPage,
        lastPage: Math.ceil(totalData / perPage) || 1,
        total: totalData,
      }}
      onPageChange={onPageChange}
      headerActions={
        <Button onClick={onAdd} className="btn-primary!">
          <Plus className="mr-2 h-4 w-4" />
          Tambah
        </Button>
      }
    />
  );
}
