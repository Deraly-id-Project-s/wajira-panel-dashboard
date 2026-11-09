import { useMemo, useState } from 'react';

import type { UnitTransactionTypeDetail } from '@/@types/unit-transaction.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { TableFooter, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useExportUnitTypeDetails, useUnitTransactionTypeDetails } from '@/hooks/useUnitTransaction';
import { cn } from '@/lib/utils';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { Download } from 'lucide-react';
import { createCustomerColumn, createSupplierColumn } from './unitTransactionPersonColumns';

const stockStateConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600' },
  cancel: { label: 'Batal', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  prepare: { label: 'Disiapkan', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  purchase_order: { label: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  in_transit: { label: 'Dalam Perjalanan', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  receipt: { label: 'Diterima', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

type UnitTypeDetailTableProps = {
  transactionId: string;
  transactionCode?: string;
  transactionType?: 'purchase' | 'sales' | string;
};

export function UnitTypeDetailTable({
  transactionId,
  transactionCode,
}: UnitTypeDetailTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching } = useUnitTransactionTypeDetails(transactionId, {
    page: currentPage,
    perPage,
    search: search || undefined,
  });
  const { handleExport, isExporting } = useExportUnitTypeDetails();

  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const rawData = useMemo(() => data?.data ?? [], [data?.data]);

  const isServerPaginated = useMemo(() => {
    if (!data?.meta) return false;
    return (data.meta.lastPage > 1 || data.meta.total > rawData.length) && rawData.length <= perPage;
  }, [data?.meta, rawData.length, perPage]);

  const totalEntries = data?.meta?.total ?? rawData.length;
  const totalPages = isServerPaginated
    ? (data?.meta?.lastPage ?? 1)
    : Math.max(1, Math.ceil(rawData.length / perPage));

  const pagedData = useMemo(() => {
    if (isServerPaginated) return rawData;
    const start = (currentPage - 1) * perPage;
    return rawData.slice(start, start + perPage);
  }, [isServerPaginated, rawData, currentPage, perPage]);

  const columns = useMemo<ColumnDef<UnitTransactionTypeDetail>[]>(
    () => [
      {
        header: 'No',
        alignment: 'center',
        cell: (_item, index) =>
          ((currentPage - 1) * perPage) + index + 1,
      },
      {
        header: 'Kode Unit',
        accessorKey: 'unit_transaction_item.unit_type.code',
        sortable: true,
        cell: (item) => item.unit_transaction_item?.unit_type?.code ? <CopyBox text={item.unit_transaction_item?.unit_type?.code} /> : '-',
      },
      {
        header: 'Tipe Unit',
        accessorKey: 'unit_transaction_item.unit_type.name',
        sortable: true,
        cell: (item) => item.unit_transaction_item?.unit_type?.name ? <ReferenceLink target='_blank' href={`/dashboard/${slug}/master/type-unit/${item.unit_transaction_item?.unit_type?.id}`}>{item.unit_transaction_item?.unit_type?.name}</ReferenceLink> : '-',
      },
      {
        header: 'Warna',
        accessorKey: 'color',
        sortable: true,
        cell: (item) => item.color || '-',
      },
      {
        header: 'Nomor Mesin',
        accessorKey: 'machine_number',
        sortable: true,
        cell: (item) => item?.machine_number ? <CopyBox text={item.machine_number} /> : '-',
      },
      {
        header: 'Nomor Rangka',
        accessorKey: 'chassis_number',
        sortable: true,
        cell: (item) => item?.chassis_number ? <CopyBox text={item.chassis_number} /> : '-',
      },
      createSupplierColumn<UnitTransactionTypeDetail>(slug),
      createCustomerColumn<UnitTransactionTypeDetail>(slug),
      {
        header: 'Sub Blok Warehouse',
        accessorKey: 'warehouse_sub_block.name',
        cell: (item) => item.warehouse_sub_block?.name ? <CopyBox text={item.warehouse_sub_block?.name} /> : '-',
      },
      {
        header: 'Stok',
        alignment: 'center',
        cell: (item) => (
          <Badge
            variant="outline"
            className={
              item.in_stock
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold'
                : 'border-rose-200 bg-rose-50 text-rose-700 font-semibold'
            }
          >
            {item.in_stock ? 'Tersedia' : 'Tidak Tersedia'}
          </Badge>
        ),
      },
      {
        header: 'Kondisi',
        accessorKey: 'status',
        alignment: 'center',
        cell: (item) => (
          <Badge
            variant="outline"
            className="capitalize border-slate-200 bg-slate-50 text-slate-700 font-semibold"
          >
            {item.status?.replace(/_/g, ' ') || '-'}
          </Badge>
        ),
      },
      {
        header: 'Posisi Stok',
        accessorKey: 'stock_state',
        alignment: 'center',
        cell: (item) => {
          const state = item.stock_state || 'draft';
          const config = stockStateConfig[state] ?? {
            label: state.replace(/_/g, ' '),
            className: 'border-slate-200 bg-slate-50 text-slate-700',
          };

          return (
            <Badge variant="outline" className={cn('capitalize font-semibold', config.className)}>
              {config.label}
            </Badge>
          );
        },
      },
    ],
    [currentPage, perPage, slug],
  );

  const totalUnits = totalEntries;

  const tableFooter = useMemo(() => {
    if (isLoading || !rawData || rawData.length === 0) return null;

    return (
      <TableFooter className="bg-[#f8f9fa] border-t border-slate-200">
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columns.length} className="py-3 px-4 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Unit:
              </span>
              <span className="inline-flex items-baseline gap-1 text-sm font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-md shadow-xs">
                <span>{totalUnits.toLocaleString('id-ID')}</span>
                <span className="text-xs font-medium text-slate-600">Unit</span>
              </span>
            </div>
          </TableCell>
        </TableRow>
      </TableFooter>
    );
  }, [columns.length, rawData, isLoading, totalUnits]);

  return (
    <CollapsibleBox
      title="Daftar Detail Unit Tipe"
      description="Rincian identitas dan status setiap unit tipe pada transaksi ini"
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isExporting}
          onClick={() => handleExport(transactionId, transactionCode, { search: search || undefined })}
          className="gap-2 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Mengekspor...' : 'Export Excel'}
        </Button>
      }
    >
      <div className="p-6">
        <BaseTable
          data={pagedData}
          columns={columns}
          loading={isLoading || isFetching}
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Cari nomor mesin, nomor rangka, warna, supplier, customer..."
          showLimitChange
          perPage={perPage}
          onPerPageChange={(val) => {
            setPerPage(val);
            setCurrentPage(1);
          }}
          meta={{
            currentPage,
            perPage,
            lastPage: totalPages,
            total: totalEntries,
          }}
          onPageChange={setCurrentPage}
          footer={tableFooter}
        />
      </div>
    </CollapsibleBox>
  );
}
