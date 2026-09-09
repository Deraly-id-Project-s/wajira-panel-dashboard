'use client';

import { useMemo, useState } from 'react';
import { Check, Search, SendHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DispatchUnitTableRow } from '@/@types/pengeluaran-unit.types';
import { PaginationMeta } from '@/@types/pagination.types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';

interface Props {
  data: DispatchUnitTableRow[];
  meta: PaginationMeta;
  search: string;
  perPage: number;
  page: number;
  selectedIds: number[];
  isLoading: boolean;
  isError: boolean;
  isSubmitting?: boolean;
  errorMessage?: string;
  onSearchChange: (value: string) => void;
  onPerPageChange: (value: number) => void;
  onPageChange: (value: number) => void;
  onSelectedIdsChange: (ids: number[]) => void;
  onKirim: (ids: number[]) => Promise<void>;
  onCancel?: () => void;
  onRetry?: () => void;
}

export default function PengeluaranUnitCreateTable({
  data,
  meta,
  search,
  perPage,
  page,
  selectedIds,
  isLoading,
  isError,
  isSubmitting,
  errorMessage,
  onSearchChange,
  onPerPageChange,
  onPageChange,
  onSelectedIdsChange,
  onKirim,
  onCancel,
  onRetry,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'issued'>('all');
  const totalPages = Math.max(1, meta.lastPage);
  const filteredData = useMemo(() => {
    if (statusFilter === 'issued') {
      return data.filter((item) => item.isDispatched);
    }

    if (statusFilter === 'pending') {
      return data.filter((item) => !item.isDispatched);
    }

    return data;
  }, [data, statusFilter]);

  const issuedCount = data.filter((item) => item.isDispatched).length;
  const pendingCount = data.length - issuedCount;

  const effectiveSelectedCount = selectedIds.length + issuedCount;

  const toggleSelect = (id: number) => {
    const row = data.find((item) => item.unitTransactionItemDetailId === id);
    if (!row || row.isDispatched) return;

    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter((item) => item !== id));
      return;
    }

    onSelectedIdsChange([...selectedIds, id]);
  };

  const toggleAllOnPage = () => {
    if (filteredData.length === 0) return;

    const pageIds = filteredData.filter((item) => !item.isDispatched).map((item) => item.unitTransactionItemDetailId);
    if (pageIds.length === 0) return;

    const allSelected = pageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      onSelectedIdsChange(selectedIds.filter((id) => !pageIds.includes(id)));
      return;
    }

    onSelectedIdsChange(Array.from(new Set([...selectedIds, ...pageIds])));
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let index = 1; index <= totalPages; index += 1) pages.push(index);
    } else if (page <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (page >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
    }
    return pages;
  };

  const startIndex = meta.total === 0 || filteredData.length === 0 ? 0 : (meta.currentPage - 1) * meta.perPage + 1;
  const endIndex = meta.total === 0 || filteredData.length === 0 ? 0 : Math.min(startIndex + filteredData.length - 1, meta.total);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search here" value={search} onChange={(event) => onSearchChange(event.target.value)} className="pl-9 bg-white" />
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

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Status</span>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'issued') => setStatusFilter(value)}>
              <SelectTrigger className="h-10 w-[190px] border-gray-200 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="pending">Belum Dikeluarkan</SelectItem>
                <SelectItem value="issued">Sudah Dikeluarkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-gray-200 text-gray-700">Total tampil: {filteredData.length}</Badge>
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Sudah Dikeluarkan: {issuedCount}</Badge>
        <Badge variant="outline" className="border-amber-200 text-amber-700">Belum Dikeluarkan: {pendingCount}</Badge>
      </div>

      <div className="flex items-center justify-between min-h-[40px]">
        <div className="flex items-center gap-2 text-[15px] text-gray-500">
          <Check size={20} className="text-[#1FBE78]" strokeWidth={2.5} />
          <span>{effectiveSelectedCount} data tercentang ({selectedIds.length} siap dikirim)</span>
        </div>

        <div className="flex items-center gap-3">
          {onCancel ? (
            <Button variant="ghost" size="sm" className="h-10 px-6 font-medium text-gray-600 hover:text-gray-900 bg-transparent" onClick={onCancel}>
              Batal
            </Button>
          ) : null}
          <Button
            size="sm"
            className="h-10 px-5 bg-[#1FBE78] hover:bg-[#19ac6c] font-medium rounded-md gap-2 text-white"
            onClick={() => void onKirim(selectedIds)}
            disabled={selectedIds.length === 0 || isSubmitting || isLoading || isError}
          >
            <SendHorizontal size={16} /> {isSubmitting ? 'Mengirim...' : 'Kirim'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
        <Table className="w-full text-sm">
          <TableHeader className="bg-[#f8f9fa] border-b border-gray-200">
            <TableRow>
              <TableHead className="px-4 py-4 text-center w-[48px]">
                <Checkbox
                  checked={
                    filteredData.filter((item) => !item.isDispatched).length > 0 &&
                    filteredData.filter((item) => !item.isDispatched).every((item) => selectedIds.includes(item.unitTransactionItemDetailId))
                  }
                  onCheckedChange={toggleAllOnPage}
                />
              </TableHead>
              <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500 whitespace-nowrap">NO</TableHead>
              <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500 whitespace-nowrap">KODE JUAL</TableHead>
              <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500 whitespace-nowrap">TIPE UNIT</TableHead>
              <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500 whitespace-nowrap">WARNA</TableHead>
              <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500 whitespace-nowrap">NO MESIN</TableHead>
              <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500 whitespace-nowrap">NO RANGKA</TableHead>
              <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500 whitespace-nowrap">STATUS PENGELUARAN</TableHead>
              <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500 whitespace-nowrap">STATUS STOCK</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow className="group">
                <TableCell colSpan={9} className="text-center px-4 py-4 sticky right-0 bg-white  z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                  <LoadingState variant="section" text="Memuat data..." />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow className="group">
                <TableCell colSpan={9} className="px-4 py-8 text-center text-red-600 text-sm">
                  <LoadingState variant="section" text="Memuat data..." />
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow className="group">
                <TableCell colSpan={100} className="px-4 py-16 text-center text-gray-500 text-sm">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="rounded-full bg-slate-50 p-4 mb-2">
                      <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-base font-semibold text-slate-900">Tidak ada data ditemukan</p>
                    <p className="text-sm text-slate-500">Belum ada data atau coba gunakan kata kunci pencarian lain.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => (
                <TableRow key={item.id} className="group hover:bg-gray-50/70 border-b transition-colors border-slate-100">
                  <TableCell className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                    <Checkbox checked={item.isDispatched || selectedIds.includes(item.unitTransactionItemDetailId)} disabled={item.isDispatched} onCheckedChange={() => toggleSelect(item.unitTransactionItemDetailId)} />
                  </TableCell>
                  <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{startIndex + index}</TableCell>
                  <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{item.salesCode}</TableCell>
                  <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{item.unitTypeName}</TableCell>
                  <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{item.color}</TableCell>
                  <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{item.machineNumber}</TableCell>
                  <TableCell className="px-4 py-4 text-left text-sm text-slate-700">{item.chassisNumber}</TableCell>
                  <TableCell className="px-4 py-4 text-left text-sm text-slate-700">
                    {item.isDispatched ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Dikeluarkan</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 text-amber-700">Belum Dikeluarkan</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-left text-sm text-slate-700">
                    {item.inStock === true ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Tersedia</Badge>
                    ) : item.inStock === false ? (
                      <Badge variant="outline" className="border-amber-200 text-amber-700">Terjual</Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-200 text-gray-700">-</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
        <div>
          Showing {startIndex === 0 && endIndex === 0 ? 0 : startIndex}-{endIndex} of {meta.total} data
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-transparent hover:text-gray-900 px-3" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </Button>
          {getPageNumbers().map((pageNumber, index) => (
            <Button
              key={`${String(pageNumber)}-${index}`}
              variant={pageNumber === page ? 'outline' : 'ghost'}
              size="sm"
              className={`w-8 h-8 p-0 border-gray-200 ${pageNumber === page ? 'text-gray-900 hover:bg-gray-50' : 'text-gray-600 hover:bg-transparent hover:text-gray-900 border-transparent'}`}
              onClick={() => {
                if (typeof pageNumber === 'number') onPageChange(pageNumber);
              }}
              disabled={typeof pageNumber !== 'number'}
            >
              {pageNumber}
            </Button>
          ))}
          <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-transparent hover:text-gray-900 px-3" disabled={page >= totalPages || meta.total === 0} onClick={() => onPageChange(page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
