import { useMemo } from 'react';
import { Download, MoreVertical, Plus, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import type { VehicleDocumentSummary } from '@/types/vehicle-document.types';

interface Props {
  items: VehicleDocumentSummary[];
  search: string;
  isLoading?: boolean;
  page: number;
  perPage: number;
  totalData: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (value: number) => void;
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
  onEdit: (item: VehicleDocumentSummary) => void;
  onDelete: (item: VehicleDocumentSummary) => void;
  isExporting?: boolean;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'dd/MM/yyyy');
};

export function VehicleDocumentTable({
  items,
  search,
  isLoading = false,
  page,
  perPage,
  totalData,
  onSearchChange,
  onPageChange,
  onPerPageChange,
  onAdd,
  onImport,
  onExport,
  onEdit,
  onDelete,
  isExporting = false,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalData / perPage));

  const columns = useMemo<ColumnDef<VehicleDocumentSummary>[]>(
    () => [
      {
        header: 'Kode Dokumen',
        accessorKey: 'code',
        alignment: 'left',
        className: 'font-medium text-slate-900',
        cell: (item) => item.code || '-',
      },
      {
        header: 'Kode Ditlantas',
        accessorKey: 'ditlantasProcess.code',
        alignment: 'left',
        className: 'text-slate-700',
        cell: (item) => item.ditlantasProcess?.code || '-',
      },
      {
        header: 'Vendor',
        alignment: 'left',
        className: 'text-slate-700',
        cell: (item) => item.ditlantasProcess?.vendor?.name || '-',
      },
      {
        header: 'Tanggal Terima',
        accessorKey: 'receiptDate',
        alignment: 'center',
        cell: (item) => formatDate(item.receiptDate),
      },
      {
        header: 'Processed',
        accessorKey: 'processedCount',
        alignment: 'center',
        className: 'font-semibold text-emerald-600',
        cell: (item) => item.processedCount,
      },
      {
        header: 'Unprocessed',
        accessorKey: 'unprocessedCount',
        alignment: 'center',
        className: 'font-semibold text-amber-600',
        cell: (item) => item.unprocessedCount,
      },
      {
        header: 'Deskripsi',
        accessorKey: 'description',
        alignment: 'left',
        className: 'max-w-[220px] truncate text-slate-700',
        cell: (item) => item.description || '-',
      },
      {
        header: 'Tanggal Dibuat',
        accessorKey: 'createdAt',
        alignment: 'center',
        cell: (item) => formatDate(item.createdAt),
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
                  <MoreVertical className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem onClick={() => onEdit(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Detail / Edit
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
    [onDelete, onEdit],
  );

  return (
    <BaseTable
      data={items}
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
      headerActions={
        <div className="flex flex-wrap gap-2">
          <Button onClick={onImport} variant="outline" className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={onExport} disabled={isExporting} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button onClick={onAdd} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Data
          </Button>
        </div>
      }
    />
  );
}
