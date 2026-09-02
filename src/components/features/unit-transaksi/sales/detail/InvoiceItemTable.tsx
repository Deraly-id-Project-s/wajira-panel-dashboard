'use client';


import { useState, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';
import type { InvoiceItem } from './invoice.types';

export function InvoiceItemTable({ items }: { items: InvoiceItem[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const handleEdit = (item: InvoiceItem) => {
    alert(`Edit: ${item.unitType}`);
  };

  const handleDetail = (item: InvoiceItem) => {
    alert(`Detail: ${item.unitType}`);
  };

  const handleDelete = (item: InvoiceItem) => {
    if (confirm(`Hapus ${item.unitType}?`)) {
      alert('Item deleted!');
    }
  };

  const columns = useMemo<ColumnDef<InvoiceItem>[]>(
    () => [
      {
        header: 'No',
        alignment: 'center',
        cell: (_, i) => (currentPage - 1) * itemsPerPage + i + 1,
      },
      {
        header: 'TIPE UNIT',
        accessorKey: 'unitType',
        sortable: true,
        className: 'font-medium text-slate-900',
        cell: (item) => item.unitType,
      },
      {
        header: 'QTY',
        accessorKey: 'qty',
        sortable: true,
        alignment: 'center',
        cell: (item) => item.qty,
      },
      {
        header: 'HARGA JUAL',
        accessorKey: 'hargaJual',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.hargaJual),
      },
      {
        header: 'BIAYA BBN',
        accessorKey: 'biayaBbn',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.biayaBbn),
      },
      {
        header: 'BIAYA EKSPEDISI',
        accessorKey: 'biayaEkspedisi',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.biayaEkspedisi),
      },
      {
        header: 'BIAYA LAIN',
        accessorKey: 'biayaLain',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.biayaLain),
      },
      {
        header: 'HPP',
        accessorKey: 'hpp',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.hpp),
      },
      {
        header: 'DPP',
        accessorKey: 'dpp',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.dpp),
      },
      {
        header: 'PPN',
        accessorKey: 'ppn',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.ppn),
      },
      {
        header: 'JUMLAH',
        accessorKey: 'jumlah',
        sortable: true,
        alignment: 'center',
        className: 'font-semibold text-slate-900',
        cell: (item) => formatCurrency(item.jumlah),
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
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem onClick={() => handleEdit(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDetail(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(item)} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [currentPage],
  );

  const totalPages = Math.ceil(items.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage]);

  return (
    <div className="space-y-4">
      <Card className="rounded-md border border-slate-200 p-4 bg-white shadow-none">
        <CardHeader className="p-0 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Detail Penjualan Unit</h2>
            <p className="text-sm text-muted-foreground">Rincian lengkap unit yang terjual</p>
          </div>
        </CardHeader>

        <BaseTable
          data={paginatedData}
          columns={columns}
          showCheckbox
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          getRowId={(item) => item.id}
          defaultSort={{ key: 'unitType', direction: 'asc' }}
          meta={{
            currentPage,
            perPage: itemsPerPage,
            lastPage: totalPages,
            total: items.length,
          }}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
