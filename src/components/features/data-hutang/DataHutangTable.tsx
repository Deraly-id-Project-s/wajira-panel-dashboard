import Link from 'next/link';
import { useRouter } from 'next/router';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import type { LiabilityListItem, LiabilityListMeta } from '@/types/pembayaran-hutang.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { formatDate } from '@/lib/utils/format';

type Props = {
  data: LiabilityListItem[];
  meta: LiabilityListMeta | null;
  loading?: boolean;
  error?: string | null;
  search?: string;
  perPage?: number;
  currentPage?: number;
  onSearchChange?: (value: string) => void;
  onPerPageChange?: (value: number) => void;
  onPageChange?: (value: number) => void;
  onRetry?: () => void;
};

export default function DataHutangTable({ data, meta, loading, error, search, perPage, currentPage, onSearchChange, onPerPageChange, onPageChange, onRetry }: Props) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const startIndex = meta?.from ?? (data.length > 0 ? ((currentPage ?? 1) - 1) * (perPage ?? 1) + 1 : 0);

  const columns: ColumnDef<LiabilityListItem>[] = [
    {
      header: 'NO PEMBELIAN',
      accessorKey: 'code',
      sortable: true,
      alignment: 'left',
      cell: (item) => <CopyBox text={item.code} />,
    },
    {
      header: 'TANGGAL',
      accessorKey: 'date',
      sortable: true,
      alignment: 'center',
      cell: (item) => formatDate(item.date),
    },
    {
      header: 'NAMA SUPPLIER',
      accessorKey: 'supplier_name',
      sortable: true,
      alignment: 'left',
      cell: (item) => <ReferenceLink href={`/dashboard/${slug}/master/supplier?search=${item?.supplier_name}`}>{item?.supplier_name}</ReferenceLink>,
    },
    {
      header: 'TOTAL BELI',
      accessorKey: 'grand_total',
      sortable: true,
      alignment: 'center',
      cell: (item) => currenciesFormat('idr', item.grand_total),
    },
    {
      header: 'TOTAL BAYAR',
      accessorKey: 'total_paid',
      sortable: true,
      alignment: 'center',
      cell: (item) => currenciesFormat('idr', item.total_paid),
    },
    {
      header: 'AMOUNT HUTANG',
      accessorKey: 'remaining_payment',
      sortable: true,
      alignment: 'center',
      cell: (item) => <span className="font-medium text-red-600">{currenciesFormat('idr', item.remaining_payment)}</span>,
    },
    {
      header: 'ACTION',
      alignment: 'center',
      sticky: 'right',
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[100px] rounded-md p-2">
            <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2.5">
              {slug ? <Link href={`/dashboard/${slug}/finance/data-hutang/${item.id}`}>Detail</Link> : <span className="cursor-not-allowed text-slate-400">Detail</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Coba Lagi
              </Button>
            )}
          </div>
        </div>
      )}

      <BaseTable
        data={data}
        columns={columns}
        loading={loading}
        search={search}
        onSearchChange={onSearchChange}
        showLimitChange={Boolean(onPerPageChange)}
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        meta={meta ? {
          currentPage: currentPage ?? 1,
          perPage: perPage ?? 25,
          lastPage: meta.lastPage || 1,
          total: meta.total || data.length,
        } : undefined}
        onPageChange={onPageChange}
      />
    </div>
  );
}