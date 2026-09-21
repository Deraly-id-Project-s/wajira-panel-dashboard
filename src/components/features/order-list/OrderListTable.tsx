import * as React from 'react';
import { FileText, MoreVertical, RotateCcw, Truck } from 'lucide-react';
import type { OrderList, OrderListStatus } from '@/@types/order-list.types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import {
  getOrderStatusBadgeClassName,
  getOrderStatusLabel,
  getPrimaryTarifItem,
  ORDER_LIST_STATUS_OPTIONS,
} from './order-list.utils';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

interface OrderListTableProps {
  data: OrderList[];
  isLoading?: boolean;
  onDetail: (item: OrderList) => void;
  onEdit: (item: OrderList) => void;
  onDelete: (item: OrderList) => void;
  onUpdateStatus?: (item: OrderList, newStatus: OrderListStatus) => void;
  onProcessInvoice: (item: OrderList) => void;
  processingInvoiceId?: number | null;
  canEdit: boolean;
  canDelete: boolean;
}

export const OrderListTable = React.memo(function OrderListTable({
  data,
  isLoading = false,
  onDetail,
  onEdit,
  onDelete,
  onUpdateStatus,
  onProcessInvoice,
  processingInvoiceId,
  canEdit,
  canDelete,
}: OrderListTableProps) {
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const columns = React.useMemo<ColumnDef<OrderList>[]>(
    () => [
      {
        header: 'KODE ORDER',
        accessorKey: 'code',
        sortable: true,
        cell: (item) => <CopyBox text={item.code || '-'} href={`/dashboard/${slugStr}/administrasi/order-list/detail/${item.id}`} />
      },
      {
        header: 'STATUS',
        accessorKey: 'status',
        alignment: 'center',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer transition-colors hover:opacity-80 focus:outline-none',
                  getOrderStatusBadgeClassName(item.status)
                )}
                disabled={!canEdit}
              >
                {getOrderStatusLabel(item.status)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[140px] rounded-md border-slate-200 shadow-lg p-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Ubah Status</div>
              <DropdownMenuSeparator />
              {ORDER_LIST_STATUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  disabled={item.status === option.value}
                  onSelect={() => {
                    if (item.status !== option.value && onUpdateStatus) {
                      onUpdateStatus(item, option.value);
                    }
                  }}
                  className={cn('cursor-pointer rounded-md px-2.5 py-2 text-xs font-medium', item.status === option.value && 'bg-slate-100 opacity-50')}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      {
        header: 'NAMA CUSTOMER',
        accessorKey: 'customer.name',
        sortable: true,
        cell: (item) => item?.customer?.name ? <ReferenceLink href={`/dashboard/${slugStr}/master/customer?search=${item?.customer}`}>{item.customer?.name}</ReferenceLink> : '-',
      },
      {
        header: 'DRIVER',
        accessorKey: 'tarifs',
        cell: (item) => {
          const primaryTarif = getPrimaryTarifItem(item);
          return (
            <span className="text-sm text-gray-700">
              {item.tarifs.length > 1 ? (
                <span className="flex flex-col gap-0.5">
                  {item.tarifs.map((t, idx) => (
                    <span key={t.id || idx} className="block whitespace-nowrap text-xs text-left">
                      {idx + 1}. {t.driver?.name || '-'}
                    </span>
                  ))}
                </span>
              ) : (
                primaryTarif?.driver?.name || '-'
              )}
            </span>
          );
        },
      },
      {
        header: 'LOADING IN',
        accessorKey: 'loadingIn',
        cell: (item) => {
          const primaryTarif = getPrimaryTarifItem(item);
          return (
            <span className="text-sm text-gray-700">
              {item.tarifs.length > 1 ? (
                <span className="flex flex-col gap-0.5">
                  {item.tarifs.map((t, idx) => (
                    <span key={t.id || idx} className="block whitespace-nowrap text-xs text-left">
                      {idx + 1}. {t.loadingIn || '-'}
                    </span>
                  ))}
                </span>
              ) : (
                primaryTarif?.loadingIn || item.loadingIn || '-'
              )}
            </span>
          );
        },
      },
      {
        header: 'LOADING OUT',
        accessorKey: 'loadingOut',
        cell: (item) => {
          const primaryTarif = getPrimaryTarifItem(item);
          return (
            <span className="text-sm text-gray-700">
              {item.tarifs.length > 1 ? (
                <span className="flex flex-col gap-0.5">
                  {item.tarifs.map((t, idx) => (
                    <span key={t.id || idx} className="block whitespace-nowrap text-xs text-left">
                      {idx + 1}. {t.loadingOut || '-'}
                    </span>
                  ))}
                </span>
              ) : (
                primaryTarif?.loadingOut || item.loadingOut || '-'
              )}
            </span>
          );
        },
      },
      {
        header: 'TUJUAN KIRIM',
        accessorKey: 'destination',
        cell: (item) => {
          const primaryTarif = getPrimaryTarifItem(item);
          return (
            <span className="text-sm text-gray-700">
              {item.tarifs.length > 1 ? (
                <span className="flex flex-col gap-0.5">
                  {item.tarifs.map((t, idx) => (
                    <span key={t.id || idx} className="block text-xs text-left">
                      {idx + 1}. {t.deliveryDestination || '-'}
                    </span>
                  ))}
                </span>
              ) : (
                primaryTarif?.deliveryDestination || '-'
              )}
            </span>
          );
        },
      },
      {
        header: 'UJ DRIVER',
        accessorKey: 'ujDriver',
        alignment: 'right',
        cell: (item) => <span className="text-sm text-gray-700">{currenciesFormat('idr', item.ujDriver)}</span>,
      },
      {
        header: 'INV EKSPEDISI',
        accessorKey: 'billInvoice',
        alignment: 'right',
        cell: (item) => <span className="text-sm text-gray-700">{currenciesFormat('idr', item.billInvoice)}</span>,
      },
      {
        header: 'PPN',
        accessorKey: 'ppn',
        alignment: 'right',
        cell: (item) => <span className="text-sm text-gray-700">{currenciesFormat('idr', item.ppn)}</span>,
      },
      {
        header: 'ACTION',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 cursor-pointer rounded-full">
                <MoreVertical className="h-4 w-4 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[170px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onSelect={() => {
                  onDetail(item);
                }}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50"
              >
                Detail
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  onEdit(item);
                }}
                disabled={!canEdit || item?.status !== 'draft'}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50"
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  onDelete(item);
                }}
                disabled={!canDelete || item?.status !== 'draft'}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                Hapus
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {item.status === 'draft' ? (
                <DropdownMenuItem
                  onSelect={() => {
                    if (onUpdateStatus) onUpdateStatus(item, 'deliver');
                  }}
                  disabled={!canEdit}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-orange-700 focus:bg-orange-50 focus:text-orange-800"
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Proses DO Ekspedisi
                </DropdownMenuItem>
              ) : item.status === 'deliver' ? (
                <DropdownMenuItem
                  onSelect={() => {
                    if (onUpdateStatus) onUpdateStatus(item, 'draft');
                  }}
                  disabled={!canEdit}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-slate-700 focus:bg-slate-50 focus:text-slate-900"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Jadikan Draft
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => {
                    onProcessInvoice(item);
                  }}
                  disabled={
                    !canEdit ||
                    item.status !== 'done' ||
                    item.isHasInvoice ||
                    !item.canMarkDone ||
                    processingInvoiceId === item.id
                  }
                  className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-orange-700 focus:bg-orange-50 focus:text-orange-800"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {item.isHasInvoice ? 'Invoice Sudah Dibuat' : 'Proses DO Invoice'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onDetail, onEdit, onDelete, onUpdateStatus, onProcessInvoice, processingInvoiceId, canEdit, canDelete, slugStr]
  );

  return (
    <div className="space-y-6">
      <BaseTable
        data={data}
        columns={columns}
        loading={isLoading}
        defaultSort={{ key: 'id', direction: 'desc' }}
      />
    </div>
  );
});
