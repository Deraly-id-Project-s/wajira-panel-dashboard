import * as React from 'react';
import { Eye, FilePenLine, MoreVertical, Plus, Search, Trash2 } from 'lucide-react';
import type { OrderList, OrderListStatus } from '@/@types/order-list.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import { cn } from '@/lib/utils';
import {
  formatOrderCurrency,
  getOrderVehicleTypeLabel,
  getOrderStatusBadgeClassName,
  getOrderStatusLabel,
  getPrimaryTarifItem,
  ORDER_LIST_STATUS_OPTIONS,
} from './order-list.utils';

interface OrderListTableProps {
  data: OrderList[];
  search: string;
  page: number;
  perPage: number;
  totalData: number;
  isLoading?: boolean;
  isRefetching?: boolean;
  onSearchChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onPerPageChange: (value: number) => void;
  onAdd: () => void;
  onDetail: (item: OrderList) => void;
  onEdit: (item: OrderList) => void;
  onDelete: (item: OrderList) => void;
  onUpdateStatus?: (item: OrderList, newStatus: OrderListStatus) => void;
}

const headers = [
  { key: 'code', label: 'KODE ORDER', align: 'left' },
  { key: 'customer', label: 'NAMA CUSTOMER', align: 'left', minWidth: '180px' },
  { key: 'loading_in', label: 'LOADING IN', align: 'left' },
  { key: 'destination', label: 'TUJUAN KIRIM', align: 'left', minWidth: '180px' },
  { key: 'loading_out', label: 'LOADING OUT', align: 'left' },
  { key: 'vehicle_type', label: 'TIPE', align: 'center' },
  { key: 'uj_driver', label: 'UJ DRIVER', align: 'right' },
  { key: 'invoice', label: 'INV EKSPEDISI', align: 'right' },
  { key: 'ppn', label: 'PPN', align: 'right' },
  { key: 'status', label: 'STATUS', align: 'center' },
  { key: 'action', label: 'aksi', align: 'center' },
];

export const OrderListTable = React.memo(function OrderListTable({
  data,
  search,
  page,
  perPage,
  totalData,
  isLoading = false,
  isRefetching = false,
  onSearchChange,
  onPageChange,
  onPerPageChange,
  onAdd,
  onDetail,
  onEdit,
  onDelete,
  onUpdateStatus,
}: OrderListTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalData / perPage));
  const visiblePages = getVisiblePageNumbers(totalPages, page, 5);
  const startData = totalData === 0 ? 0 : (page - 1) * perPage + 1;
  const endData = totalData === 0 ? 0 : Math.min(page * perPage, totalData);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Order List</h1>
          <p className="text-sm text-muted-foreground">Lihat dan kelola pesanan pelanggan dengan mudah.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search here"
              className="pl-9 bg-white"
            />
          </div>
          {isRefetching ? <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Memperbarui data...</span> : null}

          <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
            <span>Show</span>
            <Select value={String(perPage)} onValueChange={(value) => onPerPageChange(Number(value))}>
              <SelectTrigger className="w-[70px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>Page</span>
          </div>
        </div>

        <Button type="button" onClick={onAdd} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto shadow-none">
        <Table className="min-w-[1180px]">
          <TableHeader className="bg-[#f8f9fa] border-b border-gray-200">
            <TableRow className="border-slate-200">
              {headers.map((header) => (
                <TableHead
                  key={header.key}
                  className={cn(
                    'whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase text-slate-500',
                    header.align === 'left' && 'text-left',
                    header.align === 'center' && 'text-center',
                    header.align === 'right' && 'text-right',
                    header.key === 'action' && 'w-[80px] sticky right-0 bg-[#f8f9fa] z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]'
                  )}
                  style={header.minWidth ? { minWidth: header.minWidth } : undefined}
                >
                  {header.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: Math.min(perPage, 5) }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="group border-slate-100">
                  {headers.map((header) => (
                    <TableCell key={header.key} className={cn("text-center px-4 py-4", header.key === 'action' && "sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]")}>
                      <div className="h-4 min-w-[90px] animate-pulse rounded bg-slate-100" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
              : null}

            {!isLoading && data.length === 0 ? (
              <TableRow className="group">
                <TableCell colSpan={100} className="py-16 h-28 text-center text-sm text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="rounded-full bg-slate-50 p-4 mb-2">
                      <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-base font-semibold text-slate-900">Tidak ada data ditemukan</p>
                    <p className="text-sm text-slate-500">Belum ada data atau coba gunakan kata kunci pencarian lain.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoading
              ? data.map((item) => {
                const primaryTarif = getPrimaryTarifItem(item);

                return (
                  <TableRow key={item.id} className="group border-slate-100 transition-colors hover:bg-slate-50/70">
                    <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{item.code || '-'}</TableCell>
                    <TableCell className="min-w-[180px] px-4 py-4 text-left text-sm text-slate-700">{item.customer?.name || '-'}</TableCell>

                    <TableCell className="px-4 py-4 text-left text-sm text-slate-700">
                      {item.tarifs.length > 1 ? (
                        <div className="flex flex-col items-start text-left gap-1">
                          {item.tarifs.map((t, idx) => (
                            <div key={t.id || idx} className="whitespace-nowrap">
                              <span>{idx + 1}. {t.loadingIn || '-'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        primaryTarif?.loadingIn || item.loadingIn || '-'
                      )}
                    </TableCell>

                    <TableCell className="min-w-[180px] px-4 py-4 text-left text-sm text-slate-700">
                      {item.tarifs.length > 1 ? (
                        <div className="flex flex-col items-start text-left gap-1">
                          {item.tarifs.map((t, idx) => (
                            <div key={t.id || idx}>
                              <span>{idx + 1}. {t.deliveryDestination || '-'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        primaryTarif?.deliveryDestination || '-'
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-4 text-left text-sm text-slate-700">
                      {item.tarifs.length > 1 ? (
                        <div className="flex flex-col items-start text-left gap-1">
                          {item.tarifs.map((t, idx) => (
                            <div key={t.id || idx} className="whitespace-nowrap">
                              <span>{idx + 1}. {t.loadingOut || '-'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        primaryTarif?.loadingOut || item.loadingOut || '-'
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{getOrderVehicleTypeLabel(item, primaryTarif)}</TableCell>
                    <TableCell className="px-4 py-4 text-right text-sm text-slate-700">{formatOrderCurrency(item.ujDriver)}</TableCell>
                    <TableCell className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatOrderCurrency(item.billInvoice)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right text-sm text-slate-700">{formatOrderCurrency(item.ppn)}</TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium cursor-pointer transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
                              getOrderStatusBadgeClassName(item.status)
                            )}
                          >
                            {getOrderStatusLabel(item.status)}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-[140px] rounded-xl">
                          <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Ubah Status</div>
                          <DropdownMenuSeparator />
                          {ORDER_LIST_STATUS_OPTIONS.map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              disabled={item.status === option.value}
                              onSelect={(e) => {
                                e.preventDefault();
                                if (item.status !== option.value && onUpdateStatus) {
                                  onUpdateStatus(item, option.value);
                                }
                              }}
                              className={cn('cursor-pointer rounded-lg', item.status === option.value && 'bg-slate-100 opacity-50')}
                            >
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 cursor-pointer rounded-full">
                              <MoreVertical className="h-4 w-4 text-slate-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[190px] rounded-xl">
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                onDetail(item);
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                onEdit(item);
                              }}
                              className="cursor-pointer"
                            >
                              <FilePenLine className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                onDelete(item);
                              }}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
              : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between px-1">
        <p>Showing {startData}-{endData} of {totalData} data</p>
        <div className="flex flex-wrap items-center justify-end gap-1 text-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-9 rounded-xl px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
          >
            Previous
          </Button>
          {visiblePages[0] > 1 ? <span className="px-2 text-sm text-slate-500">1 ...</span> : null}
          {visiblePages.map((value) => (
            <Button
              key={value}
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(value)}
              className={cn(
                'h-9 min-w-9 rounded-xl border px-3 text-sm font-medium shadow-none',
                value === page
                  ? 'border-slate-200 bg-white text-slate-950 shadow-sm'
                  : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white',
              )}
            >
              {value}
            </Button>
          ))}
          {visiblePages[visiblePages.length - 1] < totalPages ? <span className="px-2 text-sm text-slate-500">... {totalPages}</span> : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-9 rounded-xl px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
});
