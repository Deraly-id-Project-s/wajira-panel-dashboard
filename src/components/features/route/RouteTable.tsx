import { useMemo, useState } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import type { RouteModel } from '@/@types/route.types';
import { TextTruncate } from '@/components/ui/text-truncate';
import { ReferenceLink } from '@/components/ui/reference-link';

interface RouteTableProps {
  data: RouteModel[];
  isLoading?: boolean;
  onEdit: (route: RouteModel) => void;
  onDelete: (route: RouteModel) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function RouteTable({
  data,
  isLoading = false,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: RouteTableProps) {
  const [openActionId, setOpenActionId] = useState<string | number | null>(null);

  const columns = useMemo<ColumnDef<RouteModel>[]>(
    () => [
      {
        header: 'NAMA RUTE',
        accessorKey: 'name',
        sortable: true,
        className: 'font-medium text-gray-900 truncate max-w-[200px]',
        cell: (item) => item.name || '-',
      },
      {
        header: 'ALAMAT',
        accessorKey: 'address',
        sortable: true,
        className: 'max-w-[260px]',
        cell: (item) => (
          <TextTruncate text={item.address || '-'} maxLength={50} className="block max-w-[260px] truncate" />
        ),
      },
      {
        header: 'INFORMASI LAINNYA',
        accessorKey: 'other_information',
        sortable: true,
        className: 'max-w-[200px]',
        cell: (item) => item.other_information || item.otherInformation || '-',
      },
      {
        header: 'DESKRIPSI',
        accessorKey: 'description',
        sortable: true,
        className: 'max-w-[200px]',
        cell: (item) => item.description || '-',
      },
      {
        header: 'MAPS',
        accessorKey: 'link',
        sortable: false,
        cell: (item) => {
          const mapHref = item.link || (item.coordinat || item.coordinate ? `https://www.google.com/maps?q=${item.coordinat || item.coordinate}` : null);
          return mapHref ? (
            <ReferenceLink href={mapHref} target="_blank">
              Buka Maps
            </ReferenceLink>
          ) : (
            '-'
          );
        },
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu
            open={openActionId === item.id}
            onOpenChange={(open) => setOpenActionId(open ? item.id : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                disabled={!canEdit}
                onClick={() => {
                  setOpenActionId(null);
                  onEdit(item);
                }}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canDelete}
                onClick={() => {
                  setOpenActionId(null);
                  onDelete(item);
                }}
                className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:cursor-not-allowed"
              >
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onEdit, onDelete, openActionId, canEdit, canDelete],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      defaultSort={{ key: 'name', direction: 'asc' }}
    />
  );
}
