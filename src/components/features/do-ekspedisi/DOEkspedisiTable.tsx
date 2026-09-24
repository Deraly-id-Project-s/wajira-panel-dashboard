import React, { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import { CopyBox } from '@/components/ui/copy-box';
import { useRouter } from 'next/router';
import { ReferenceLink } from '@/components/ui/reference-link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { getDoEkspedisiStatusBadgeClassName, getDoEkspedisiStatusLabel } from './do-ekspedisi-status';

interface DOEkspedisiTableProps {
  data: DoEkspedisi[];
  isLoading?: boolean;
  onEdit: (item: DoEkspedisi) => void;
  onDetail: (item: DoEkspedisi) => void;
  onDelete: (item: DoEkspedisi) => void;
  onPrint: (item: DoEkspedisi) => void;
}

const getVehicleTypeBadgeClassName = (type: string) => {
  switch (String(type).toLowerCase()) {
    case 'towing':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'cdd':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'fuso':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getVehicleTypeLabel = (type: string) => {
  switch (String(type).toLowerCase()) {
    case 'towing':
      return 'Towing';
    case 'cdd':
      return 'CDD';
    case 'fuso':
      return 'Fuso';
    default:
      return type?.toUpperCase() || '-';
  }
};

export const DOEkspedisiTable = React.memo(function DOEkspedisiTable({
  data,
  isLoading = false,
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
        cell: (item) => item?.orderCode ? <CopyBox text={item?.orderCode} href={item.orderList?.id ? `/dashboard/${slug}/administrasi/order-list/detail/${item.orderList.id}` : undefined} /> : '-',
      },
      {
        header: 'Status',
        accessorKey: 'status',
        alignment: 'center',
        cell: (item) => (
          <Badge variant="outline" className={cn('rounded-full px-2.5 py-0.5 text-xs', getDoEkspedisiStatusBadgeClassName(item.status))}>
            {getDoEkspedisiStatusLabel(item.status)}
          </Badge>
        ),
      },
      {
        header: 'Nama Driver',
        accessorKey: 'driver.name',
        alignment: 'center',
        cell: (item) => item?.driver ? <ReferenceLink target='_blank' href={`/dashboard/${slug}/master/driver/${item?.driver?.id}`}>{item?.driver?.name}</ReferenceLink> : '-',
      },
      {
        header: 'No Polisi',
        accessorKey: 'vehicle.registrationNumber',
        alignment: 'center',
        cell: (item) => item.vehicle?.registrationNumber ? <ReferenceLink target='_blank' href={`/dashboard/${slug}/master/armada?search=${item?.vehicle?.registrationNumber}`}>
          {item.vehicle?.registrationNumber}
        </ReferenceLink> : '-'
      },
      {
        header: 'Tipe',
        accessorKey: 'vehicle.type',
        alignment: 'center',
        cell: (item) => {
          const type = item.vehicle?.type || '';
          return (
            <Badge variant="outline" className={cn('rounded-full px-2.5 py-0.5 text-xs', getVehicleTypeBadgeClassName(type))}>
              {getVehicleTypeLabel(type)}
            </Badge>
          );
        },
      },
      {
        header: 'Waktu Ekspedisi',
        alignment: 'center',
        cell: (item) => {
          if (!item.startDate && !item.endDate) return '-';
          const fmt = (v: string | null | undefined) => {
            if (!v) return null;
            const d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
          };
          const start = fmt(item.startDate);
          const end = fmt(item.endDate);
          const fmtShort = (d: Date) => format(d, 'dd MMM yyyy');
          const fmtTime = (d: Date) => format(d, 'HH:mm');

          if (start && end && fmtShort(start) === fmtShort(end)) {
            return (
              <div className="flex flex-col text-xs leading-tight">
                <span className="text-slate-800">{fmtShort(start)}</span>
                <span className="text-slate-500">{fmtTime(start)} - {fmtTime(end)}</span>
              </div>
            );
          }
          return (
            <div className="flex flex-col text-xs leading-tight">
              {start && <span className="text-slate-800">{fmtShort(start)} {fmtTime(start)}</span>}
              {end && <span className="text-slate-500">s/d {fmtShort(end)} {fmtTime(end)}</span>}
            </div>
          );
        },
      },
      {
        header: 'Target Waktu',
        alignment: 'center',
        cell: (item) => {
          if (!item.targetStartDate && !item.targetEndDate) return '-';
          const fmt = (v: string | null | undefined) => {
            if (!v) return null;
            const d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
          };
          const start = fmt(item.targetStartDate);
          const end = fmt(item.targetEndDate);
          const fmtShort = (d: Date) => format(d, 'dd MMM yyyy');
          const fmtTime = (d: Date) => format(d, 'HH:mm');

          if (start && end && fmtShort(start) === fmtShort(end)) {
            return (
              <div className="flex flex-col text-xs leading-tight">
                <span className="text-slate-800">{fmtShort(start)}</span>
                <span className="text-slate-500">{fmtTime(start)} - {fmtTime(end)}</span>
              </div>
            );
          }
          return (
            <div className="flex flex-col text-xs leading-tight">
              {start && <span className="text-slate-800">{fmtShort(start)} {fmtTime(start)}</span>}
              {end && <span className="text-slate-500">s/d {fmtShort(end)} {fmtTime(end)}</span>}
            </div>
          );
        },
      },
      {
        header: 'Uang Jalan',
        accessorKey: 'ujNominal',
        alignment: 'right',
        cell: (item) => <span className="font-semibold text-slate-800">{currenciesFormat('idr', item.ujNominal)}</span>,
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => {
          const canEdit = String(item.status).toLowerCase() === 'draft';
          const canDelete = String(item.status).toLowerCase() === 'draft';

          return (
            <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem disabled={!canEdit} onClick={() => canEdit && onEdit(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDetail(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrint(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Print
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canDelete} onClick={() => canDelete && onDelete(item)} className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:cursor-not-allowed">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onDelete, onDetail, onEdit, onPrint, slug],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
    />
  );
});
