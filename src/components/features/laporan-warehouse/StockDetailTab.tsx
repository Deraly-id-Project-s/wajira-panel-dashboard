"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { useGetWarehouseStockDetail } from '@/hooks/useLaporanWarehouse';
import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { SearchPagination } from '@/components/ui/search-pagination';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';
import { CopyBox } from '@/components/ui/copy-box';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StockStatus, StockUnit } from '@/@types/stock-unit.types';
import StockUnitFilterDropdown from '@/components/features/stock-unit/StockUnitFilterTabs';

const statusConfig: Record<string, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
  minor_damage: { label: 'Minor Damage', className: 'border-amber-200 bg-amber-50 text-amber-700 font-semibold' },
  major_damage: { label: 'Major Damage', className: 'border-red-200 bg-red-50 text-red-700 font-semibold' },
  returned: { label: 'Retur Beli', className: 'border-purple-200 bg-purple-50 text-purple-700 font-semibold' },
  refunded: { label: 'Refund Jual', className: 'border-orange-200 bg-orange-50 text-orange-700 font-semibold' },
  lost: { label: 'Lost', className: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' },
  in_repair: { label: 'In Repair', className: 'border-blue-200 bg-blue-50 text-blue-700 font-semibold' },
  draft: { label: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600 font-medium' },
  cancel: { label: 'Cancel', className: 'border-red-200 bg-red-50 text-red-700 font-medium' },
  rejected: { label: 'Rejected', className: 'border-red-200 bg-red-50 text-red-700 font-medium' },
  prepare: { label: 'Prepare', className: 'border-amber-200 bg-amber-50 text-amber-700 font-medium' },
  inbound_purchase_order: { label: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700 font-medium' },
  inbound_incoming_goods: { label: 'In Transit', className: 'border-blue-200 bg-blue-50 text-blue-700 font-medium' },
  inbound_receipt: { label: 'Available', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
  inbound_return: { label: 'Refund', className: 'border-orange-200 bg-orange-50 text-orange-700 font-medium' },
  outbound_reserved: { label: 'Reserved', className: 'border-orange-200 bg-orange-50 text-orange-700 font-medium' },
  outbound_in_transit: { label: 'In Transit', className: 'border-indigo-200 bg-indigo-50 text-indigo-700 font-medium' },
  outbound_delivered: { label: 'Delivered', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-medium' },
  outbound_return: { label: 'Return', className: 'border-rose-200 bg-rose-50 text-rose-700 font-medium' },
};

const renderStatus = (status: string) => {
  const config = statusConfig[status] ?? {
    label: status ? status.replace(/_/g, ' ') : '-',
    className: 'border-slate-200 bg-slate-50 text-slate-700 font-medium',
  };

  return (
    <Badge variant="outline" className={cn('capitalize', config.className)}>
      {config.label}
    </Badge>
  );
};

type StockDetailTabProps = {
  perPage: number;
  machineNumber: string;
  onActionsChange?: (actions: { print: () => void; download: () => void }) => void;
};

const toCsvLine = (cells: Array<string | number>): string =>
  cells
    .map((cell) => {
      const safe = String(cell).replace(/"/g, '""');
      return `"${safe}"`;
    })
    .join(',');

export default function StockDetailTab({ perPage, machineNumber: initialMachineNumber, onActionsChange }: StockDetailTabProps) {
  const { companyId } = useCompany();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(perPage || 25);
  const [search, setSearch] = useState('');
  const [machineNumber, setMachineNumber] = useState(initialMachineNumber || '');
  const [chassisNumber, setChassisNumber] = useState('');
  const [color, setColor] = useState('');
  const [stockState, setStockState] = useState<StockStatus | undefined>(undefined);
  const [inStock, setInStock] = useState<boolean | undefined>(undefined);

  const debouncedSearch = useDebouncedValue(search, 500);
  const debouncedMachineNumber = useDebouncedValue(machineNumber, 500);
  const debouncedChassisNumber = useDebouncedValue(chassisNumber, 500);
  const debouncedColor = useDebouncedValue(color, 500);

  useEffect(() => {
    setItemsPerPage(perPage);
    setPage(1);
  }, [perPage]);

  const params = useMemo(() => ({
    company_id: companyId || undefined,
    page,
    per_page: itemsPerPage,
    search: debouncedSearch || undefined,
    machine_number: debouncedMachineNumber || undefined,
    chassis_number: debouncedChassisNumber || undefined,
    color: debouncedColor || undefined,
    stock_state: stockState,
    in_stock: inStock,
  }), [companyId, page, itemsPerPage, debouncedSearch, debouncedMachineNumber, debouncedChassisNumber, debouncedColor, stockState, inStock]);

  const { data: response, isLoading, isError } = useGetWarehouseStockDetail(params);

  const rows = useMemo(() => (response?.data as unknown as StockUnit[]) || [], [response?.data]);

  const meta = useMemo(() => ({
    currentPage: response?.meta?.currentPage || response?.current_page || page,
    perPage: response?.meta?.perPage || response?.per_page || itemsPerPage,
    lastPage: response?.meta?.lastPage || response?.last_page || 1,
    total: response?.meta?.total || response?.total || rows.length,
  }), [response, page, itemsPerPage, rows.length]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(() => {
    if (rows.length === 0) {
      toast.error('Tidak ada data untuk diunduh');
      return;
    }

    const header = [
      'NO',
      'NAMA UNIT',
      'WARNA',
      'NOMOR MESIN',
      'NOMOR RANGKA',
      'SUB BLOK',
      'STATUS STOK',
      'KONDISI STOK',
      'POSISI STOK',
    ];
    const lines = [toCsvLine(header)];

    rows.forEach((item, index) => {
      lines.push(
        toCsvLine([
          index + 1,
          item.namaUnit || '-',
          item.warna || '-',
          item.noMesin || '-',
          item.noRangka || '-',
          item.warehouseSubBlock?.name || 'Belum Ditambahkan',
          item.inStock ? 'Tersedia' : 'Tidak Tersedia',
          item.status || '-',
          item.stockStatus || '-',
        ]),
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `warehouse-stock-detail-page-${page}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    toast.success('Data stock detail berhasil diunduh');
  }, [page, rows]);

  useEffect(() => {
    onActionsChange?.({ print: handlePrint, download: handleDownload });
  }, [handleDownload, handlePrint, onActionsChange]);

  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const columns = useMemo<ColumnDef<StockUnit>[]>(
    () => [
      {
        header: 'Nama Unit',
        accessorKey: 'namaUnit',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <ReferenceLink href={`/dashboard/${slugStr}/master/type-unit?search=${item.namaUnit}`}>
            {item.namaUnit}
          </ReferenceLink>
        ),
      },
      {
        header: 'Warna',
        accessorKey: 'warna',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.warna || '-',
      },
      {
        header: 'Nomor Mesin',
        accessorKey: 'noMesin',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.noMesin || '-'} />,
      },
      {
        header: 'Nomor Rangka',
        accessorKey: 'noRangka',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.noRangka || '-'} />,
      },
      {
        header: 'Sub Blok',
        accessorKey: 'warehouseSubBlock',
        alignment: 'center',
        sortable: true,
        tooltip: 'Lokasi sub-blok penyimpanan unit di dalam gudang',
        cell: (item) => item.warehouseSubBlock?.name ? <CopyBox text={item.warehouseSubBlock.name} /> : <Badge variant='outline' className="font-semibold bg-white">Belum Ditambahkan</Badge>,
      },
      {
        header: 'Status Stok',
        accessorKey: 'inStock',
        sortable: true,
        alignment: 'center',
        tooltip: 'Status ketersediaan unit fisik di gudang',
        cell: (item) => item?.inStock ? (
          <Badge variant="outline" className="capitalize border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">Tersedia</Badge>
        ) : (
          <Badge variant="outline" className="capitalize border-rose-200 bg-rose-50 text-rose-700 font-semibold">Tidak Tersedia {item?.isSoldUnit && '/ Terjual'}</Badge>
        ),
      },
      {
        header: 'Kondisi Stok',
        accessorKey: 'status',
        sortable: true,
        alignment: 'center',
        tooltip: 'Kondisi fisik unit saat ini',
        cell: (item) => renderStatus(item.status),
      },
      {
        header: 'Posisi Stok',
        accessorKey: 'stockStatus',
        sortable: true,
        alignment: 'center',
        tooltip: 'Posisi logistik atau status alur stok unit',
        cell: (item) => {
          const config: Record<string, { label: string; name: string; className: string }> = {
            draft: { label: 'Draft', name: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600 font-semibold' },
            cancel: { label: 'Cancel', name: 'Batal', className: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' },
            prepare: { label: 'Prepare', name: 'Disiapkan', className: 'border-amber-200 bg-amber-50 text-amber-700 font-semibold' },
            purchase_order: { label: 'Purchase Order', name: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700 font-semibold' },
            in_transit: { label: 'In Transit', name: 'Dalam Perjalanan', className: 'border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold' },
            receipt: { label: 'Receipt', name: 'Diterima', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
          };
          const stateVal = item?.stockStatus ?? 'draft';
          const match = config[stateVal] ?? {
            label: stateVal.replace(/_/g, ' '),
            className: 'border-slate-200 bg-slate-50 text-slate-700 font-semibold',
          };

          const isRefund = item?.status === 'returned' || item?.status === 'refunded';
          const isReceipt = (stateVal as string) === 'receipt' || (stateVal as string) === 'inbound_receipt';

          return (
            <Badge variant="outline" className={cn('capitalize font-semibold', match.className)}>
              {isReceipt ? (isRefund ? 'Dikembalikan' : (item?.isSoldUnit ? 'Dikirim' : 'Diterima')) : match.label}
            </Badge>
          );
        },
      },
    ],
    [slugStr]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <Input
          placeholder="Cari No Mesin..."
          value={machineNumber}
          onChange={(e) => {
            setMachineNumber(e.target.value);
            setPage(1);
          }}
          className="w-40 bg-white"
        />
        <Input
          placeholder="Cari No Rangka..."
          value={chassisNumber}
          onChange={(e) => {
            setChassisNumber(e.target.value);
            setPage(1);
          }}
          className="w-40 bg-white"
        />
        <Input
          placeholder="Warna..."
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setPage(1);
          }}
          className="w-32 bg-white"
        />
        <Select
          value={inStock === undefined ? 'all' : inStock ? 'true' : 'false'}
          onValueChange={(val) => {
            setInStock(val === 'all' ? undefined : val === 'true');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36 bg-white">
            <SelectValue placeholder="Ketersediaan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Stok</SelectItem>
            <SelectItem value="true">Tersedia</SelectItem>
            <SelectItem value="false">Tidak Tersedia</SelectItem>
          </SelectContent>
        </Select>
        <StockUnitFilterDropdown
          active={stockState ?? 'all'}
          onChange={(val) => {
            setStockState(val === 'all' ? undefined : val);
            setPage(1);
          }}
        />
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center text-red-500 py-16 bg-white rounded-md border border-gray-200">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm">Gagal memuat data stock detail</p>
        </div>
      ) : (
        <SearchPagination
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search here..."
          searchAriaLabel="Cari unit"
          page={page}
          perPage={itemsPerPage}
          total={meta.total}
          lastPage={meta.lastPage}
          from={(meta.currentPage - 1) * meta.perPage + 1}
          to={Math.min(meta.currentPage * meta.perPage, meta.total)}
          onPageChange={setPage}
          onPerPageChange={(pp) => {
            setItemsPerPage(pp);
            setPage(1);
          }}
        >
          <BaseTable
            data={rows}
            columns={columns}
            loading={isLoading}
          />
        </SearchPagination>
      )}
    </div>
  );
}
