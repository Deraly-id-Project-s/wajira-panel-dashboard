import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PPNPenjualan } from '@/@types/ppn.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Settings } from 'lucide-react';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDateUI } from '@/lib/utils/date';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useBulkUpdatePPNPenjualan } from '@/hooks/usePPN';
import { toast } from 'sonner';
import { MoneyInput } from '@/components/ui/money-input';

interface Props {
  data: PPNPenjualan[];
  meta: PaginationMeta;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  hasNextPage: boolean;
  isTotalExact: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onEdit: (item: PPNPenjualan) => void;
  onSortChange: (sortBy: string) => void;
  onPageChange: (page: number) => void;
}

const formatDate = (value: string | null) => {
  if (!value) return '-';

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : formatDateUI(parsed);
};

const renderStatusBadge = (hasValue: boolean, readyLabel: string, emptyLabel: string) => (
  <Badge className={hasValue ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none' : 'bg-amber-100 text-amber-700 hover:bg-amber-100 shadow-none'}>
    {hasValue ? readyLabel : emptyLabel}
  </Badge>
);

const getPPNRowMark = (item: PPNPenjualan) => {
  const hasFp = Boolean(item.fp_date);
  const hasNsfpAge = Boolean(item.nsfp_age);
  const hasNsfpNumber = Boolean(item.nsfp_number && item.nsfp_number.trim() !== '');

  if (hasFp && hasNsfpAge && hasNsfpNumber) {
    return 'success';
  }

  if (item.nsfp_age) {
    const date = new Date(item.nsfp_age);
    if (!Number.isNaN(date.getTime())) {
      const diffInMs = date.getTime() - Date.now();
      const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays < 0 || diffInDays <= 30) {
        return 'alert';
      }
      if (diffInDays <= 90) {
        return 'base';
      }
    }
  }

  return undefined;
};

export default function PPNPenjualanTable({
  data,
  meta,
  sortBy,
  sortDirection,
  hasNextPage,
  isTotalExact,
  isLoading = false,
  isFetching = false,
  isError = false,
  errorMessage,
  onRetry,
  onEdit,
  onSortChange,
  onPageChange,
}: Props) {
  const router = useRouter();
  const { slug } = router.query;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isOpenBulkModal, setIsOpenBulkModal] = useState(false);

  // Bulk update form states
  const [fpDate, setFpDate] = useState('');
  const [nsfpAge, setNsfpAge] = useState('');
  const [nsfpAmount, setNsfpAmount] = useState('');
  const [amount, setAmount] = useState('');
  const [nsfpNumber, setNsfpNumber] = useState('');

  const bulkUpdateMutation = useBulkUpdatePPNPenjualan();

  useEffect(() => {
    setSelectedIds(new Set());
  }, [data]);

  const handleSelectedIdsChange = useCallback((ids: Set<string>) => {
    setSelectedIds(ids);
  }, []);

  const handleSubmitBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = Array.from(selectedIds).map(Number).filter((id) => !isNaN(id) && id > 0);
    if (ids.length === 0) {
      toast.error('Pilih setidaknya satu data PPN Penjualan');
      return;
    }

    try {
      await bulkUpdateMutation.mutateAsync({
        ppn_data_ids: ids,
        fp_date: fpDate || undefined,
        nsfp_age: nsfpAge || undefined,
        nsfp_amount: nsfpAmount !== '' ? Number(nsfpAmount) : undefined,
        amount: amount !== '' ? Number(amount) : undefined,
        nsfp_number: nsfpNumber || undefined,
      });

      toast.success(`Berhasil memperbarui ${ids.length} data PPN Penjualan`);
      setSelectedIds(new Set());
      setIsOpenBulkModal(false);
      setFpDate('');
      setNsfpAge('');
      setNsfpAmount('');
      setAmount('');
      setNsfpNumber('');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal melakukan Update Data PPN Penjualan');
    }
  };

  const columns = useMemo<ColumnDef<PPNPenjualan>[]>(
    () => [
      {
        header: 'Kode Invoice',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item?.code ?? '-'} />
      },
      {
        header: 'Tanggal Jual',
        accessorKey: 'buy_date',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.buy_date),
      },
      {
        header: 'Tipe Unit',
        accessorKey: 'unit_type.name',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <div>
            <div className="font-medium text-slate-900">
              <ReferenceLink href={`/dashboard/${slug}/master/type-unit?search=${item?.unit_type?.name}`}>
                {item.unit_type.name}
              </ReferenceLink>
            </div>
            <div className="text-xs text-slate-500">{item.unit_type.code}</div>
          </div>
        ),
      },
      {
        header: 'Customer',
        accessorKey: 'supplier',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <ReferenceLink href={`/dashboard/${slug}/master/customer?search=${item?.supplier}`}>
            {item?.supplier}
          </ReferenceLink>
        )
      },
      {
        header: 'Tanggal FPM',
        accessorKey: 'fp_date',
        sortable: true,
        alignment: 'center',
        cell: (item) => {
          const hasFpm = Boolean(item.fp_date);
          return (
            <div className="space-y-1">
              {item.fp_date ? (
                <>
                  <div>{formatDate(item.fp_date)}</div>
                  {renderStatusBadge(hasFpm, 'FPM Terisi', 'Belum FPM')}
                </>
              ) : renderStatusBadge(false, 'FPM Terisi', 'Belum FPM')}
            </div>
          );
        },
      },
      {
        header: 'Masa NSFPM',
        accessorKey: 'nsfp_age',
        sortable: true,
        alignment: 'center',
        cell: (item) => {
          const hasNsfpmAge = Boolean(item.nsfp_age);
          return (
            <div className="space-y-1">
              {item.nsfp_age ? (
                <>
                  <div>{formatDate(item.nsfp_age)}</div>
                  {renderStatusBadge(hasNsfpmAge, 'NSFPM Terisi', 'Belum NSFPM')}
                </>
              ) : renderStatusBadge(false, 'NSFPM Terisi', 'Belum NSFPM')}
            </div>
          );
        },
      },
      {
        header: 'Nomor NSFP',
        alignment: 'center',
        cell: (item) => {
          const hasNsfpNumber = Boolean(item.nsfp_number && item.nsfp_number.trim() !== '');
          return (
            <div className="space-y-1 flex flex-col items-center">
              {hasNsfpNumber ? <CopyBox text={item.nsfp_number ?? '-'} /> : renderStatusBadge(false, 'Sudah Input', 'Belum Input')}
            </div>
          );
        },
      },
      {
        header: 'No Mesin',
        alignment: 'left',
        cell: (item) => (
          <CopyBox text={item.unit_transaction_item_detail?.machine_number ?? '-'} />
        ),
      },
      {
        header: 'No Rangka',
        alignment: 'left',
        cell: (item) => (
          <CopyBox text={item.unit_transaction_item_detail?.chassis_number ?? '-'} />
        ),
      },
      {
        header: 'Harga Unit',
        accessorKey: 'unit_price',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.unit_price),
      },
      {
        header: 'Total Harga',
        accessorKey: 'total_price',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.total_price),
      },
      {
        header: 'DPP',
        accessorKey: 'dpp_amount',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.dpp_amount),
      },
      {
        header: 'PPN 11%',
        accessorKey: 'ppn_11',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.ppn_11),
      },
      {
        header: 'Total Bayar',
        accessorKey: 'payment_amount',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.payment_amount),
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
            <DropdownMenuContent align="end" className="min-w-[100px] rounded-md p-2">
              <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer rounded-md px-3 py-2.5">
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onEdit, slug]
  );

  return (
    <div className="space-y-4">
      {isFetching && !isLoading && (
        <div className="rounded-md border border-blue-200 bg-blue-50/50 px-4 py-2 text-xs text-blue-700">
          Memperbarui data...
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600 mb-2">{errorMessage ?? 'Gagal memuat data PPN penjualan'}</p>
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
        loading={isLoading || isFetching}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={(key) => onSortChange(key)}
        showCheckbox
        selectedIds={selectedIds}
        onSelectedIdsChange={handleSelectedIdsChange}
        getRowId={(item) => String(item.id)}
        meta={{
          currentPage: meta.currentPage,
          perPage: meta.perPage,
          lastPage: isTotalExact ? meta.lastPage : (hasNextPage ? meta.currentPage + 1 : meta.currentPage),
          total: isTotalExact ? meta.total : (hasNextPage ? (meta.currentPage * meta.perPage) + 1 : meta.currentPage * meta.perPage),
        }}
        onPageChange={onPageChange}
        getRowMark={getPPNRowMark}
        headerActions={
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => setIsOpenBulkModal(true)}
              disabled={selectedIds.size === 0}
              variant="default"
            >
              <Settings size={14} /> Update Data ({selectedIds.size})
            </Button>
          </div>
        }
      />

      <Dialog open={isOpenBulkModal} onOpenChange={setIsOpenBulkModal}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl w-[90vw] p-6 rounded-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Update Data Data PPN Penjualan ({selectedIds.size} Data Terpilih)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 my-4">
            {/* Selected Items Summary Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="max-h-52 overflow-y-auto overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-[#f8f9fa] text-slate-600 uppercase text-xs font-semibold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3">Kode Invoice</th>
                      <th className="px-4 py-3">Tanggal Jual</th>
                      <th className="px-4 py-3">Tipe Unit</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Tanggal FPM</th>
                      <th className="px-4 py-3">Masa NSFPM</th>
                      <th className="px-4 py-3">Nomor NSFP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data
                      .filter((item) => selectedIds.has(String(item.id)))
                      .map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <CopyBox text={row.code ?? '-'} />
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(row.buy_date)}</td>
                          <td className="px-4 py-3 text-slate-600">{row.unit_type?.name ?? '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{row.supplier ?? '-'}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(row.fp_date)}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(row.nsfp_age)}</td>
                          <td className="px-4 py-3 text-slate-600 font-mono text-xs">{row.nsfp_number ?? '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Form Fields Grid */}
            <form id="bulk-update-ppn-penjualan-form" onSubmit={handleSubmitBulk} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Tanggal FPM (fp_date)</label>
                <Input
                  type="date"
                  value={fpDate}
                  onChange={(e) => setFpDate(e.target.value)}
                  className="bg-white border-slate-200 h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Masa NSFPM (nsfp_age)</label>
                <Input
                  type="date"
                  value={nsfpAge}
                  onChange={(e) => setNsfpAge(e.target.value)}
                  className="bg-white border-slate-200 h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Jumlah NSFP (nsfp_amount)</label>
                <Input
                  type="number"
                  placeholder="Jumlah NSFP"
                  value={nsfpAmount}
                  onChange={(e) => setNsfpAmount(e.target.value)}
                  className="bg-white border-slate-200 h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Total Nominal (amount)</label>
                <MoneyInput
                  placeholder="Nominal Rupiah"
                  value={Number(amount) || 0}
                  onChangeValue={(value) => setAmount(value.toString())}
                  className="bg-white border-slate-200 h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Nomor NSFP (nsfp_number)</label>
                <Input
                  type="text"
                  placeholder="Contoh: FAP0012"
                  value={nsfpNumber}
                  onChange={(e) => setNsfpNumber(e.target.value)}
                  className="bg-white border-slate-200 h-9 text-xs rounded-lg"
                />
              </div>
            </form>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => setIsOpenBulkModal(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="bulk-update-ppn-penjualan-form"
              disabled={bulkUpdateMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5"
            >
              {bulkUpdateMutation.isPending ? 'Memproses...' : 'Proses Update Bulk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
