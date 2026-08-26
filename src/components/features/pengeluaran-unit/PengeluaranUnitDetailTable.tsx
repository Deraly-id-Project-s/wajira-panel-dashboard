import { useCallback, useEffect, useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { WarehouseActivityUnitDetail } from '@/@types/warehouse.types';
import { useRouter } from 'next/router';
import { ReferenceLink } from '@/components/ui/reference-link';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useBulkUpdateUnitItemDetails, useWarehouseSubBlocks } from '@/hooks/useUnitItemDetail';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  data?: WarehouseActivityUnitDetail[];
  activityState?: string;
  isRefundActivity?: boolean;
  isLoading?: boolean;
}

export default function PengeluaranUnitDetailTable({ data, isRefundActivity, activityState, isLoading = false }: Props) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [search, setSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [dispatchFilter, setDispatchFilter] = useState<'all' | 'issued' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [dispatchedIds, setDispatchedIds] = useState<number[]>([]);

  // Modal State
  const [isOpenProcessModal, setIsOpenProcessModal] = useState(false);
  const [stockState, setStockState] = useState<string>('receipt');
  const [warehouseSubBlockId, setWarehouseSubBlockId] = useState<string>('');

  const { data: subBlocksResponse, isLoading: subBlocksLoading } = useWarehouseSubBlocks({ is_active: true });
  const bulkUpdateMutation = useBulkUpdateUnitItemDetails();

  const rows = useMemo(() => {
    const source = data ?? [];
    return source.map((item) => ({
      id: item.id,
      salesCode: item.noPembelian,
      unitTypeName: item.tipeUnit,
      color: item.warna,
      machineNumber: item.noMesin,
      chassisNumber: item.noRangka,
      isDispatched: item.diterima,
      inStock: item.in_stock,
      in_stock: item.in_stock,
      status: item.status,
      state: item?.stockState,
      warehouseSubBlock: item?.warehouseSubBlock,
      isSoldUnit: item.isSoldUnit,
    }));
  }, [data]);

  useEffect(() => {
    const serverDispatchedIds = rows.filter((item) => item.isDispatched).map((item) => item.id);
    setDispatchedIds((prev) => Array.from(new Set([...prev, ...serverDispatchedIds])));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = rows;

    if (term) {
      result = result.filter((row) =>
        [row.salesCode, row.unitTypeName, row.color, row.machineNumber, row.chassisNumber]
          .map((val) => String(val ?? '').toLowerCase())
          .some((val) => val.includes(term))
      );
    }

    if (dispatchFilter === 'issued') {
      result = result.filter((item) => item.isDispatched);
    } else if (dispatchFilter === 'pending') {
      result = result.filter((item) => !item.isDispatched);
    }

    return result;
  }, [rows, search, dispatchFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, safePage, itemsPerPage]);

  useEffect(() => {
    setSelected([]);
  }, [filteredRows]);

  const issuedCount = useMemo(() => rows.filter((item) => dispatchedIds.includes(item.id)).length, [rows, dispatchedIds]);
  const pendingCount = useMemo(() => rows.filter((item) => !dispatchedIds.includes(item.id)).length, [rows, dispatchedIds]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, search, dispatchFilter]);

  const stringSelectedIds = useMemo(() => new Set(selected.map(String)), [selected]);

  const handleSelectedIdsChange = useCallback((ids: Set<string>) => {
    setSelected(Array.from(ids).map(Number));
  }, []);

  const handleSubmitProcess = async () => {
    if (selected.length === 0) return;
    try {
      await bulkUpdateMutation.mutateAsync({
        unit_transaction_item_details_ids: selected,
        stock_state: stockState,
        transaction_type: 'sales',
        warehouse_sub_block_id: warehouseSubBlockId ? Number(warehouseSubBlockId) : null,
      });
      toast.success('Berhasil memproses status dan sub-blok unit');
      setSelected([]);
      setIsOpenProcessModal(false);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memproses data unit');
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'Kode Jual',
        accessorKey: 'salesCode',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <CopyBox text={item.salesCode || ""} />
        )
      },
      {
        header: 'Tipe Unit',
        accessorKey: 'unitTypeName',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <ReferenceLink href={`/dashboard/${slug}/master/type-unit?search=${item.unitTypeName}`}>
            {item.unitTypeName}
          </ReferenceLink>
        ),
      },
      {
        header: 'Warna',
        accessorKey: 'color',
        sortable: true,
        alignment: 'left',
      },
      {
        header: 'Nomor Mesin',
        accessorKey: 'machineNumber',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <CopyBox text={item?.machineNumber || ""} />
        )
      },
      {
        header: 'Nomor Rangka',
        accessorKey: 'chassisNumber',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <CopyBox text={item?.chassisNumber || ""} />
        )
      },
      {
        header: 'Sub Blok',
        accessorKey: 'warehouseSubBlock',
        sortable: true,
        alignment: 'center',
        tooltip: 'Lokasi sub-blok penyimpanan unit di dalam gudang',
        cell: (item) => item.warehouseSubBlock ? <CopyBox text={item.warehouseSubBlock} /> : <Badge variant='outline' className={`font-semibold bg-white`}>Belum Ditambahkan</Badge>
      },
      {
        header: 'Status Stok',
        accessorKey: 'in_stock',
        sortable: true,
        alignment: 'center',
        tooltip: 'Status ketersediaan unit fisik di gudang',
        cell: (item) => item?.in_stock ? <Badge variant="outline" className={cn('capitalize', 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold')}>Tersedia</Badge> : <Badge variant="outline" className={cn('capitalize', 'border-rose-200 bg-rose-50 text-rose-700 font-semibold')}>Tidak Tersedia {item?.isSoldUnit && isRefundActivity ? '/ Dikembalikan' : '/ Terjual'}</Badge>
      },
      {
        header: 'Kondisi Stok',
        accessorKey: 'status',
        sortable: true,
        alignment: 'center',
        tooltip: 'Kondisi fisik unit saat ini',
        cell: (item) => {
          let text = '-';
          let background = 'border-slate-200 bg-slate-50 text-slate-700';
          switch (item?.status) {
            case 'returned':
              text = 'Retur Beli';
              background = 'border-purple-200 bg-purple-50 text-purple-700 font-semibold';
              break;
            case 'refunded':
              text = 'Refund Jual';
              background = 'border-orange-200 bg-orange-50 text-orange-700 font-semibold';
              break;
            case 'normal':
              text = 'Normal';
              background = 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold';
              break;
            default:
              text = 'Belum Dikeluarkan';
              background = 'border-amber-200 bg-amber-50 text-amber-700 font-semibold';
              break;
          }

          return (
            <Badge variant='outline' className={cn('capitalize font-semibold', background)}>
              {text}
            </Badge>
          );
        },
      },
      {
        header: 'Posisi Stok',
        accessorKey: 'state',
        sortable: true,
        alignment: 'center',
        tooltip: 'Posisi logistik atau status alur stok unit',
        cell: (item) => {
          const config: Record<string, { label: string; name: string; className: string }> = {
            draft: { label: 'Draft', name: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600 font-semibold' },
            cancel: { label: 'Cancel', name: 'Batal', className: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' },
            prepare: { label: 'Prepare', name: 'Disiapkan', className: 'border-amber-200 bg-amber-50 text-amber-700 font-semibold' },
            purchase_order: { label: 'Purchase Order', name: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700 font-semibold' },
            in_transit: { label: 'In Transit', name: 'Dalam Perjalanan', className: 'border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold' },
            receipt: { label: 'Receipt', name: 'Terkirim', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
          };

          const stateVal = item?.state ?? 'draft';
          const match = config[stateVal] ?? {
            label: stateVal.replace(/_/g, ' '),
            name: stateVal.replace(/_/g, ' '),
            className: 'border-slate-200 bg-slate-50 text-slate-700 font-semibold',
          };

          return (
            <Badge variant="outline" className={cn('capitalize font-semibold', match.className)}>
              {item?.state === 'receipt' ? (isRefundActivity ? 'Dikembalikan' : (item?.isSoldUnit ? 'Dikirim' : 'Diterima')) : match.label}
            </Badge>
          );
        }
      }
    ],
    [slug, isRefundActivity]
  );

  return (
    <div className="space-y-4">
      <BaseTable
        data={paginatedRows}
        columns={columns}
        loading={isLoading}
        search={search}
        onSearchChange={setSearch}
        showLimitChange
        perPage={itemsPerPage}
        onPerPageChange={setItemsPerPage}
        showCheckbox={activityState !== 'done'}
        selectedIds={stringSelectedIds}
        onSelectedIdsChange={handleSelectedIdsChange}
        getRowId={(item) => String(item.id)}
        isCheckboxDisabled={(item) => activityState?.toLowerCase() === 'done'}
        meta={{
          currentPage: safePage,
          perPage: itemsPerPage,
          lastPage: totalPages,
          total: filteredRows.length,
        }}
        onPageChange={setCurrentPage}
        headerActions={
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>Filter Status</span>
                <Select value={dispatchFilter} onValueChange={(val) => setDispatchFilter(val as 'all' | 'issued' | 'pending')}>
                  <SelectTrigger className="h-10 w-[190px] border-gray-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Data</SelectItem>
                    <SelectItem value="pending">Belum Dikeluarkan</SelectItem>
                    <SelectItem value="issued">Sudah Dikeluarkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Dikeluarkan: {issuedCount}</span>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Belum Dikeluarkan: {pendingCount}</span>

                <Button
                  onClick={() => setIsOpenProcessModal(true)}
                  disabled={selected.length === 0}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs gap-1.5 font-medium rounded-lg ml-2 shadow-sm"
                >
                  <Settings size={14} className="animate-spin-hover" /> Proses Data ({selected.length})
                </Button>
              </div>
            </div>
          </div>
        }
      />

      <Dialog open={isOpenProcessModal} onOpenChange={setIsOpenProcessModal}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl w-[90vw] p-6 rounded-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Proses Data Unit ({selected.length} Unit Terpilih)</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 my-4 overflow-x-scroll">
            {/* Selected Vehicles Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="max-h-60 overflow-y-auto overflow-x-scroll">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-[#f8f9fa] text-slate-600 uppercase text-xs font-semibold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3">Kode Jual</th>
                      <th className="px-4 py-3">Tipe Unit</th>
                      <th className="px-4 py-3">Warna</th>
                      <th className="px-4 py-3">No Mesin</th>
                      <th className="px-4 py-3">No Rangka</th>
                      <th className="px-4 py-3">Sub Blok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.filter((row) => selected.includes(row.id)).map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <CopyBox text={row.salesCode ?? "-"} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <ReferenceLink href={`/dashboard/${slug}/master?search=${row?.unitTypeName}`}>
                            {row.unitTypeName}
                          </ReferenceLink>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.color || '-'}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs"><CopyBox text={row.machineNumber || ''} /></td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs"><CopyBox text={row.chassisNumber || ''} /></td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                          {row.warehouseSubBlock ? <CopyBox text={row.warehouseSubBlock} /> : <Badge variant='outline' className={`font-semibold bg-white`}>Belum Ditambahkan</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Posisi Stok</label>
                <Select value={stockState} onValueChange={setStockState}>
                  <SelectTrigger className="w-full bg-white border-slate-200 h-10 rounded-lg">
                    <SelectValue placeholder="Pilih posisi stok" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase_order">Purchase Order (PO)</SelectItem>
                    <SelectItem value="in_transit">In Transit (Dalam Perjalanan)</SelectItem>
                    <SelectItem value="receipt">Receipt (Dikeluarkan / Dikirim)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Sub Blok Gudang</label>
                <Select value={warehouseSubBlockId} onValueChange={setWarehouseSubBlockId}>
                  <SelectTrigger className="w-full bg-white border-slate-200 h-10 rounded-lg">
                    <SelectValue placeholder={subBlocksLoading ? "Memuat sub blok..." : "Pilih sub blok gudang"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subBlocksResponse?.data?.data && subBlocksResponse.data.data.length > 0 ? (
                      subBlocksResponse.data.data.map((sb: any) => (
                        <SelectItem key={sb.id} value={String(sb.id)}>
                          {sb.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        Sub blok gudang tidak ditemukan.
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button variant="outline" className="rounded-lg" onClick={() => setIsOpenProcessModal(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmitProcess}
              disabled={bulkUpdateMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5"
            >
              {bulkUpdateMutation.isPending ? 'Memproses...' : 'Proses Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
