import React from 'react';
import { Search, MoreVertical, Printer, Edit, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';

interface DOEkspedisiTableProps {
  data: DoEkspedisi[];
  search: string;
  page: number;
  perPage: number;
  totalData: number;
  totalPages: number;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onEdit: (item: DoEkspedisi) => void;
  onDetail: (item: DoEkspedisi) => void;
  onDelete: (item: DoEkspedisi) => void;
  onPrint: (item: DoEkspedisi) => void;
}

const renderPagination = (page: number, totalPages: number): Array<number | string> => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, '...', totalPages];
  if (page >= totalPages - 3) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, '...', page - 1, page, page + 1, '...', totalPages];
};

export const DOEkspedisiTable = React.memo(function DOEkspedisiTable({
  data,
  search,
  page,
  perPage,
  totalData,
  totalPages,
  isLoading = false,
  onSearchChange,
  onPageChange,
  onPerPageChange,
  onEdit,
  onDetail,
  onDelete,
  onPrint,
}: DOEkspedisiTableProps) {
  const startData = totalData === 0 ? 0 : (page - 1) * perPage + 1;
  const endData = totalData === 0 ? 0 : Math.min(page * perPage, totalData);

  const renderPaginationNumbers = () => {
    const pages = renderPagination(page, totalPages);
    return pages.map((p, idx) => (
      <Button
        key={idx}
        variant="ghost"
        size="sm"
        disabled={p === '...'}
        onClick={() => typeof p === 'number' && onPageChange(p)}
        className={cn(
          'h-9 min-w-9 rounded-md border px-3 text-sm font-medium shadow-none',
          p === page
            ? 'border-slate-200 bg-white text-slate-950 shadow-sm'
            : p === '...'
              ? 'border-transparent bg-transparent text-slate-500 cursor-default hover:bg-transparent hover:border-transparent'
              : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white',
        )}
      >
        {p}
      </Button>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search here"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
            <span>Show</span>
            <Select value={String(perPage)} onValueChange={(value) => onPerPageChange(Number(value))}>
              <SelectTrigger className="w-[70px] bg-white">
                <SelectValue placeholder="25" />
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
      </div>

      <div className="rounded-md border border-gray-200 bg-white overflow-x-auto shadow-none">
        <Table className="min-w-[980px]">
          <TableHeader className="bg-[#f8f9fa] border-b border-gray-200">
            <TableRow className="hover:bg-[#f8f9fa]">
              <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Kode DO</TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Kode Order</TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Tanggal</TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Nama Driver</TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">No Polisi</TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase text-slate-500 px-4 py-4">Tipe</TableHead>
              <TableHead className="w-[80px] px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase sticky right-0 bg-[#f8f9fa] z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]" AksiTableHead>
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
              data.map((item) => (
                <TableRow key={item.id} className="group border-b border-[#EEF2F6] last:border-0 hover:bg-gray-50 transition-colors">
                  <TableCell className="px-4 py-4 text-center text-sm font-medium text-slate-800">{item.doCode || '-'}</TableCell>
                  <TableCell className="px-4 py-4 text-center text-sm text-slate-600">{item.orderCode || item.orderList?.code || '-'}</TableCell>
                  <TableCell className="px-4 py-4 text-center text-sm text-slate-600">
                    {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-center text-sm text-slate-600">{item.driver?.name || '-'}</TableCell>
                  <TableCell className="px-4 py-4 text-center text-sm text-slate-600">{item.vehicle?.registrationNumber || '-'}</TableCell>
                  <TableCell className="px-4 py-4 text-center text-sm text-slate-600">{item.vehicle?.type || '-'}</TableCell>
                  <TableCell className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                          <DropdownMenuItem onClick={() => onEdit(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDetail(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" />
                            Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onPrint(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(item)} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" />
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

      <div className="flex flex-col gap-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between px-1">
        <div>
          Showing {startData}-{endData} of {totalData} data
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-end gap-1 text-slate-800">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>

            {renderPaginationNumbers()}

            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
