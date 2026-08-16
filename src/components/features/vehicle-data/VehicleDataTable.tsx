import { CheckCircle2, Download, MoreVertical, Plus, Search, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { getVisiblePageNumbers } from '@/lib/api/pagination';
import type { VehicleData } from '@/@types/vehicle-data.types';
import { SearchableSelect, type SearchableSelectOption } from './SearchableSelect';
import { LoadingState } from '@/components/ui/loading-state';

interface VehicleDataTableProps {
  items: VehicleData[];
  isLoading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  perPage: number;
  totalData: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  selectedIds: number[];
  assignedIds: number[];
  onSelectedIdsChange: (ids: number[]) => void;
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
  onDetail: (item: VehicleData) => void;
  onEdit: (item: VehicleData) => void;
  onDelete: (item: VehicleData) => void;
  isExporting?: boolean;
  vendorId: string;
  onVendorIdChange: (value: string) => void;
  vendorOptions: SearchableSelectOption[];
  onVendorSearchChange: (value: string) => void;
  processDate?: Date;
  onProcessDateChange: (value?: Date) => void;
  onSubmitAssign: () => void;
  isAssigning?: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd/MM/yyyy');
};

export function VehicleDataTable({
  items,
  isLoading = false,
  search,
  onSearchChange,
  page,
  perPage,
  totalData,
  onPageChange,
  onPerPageChange,
  selectedIds,
  assignedIds,
  onSelectedIdsChange,
  onAdd,
  onImport,
  onExport,
  onDetail,
  onEdit,
  onDelete,
  isExporting = false,
  vendorId,
  onVendorIdChange,
  vendorOptions,
  onVendorSearchChange,
  processDate,
  onProcessDateChange,
  onSubmitAssign,
  isAssigning = false,
}: VehicleDataTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalData / perPage));
  const startData = totalData === 0 ? 0 : (page - 1) * perPage + 1;
  const endData = Math.min(page * perPage, totalData);
  const currentPageSelectableIds = items.filter((item) => !assignedIds.includes(item.id)).map((item) => item.id);
  const allSelected = currentPageSelectableIds.length > 0 && currentPageSelectableIds.every((id) => selectedIds.includes(id));
  const visiblePages = getVisiblePageNumbers(totalPages, page, 5);
  const assignedCountOnPage = items.filter((item) => assignedIds.includes(item.id)).length;
  const selectedPendingCount = selectedIds.filter((id) => !assignedIds.includes(id)).length;

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const next = Array.from(new Set([...selectedIds, ...currentPageSelectableIds]));
      onSelectedIdsChange(next);
      return;
    }

    onSelectedIdsChange(selectedIds.filter((id) => !currentPageSelectableIds.includes(id)));
  };

  const handleSelectRow = (id: number, checked: boolean | 'indeterminate') => {
    if (checked === true) {
      onSelectedIdsChange(Array.from(new Set([...selectedIds, id])));
      return;
    }

    onSelectedIdsChange(selectedIds.filter((value) => value !== id));
  };

  const handleResetAssign = () => {
    onVendorIdChange('');
    onProcessDateChange(undefined);
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_1.15fr_auto] lg:items-end">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">Tanggal Proses</label>
            <DatePicker value={processDate} onChange={onProcessDateChange} placeholder="Pilih tanggal proses" className="h-11 rounded-md bg-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">Nama Vendor</label>
            <SearchableSelect
              value={vendorId}
              onChange={onVendorIdChange}
              options={vendorOptions}
              onSearchChange={onVendorSearchChange}
              placeholder="Pilih vendor"
              searchPlaceholder="Cari vendor..."
              emptyText="Vendor tidak ditemukan."
              className="h-11 rounded-md bg-white"
            />
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button variant="outline" onClick={handleResetAssign} className="h-11 rounded-md px-5">
              Reset
            </Button>
            <Button onClick={onSubmitAssign} disabled={isAssigning} className="h-11 rounded-md bg-[#22c55e] px-5 hover:bg-[#16a34a]">
              {isAssigning ? 'Memproses...' : 'Serahkan'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative w-full md:w-[325px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search here" className="h-11 rounded-md border-slate-200 bg-white pl-10" />
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

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {assignedIds.length} data sudah di-assign
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
              {selectedPendingCount} data siap di-assign
            </div>
            {assignedCountOnPage > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                {assignedCountOnPage} data di halaman ini sudah di-assign
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
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
            <TableHead className="w-14 px-4 py-4 text-center">
              <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} aria-label="Pilih semua data kendaraan" />
            </TableHead>
            <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">Kode Ditlantas</TableHead>
            <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">Dealer</TableHead>
            <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">Nama STNK</TableHead>
            <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">Wilayah</TableHead>
            <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">Tipe Motor</TableHead>
            <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">No Mesin</TableHead>
            <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">No Rangka</TableHead>
            <TableHead className="px-4 py-4 text-center text-xs font-semibold uppercase text-slate-500">Tgl Faktur</TableHead>
            <TableHead className="px-4 py-4 text-center text-xs font-semibold uppercase text-slate-500">Tgl Terima Faktur</TableHead>
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
              <TableRow key={item.id} className={`group ${assignedIds.includes(item.id) ? 'border-b border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/60 transition-colors' : 'border-b border-slate-200 hover:bg-gray-50/70 transition-colors'}`}>
                <TableCell className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                  <Checkbox
                    checked={assignedIds.includes(item.id) || selectedIds.includes(item.id)}
                    disabled={assignedIds.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectRow(item.id, checked)}
                    aria-label={`Pilih data kendaraan ${item.invoiceNumber}`}
                  />
                </TableCell>
                <TableCell className="px-4 py-4 text-sm font-medium text-slate-900 text-left">
                  {item.ditlantasProcess?.[0]?.code || '-'}
                </TableCell>
                <TableCell className="max-w-[220px] px-4 py-4 text-sm text-slate-700 text-left">
                  <div className="space-y-2">
                    <div className="line-clamp-2 uppercase font-medium text-slate-900">{item.dealer?.namaDealer || '-'}</div>
                    {assignedIds.includes(item.id) ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Sudah assign Ditlantas
                      </span>
                    ) : selectedIds.includes(item.id) ? (
                      <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                        Siap di-assign
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-slate-700 text-left">{item.stnkName || '-'}</TableCell>
                <TableCell className="px-4 py-4 text-sm text-slate-700 text-left">{item.region?.name || '-'}</TableCell>
                <TableCell className="px-4 py-4 text-sm text-slate-700 text-left">{item.motorcycleType || item.motorcycleModel || '-'}</TableCell>
                <TableCell className="px-4 py-4 text-sm text-slate-700 text-left font-medium">{item.machineNumber || '-'}</TableCell>
                <TableCell className="px-4 py-4 text-sm text-slate-700 text-left">{item.chassisNumber || '-'}</TableCell>
                <TableCell className="px-4 py-4 text-sm text-slate-700 text-center">{formatDate(item.invoiceDate)}</TableCell>
                <TableCell className="px-4 py-4 text-sm text-slate-700 text-center">{formatDate(item.invoiceReceiveDate)}</TableCell>
                <TableCell className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[170px]">
                      <DropdownMenuItem onClick={() => onDetail(item)} className="cursor-pointer">Detail</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(item)} className="cursor-pointer text-red-600 focus:text-red-600">Hapus</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
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
          )}
        </TableBody>
      </Table>
      </div>

      <div className="flex flex-col gap-4 px-1 pb-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500">
          Showing {startData}-{endData} of {totalData} data
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-700">
          <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="rounded-md px-3">
            Previous
          </Button>
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
          <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="rounded-md px-3">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}