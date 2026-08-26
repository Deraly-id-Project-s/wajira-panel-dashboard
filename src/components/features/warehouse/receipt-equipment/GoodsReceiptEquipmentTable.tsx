import Link from 'next/link';
import { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { GoodsReceiptEquipment } from '@/@types/goods-receipt-equipment.types';
import { formatDate, formatCurrency, getReceiptBilling } from './goodsReceiptEquipment.utils';

interface GoodsReceiptEquipmentTableProps {
  data: GoodsReceiptEquipment[];
  isLoading: boolean;
  isFetching?: boolean;
  slug: string;
  onUploadInvoice: (item: GoodsReceiptEquipment) => void;
  onPayBilling?: (item: GoodsReceiptEquipment) => void;
  onCreateBilling?: (item: GoodsReceiptEquipment) => void;
  onDelete: (item: GoodsReceiptEquipment) => void;
}

export function GoodsReceiptEquipmentTable({
  data,
  isLoading,
  slug,
  onUploadInvoice,
  onPayBilling,
  onCreateBilling,
  onDelete,
}: GoodsReceiptEquipmentTableProps) {
  const columns = useMemo<ColumnDef<GoodsReceiptEquipment>[]>(
    () => [
      {
        header: 'KODE TRANSAKSI',
        accessorKey: 'code',
        className: 'font-medium text-slate-900',
        cell: (item) => item.code || '-',
      },
      {
        header: 'TANGGAL TERIMA',
        accessorKey: 'transactionDate',
        className: 'text-slate-700',
        cell: (item) => formatDate(item.transactionDate),
      },
      {
        header: 'SUPPLIER',
        accessorKey: 'supplier.name',
        className: 'text-slate-700',
        cell: (item) => item.supplier?.name || '-',
      },
      {
        header: 'LOKASI',
        accessorKey: 'location',
        className: 'text-slate-700',
        cell: (item) => item.location || '-',
      },
      {
        header: 'TOTAL HARGA',
        accessorKey: 'totalBrutto',
        className: 'font-semibold text-slate-900',
        cell: (item) => formatCurrency(item.totalBrutto),
      },
      {
        header: 'STATUS',
        cell: (item) => {
          const billing = getReceiptBilling(item as any);
          const isPaid = item.isPaid || billing?.isPaid;

          return isPaid ? (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              Lunas
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/15">
              Belum Lunas
            </span>
          );
        },
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => {
          const hasBilling = item.goodsTransactionBillings && item.goodsTransactionBillings.length > 0;
          const billing = getReceiptBilling(item as any);
          const isPaid = item.isPaid || billing?.isPaid;

          return (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                  <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                    <Link href={`/dashboard/${slug}/warehouse/perlengkapan-masuk/${item.id}/edit`}>Edit</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                    <Link href={`/dashboard/[slug]/warehouse/perlengkapan-masuk/${item.id}`.replace('[slug]', slug)}>Detail</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setTimeout(() => onUploadInvoice(item), 100);
                    }}
                    className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                  >
                    Upload Invoice
                  </DropdownMenuItem>

                  {!isPaid && !hasBilling && onCreateBilling && (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setTimeout(() => onCreateBilling(item), 100);
                      }}
                      className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                    >
                      Buat Billing
                    </DropdownMenuItem>
                  )}

                  {!isPaid && hasBilling && onPayBilling && (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setTimeout(() => onPayBilling(item), 100);
                      }}
                      className="rounded-lg px-3 py-2 text-sm text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 cursor-pointer"
                    >
                      Bayar Billing
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setTimeout(() => onDelete(item), 100);
                    }}
                    className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                  >
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onCreateBilling, onDelete, onPayBilling, onUploadInvoice, slug],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
    />
  );
}
