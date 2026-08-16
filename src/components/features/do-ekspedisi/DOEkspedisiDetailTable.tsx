import React from 'react';
import { MoreVertical, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DoEkspedisiItem } from '@/@types/do-ekspedisi.types';
import { formatCurrency } from '@/lib/utils/currency';
import { LoadingState } from '@/components/ui/loading-state';

interface DOEkspedisiDetailTableProps {
  data: DoEkspedisiItem[];
  page: number;
  perPage: number;
  isLoading?: boolean;
  onView: (item: DoEkspedisiItem) => void;
  onEdit: (item: DoEkspedisiItem) => void;
  onDelete: (item: DoEkspedisiItem) => void;
}

export function DOEkspedisiDetailTable({
  data,
  page,
  perPage,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
}: DOEkspedisiDetailTableProps) {
  const getDestinationSummary = (item: DoEkspedisiItem) => {
    if (item.destinations && item.destinations.length > 0) {
      return item.destinations.map((destination) => destination.destination).filter(Boolean).join(', ');
    }

    return item.destination || '-';
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white overflow-x-auto shadow-none">s*<Table className="min-w-[1500px]">
      <TableHeader className="bg-[#f8f9fa] border-b border-gray-200">
        <TableRow className="hover:bg-[#f8f9fa]">
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">No</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Customer</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Loading In</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Tujuan Kirim</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Loading Out</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Keterangan</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">UJ Driver</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">UJ Lainnya</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Invoice</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Invoice Tambahan</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">PPN</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Fee</TableHead>
          <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4 w-[80px] sticky right-0 bg-[#f8f9fa] z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]" AksiTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <tr>
            <td colSpan={100} className="px-4 py-16 text-center bg-white">
              <LoadingState variant="section" text="Memuat data..." />
            </td>
          </tr>
        ) : data.length > 0 ? (
          data.map((item, index) => (
            <TableRow key={item.id} className="group border-b border-[#EEF2F6] last:border-0 hover:bg-gray-50 transition-colors">
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{(page - 1) * perPage + index + 1}</TableCell>
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{item.customerName || '-'}</TableCell>
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{item.loadingIn || '-'}</TableCell>
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{getDestinationSummary(item)}</TableCell>
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{item.loadingOut || '-'}</TableCell>
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{item.driverNote || '-'}</TableCell>
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{formatCurrency(item.driverFee)}</TableCell>
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{formatCurrency(item.otherFee)}</TableCell>
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{formatCurrency(item.invoiceFee)}</TableCell>
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{formatCurrency(item.additionalCostFee)}</TableCell>
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{formatCurrency(item.ppnFee)}</TableCell>
              <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{formatCurrency(item.serviceFee)}</TableCell>
              <TableCell className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                      <DropdownMenuItem onClick={() => onView(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                        Detail
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(item)} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow className="group">
            <TableCell colSpan={100} className="py-16 h-32 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="rounded-full bg-slate-50 p-4 mb-2">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-900">Tidak ada data ditemukan</p>
                <p className="text-sm text-slate-500">Belum ada data atau coba gunakan kata kunci pencarian lain.</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
    </div>
  );
}
