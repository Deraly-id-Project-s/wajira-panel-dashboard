"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { useGetWarehouseStock } from '@/hooks/useLaporanWarehouse';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { StockItem } from '@/services/laporan-warehouse.service';
import { AlertCircle } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { SearchPagination } from '@/components/ui/search-pagination';
import { ReferenceLink } from '@/components/ui/reference-link';
import { CopyBox } from '@/components/ui/copy-box';
import { useRouter } from 'next/router';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

const toCsvLine = (cells: Array<string | number>): string =>
  cells
    .map((cell) => {
      const safe = String(cell).replace(/"/g, '""');
      return `"${safe}"`;
    })
    .join(',');

type StockTabProps = {
  perPage: number;
  onActionsChange?: (actions: { print: () => void; download: () => void }) => void;
};

export default function StockTab({ perPage, onActionsChange }: StockTabProps) {
  const { companyId } = useCompany();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(perPage || 25);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 500);

  useEffect(() => {
    setItemsPerPage(perPage);
    setPage(1);
  }, [perPage]);

  const {
    data: response,
    isLoading,
    isError,
  } = useGetWarehouseStock({
    company_id: companyId ? Number(companyId) : 1,
    page,
    per_page: itemsPerPage,
    search: debouncedSearch || undefined,
  });

  const rows = useMemo(() => response?.data || [], [response?.data]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, item) => {
        acc.available += item.stock_available || 0;
        acc.forecast += item.stock_forecast || 0;
        return acc;
      },
      { available: 0, forecast: 0 }
    );
  }, [rows]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(() => {
    if (rows.length === 0) {
      toast.error('Tidak ada data untuk diunduh');
      return;
    }

    const header = ['NO', 'KODE UNIT', 'MERK', 'TIPE UNIT', 'KATEGORI', 'HARGA BELI', 'TERSEDIA', 'FORECAST'];
    const lines = [toCsvLine(header)];

    const fromIndex = response?.from ?? 1;

    rows.forEach((item, index) => {
      lines.push(
        toCsvLine([
          fromIndex + index,
          item.unit_type?.code || '-',
          item.unit_type?.brand?.name || '-',
          item.unit_type?.name || '-',
          item.unit_type?.unit_type || '-',
          item.unit_type?.buy_price || 0,
          item.stock_available || 0,
          item.stock_forecast || 0,
        ])
      );
    });

    lines.push(toCsvLine(['', '', '', '', '', 'GRAND TOTAL', totals.available, totals.forecast]));

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `warehouse-stock-page-${page}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    toast.success('Data stock berhasil diunduh');
  }, [rows, response?.from, totals.available, totals.forecast, page]);

  useEffect(() => {
    onActionsChange?.({ print: handlePrint, download: handleDownload });
  }, [handleDownload, handlePrint, onActionsChange]);

  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const columns = useMemo<ColumnDef<StockItem>[]>(
    () => [
      {
        header: 'Kode Unit',
        accessorKey: 'unit_type.code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.unit_type?.code || '-'} />,
      },
      {
        header: 'Merk',
        accessorKey: 'unit_type.brand.name',
        sortable: true,
        alignment: 'left',
        cell: (item) =>
          item.unit_type?.brand?.name ? (
            <ReferenceLink href={`/dashboard/${slugStr}/master/brand?search=${item.unit_type.brand.name}`}>
              {item.unit_type.brand.name}
            </ReferenceLink>
          ) : (
            '-'
          ),
      },
      {
        header: 'Tipe Unit',
        accessorKey: 'unit_type.name',
        sortable: true,
        alignment: 'left',
        cell: (item) =>
          item.unit_type?.name ? (
            <ReferenceLink href={`/dashboard/${slugStr}/master/type-unit?search=${item.unit_type.name}`}>
              {item.unit_type.name}
            </ReferenceLink>
          ) : (
            '-'
          ),
      },
      {
        header: 'Kategori',
        accessorKey: 'unit_type.unit_type',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.unit_type?.unit_type || '-',
      },
      {
        header: 'Harga Beli',
        accessorKey: 'unit_type.buy_price',
        sortable: true,
        alignment: 'right',
        cell: (item) => currenciesFormat('idr', item.unit_type?.buy_price),
      },
      {
        header: 'Unit Tersedia',
        accessorKey: 'stock_available',
        sortable: true,
        alignment: 'center',
        cell: (item) => (item.stock_available || 0).toLocaleString('id-ID'),
      },
      {
        header: 'Perkiraan Unit',
        accessorKey: 'stock_forecast',
        sortable: true,
        alignment: 'center',
        cell: (item) => (item.stock_forecast || 0).toLocaleString('id-ID'),
      },
    ],
    [slugStr]
  );

  const footerRow = useMemo(
    () => (
      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-t border-slate-200 font-semibold print:text-[10px]">
        <TableCell colSpan={5} className="px-4 py-4 pr-10 text-right text-slate-900">
          GRAND TOTAL
        </TableCell>
        <TableCell className="px-4 py-4 text-center text-slate-900">{totals.available.toLocaleString('id-ID')}</TableCell>
        <TableCell className="px-4 py-4 text-center text-slate-900">{totals.forecast.toLocaleString('id-ID')}</TableCell>
      </TableRow>
    ),
    [totals]
  );

  return (
    <div className="space-y-4">
      {isError ? (
        <div className="flex flex-col items-center justify-center text-red-500 py-16 bg-white rounded-md border border-gray-200">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm">Gagal memuat data stock</p>
        </div>
      ) : (
        <SearchPagination
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search here.."
          searchAriaLabel="Cari stok unit"
          page={page}
          perPage={itemsPerPage}
          total={response?.total}
          lastPage={response?.last_page}
          from={response?.from}
          to={response?.to}
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
            footer={footerRow}
          />
        </SearchPagination>
      )}
    </div>
  );
}
