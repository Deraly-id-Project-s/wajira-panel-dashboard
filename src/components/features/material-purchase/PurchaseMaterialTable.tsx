import Link from 'next/link';
import { useMemo } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import type { MaterialTransaction } from '@/types/material-transaction.types';

interface PurchaseMaterialTableProps {
  slug: string;
  data: MaterialTransaction[];
  totalData: number;
  page: number;
  perPage: number;
  search: string;
  isLoading?: boolean;
  onPageChange: (value: number) => void;
  onPerPageChange: (value: number) => void;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (item: MaterialTransaction) => void;
  onDelete: (item: MaterialTransaction) => void;
  title?: string;
  description?: string;
  codeHeader?: string;
  dateHeader?: string;
  counterpartyHeader?: string;
  routeBasePath?: string;
  loadingText?: string;
  emptyText?: string;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

const formatCurrency = (value: number) => {
  if (!value) return '-';
  return `Rp${value.toLocaleString('id-ID')}`;
};

const getPaymentStatusMeta = (item: MaterialTransaction) => {
  if (item.isPaid || item.totalUnpaid <= 0) {
    return {
      label: 'Lunas',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  return {
    label: 'Belum Lunas',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  };
};

export function PurchaseMaterialTable({
  slug,
  data,
  totalData,
  page,
  perPage,
  search,
  isLoading = false,
  onPageChange,
  onPerPageChange,
  onSearchChange,
  onAdd,
  onEdit,
  onDelete,
  title = 'Pembelian Material',
  description = 'Kelola data pembelian material',
  codeHeader = 'KODE BELI',
  dateHeader = 'TGL TAGIHAN',
  counterpartyHeader = 'SUPPLIER',
  routeBasePath = 'pembelian-material',
}: PurchaseMaterialTableProps) {
  const columns = useMemo<ColumnDef<MaterialTransaction>[]>(
    () => [
      {
        header: codeHeader,
        accessorKey: 'code',
        className: 'text-slate-800 font-medium',
        cell: (item) => item.code || '-',
      },
      {
        header: dateHeader,
        accessorKey: 'transactionDate',
        className: 'text-slate-800',
        cell: (item) => formatDate(item.transactionDate),
      },
      {
        header: counterpartyHeader,
        accessorKey: 'supplierName',
        className: 'text-slate-800',
        cell: (item) => item.supplierName || '-',
      },
      {
        header: 'NOMINAL',
        accessorKey: 'totalAmount',
        className: 'text-slate-800 font-medium',
        cell: (item) => formatCurrency(item.totalAmount),
      },
      {
        header: 'STATUS',
        cell: (item) => {
          const statusMeta = getPaymentStatusMeta(item);
          return (
            <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
              {statusMeta.label}
            </Badge>
          );
        },
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4 text-slate-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-md border-slate-200 p-2 shadow-lg">
                <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer rounded-md px-3 py-2 text-sm">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2 text-sm">
                  <Link href={`/dashboard/${slug}/${routeBasePath}/${item.id}`}>Detail</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(item)} className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 focus:text-red-600">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [codeHeader, counterpartyHeader, dateHeader, onDelete, onEdit, routeBasePath, slug],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <BaseTable
        data={data}
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
          lastPage: Math.max(1, Math.ceil((totalData || 0) / perPage)),
          total: totalData,
        }}
        onPageChange={onPageChange}
        headerActions={
          <Button onClick={onAdd} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Data
          </Button>
        }
      />
    </div>
  );
}
