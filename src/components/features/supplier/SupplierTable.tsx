import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload } from 'lucide-react';
import type { Supplier } from '@/types/supplier.types';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';

interface SupplierTableProps {
  suppliers: Supplier[];
  isLoading?: boolean;
  search: string;
  page: number;
  perPage: number;
  totalData: number;
  totalPages: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onAdd: () => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onImport: () => void;
  onExport: () => void;
  isExporting?: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function SupplierTable({
  suppliers,
  isLoading = false,
  search,
  page,
  perPage,
  totalData,
  totalPages,
  onSearchChange,
  onPageChange,
  onPerPageChange,
  onAdd,
  onEdit,
  onDelete,
  onImport,
  onExport,
  isExporting = false,
  canCreate,
  canEdit,
  canDelete,
}: SupplierTableProps) {
  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        header: 'Kode',
        accessorKey: 'code',
        sortable: true,
        cell: (item) => <CopyBox text={item.code || '-'} />,
      },
      {
        header: 'Nama Supplier',
        accessorKey: 'name',
        sortable: true,
        className: 'font-medium text-gray-900 truncate max-w-[220px]',
      },
      {
        header: 'PIC',
        accessorKey: 'pic',
        sortable: true,
        cell: (item) => item.pic || '-',
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
        header: 'Alamat',
        accessorKey: 'address',
        sortable: true,
        cell: (item) => <span className="line-clamp-2">{item.address || '-'}</span>,
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
      data={suppliers}
      columns={columns}
      loading={isLoading}
      searchPlaceholder="Search here"
      search={search}
      onSearchChange={onSearchChange}
      showLimitChange
      perPage={perPage}
      onPerPageChange={onPerPageChange}
      defaultSort={{ key: 'code', direction: 'asc' }}
      meta={{
        currentPage: page,
        perPage,
        lastPage: totalPages,
        total: totalData,
      }}
      onPageChange={onPageChange}
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <Button onClick={onImport} variant="outline" className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}
          <Button onClick={onExport} disabled={isExporting} variant="outline" className="w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          {canCreate && (
            <Button onClick={onAdd} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
              <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
              Tambah
            </Button>
          )}
        </div>
      }
    />
  );
}
