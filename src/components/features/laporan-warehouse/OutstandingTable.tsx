"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { useStockUnits } from '@/hooks/useStockUnit';
import StockUnitTable from '@/components/features/stock-unit/StockUnitTable';
import StockUnitFilterDropdown from '@/components/features/stock-unit/StockUnitFilterTabs';
import { SearchPagination } from '@/components/ui/search-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import type { StockStatus } from '@/@types/stock-unit.types';

type OutstandingTableProps = {
  type: 'purchase' | 'sales';
  perPage: number;
  dateRange?: { from?: Date; to?: Date };
  onActionsChange?: (actions: { print: () => void; download: () => void }) => void;
};

const toCsvLine = (cells: Array<string | number>): string =>
  cells
    .map((cell) => {
      const safe = String(cell).replace(/"/g, '""');
      return `"${safe}"`;
    })
    .join(',');

export default function OutstandingTable({ type, perPage, onActionsChange }: OutstandingTableProps) {
  const { companyId } = useCompany();

  const [search, setSearch] = useState('');
  const [hookPage, setHookPage] = useState(1);
  const [hookPerPage, setHookPerPage] = useState(perPage || 25);
  const [stockState, setStockState] = useState<StockStatus | undefined>(undefined);
  const [inStock, setInStock] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    setHookPerPage(perPage);
    setHookPage(1);
  }, [perPage]);

  const params = useMemo(() => ({
    page: hookPage,
    perPage: hookPerPage,
    search,
    stock_state: stockState,
    in_stock: inStock,
    specified: type === 'purchase' ? 'purchase_outstanding' : 'sales_outstanding',
  }), [hookPage, hookPerPage, search, stockState, inStock, type]);

  const { data: response, isLoading, isError } = useStockUnits(companyId, params);

  const rows = useMemo(() => response?.data || [], [response?.data]);

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
    anchor.download = `warehouse-${type === 'purchase' ? 'po' : 'so'}-outstanding-page-${hookPage}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    toast.success(`Data ${type === 'purchase' ? 'purchase' : 'sales'} order outstanding berhasil diunduh`);
  }, [hookPage, rows, type]);

  useEffect(() => {
    onActionsChange?.({ print: handlePrint, download: handleDownload });
  }, [handleDownload, handlePrint, onActionsChange]);

  return (
    <div className="space-y-4">
      {isError ? (
        <div className="flex flex-col items-center justify-center text-red-500 py-16 bg-white rounded-md border border-gray-200">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm">Gagal memuat data outstanding</p>
        </div>
      ) : (
        <SearchPagination
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari unit outstanding"
          page={hookPage}
          perPage={hookPerPage}
          total={response?.meta?.total}
          lastPage={response?.meta?.lastPage}
          onPageChange={setHookPage}
          onPerPageChange={setHookPerPage}
          actions={(
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Select
                value={inStock === undefined ? 'all' : inStock ? 'true' : 'false'}
                onValueChange={(val) => {
                  const nextInStock = val === 'all' ? undefined : val === 'true';
                  setInStock(nextInStock);
                  setHookPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[160px] border-gray-300 bg-white text-gray-900 rounded-md shadow-sm">
                  <SelectValue placeholder="Semua Ketersediaan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Stok</SelectItem>
                  <SelectItem value="true">Tersedia (In Stock)</SelectItem>
                  <SelectItem value="false">Tidak Tersedia</SelectItem>
                </SelectContent>
              </Select>
              <StockUnitFilterDropdown
                active={(stockState as StockStatus) ?? 'all'}
                onChange={(value) => {
                  const nextStatus = value === 'all' ? undefined : value;
                  setStockState(nextStatus);
                  setHookPage(1);
                }}
              />
            </div>
          )}
        >
          <StockUnitTable
            data={rows}
            isLoading={isLoading}
          />
        </SearchPagination>
      )}
    </div>
  );
}
