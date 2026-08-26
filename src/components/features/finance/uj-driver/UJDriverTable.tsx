import { useState } from 'react';
import type { UJDriverItem, UJDriverPaginationResponse } from '@/types/uj-driver.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/currency';
import { format } from 'date-fns';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

interface Props {
  data: UJDriverItem[];
  meta: UJDriverPaginationResponse<UJDriverItem>['data'] | null;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onPay: (item: UJDriverItem) => void;
  onPageChange: (page: number) => void;
  onSortChange: (key: string) => void;
  currentSortBy?: string;
  currentSortDirection?: 'asc' | 'desc';
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'dd/MM/yyyy');
};

export default function UJDriverTable({
  data,
  meta,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onPay,
  onPageChange,
  onSortChange,
  currentSortBy,
  currentSortDirection,
}: Props) {
  const getKasMasukAmount = (item: UJDriverItem) => {
    const payment = item.uj_driver_billing_payment;
    if (!payment) return null;
    return payment.amount ?? payment.total_paid ?? null;
  };

  const getUJLainnyaAmount = (item: UJDriverItem) => {
    const payment = item.uj_driver_billing_payment;
    if (!payment) return null;
    return payment.other_amount ?? payment.uj_lainnya ?? null;
  };

  const columns: ColumnDef<UJDriverItem>[] = [
    {
      header: 'NO',
      alignment: 'center',
      cell: (_, index) => {
        const startIndex = meta?.from ?? 0;
        return startIndex > 0 ? startIndex + index : index + 1;
      }
    },
    {
      header: 'KODE DO',
      accessorKey: 'code',
      sortable: true,
      alignment: 'left',
      cell: (item) => <span className="font-medium text-slate-900">{item.code || '-'}</span>,
    },
    {
      header: 'TANGGAL',
      accessorKey: 'date',
      sortable: true,
      alignment: 'center',
      cell: (item) => formatDate(item.date),
    },
    {
      header: 'NO POLISI',
      accessorKey: 'vehicle_registration_number',
      sortable: true,
      alignment: 'left',
      cell: (item) => item.vehicle?.registration_number || '-',
    },
    {
      header: 'TIPE',
      accessorKey: 'vehicle_type',
      sortable: true,
      alignment: 'left',
      cell: (item) => item.vehicle?.type || item.order_list?.vehicle_type || '-',
    },
    {
      header: 'DRIVER',
      accessorKey: 'driver_name',
      sortable: true,
      alignment: 'left',
      cell: (item) => item.driver?.name || '-',
    },
    {
      header: 'CUSTOMER',
      accessorKey: 'customer_name',
      sortable: true,
      alignment: 'left',
      cell: (item) => item.order_list?.customer?.name || '-',
    },
    {
      header: 'LOADING IN',
      accessorKey: 'loading_in',
      sortable: true,
      alignment: 'left',
      cell: (item) => item.order_list?.loading_in || '-',
    },
    {
      header: 'TUJUAN',
      accessorKey: 'do_delivery_destination',
      sortable: true,
      alignment: 'left',
      cell: (item) => item.order_list?.do_delivery_destination || '-',
    },
    {
      header: 'LOADING OUT',
      accessorKey: 'loading_out',
      sortable: true,
      alignment: 'left',
      cell: (item) => item.order_list?.loading_out || '-',
    },
    {
      header: 'UJ DRIVER',
      accessorKey: 'uj_driver',
      sortable: true,
      alignment: 'right',
      cell: (item) => {
        const ujDriver = item.order_list?.uj_driver;
        return <span className="font-medium text-slate-900">{ujDriver != null ? formatCurrency(ujDriver) : '-'}</span>;
      },
    },
    {
      header: 'UJ LAINNYA',
      accessorKey: 'other_amount',
      sortable: true,
      alignment: 'right',
      cell: (item) => {
        const ujLainnya = getUJLainnyaAmount(item);
        return <span className="font-medium text-slate-900">{ujLainnya != null ? formatCurrency(ujLainnya) : '-'}</span>;
      },
    },
    {
      header: 'KAS MASUK',
      accessorKey: 'amount',
      sortable: true,
      alignment: 'right',
      cell: (item) => {
        const kasMasuk = getKasMasukAmount(item);
        return kasMasuk != null ? (
          <span className="text-emerald-600 font-medium">{formatCurrency(kasMasuk)}</span>
        ) : (
          <span className="text-slate-500 font-normal">Belum Bayar</span>
        );
      },
    },
    {
      header: 'ACTION',
      alignment: 'center',
      sticky: 'right',
      cell: (item) => {
        const kasMasuk = getKasMasukAmount(item);
        return kasMasuk != null ? (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 font-medium shadow-none">
            Lunas
          </Badge>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => onPay(item)}>
            Bayar
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600 mb-2">{errorMessage ?? 'Gagal memuat data'}</p>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      )}

      <BaseTable
        data={data}
        columns={columns}
        loading={isLoading}
        sortBy={currentSortBy}
        sortDirection={currentSortDirection || 'asc'}
        onSortChange={(key) => onSortChange(key)}
        meta={meta ? {
          currentPage: meta.current_page || 1,
          perPage: meta.per_page || 10,
          lastPage: meta.last_page || 1,
          total: meta.total || data.length,
        } : undefined}
        onPageChange={onPageChange}
      />
    </div>
  );
}
