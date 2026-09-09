import { useMemo } from 'react';
import { format } from 'date-fns';
import { MoreVertical } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { LPJRecord } from './lpj-perjalanan.data';

interface LPJTableProps {
  data: LPJRecord[];
  onEdit: (item: LPJRecord) => void;
  onDetail: (item: LPJRecord) => void;
  onDelete: (item: LPJRecord) => void;
}

export function LPJTable({
  data,
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
                <DropdownMenuItem onClick={() => onEdit(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDetail(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Detail
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
    [onDelete, onDetail, onEdit],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
    />
  );
}
