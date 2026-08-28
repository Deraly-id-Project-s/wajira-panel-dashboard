import Link from 'next/link';
import { useMemo } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import type { GoodsReceipt } from '@/@types/goods-receipt.types';
import { formatCurrency, formatDate, getReceiptStatusLabel } from './goods-receipt.utils';

interface GoodsReceiptTableProps {
  slug: string;
  data: GoodsReceipt[];
  totalData: number;
  page: number;
  perPage: number;
  search: string;
  isLoading?: boolean;
  canAdd?: boolean;
  onPageChange: (value: number) => void;
  onPerPageChange: (value: number) => void;
  onSearchChange: (value: string) => void;
  onAdd?: () => void;
  onPay: (item: GoodsReceipt) => void;
  onUpload: (item: GoodsReceipt) => void;
  onDelete?: (item: GoodsReceipt) => void;
}

export function GoodsReceiptTable({
  slug,
  data,
  totalData,
  page,
  perPage,
  search,
  isLoading = false,
  canAdd = false,
  onPageChange,
  onPerPageChange,
  onSearchChange,
  onAdd,
  onPay,
  onUpload,
  onDelete,
}: GoodsReceiptTableProps) {
  const columns = useMemo<ColumnDef<GoodsReceipt>[]>(
    () => [
      {
        header: 'KODE BELI',
        accessorKey: 'code',
        className: 'text-slate-700 font-medium',
        cell: (item) => item.code || '-',
      },
      {
        header: 'TANGGAL',
        accessorKey: 'transactionDate',
        className: 'text-slate-700',
        cell: (item) => formatDate(item.transactionDate),
      },
      {
        header: 'SUPPLIER',
        accessorKey: 'supplier.name',
        className: 'text-slate-700',
        cell: (item) => item.supplier?.name ?? '-',
      },
      {
        header: 'HARGA BELI',
        accessorKey: 'totalBrutto',
        className: 'text-slate-700 font-medium',
        cell: (item) => formatCurrency(item.totalBrutto),
      },
      {
        header: 'STATUS',
        className: 'text-slate-700',
        cell: (item) => getReceiptStatusLabel(item),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  <Link href={`/dashboard/${slug}/warehouse/penerimaan-material/${item.id}/edit`}>Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  <Link href={`/dashboard/${slug}/warehouse/penerimaan-material/${item.id}`}>Detail</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPay(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Bayar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpload(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Upload Nota
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(item)} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                    Hapus
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onDelete, onPay, onUpload, slug],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Penerimaan Material"
        subtitle="Kelola dan lacak semua data penerimaan stock material"
      />

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
          <Button onClick={() => onAdd?.()} disabled={!canAdd} className="btn-primary!">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Data
          </Button>
        }
      />
    </div>
  );
}
