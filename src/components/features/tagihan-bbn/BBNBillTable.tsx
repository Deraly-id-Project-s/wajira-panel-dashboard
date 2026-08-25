import { useMemo } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import type { BBNBill } from '@/@types/bbn-bill.types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { calculateOutstanding, formatBillCode, formatCurrency, formatShortDate } from '@/components/features/tagihan-bbn/utils';

interface Props {
  items: BBNBill[];
  search: string;
  isLoading?: boolean;
  page: number;
  perPage: number;
  totalData: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (value: number) => void;
  onAdd: () => void;
  onDetail: (item: BBNBill) => void;
  onEdit: (item: BBNBill) => void;
  onPay: (item: BBNBill) => void;
  onPrint: (item: BBNBill) => void;
  onDelete: (item: BBNBill) => void;
}

export function BBNBillTable({
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
  onDetail,
  onEdit,
  onPay,
  onPrint,
  onDelete,
}: Props) {
  void onEdit;

  const columns = useMemo<ColumnDef<BBNBill>[]>(
    () => [
      {
        header: 'NOMOR TAGIHAN',
        accessorKey: 'code',
        className: 'font-medium text-slate-900',
        cell: (item) => item.code || formatBillCode(item.id),
      },
      {
        header: 'KODE DITLANTAS',
        accessorKey: 'ditlantasProcess.code',
        className: 'text-slate-700',
        cell: (item) => item.ditlantasProcess?.code || '-',
      },
      {
        header: 'TGL TAGIHAN',
        accessorKey: 'billDate',
        alignment: 'center',
        cell: (item) => formatShortDate(item.billDate),
      },
      {
        header: 'NAMA DEALER',
        className: 'uppercase text-slate-700',
        cell: (item) => item.ditlantasProcess?.vendor?.name || item.dealer?.name || '-',
      },
      {
        header: 'TGL BAYAR',
        accessorKey: 'paidDate',
        alignment: 'center',
        cell: (item) => formatShortDate(item.paidDate),
      },
      {
        header: 'TOTAL TAGIHAN',
        accessorKey: 'bruttoAmount',
        alignment: 'center',
        cell: (item) => formatCurrency(item.bruttoAmount),
      },
      {
        header: 'TERBAYAR',
        accessorKey: 'paidAmount',
        alignment: 'center',
        cell: (item) => formatCurrency(item.paidAmount),
      },
      {
        header: 'KURANG BAYAR',
        alignment: 'center',
        className: 'font-semibold text-slate-700',
        cell: (item) =>
          formatCurrency(
            item.remainingAmount !== undefined
              ? item.remainingAmount
              : calculateOutstanding(item.bruttoAmount, item.paidAmount),
          ),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] rounded-md bg-white shadow-md border border-slate-100 p-1.5">
                <DropdownMenuItem onClick={() => onDetail(item)} className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPay(item)} className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  Bayar Tagihan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrint(item)} className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  Print
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(item)} className="cursor-pointer rounded-lg px-3 py-2 text-sm text-red-600 focus:text-red-600 hover:bg-slate-50">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onDelete, onDetail, onPay, onPrint],
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
        lastPage: Math.max(1, Math.ceil(totalData / perPage)),
        total: totalData,
      }}
      onPageChange={onPageChange}
      headerActions={
        <Button onClick={onAdd} className="button-theme-1!">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Data
        </Button>
      }
    />
  );
}
