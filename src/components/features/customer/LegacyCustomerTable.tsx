import { useMemo, useState } from 'react';
import { MoreHorizontal, Plus, Upload } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Customer } from '@/types/customer.types';

interface LegacyCustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onAdd?: () => void;
  onImport?: () => void;
}

export function LegacyCustomerTable({ customers, onEdit, onDelete, onAdd, onImport }: LegacyCustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const filteredData = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    return customers.filter(
      (item) =>
        (item.name ?? '').toLowerCase().includes(lowercasedTerm) ||
        (item.code ?? '').toLowerCase().includes(lowercasedTerm) ||
        (item.address ?? '').toLowerCase().includes(lowercasedTerm) ||
        (item.npwp ?? '').toLowerCase().includes(lowercasedTerm) ||
        (item.pic ?? '').toLowerCase().includes(lowercasedTerm) ||
        (item.phone ?? '').toLowerCase().includes(lowercasedTerm) ||
        (item.map_link ?? '').toLowerCase().includes(lowercasedTerm),
    );
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        header: 'KODE CUSTOMER',
        accessorKey: 'code',
        className: 'font-medium text-slate-800',
        cell: (customer) => customer.code ?? '-',
      },
      {
        header: 'NAMA CUSTOMER',
        accessorKey: 'name',
        className: 'text-slate-700',
        cell: (customer) => customer.name || '-',
      },
      {
        header: 'ALAMAT',
        accessorKey: 'address',
        className: 'max-w-[300px] truncate text-slate-700',
        cell: (customer) => (
          <span title={customer.address ?? undefined}>{customer.address ?? '-'}</span>
        ),
      },
      {
        header: 'NPWP',
        accessorKey: 'npwp',
        className: 'text-slate-700',
        cell: (customer) => customer.npwp ?? '-',
      },
      {
        header: 'PIC',
        accessorKey: 'pic',
        className: 'text-slate-700',
        cell: (customer) => customer.pic ?? '-',
      },
      {
        header: 'PHONE',
        accessorKey: 'phone',
        className: 'text-slate-700',
        cell: (customer) => customer.phone ?? '-',
      },
      {
        header: 'MAPS',
        accessorKey: 'map_link',
        className: 'text-slate-700',
        cell: (customer) =>
          customer.map_link ? (
            <a href={customer.map_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              [link]
            </a>
          ) : (
            '-'
          ),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (customer) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem onClick={() => onEdit(customer)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(customer)} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onDelete, onEdit],
  );

  return (
    <BaseTable
      data={currentData}
      columns={columns}
      searchPlaceholder="Search here"
      search={searchTerm}
      onSearchChange={(val) => {
        setSearchTerm(val);
        setCurrentPage(1);
      }}
      showLimitChange
      perPage={itemsPerPage}
      onPerPageChange={(val) => {
        setItemsPerPage(val);
        setCurrentPage(1);
      }}
      meta={{
        currentPage,
        perPage: itemsPerPage,
        lastPage: totalPages,
        total: filteredData.length,
      }}
      onPageChange={setCurrentPage}
      headerActions={
        (onImport || onAdd) && (
          <div className="flex flex-wrap items-center gap-2">
            {onImport && (
              <Button onClick={onImport} variant="outline" className="w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            {onAdd && (
              <Button onClick={onAdd} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
                <Plus className="h-4 w-4 mr-2" />
                Tambah
              </Button>
            )}
          </div>
        )
      }
    />
  );
}
