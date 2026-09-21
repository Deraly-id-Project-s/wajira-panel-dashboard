import { useMemo, useState } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import type { Customer } from '@/@types/customer.types';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { TextTruncate } from '@/components/ui/text-truncate';

interface CustomerTableProps {
  customers: Customer[];
  isLoading?: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function CustomerTable({
  customers,
  isLoading = false,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: CustomerTableProps) {
  const [openActionId, setOpenActionId] = useState<string | number | null>(null);

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        header: 'Kode',
        accessorKey: 'code',
        sortable: true,
        cell: (item) => <CopyBox text={item.code || '-'} />,
      },
      {
        header: 'Nama Customer',
        accessorKey: 'name',
        sortable: true,
        className: 'font-medium text-gray-900 truncate max-w-[220px]',
      },
      {
        header: 'Alamat',
        accessorKey: 'address',
        sortable: true,
        className: 'max-w-[260px]',
        cell: (item) => <TextTruncate text={item.address || '-'} maxLength={48} className="block max-w-[260px] truncate" />,
      },
      {
        header: 'Phone',
        accessorKey: 'phone',
        sortable: true,
        cell: (item) => (
          <ReferenceLink href={`https://wa.me/${item.phone}`}>
            {item.phone || '-'}
          </ReferenceLink>
        ),
      },
      {
        header: 'NPWP',
        accessorKey: 'npwp',
        sortable: true,
        cell: (item) => item.npwp || '-',
      },
      {
        header: 'PIC',
        accessorKey: 'pic',
        sortable: true,
        cell: (item) => item.pic || '-',
      },
      {
        header: 'Maps',
        accessorKey: 'map_link',
        sortable: true,
        cell: (item) =>
          item.map_link ? (
            <a
              href={item.map_link}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-[180px] truncate text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              {item.map_link}
            </a>
          ) : (
            '-'
          ),
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
              <button className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                disabled={!canEdit}
                onSelect={() => {
                  setOpenActionId(null);
                  onEdit(item);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                disabled={!canDelete}
                onSelect={() => {
                  setOpenActionId(null);
                  onDelete(item);
                }}
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
      data={customers}
      columns={columns}
      loading={isLoading}
      defaultSort={{ key: 'code', direction: 'asc' }}
    />
  );
}
