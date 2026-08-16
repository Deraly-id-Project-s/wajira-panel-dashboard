import { Download, MoreVertical, Plus, Search, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import type { VehicleDocumentSummary } from '@/@types/vehicle-document.types';
import { LoadingState } from '@/components/ui/loading-state';

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
  const visiblePages = getVisiblePageNumbers(totalPages, page, 5);
  const startData = totalData === 0 ? 0 : (page - 1) * perPage + 1;
  const endData = Math.min(page * perPage, totalData);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative w-full md:w-[380px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search here" className="h-11 rounded-md border-slate-200 bg-white pl-11" />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>Show</span>
            <Select value={String(perPage)} onValueChange={(value) => onPerPageChange(Number(value))}>
              <SelectTrigger className="h-11 w-[90px] rounded-md border-slate-200 bg-white">
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

        <div className="flex flex-wrap gap-2 xl:justify-end">
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
      </div>

      <div className="overflow-x-auto rounded-[16px] border border-slate-200 bg-white shadow-sm">s*<Table>
        <TableHeader className="bg-[#f8f9fa] border-b border-gray-200">
          <TableRow className="border-slate-200 hover:bg-transparent">
            <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">Kode Dokumen</TableHead>
            <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">Kode Ditlantas</TableHead>
            <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">Vendor</TableHead>
            <TableHead className="px-4 py-4 text-center text-xs font-semibold uppercase text-slate-500">Tanggal Terima</TableHead>
            <TableHead className="px-4 py-4 text-center text-xs font-semibold uppercase text-slate-500">Processed</TableHead>
            <TableHead className="px-4 py-4 text-center text-xs font-semibold uppercase text-slate-500">Unprocessed</TableHead>
            <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">Deskripsi</TableHead>
            <TableHead className="px-4 py-4 text-center text-xs font-semibold uppercase text-slate-500">Tanggal Dibuat</TableHead>
            <TableHead className="px-4 py-4 text-center text-xs font-semibold uppercase text-slate-500 w-[80px] sticky right-0 bg-[#f8f9fa] z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]" AksiTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <tr>
              <td colSpan={100} className="px-4 py-16 text-center bg-white">
                <LoadingState variant="section" text="Memuat data..." />
              </td>
            </tr>
          ) : items.length ? (
            items.map((item) => (
              <TableRow key={item.id} className="group border-b border-slate-200 hover:bg-gray-50/70 transition-colors">
                <TableCell className="px-4 py-4 text-sm font-medium text-slate-900 text-left">{item.code || '-'}</TableCell>
                <TableCell className="px-4 py-4 text-sm text-slate-700 text-left">{item.ditlantasProcess?.code || '-'}</TableCell>
                <TableCell className="px-4 py-4 text-sm text-slate-700 text-left">{item.ditlantasProcess?.vendor?.name || '-'}</TableCell>
                <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{formatDate(item.receiptDate)}</TableCell>
                <TableCell className="px-4 py-4 text-center text-sm font-semibold text-emerald-600">{item.processedCount}</TableCell>
                <TableCell className="px-4 py-4 text-center text-sm font-semibold text-amber-600">{item.unprocessedCount}</TableCell>
                <TableCell className="max-w-[220px] truncate px-4 py-4 text-sm text-slate-700 text-left">{item.description || '-'}</TableCell>
                <TableCell className="px-4 py-4 text-center text-sm text-slate-700">{formatDate(item.createdAt)}</TableCell>
                <TableCell className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">Detail / Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(item)} className="cursor-pointer text-red-600 focus:text-red-600">Hapus</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="group">
              <TableCell colSpan={100} className="h-28 text-center text-sm text-slate-500 px-4 py-16">
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

      <div className="flex flex-col gap-4 px-1 pb-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500">Showing {startData}-{endData} of {totalData} data</div>
        <div className="flex items-center gap-1 text-sm text-slate-700">
          <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="rounded-md px-3">Previous</Button>
          {visiblePages[0] > 1 ? <span className="px-1 text-slate-400">...</span> : null}
          {visiblePages.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className="h-9 min-w-9 rounded-md border-slate-200"
            >
              {pageNumber}
            </Button>
          ))}
          {visiblePages[visiblePages.length - 1] < totalPages ? <span className="px-1 text-slate-400">...</span> : null}
          <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="rounded-md px-3">Next</Button>
        </div>
      </div>
    </div>
  );
}
