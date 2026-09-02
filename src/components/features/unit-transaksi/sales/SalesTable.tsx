'use client';


import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { PaginationMeta } from '@/@types/pagination.types';
import { UnitTransaction } from '@/@types/unit-transaction.types';
import { cn } from '@/lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Plus, Search, Eye, Pencil, Trash2, RotateCcw, Printer, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SearchVehicleModal from '@/components/features/vehicle/SearchVehicleModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils/format';

export interface SalesTableProps {
  data: UnitTransaction[];
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

export function SalesTable({
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
}: SalesTableProps) {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState(search || '');
  const [billingFilter, setBillingFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [isVehicleSearchOpen, setIsVehicleSearchOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const isRefunded = (item: UnitTransaction) => String(item.stock_state ?? '').toLowerCase() === 'outbound_return';
  const getBillingLabel = useCallback((item: UnitTransaction) => {
    if (isRefunded(item)) return 'Refund';
    return item.isPaid ? 'Lunas' : 'Belum Lunas';
  }, []);

  const getRemainingPayment = (item: UnitTransaction) => {
    if (item.isPaid) return item.remainingPayment || 0;
    if (!item.remainingPayment) return item.transaction_bruto_total || 0;
    return item.remainingPayment || 0;
  };

  const processedData = useMemo(() => {
    const filtered = data.filter((item) => {
      if (billingFilter === 'paid') return Boolean(item.isPaid);
      if (billingFilter === 'unpaid') return !Boolean(item.isPaid);
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const factor = sortConfig.direction === 'asc' ? 1 : -1;

      const compareDate = (valueA?: string, valueB?: string) => {
        const dateA = valueA ? new Date(valueA).getTime() : 0;
        const dateB = valueB ? new Date(valueB).getTime() : 0;
        return (dateA - dateB) * factor;
      };

      const compareNumber = (valueA?: number, valueB?: number) => ((Number(valueA ?? 0) - Number(valueB ?? 0)) * factor);
      const compareText = (valueA?: string, valueB?: string) => (String(valueA ?? '').localeCompare(String(valueB ?? '')) * factor);

      switch (sortConfig.key) {
        case 'code':
          return compareText(a.code, b.code);
        case 'created_at':
          return compareDate(a.created_at, b.created_at);
        case 'supplier':
          return compareText(a.supplier, b.supplier);
        case 'warehouse':
          return compareText(a.warehouse, b.warehouse);
        case 'transaction_bruto_total':
          return compareNumber(a.transaction_bruto_total, b.transaction_bruto_total);
        case 'transaction_bbn_total':
          return compareNumber(a.transaction_bbn_total, b.transaction_bbn_total);
        case 'expedition_fee_total':
          return compareNumber(a.expedition_fee_total, b.expedition_fee_total);
        case 'transaction_other_fee':
          return compareNumber(a.transaction_other_fee, b.transaction_other_fee);
        case 'transaction_dpp_total':
          return compareNumber(a.transaction_dpp_total, b.transaction_dpp_total);
        case 'transaction_ppn_total':
          return compareNumber(a.transaction_ppn_total, b.transaction_ppn_total);
        case 'remainingPayment':
          return compareNumber(getRemainingPayment(a), getRemainingPayment(b));
        case 'stock_state':
          return compareText(a.stock_state, b.stock_state);
        case 'billing':
          return compareText(getBillingLabel(a), getBillingLabel(b));
        default:
          return 0;
      }
    });

    return sorted;
  }, [data, billingFilter, sortConfig, getBillingLabel]);

  const currentPage = meta?.currentPage ?? 1;
  const itemsPerPage = meta?.perPage ?? 25;
  const totalPages = meta?.lastPage ?? 1;
  const totalEntries = billingFilter === 'all' ? meta?.total ?? processedData.length : processedData.length;

  const pagedData = useMemo(() => {
    // If backend pagination metadata is present, do not slice client-side
    if (meta) {
      return processedData;
    }
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return processedData.slice(start, end);
  }, [processedData, meta, currentPage, itemsPerPage]);

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

  const columns: ColumnDef<UnitTransaction>[] = useMemo(
    () => [
      {
        header: 'No. Transaksi',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left',
        cell: (item) => {
          const showUnBilled = item.billing_summary?.is_paid === false || item.isPaid === false;
          const showUnVerified = item.isUnitTypeDetailValid === false;

          let tooltipText = '';
          if (showUnBilled && showUnVerified) {
            tooltipText = 'Tagihan belum lunas dan detail tipe unit belum lengkap/belum valid';
          } else if (showUnBilled) {
            tooltipText = 'Tagihan belum lunas';
          } else if (showUnVerified) {
            tooltipText = 'Detail tipe unit belum lengkap/belum valid';
          }

          return (
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              {(showUnBilled || showUnVerified) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="cursor-help text-amber-500 hover:text-amber-600 transition-colors flex items-center shrink-0">
                        <AlertTriangle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-xs bg-slate-900 text-white rounded-lg p-2 text-xs shadow-md">
                      {tooltipText}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <CopyBox text={item.code} />
            </div>
          );
        },
      },
      {
        header: 'Tanggal',
        accessorKey: 'created_at',
        sortable: true,
        alignment: 'center',
        cell: (item) => item?.created_at || '-',
      },
      {
        header: 'Customer',
        accessorKey: 'supplier',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <ReferenceLink href={`/dashboard/${slug}/customer?search=${encodeURIComponent(item.supplier || '')}`}>
              {item.supplier || '-'}
            </ReferenceLink>
            {isRefunded(item) && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                Sudah Refund
              </Badge>
            )}
          </div>
        ),
      },
      {
        header: 'Gudang',
        accessorKey: 'warehouse',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.warehouse || '-',
      },
      {
        header: 'Bruto Total',
        accessorKey: 'transaction_bruto_total',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.transaction_bruto_total),
      },
      {
        header: 'BBN Total',
        accessorKey: 'transaction_bbn_total',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.transaction_bbn_total),
      },
      {
        header: 'Ekspedisi Total',
        accessorKey: 'expedition_fee_total',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.expedition_fee_total),
      },
      {
        header: 'Biaya Lainnya',
        accessorKey: 'transaction_other_fee',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.transaction_other_fee),
      },
      {
        header: 'DPP Total',
        accessorKey: 'transaction_dpp_total',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.transaction_dpp_total),
      },
      {
        header: 'PPN Total',
        accessorKey: 'transaction_ppn_total',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.transaction_ppn_total),
      },
      {
        header: 'Sisa Pembayaran',
        accessorKey: 'remainingPayment',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <span className={cn(getRemainingPayment(item) !== 0 && 'text-red-600 font-semibold')}>
            {currenciesFormat('idr', getRemainingPayment(item))}
          </span>
        ),
      },
      {
        header: 'Status Billing',
        alignment: 'center',
        accessorKey: 'billing',
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
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                onClick={() => router.push(slug ? `/dashboard/${slug}/transaksi/penjualan-unit/${item.id}` : `/transaksi/penjualan-unit/${item.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" /> Detail
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuItem
                    disabled={!canEdit}
                    className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(slug ? `/dashboard/${slug}/transaksi/penjualan-unit/edit/${item.id}` : `/transaksi/penjualan-unit/edit/${item.id}`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(slug ? `/dashboard/${slug}/transaksi/penjualan-unit/${item.id}/refund` : `/transaksi/penjualan-unit/${item.id}/refund`)}
                    disabled={isRefunded(item) || !canEdit}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Refund Jual
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                    disabled={!item.documentTemplateId}
                    title={!item.documentTemplateId ? 'Document template belum dipilih.' : undefined}
                    onClick={() => item.documentTemplateId && window.open(slug ? `/dashboard/${slug}/transaksi/penjualan-unit/print/${item.id}` : `/transaksi/penjualan-unit/print/${item.id}`, '_blank')}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </DropdownMenuItem>
                </>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    if (item.isPaid) {
                      e.preventDefault();
                      return;
                    }
                    onDelete(item.id);
                  }}
                  disabled={item.isPaid || !canDelete}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer",
                    item.isPaid && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-red-600 focus:bg-transparent"
                  )}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Hapus
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [slug, canEdit, canDelete, onDelete, getBillingLabel, router]
  );

  const headerActions = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {/* Search */}
        <div className="relative w-full sm:w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search No. Rangka / No. Mesin..."
            className="pl-8 bg-white h-9 border-slate-300"
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 h-9 font-medium rounded-md shadow-none px-4 whitespace-nowrap"
          onClick={() => setIsVehicleSearchOpen(true)}
        >
          Cari Data Kendaraan
        </Button>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-sm font-medium text-slate-700">Show</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-[70px] bg-white h-9 border-slate-300">
              <SelectValue placeholder="25" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm font-medium text-slate-700">Page</span>
        </div>
      </div>

      {onAdd && (
        <Button onClick={onAdd} disabled={!canCreate} className="btn-primary!">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Data
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <BaseTable
        data={pagedData}
        columns={columns}
        loading={loading}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        showLimitChange={false}
        perPage={itemsPerPage}
        onPerPageChange={(val) => {
          handleItemsPerPageChange(val.toString());
          onPageChange?.(1);
        }}
        meta={{
          currentPage,
          perPage: itemsPerPage,
          lastPage: totalPages,
          total: totalEntries,
        }}
        onPageChange={handlePageChange}
        headerActions={headerActions}
        addDateRangePicker={true}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
      />

      {/* Vehicle Search Modal */}
      <SearchVehicleModal open={isVehicleSearchOpen} onOpenChange={setIsVehicleSearchOpen} type="sales" />
    </div>
  );
}
