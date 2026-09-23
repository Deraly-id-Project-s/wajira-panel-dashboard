import { useCallback, useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SparepartTransaction } from '@/@types/sparepart-transaction.types';
import { Eye, MoreVertical, Pencil, Plus, Search, Trash2, Undo2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/router';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { PaginationMeta } from '@/@types/pagination.types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { formatDate } from '@/lib/utils/format';
import { useCustomers } from '@/hooks/useCustomer';
import { useSpareparts } from '@/hooks/useSparepart';
import { useCompany } from '@/contexts/CompanyContext';

export interface SalesSparepartTableProps {
  data: SparepartTransaction[];
  meta?: PaginationMeta;
  onDelete: (id: string) => void;
  onAdd?: () => void;
  slug: string;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  search?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
  onSearchChange?: (value: string) => void;
  loading?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  onDateRangeChange?: (start: string | null, end: string | null) => void;
}

export default function SalesSparepartTable({
  data,
  meta,
  onDelete,
  onAdd,
  slug,
  onPageChange,
  onPerPageChange,
  loading,
  search,
  canEdit,
  canDelete,
  canCreate,
  onSearchChange,
  startDate,
  endDate,
  onDateRangeChange,
}: SalesSparepartTableProps) {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState(search || '');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { companyId } = useCompany();
  const { data: customers } = useCustomers({ company_id: companyId ?? undefined });
  const { data: spareparts } = useSpareparts(companyId ?? undefined);

  const getCustomerName = useCallback((item: SparepartTransaction) => {
    if (item.person?.name) return item.person.name;
    if ((item as any).customer?.name) return (item as any).customer.name;
    if (!item.person_id) return '-';
    return customers?.data?.find((s: any) => String(s.id) === String(item.person_id))?.name || String(item.person_id);
  }, [customers]);

  const getSparepartName = useCallback((item: SparepartTransaction) => {
    if (item.sparepart?.name) return item.sparepart.name;
    if ((item as any).sparepart?.name) return (item as any).sparepart.name;
    if ((item as any).sparepart?.name) return (item as any).sparepart.name;
    if (!item.sparepart_id) return '-';
    return spareparts?.data?.find((s: any) => String(s.id) === String(item.sparepart_id))?.name || String(item.sparepart_id);
  }, [spareparts]);

  // Debounce search
  useEffect(() => {
    setLocalSearch(search || '');
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange && localSearch !== (search || '')) {
        onSearchChange(localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, search]);

  const getBillingLabel = useCallback((item: SparepartTransaction) => {
    if (item.is_refunded) return 'Refund';
    return item.sparepart_transaction_billing?.is_paid ? 'Lunas' : 'Belum Lunas';
  }, []);

  const currentPage = meta?.currentPage ?? 1;
  const itemsPerPage = meta?.perPage ?? 25;
  const totalPages = meta?.lastPage ?? 1;
  const totalEntries = meta?.total ?? data.length;

  const handleItemsPerPageChange = (value: string) => {
    const parsed = Number(value);
    onPerPageChange?.(parsed);
  };

  const handlePageChange = (page: number) => {
    onPageChange?.(page);
  };

  const handleSearch = (value: string) => {
    setLocalSearch(value);
  };

  const columns: ColumnDef<SparepartTransaction>[] = useMemo(
    () => [
      {
        header: 'Kode Transaksi',
        accessorKey: 'code',
        sortable: true,
        cell: (item) => (
          <CopyBox text={item.code || '-'} />
        ),
      },
      {
        header: 'Tanggal',
        accessorKey: 'transaction_date',
        sortable: true,
        cell: (item) => formatDate(item?.transaction_date || item?.created_at) || '-',
      },
      {
        header: 'Customer',
        accessorKey: 'person.name',
        sortable: true,
        cell: (item) => (
          <ReferenceLink href={`/dashboard/${slug}/master/customer?search=${encodeURIComponent(getCustomerName(item))}`}>
            {getCustomerName(item) === String(item.person_id) ? `Customer #${item.person_id}` : getCustomerName(item)}
          </ReferenceLink>
        ),
      },
      {
        header: 'Sparepart',
        accessorKey: 'sparepart.name',
        sortable: true,
        cell: (item) => (
          <ReferenceLink href={`/dashboard/${slug}/master/sparepart?search=${encodeURIComponent(getSparepartName(item) === String(item.sparepart_id) ? '' : getSparepartName(item))}`}>
            {getSparepartName(item) === String(item.sparepart_id) ? `Sparepart #${item.sparepart_id}` : getSparepartName(item)}
          </ReferenceLink>
        ),
      },
      {
        header: 'Qty',
        alignment: 'center',
        accessorKey: 'qty',
        sortable: true,
        cell: (item) => item.qty || 0,
      },
      {
        header: 'Bruto Total',
        alignment: 'center',
        accessorKey: 'transaction_bruto_total',
        sortable: true,
        cell: (item) => currenciesFormat('idr', item.transaction_bruto_total),
      },
      {
        header: 'Diskon',
        alignment: 'center',
        accessorKey: 'discount',
        sortable: true,
        cell: (item) => `${item.discount || 0} %`,
      },
      {
        header: 'Netto Total',
        alignment: 'center',
        className: 'font-semibold',
        accessorKey: 'transaction_netto_total',
        sortable: true,
        cell: (item) => currenciesFormat('idr', item.transaction_netto_total),
      },
      {
        header: 'Sisa Pembayaran',
        alignment: 'center',
        accessorKey: 'billing_summary.remaining_payment',
        sortable: true,
        cell: (item) => {
          const remaining = item.billing_summary?.remaining_payment || 0;
          return (
            <span className={cn(remaining !== 0 && 'text-red-600 font-semibold')}>
              {currenciesFormat('idr', remaining)}
            </span>
          );
        },
      },
      {
        header: 'Status Billing',
        alignment: 'center',
        accessorKey: 'billing_summary.is_paid',
        sortable: true,
        cell: (item) => {
          const label = getBillingLabel(item);
          return (
            <Badge
              className={cn(
                'font-medium',
                label === 'Lunas' && 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
                label === 'Belum Lunas' && 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
                label === 'Refund' && 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              )}
            >
              {label}
            </Badge>
          );
        },
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-sparepart/${item.id}`)}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                Detail
              </DropdownMenuItem>
              {!item.is_refunded && canCreate && (
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/${slug}/transaksi/refund-sparepart/create?sparepart_transaction_id=${item.id}`)}
                  className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                >
                  Refund
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/${slug}/transaksi/penjualan-sparepart/edit/${item.id}`)}
                  className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                >
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className={cn(
                    "rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer",
                    item.sparepart_transaction_billing?.is_paid && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-red-600 focus:bg-transparent"
                  )}
                  disabled={item.sparepart_transaction_billing?.is_paid}
                  onClick={(e) => {
                    if (item.sparepart_transaction_billing?.is_paid) {
                      e.preventDefault();
                      return;
                    }
                    onDelete(String(item.id));
                  }}
                >
                  Hapus
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [slug, canCreate, canEdit, canDelete, onDelete, getBillingLabel, router, getCustomerName, getSparepartName]
  );

  const headerActions = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search Kode Transaksi..."
            className="pl-8 bg-white h-9 border-slate-300"
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-sm font-medium text-slate-700">Show</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-[70px] bg-white h-9 border-slate-300">
              <SelectValue placeholder="25" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm font-medium text-slate-700">Page</span>
        </div>
      </div>

      {onAdd && canCreate && (
        <Button onClick={onAdd} className="btn-primary!">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Data
        </Button>
      )}
    </div>
  );

  const showInternalControls = Boolean(onSearchChange);

  return (
    <div className="space-y-4">
      <BaseTable
        data={data}
        columns={columns}
        loading={loading}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        showLimitChange={false}
        perPage={itemsPerPage}
        onPerPageChange={onPerPageChange}
        meta={meta}
        onPageChange={onPageChange}
        headerActions={showInternalControls ? headerActions : undefined}
        addDateRangePicker={showInternalControls && Boolean(onDateRangeChange)}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
      />
    </div>
  );
}
