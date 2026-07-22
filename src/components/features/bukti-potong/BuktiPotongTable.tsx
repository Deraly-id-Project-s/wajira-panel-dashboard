import { useMemo } from 'react';
import type { WithholdingTaxItem, WithholdingTaxListResponse } from '@/@types/withholding-tax.types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { CopyBox } from '@/components/ui/copy-box';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

interface Props {
  data: WithholdingTaxItem[];
  meta: WithholdingTaxListResponse['meta'] | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onView: (item: WithholdingTaxItem) => void;
  onEdit: (item: WithholdingTaxItem) => void;
  onDelete: (item: WithholdingTaxItem) => void;
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

export default function WithholdingTaxTable({
  data,
  meta,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onView,
  onEdit,
  onDelete,
  onPageChange,
  onSortChange,
  currentSortBy,
  currentSortDirection,
}: Props) {
  const page = meta?.currentPage ?? 1;
  const perPage = meta?.perPage ?? 10;

  const columns = useMemo<ColumnDef<WithholdingTaxItem>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'left',
        className: 'w-16',
        cell: (_, idx) => (page - 1) * perPage + idx + 1,
      },
      {
        header: 'TANGGAL',
        accessorKey: 'created_at',
        sortable: true,
        alignment: 'left',
        cell: (item) => formatDate(item.created_at),
      },
      {
        header: 'NO INVOICE',
        accessorKey: 'do_invoice.code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.no_invoice || item.do_invoice?.code || '-'} />,
      },
      {
        header: 'NO BUKPOT',
        accessorKey: 'withholding_number',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.withholding_number || '-'} />,
      },
      {
        header: 'MASA BUKPOT',
        accessorKey: 'withholding_age',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.withholding_age + ' Bulan' || '-',
      },
      {
        header: 'NOMINAL INVOICE',
        accessorKey: 'do_invoice.total_amount',
        sortable: true,
        alignment: 'left',
        cell: (item) => {
          const nominalInvoice = item.do_invoice?.total_amount ?? item.do_invoice?.invoice_amount ?? item.do_invoice?.bill_invoice ?? 0;
          return currenciesFormat('idr', nominalInvoice);
        },
      },
      {
        header: 'PPH',
        accessorKey: 'pph_amount',
        sortable: true,
        alignment: 'left',
        cell: (item) => currenciesFormat('idr', item.pph_amount || 0),
      },
      {
        header: 'UANG MUKA PPH',
        accessorKey: 'pph_description',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.pph_description || '-',
      },
      {
        header: 'JUMLAH PEMBAYARAN',
        accessorKey: 'payment_amount',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <span className="font-medium text-emerald-600">
            {currenciesFormat('idr', item.payment_amount || 0)}
          </span>
        ),
      },
      {
        header: 'TGL DIBAYAR',
        accessorKey: 'payment_date',
        sortable: true,
        alignment: 'left',
        cell: (item) => formatDate(item.payment_date),
      },
      {
        header: 'aksi',
        alignment: 'left',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onView(item)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                <span>Detail</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Hapus</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [page, perPage, onView, onEdit, onDelete]
  );

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600 mb-2">{errorMessage ?? 'Gagal memuat data bukti potong'}</p>
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
        sortDirection={currentSortDirection}
        onSortChange={(key) => onSortChange(key)}
        meta={{
          currentPage: page,
          perPage,
          lastPage: meta?.lastPage ?? 1,
          total: meta?.total ?? data.length,
        }}
        onPageChange={onPageChange}
      />
    </div>
  );
}
