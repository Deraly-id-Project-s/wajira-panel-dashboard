import type { DoInvoice, DoInvoiceListResponse } from '@/@types/do-invoice.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/currency';
import { format } from 'date-fns';
import { useOrderListDetail } from '@/hooks/useOrderList';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  data: DoInvoice[];
  meta: DoInvoiceListResponse['meta'] | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onPay: (item: DoInvoice) => void;
  onPageChange: (page: number) => void;
  onSortChange: (key: string) => void;
  currentSortBy?: string;
  currentSortDirection?: 'asc' | 'desc';
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'dd MMM yyyy');
};

const getKasMasukAmount = (item: DoInvoice) => {
  const payment = item.financeBillingPayment;
  if (!payment) return null;
  return payment.amount ?? payment.totalPaid ?? null;
};

// Component for cells that require the orderListDetail data
const OrderListDetailCell = ({
  item,
  render
}: {
  item: DoInvoice;
  render: (detail: any, isLoading: boolean, firstExp: any, orderList: any) => React.ReactNode;
}) => {
  const { data: orderListDetail, isLoading: isLoadingDetail } = useOrderListDetail(item.orderList?.id ?? null);
  const firstExp = item.expeditions?.[0];
  const orderList = item.orderList ?? firstExp?.orderList;

  return <>{render(orderListDetail, isLoadingDetail, firstExp, orderList)}</>;
};

export default function FinanceInvoiceTable({
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

  const columns: ColumnDef<DoInvoice>[] = [
    {
      header: 'NO',
      alignment: 'center',
      cell: (_, index) => {
        const page = meta?.currentPage ?? 1;
        const perPage = meta?.perPage ?? 10;
        const startIndex = data.length > 0 ? (page - 1) * perPage + 1 : 0;
        return startIndex > 0 ? startIndex + index : index + 1;
      }
    },
    {
      header: 'NO SURAT INVOICE',
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
      cell: (item) => (
        <OrderListDetailCell
          item={item}
          render={(detail, loading, firstExp, orderList) => {
            if (loading) return <Skeleton className="h-4 w-20" />;
            return firstExp?.vehicle?.registrationNumber ?? item.vehicle?.registrationNumber ?? detail?.vehicles?.[0]?.registrationNumber ?? '-';
          }}
        />
      ),
    },
    {
      header: 'TIPE',
      accessorKey: 'vehicle_type',
      sortable: true,
      alignment: 'left',
      cell: (item) => (
        <OrderListDetailCell
          item={item}
          render={(detail, loading, firstExp, orderList) => {
            if (loading) return <Skeleton className="h-4 w-16" />;
            return firstExp?.vehicle?.type ?? item.vehicle?.type ?? orderList?.vehicleType ?? detail?.vehicleType ?? '-';
          }}
        />
      ),
    },
    {
      header: 'DRIVER',
      accessorKey: 'driver_name',
      sortable: true,
      alignment: 'left',
      cell: (item) => {
        const firstExp = item.expeditions?.[0];
        return firstExp?.driver?.name ?? item.driver?.name ?? '-';
      },
    },
    {
      header: 'LOADING IN',
      accessorKey: 'loading_in',
      sortable: true,
      alignment: 'left',
      cell: (item) => (
        <OrderListDetailCell
          item={item}
          render={(detail, loading, firstExp, orderList) => {
            if (loading) return <Skeleton className="h-4 w-20" />;
            return firstExp?.tarif?.loadingIn ?? orderList?.loadingIn ?? detail?.loadingIn ?? '-';
          }}
        />
      ),
    },
    {
      header: 'TUJUAN',
      accessorKey: 'do_delivery_destination',
      sortable: true,
      alignment: 'left',
      cell: (item) => (
        <OrderListDetailCell
          item={item}
          render={(detail, loading, firstExp, orderList) => {
            if (loading) return <Skeleton className="h-4 w-24" />;
            return orderList?.doDeliveryDestination ?? firstExp?.destination ?? detail?.tarifs?.[0]?.deliveryDestination ?? '-';
          }}
        />
      ),
    },
    {
      header: 'LOADING OUT',
      accessorKey: 'loading_out',
      sortable: true,
      alignment: 'left',
      cell: (item) => (
        <OrderListDetailCell
          item={item}
          render={(detail, loading, firstExp, orderList) => {
            if (loading) return <Skeleton className="h-4 w-20" />;
            return firstExp?.tarif?.loadingOut ?? orderList?.loadingOut ?? detail?.loadingOut ?? '-';
          }}
        />
      ),
    },
    {
      header: 'INVOICE EKSPEDISI',
      accessorKey: 'invoice_amount',
      sortable: true,
      alignment: 'right',
      cell: (item) => (
        <OrderListDetailCell
          item={item}
          render={(detail, loading, firstExp, orderList) => {
            if (loading) return <Skeleton className="h-4 w-24 ml-auto" />;
            const invoiceEkspedisi = firstExp?.invoiceExpedition ?? orderList?.billInvoice ?? detail?.billInvoice ?? 0;
            return <span className="font-medium text-slate-900">{formatCurrency(invoiceEkspedisi)}</span>;
          }}
        />
      ),
    },
    {
      header: 'BIAYA TAMBAHAN',
      accessorKey: 'additional_fee',
      sortable: true,
      alignment: 'right',
      cell: (item) => {
        const additionalFee = (item.additionalFee ?? 0) + (item.otherFee ?? 0);
        return <span className="font-medium text-slate-900">{formatCurrency(additionalFee)}</span>;
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
          <Button type="button" variant="outline" onClick={() => onPay(item)}>
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
          <p className="text-sm text-red-600 mb-2">{errorMessage ?? 'Gagal memuat data invoice'}</p>
          {onRetry && (
            <Button type="button" variant="outline" onClick={onRetry}>
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
          currentPage: meta.currentPage || 1,
          perPage: meta.perPage || 10,
          lastPage: meta.lastPage || 1,
          total: meta.total || data.length,
        } : undefined}
        onPageChange={onPageChange}
      />
    </div>
  );
}
