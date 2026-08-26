import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/@types/pagination.types';
import type { SparepartTransactionRefund } from '@/@types/sparepart-refund.types';

interface Props {
  data: SparepartTransactionRefund[];
  meta?: PaginationMeta;
  loading?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (value: number) => void;
  onDelete?: (id: string) => void;
}

export default function SparepartRefundTable({ data, meta, loading, search, onSearchChange, onPageChange, onPerPageChange, onDelete }: Props) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const columns = useMemo<ColumnDef<SparepartTransactionRefund>[]>(() => [
    { header: 'Kode Refund', accessorKey: 'code', sortable: true, cell: (item) => <CopyBox text={item.code || '-'} /> },
    { header: 'Jenis', accessorKey: 'type', sortable: true, cell: (item) => <Badge variant="outline">{item.type === 'purchase' ? 'Pembelian' : item.type === 'sales' ? 'Penjualan' : '-'}</Badge> },
    { header: 'Kode Transaksi', accessorKey: 'transaction.code', sortable: true, cell: (item) => <CopyBox text={item.transaction?.code || '-'} /> },
    { header: 'Tanggal', accessorKey: 'payment_date', sortable: true, cell: (item) => formatDate(item.payment_date || item.refund_date || '') || '-' },
    { header: 'Nominal Refund', accessorKey: 'amount', sortable: true, alignment: 'right', cell: (item) => currenciesFormat('idr', item.amount) },
    { header: 'Sudah Dibayar', alignment: 'right', cell: (item) => currenciesFormat('idr', item.total_paid ?? (item.payments || []).reduce((sum, payment) => sum + Number(payment.amount), 0)) },
    { header: 'Sisa', alignment: 'right', cell: (item) => <span className="font-medium text-amber-700">{currenciesFormat('idr', item.remaining_payment ?? Math.max(0, item.amount - (item.total_paid ?? (item.payments || []).reduce((sum, payment) => sum + Number(payment.amount), 0))))}</span> },
    {
      header: 'Aksi', alignment: 'center', sticky: 'right', cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/dashboard/${slug}/transaksi/refund-sparepart/${item.id}`)}><Eye className="mr-2 h-4 w-4" /> Detail</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/${slug}/transaksi/refund-sparepart/${item.id}/edit`)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            {onDelete && <DropdownMenuItem className="text-red-600" onClick={() => onDelete(item.id)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [onDelete, router, slug]);

  return <BaseTable data={data} columns={columns} loading={loading} search={search} onSearchChange={onSearchChange} searchPlaceholder="Cari kode refund..." showLimitChange perPage={meta?.perPage ?? 25} onPerPageChange={onPerPageChange} meta={meta} onPageChange={onPageChange} />;
}
