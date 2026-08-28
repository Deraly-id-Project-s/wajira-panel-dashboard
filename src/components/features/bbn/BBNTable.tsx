import React, { useMemo } from 'react';
import { Plus, MoreVertical, Upload, Download } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { BBN } from '@/@types/bbn.types';

interface BBNTableProps {
  bbns: BBN[];
  search: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  page: number;
  perPage: number;
  totalData: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onAdd: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onEdit: (bbn: BBN) => void;
  onDelete: (bbn: BBN) => void;
  isExporting?: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function BBNTable({
  bbns,
  search,
  onSearchChange,
  isLoading = false,
  page,
  perPage,
  totalData,
  onPageChange,
  onPerPageChange,
  onAdd,
  onImport,
  onExport,
  onEdit,
  onDelete,
  isExporting = false,
  canCreate,
  canEdit,
  canDelete,
}: BBNTableProps) {
  const columns = useMemo<ColumnDef<BBN>[]>(
    () => [
      {
        header: 'DEALER',
        accessorKey: 'dealer.namaDealer',
        className: 'font-medium text-gray-600',
        cell: (item) => item.dealer?.namaDealer || item.dealer?.code || '-',
      },
      {
        header: 'KODE TNBK',
        accessorKey: 'tnbkCode',
        alignment: 'center',
        cell: (item) => item.tnbkCode || '-',
      },
      {
        header: 'WILAYAH',
        accessorKey: 'region.name',
        className: 'uppercase text-gray-600',
        cell: (item) => item.region?.name || '-',
      },
      {
        header: 'JENIS',
        accessorKey: 'vehicleType',
        alignment: 'center',
        className: 'uppercase font-medium text-gray-600',
        cell: (item) => item.vehicleType || '-',
      },
      {
        header: 'UN NOTICE',
        accessorKey: 'unNoticeFee',
        className: 'text-gray-600',
        cell: (item) => formatCurrency(item.unNoticeFee),
      },
      {
        header: 'GARWIL',
        accessorKey: 'garwilFee',
        className: 'text-gray-600',
        cell: (item) => formatCurrency(item.garwilFee),
      },
      {
        header: 'BIRO/LOKET',
        accessorKey: 'countershopFee',
        className: 'text-gray-600',
        cell: (item) => formatCurrency(item.countershopFee),
      },
      {
        header: 'BIAYA LAIN',
        accessorKey: 'otherFee',
        className: 'text-gray-600',
        cell: (item) => (item.otherFee === 0 ? '0' : formatCurrency(item.otherFee)),
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
              <DropdownMenuContent align="end" className="w-[160px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem onClick={() => onEdit(item)} disabled={!canEdit} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(item)} disabled={!canDelete} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canDelete, canEdit, onDelete, onEdit],
  );

  return (
    <BaseTable
      data={bbns}
      columns={columns}
      loading={isLoading}
      getRowId={(item) => item.uuid || String(item.id || '')}
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
        canCreate && (
          <div className="flex flex-wrap items-center gap-2">
            {onExport && (
              <Button onClick={onExport} disabled={isExporting} variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            )}
            {onImport && (
              <Button onClick={onImport} variant="outline" className="w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            <Button onClick={onAdd} className="btn-primary!">
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </div>
        )
      }
    />
  );
}
