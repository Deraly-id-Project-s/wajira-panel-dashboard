import type { WithholdingTaxItem, WithholdingTaxListResponse } from '@/@types/withholding-tax.types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils/currency';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';

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
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const columns: ColumnDef<WithholdingTaxItem>[] = [
    {
      header: 'NO INVOICE',
      accessorKey: 'do_invoice.code',
      sortable: true,
      alignment: 'left',
      cell: (item) => <CopyBox text={item.do_invoice?.code || '-'} />,
    },
    {
      header: 'TGL INVOICE',
      accessorKey: 'do_invoice.date',
      sortable: true,
      alignment: 'center',
      cell: (item) => <span className="text-slate-500 whitespace-nowrap">{formatDate(item.do_invoice?.date)}</span>,
    },
    {
      header: 'NO BUKPOT',
      accessorKey: 'withholding_number',
      sortable: true,
      alignment: 'left',
      cell: (item) => <CopyBox text={item.withholding_number || '-'} />,
    },
    {
      header: 'NAMA CUSTOMER',
      accessorKey: 'customer.name',
      sortable: true,
      alignment: 'left',
      cell: (item) => <ReferenceLink href={`/dashboard/${slug}/master/supplier?search=${encodeURIComponent(item.do_invoice?.customer?.name ?? '-')}`}>{item.do_invoice?.customer?.name ?? '-'}</ReferenceLink>,
    },
    {
      header: 'MASA BUKPOT',
      accessorKey: 'withholding_age',
      sortable: true,
      alignment: 'center',
      cell: (item) => <span className="text-slate-700">{item.withholding_age || '-'}</span>,
    },
    {
      header: 'NOMINAL INVOICE',
      accessorKey: 'do_invoice.total_amount',
      sortable: true,
      alignment: 'right',
      cell: (item) => {
        const nominalInvoice = item.do_invoice?.total_amount ?? item.do_invoice?.invoice_amount ?? item.do_invoice?.bill_invoice ?? 0;
        return <span className="font-medium text-slate-900">{formatCurrency(nominalInvoice)}</span>;
      },
    },
    {
      header: 'PPH',
      accessorKey: 'pph_amount',
      sortable: true,
      alignment: 'right',
      cell: (item) => <span className="font-medium text-slate-900">{formatCurrency(item.pph_amount || 0)}</span>,
    },
    {
      header: 'UANG MUKA PPH',
      accessorKey: 'pph_description',
      sortable: true,
      alignment: 'left',
      cell: (item) => <span className="text-slate-700">{item.pph_description || '-'}</span>,
    },
    {
      header: 'JUMLAH PEMBAYARAN',
      accessorKey: 'payment_amount',
      sortable: true,
      alignment: 'right',
      cell: (item) => <span className="font-medium text-emerald-600">{formatCurrency(item.payment_amount || 0)}</span>,
    },
    {
      header: 'TGL DIBAYAR',
      accessorKey: 'payment_date',
      sortable: true,
      alignment: 'center',
      cell: (item) => <span className="text-slate-500 whitespace-nowrap">{formatDate(item.payment_date)}</span>,
    },
    {
      header: 'ACTION',
      alignment: 'center',
      sticky: 'right',
      headerClassName: 'w-24',
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
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
  ];

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600 mb-2">{errorMessage ?? 'Gagal memuat data bukti potong'}</p>
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
