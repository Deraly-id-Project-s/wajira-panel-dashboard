import { useMemo } from 'react';
import { format } from 'date-fns';
import { Pencil } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import type { VehicleDocumentItem } from '@/types/vehicle-document.types';

interface Props {
  items: VehicleDocumentItem[];
  search: string;
  isLoading?: boolean;
  page: number;
  perPage: number;
  totalData: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (value: number) => void;
  onEdit: (item: VehicleDocumentItem) => void;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'dd/MM/yy');
};

export function VehicleDocumentDetailTable({
  items,
  search,
  isLoading = false,
  page,
  perPage,
  totalData,
  onSearchChange,
  onPageChange,
  onPerPageChange,
  onEdit,
}: Props) {
  const columns = useMemo<ColumnDef<VehicleDocumentItem>[]>(
    () => [
      {
        header: 'Dealer',
        accessorKey: 'dealerName',
        className: 'font-medium text-slate-900 whitespace-nowrap',
        cell: (item) => item.dealerName || '-',
      },
      {
        header: 'Nama',
        accessorKey: 'stnkName',
        className: 'whitespace-nowrap',
        cell: (item) => item.stnkName || '-',
      },
      {
        header: 'Wilayah',
        accessorKey: 'regionName',
        className: 'whitespace-nowrap',
        cell: (item) => item.regionName || '-',
      },
      {
        header: 'No Mesin',
        accessorKey: 'machineNumber',
        className: 'font-medium text-slate-900 whitespace-nowrap',
        cell: (item) => item.machineNumber || '-',
      },
      {
        header: 'Tgl Terima Faktur',
        accessorKey: 'invoiceReceiveDate',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => formatDate(item.invoiceReceiveDate),
      },
      {
        header: 'Tgl Daftar BPKB',
        accessorKey: 'bpkbRegistrationDate',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => formatDate(item.bpkbRegistrationDate),
      },
      {
        header: 'Tgl Daftar STNK',
        accessorKey: 'stnkRegistrationDate',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => formatDate(item.stnkRegistrationDate),
      },
      {
        header: 'Tgl Bayar SKPD',
        accessorKey: 'skpdPaymentDate',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => formatDate(item.skpdPaymentDate),
      },
      {
        header: 'Tgl Terima BPKB',
        accessorKey: 'bpkbReceivedDate',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => formatDate(item.bpkbReceivedDate),
      },
      {
        header: 'Tgl Terima STNK',
        accessorKey: 'stnkReceivedDate',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => formatDate(item.stnkReceivedDate),
      },
      {
        header: 'Tgl Terima SKPD',
        accessorKey: 'skpdReceivedDate',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => formatDate(item.skpdReceivedDate),
      },
      {
        header: 'Tgl Terima TNKB',
        accessorKey: 'tnkbReceivedDate',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => formatDate(item.tnkbReceivedDate),
      },
      {
        header: 'Nomor TNKB',
        accessorKey: 'tnkbNumber',
        className: 'whitespace-nowrap',
        cell: (item) => item.tnkbNumber || '-',
      },
      {
        header: 'Notice SKPD',
        accessorKey: 'noticeFee',
        alignment: 'center',
        className: 'whitespace-nowrap',
        cell: (item) => new Intl.NumberFormat('id-ID').format(item.noticeFee || 0),
      },
      {
        header: 'Vendor Karyawan',
        accessorKey: 'vendorEmployee',
        className: 'whitespace-nowrap',
        cell: (item) => item.vendorEmployee || '-',
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-full">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit],
  );

  return (
    <BaseTable
      data={items}
      columns={columns}
      loading={isLoading}
      getRowId={(item) => `${item.id}-${item.registrationId}`}
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
    />
  );
}
