import { useMemo, useState } from 'react';
import type { KasHarianListItem } from '@/@types/kas-harian.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { format } from 'date-fns';
import { MoreVertical, Info, CheckCircle } from 'lucide-react';
import { CopyBox } from '@/components/ui/copy-box';
import { TextTruncate } from '@/components/ui/text-truncate';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

interface Props {
  data: KasHarianListItem[];
  meta: PaginationMeta;
  hasNextPage: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onView: (item: KasHarianListItem) => void;
  onPay: (item: KasHarianListItem) => void;
  onEdit: (item: KasHarianListItem) => void;
  onDelete: (item: KasHarianListItem) => void;
  onSyncPpnData?: (item: KasHarianListItem) => void;
  onToggleStatus?: (item: KasHarianListItem) => void;
  onPageChange?: (page: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const formatDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'dd MMM yyyy');
};

const hasUnitTransactionBilling = (item: KasHarianListItem) =>
  item.unitTransactionBillingId !== undefined && item.unitTransactionBillingId !== null;

const canSyncPpnData = (item: KasHarianListItem) => item.is_paid === true && item.isValid === true;

export default function KasHarianTable({
  data,
  meta,
  hasNextPage,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onView,
  onPay,
  onEdit,
  onDelete,
  onSyncPpnData,
  onToggleStatus,
  onPageChange,
  canEdit = true,
  canDelete = true,
}: Props) {
  const page = meta.currentPage;
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedData = useMemo(() => {
    if (!sortBy) return data;
    return [...data].sort((a, b) => {
      let aVal = (a as any)[sortBy];
      let bVal = (b as any)[sortBy];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortBy, sortDirection]);

  const columns = useMemo<ColumnDef<KasHarianListItem>[]>(
    () => [
      {
        header: 'NOTA REFF',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {(item.unitTransactionBillingId || item.goodsTransactionBillingId) ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="cursor-help text-[#18385b] hover:text-[#102843] transition-colors flex items-center shrink-0">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="max-w-xs bg-slate-900 text-white rounded-md p-2 text-xs shadow-md">
                    Data Arus Transaksi Kas Harian ini terhubung dengan data Administrasi
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
            <CopyBox text={`${item.code || '-'}`} />
          </div>
        ),
      },
      {
        header: 'STATUS',
        accessorKey: 'is_paid',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
            item.is_paid
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          )}>
            {item.is_paid ? 'Lunas' : 'Belum Lunas'}
          </span>
        ),
      },
      {
        header: 'No Invoice',
        accessorKey: 'invoiceNumber',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.invoiceNumber ? <CopyBox text={item.invoiceNumber} /> : '-',
      },
      {
        header: 'TANGGAL',
        accessorKey: 'date',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.date),
      },
      {
        header: 'KETERANGAN',
        accessorKey: 'note',
        sortable: true,
        alignment: 'left',
        cell: (item) => <TextTruncate text={item.note || '-'} maxLength={15} />,
      },
      {
        header: 'DEBET IDR',
        accessorKey: 'debet',
        sortable: true,
        alignment: 'center',
        cell: (item) => {
          const debetVal = item.cash_position?.debet_idr_total ?? item.debet;
          return (
            <div className="flex items-center justify-center gap-1 text-green-600 font-medium">
              {item.isValid === true && debetVal > 0 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="cursor-help text-green-400 hover:text-green-600 transition-colors">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-xs bg-slate-900 text-white rounded-md p-2 text-xs shadow-md">
                      Nominal telah disesuaikan
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              <span>{currenciesFormat('idr', debetVal)}</span>
            </div>
          );
        },
      },
      {
        header: 'KREDIT IDR',
        accessorKey: 'credit',
        sortable: true,
        alignment: 'center',
        cell: (item) => {
          const creditVal = item.cash_position?.credit_idr_total ?? item.credit;
          return (
            <div className="flex items-center justify-center gap-1 text-red-600 font-medium">
              {item.isValid === true && creditVal > 0 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="cursor-help text-green-400 hover:text-green-600 transition-colors">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-xs bg-slate-900 text-white rounded-md p-2 text-xs shadow-md">
                      Nominal telah disesuaikan
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              <span>{currenciesFormat('idr', creditVal)}</span>
            </div>
          );
        },
      },
      {
        header: 'DEBET USD',
        accessorKey: 'debet_usd',
        sortable: true,
        alignment: 'center',
        cell: (item) => {
          const debetUsdVal = item.cash_position?.debet_usd_total ?? item.debet_usd;
          return <span className="font-medium text-green-600">{currenciesFormat('usd', debetUsdVal)}</span>;
        },
      },
      {
        header: 'KREDIT USD',
        accessorKey: 'credit_usd',
        sortable: true,
        alignment: 'center',
        cell: (item) => {
          const creditUsdVal = item.cash_position?.credit_usd_total ?? item.credit_usd;
          return <span className="font-medium text-red-600">{currenciesFormat('usd', creditUsdVal)}</span>;
        },
      },
      {
        header: 'KURANG BAYAR IDR',
        accessorKey: 'remaining_payment',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <span className="font-medium text-amber-700">{currenciesFormat('idr', item.remaining_payment ?? 0)}</span>
        ),
      },
      {
        header: 'KURANG BAYAR USD',
        accessorKey: 'remaining_payment_usd',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <span className="font-medium text-amber-700">{currenciesFormat('usd', item.remaining_payment_usd ?? 0)}</span>
        ),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              {item.source === 'billing' ? (
                <DropdownMenuItem onClick={() => onPay(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Bayar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onView(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Detail
                </DropdownMenuItem>
              )}
              {item.cashFlowId && canEdit ? (
                <DropdownMenuItem onClick={() => onEdit(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Edit
                </DropdownMenuItem>
              ) : null}
              {item.cashFlowId && onToggleStatus ? (
                <>
                  {item.isValid && !item.is_paid ? (
                    <DropdownMenuItem onClick={() => onToggleStatus(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer font-medium" disabled={!item.isValid}>
                      Tandai Lunas
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onToggleStatus(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer font-medium" disabled={!item.is_paid}>
                      Tandai Belum Lunas
                    </DropdownMenuItem>
                  )}
                </>
              ) : null}
              {item.cashFlowId && onSyncPpnData ? (
                <DropdownMenuItem
                  onClick={() => {
                    if (canSyncPpnData(item)) onSyncPpnData(item);
                  }}
                  className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer font-medium"
                  disabled={!canSyncPpnData(item)}
                >
                  Sinkronasi PPN
                </DropdownMenuItem>
              ) : null}
              {item.source === 'manual' && canDelete ? (
                <DropdownMenuItem
                  onClick={() => {
                    if (!hasUnitTransactionBilling(item)) onDelete(item);
                  }}
                  className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                  disabled={hasUnitTransactionBilling(item)}
                >
                  Hapus
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canDelete, canEdit, onPay, onView, onEdit, onToggleStatus, onSyncPpnData, onDelete]
  );

  return (
    <div className="space-y-4">
      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <p className="text-sm text-red-600">{errorMessage ?? 'Gagal memuat data transaksi kas harian'}</p>
          {onRetry ? (
            <Button type="button" variant="outline" onClick={onRetry} className="mt-3">
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      <BaseTable
        data={sortedData}
        columns={columns}
        loading={isLoading}
        meta={{
          currentPage: page,
          perPage: meta.perPage,
          lastPage: meta.lastPage,
          total: meta.total,
        }}
        onPageChange={onPageChange}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={(key, direction) => {
          setSortBy(key);
          setSortDirection(direction as 'asc' | 'desc');
        }}
      />
    </div>
  );
}
