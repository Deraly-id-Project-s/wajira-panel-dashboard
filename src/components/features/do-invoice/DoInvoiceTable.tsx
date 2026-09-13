import * as React from 'react';
import { MoreVertical } from 'lucide-react';
import type { DoInvoice } from '@/@types/do-invoice.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyBox } from '@/components/ui/copy-box';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatInvoiceDate, formatInvoiceMoney } from './do-invoice.utils';

interface DoInvoiceTableProps {
  data: DoInvoice[];
  isLoading?: boolean;
  detailHref: (invoice: DoInvoice) => string;
  onDetail: (invoice: DoInvoice) => void;
}

export function DoInvoiceTable({ data, isLoading, detailHref, onDetail }: DoInvoiceTableProps) {
  const columns = React.useMemo<ColumnDef<DoInvoice>[]>(() => [
    {
      header: 'KODE INVOICE', accessorKey: 'code', sortable: true,
      cell: (item) => <CopyBox text={item.code} href={detailHref(item)} />,
    },
    { header: 'ORDER LIST', accessorKey: 'orderList.code', cell: (item) => item.orderList?.code || '-' },
    { header: 'CUSTOMER', accessorKey: 'customer.name', cell: (item) => item.customer?.name || item.orderList?.customer?.name || '-' },
    { header: 'TANGGAL', accessorKey: 'date', cell: (item) => formatInvoiceDate(item.date) },
    { header: 'NOMINAL', accessorKey: 'nominal', alignment: 'right', cell: (item) => formatInvoiceMoney(item.nominal) },
    { header: 'SISA TAGIHAN', accessorKey: 'billingRemainingNominal', alignment: 'right', cell: (item) => formatInvoiceMoney(item.billing?.remainingPayment ?? item.billingRemainingNominal) },
    {
      header: 'STATUS', accessorKey: 'isPaid', alignment: 'center',
      cell: (item) => <Badge variant="outline" className={item.isPaid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>{item.isPaid ? 'Lunas' : 'Belum Lunas'}</Badge>,
    },
    {
      header: 'ACTION', alignment: 'center', sticky: 'right',
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={`Aksi ${item.code}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onDetail(item)}>Detail</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [detailHref, onDetail]);

  return <BaseTable data={data} columns={columns} loading={isLoading} defaultSort={{ key: 'id', direction: 'desc' }} />;
}
