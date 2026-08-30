import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Customer } from '@/@types/customer.types';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';

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
        cell: (item) => <span className="line-clamp-2">{item.address || '-'}</span>,
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                disabled={!canEdit}
                onSelect={(e) => {
                  e.preventDefault();
                  onEdit(item);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                disabled={!canDelete}
                onSelect={(e) => {
                  e.preventDefault();
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
    [onEdit, onDelete, canEdit, canDelete],
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
