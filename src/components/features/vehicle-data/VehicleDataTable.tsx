import { useMemo } from 'react';
import { CheckCircle2, Download, MoreVertical, Plus, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DatePicker } from '@/components/ui/date-picker';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import type { VehicleData } from '@/types/vehicle-data.types';
import { SearchableSelect, type SearchableSelectOption } from './SearchableSelect';

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
  const assignedCountOnPage = items.filter((item) => assignedIds.includes(item.id)).length;
  const selectedPendingCount = selectedIds.filter((id) => !assignedIds.includes(id)).length;

  const handleResetAssign = () => {
    onVendorIdChange('');
    onProcessDateChange(undefined);
  };

  const columns = useMemo<ColumnDef<VehicleData>[]>(
    () => [
      {
        header: 'Kode Ditlantas',
        accessorKey: 'ditlantasProcess.0.code',
        alignment: 'left',
        className: 'font-medium text-slate-900',
        cell: (item) => item.ditlantasProcess?.[0]?.code || '-',
      },
      {
        header: 'Dealer',
        accessorKey: 'dealer.namaDealer',
        alignment: 'left',
        className: 'max-w-[220px] text-slate-700',
        cell: (item) => (
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
        ),
      },
      {
        header: 'Nama STNK',
        accessorKey: 'stnkName',
        alignment: 'left',
        className: 'text-slate-700',
        cell: (item) => item.stnkName || '-',
      },
      {
        header: 'Wilayah',
        accessorKey: 'region.name',
        alignment: 'left',
        className: 'text-slate-700',
        cell: (item) => item.region?.name || '-',
      },
      {
        header: 'Tipe Motor',
        alignment: 'left',
        className: 'text-slate-700',
        cell: (item) => item.motorcycleType || item.motorcycleModel || '-',
      },
      {
        header: 'No Mesin',
        accessorKey: 'machineNumber',
        alignment: 'left',
        className: 'font-medium text-slate-700',
        cell: (item) => item.machineNumber || '-',
      },
      {
        header: 'No Rangka',
        accessorKey: 'chassisNumber',
        alignment: 'left',
        className: 'text-slate-700',
        cell: (item) => item.chassisNumber || '-',
      },
      {
        header: 'Tgl Faktur',
        accessorKey: 'invoiceDate',
        alignment: 'center',
        className: 'text-slate-700',
        cell: (item) => formatDate(item.invoiceDate),
      },
      {
        header: 'Tgl Terima Faktur',
        accessorKey: 'invoiceReceiveDate',
        alignment: 'center',
        className: 'text-slate-700',
        cell: (item) => formatDate(item.invoiceReceiveDate),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[170px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem onClick={() => onDetail(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
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
        ),
      },
    ],
    [assignedIds, onDelete, onDetail, onEdit, selectedIds],
  );

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

      <BaseTable
        data={items}
        columns={columns}
        loading={isLoading}
        showCheckbox
        selectedIds={new Set(selectedIds.map(String))}
        onSelectedIdsChange={(set) => onSelectedIdsChange(Array.from(set).map(Number))}
        getRowId={(item) => String(item.id)}
        isCheckboxDisabled={(item) => assignedIds.includes(item.id)}
        searchPlaceholder="Search here"
        search={search}
        onSearchChange={onSearchChange}
        showLimitChange
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        meta={{
          currentPage: page,
          perPage,
          lastPage: totalPages,
          total: totalData,
        }}
        onPageChange={onPageChange}
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
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
        }
      />
    </div>
  );
}