import { useCallback, useMemo, useState } from 'react';

import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Eye, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { SalesLineItem } from '../sales.data';
import { useBulkDeleteUnitItem, useDeleteUnitItem, useSalesUnitItems } from '@/hooks/useUnitTransactionItem';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import { toast } from 'sonner';
import { ReferenceLink } from '@/components/ui/reference-link';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

interface Props {
  lineItems: SalesLineItem[];
  salesId: string;
  onAddUnit?: () => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  isPaid?: boolean;
}

export function SalesUnitTable({ lineItems, salesId, onAddUnit, canCreate, canEdit, canDelete, isPaid }: Props) {
  const router = useRouter();
  const { data: unitItemsData, isLoading, isError } = useSalesUnitItems(salesId);
  const { data: typeUnits } = useTypeUnits();
  const deleteMutation = useDeleteUnitItem();
  const bulkDeleteMutation = useBulkDeleteUnitItem();
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const slugQuery = router.query.slug;
  const slug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery || '';
  const basePath = slug ? `/dashboard/${slug}/transaksi/penjualan-unit` : '/transaksi/penjualan-unit';

  const items = useMemo(() => {
    return unitItemsData?.data ?? lineItems.map((item) => ({
      id: String(item.id),
      unit_transaction_id: String(salesId),
      unit_type_id: undefined,
      qty_total: Number(item.qty ?? 0),
      price: Number(item.hargaJual ?? 0),
      bbn_price: Number(item.biayaBbn ?? 0),
      expedition_fee: Number(item.biayaEkspedisi ?? 0),
      other_fee: Number(item.biayaLain ?? 0),
      hpp_total_price: Number(item.hpp ?? 0),
      dpp_total_price: Number(item.dpp ?? 0),
      ppn_total_price: Number(item.ppn ?? 0),
      price_usd: item.price_usd ? Number(item.price_usd) : undefined,
      price_per_unit_usd: item.price_per_unit_usd ? Number(item.price_per_unit_usd) : undefined,
    }));
  }, [unitItemsData?.data, lineItems, salesId]);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [currentPage, perPage, items]);

  const getUnitTypeName = useCallback((id?: string) => {
    if (!id) return '-';
    return typeUnits?.data?.find((unitType) => String(unitType.id) === String(id))?.name ?? '-';
  }, [typeUnits]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId, purchaseId: salesId });
      toast.success('Unit item berhasil dihapus');
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(deleteId); return next; });
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus unit item');
    }
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error('Pilih minimal satu item');
      return;
    }
    try {
      await bulkDeleteMutation.mutateAsync({ ids, purchaseId: salesId });
      toast.success(`${ids.length} unit item berhasil dihapus`);
      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal bulk delete unit item');
    }
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      header: 'Tipe Unit',
      cell: (item) => (
        <ReferenceLink href={`/dashboard/${slug}/master/unit-type?search=${getUnitTypeName(item.unit_type_id)}`}>
          {getUnitTypeName(item.unit_type_id)}
        </ReferenceLink>
      ),
    },
    {
      header: 'QTY',
      alignment: 'center',
      className: 'w-[80px]',
      cell: (item) => item.qty_total + ' Unit',
    },
    {
      header: 'Harga Jual',
      alignment: 'center',
      cell: (item) => (
        <div>
          <div>{currenciesFormat('idr', item.price)}</div>
          {item.price_usd ? (
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5" title="Harga Jual USD">
              {currenciesFormat('usd', item.price_usd)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      header: 'Biaya BBN',
      alignment: 'center',
      cell: (item) => currenciesFormat('idr', item.bbn_price),
    },
    {
      header: 'Biaya Ekspedisi',
      alignment: 'center',
      cell: (item) => currenciesFormat('idr', item.expedition_fee),
    },
    {
      header: 'Biaya Lainnya',
      alignment: 'center',
      cell: (item) => currenciesFormat('idr', item.other_fee),
    },
    {
      header: 'HPP',
      alignment: 'center',
      cell: (item) => currenciesFormat('idr', item.hpp_total_price ?? 0),
    },
    {
      header: 'DPP',
      alignment: 'center',
      cell: (item) => currenciesFormat('idr', item.dpp_total_price),
    },
    {
      header: 'PPN',
      alignment: 'center',
      cell: (item) => currenciesFormat('idr', item.ppn_total_price),
    },
    {
      header: 'Jumlah',
      alignment: 'center',
      className: 'font-semibold text-slate-900',
      cell: (item) => currenciesFormat('idr', (item.hpp_total_price ?? 0) + item.ppn_total_price + item.bbn_price + item.expedition_fee + item.other_fee),
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
          <DropdownMenuContent align="end">
            {!isPaid && (
              <DropdownMenuItem onClick={() => router.push(`${basePath}/${salesId}/unit/${item.id}/edit`)} disabled={!canEdit && isPaid}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push(`${basePath}/${salesId}/unit/${item.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> Detail
            </DropdownMenuItem>
            {!isPaid && (<DropdownMenuItem
              className="text-red-600 focus:bg-red-50 focus:text-red-600"
              onClick={() => !isPaid && setDeleteId(item.id)}
              disabled={!canDelete && isPaid}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [slug, canEdit, canDelete, basePath, salesId, router, getUnitTypeName, isPaid]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white overflow-hidden">
        <div className="border-b px-6 py-5">
          <h3 className="text-xl font-semibold">Detail Penjualan Unit</h3>
          <p className="text-sm text-muted-foreground">Rincian lengkap unit yang dijual</p>
        </div>

        <div className="p-6">
          <BaseTable
            data={pagedData}
            columns={columns}
            loading={isLoading || isError}
            showCheckbox={!isPaid}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            showLimitChange
            perPage={perPage}
            onPerPageChange={(val) => {
              setPerPage(val);
              setCurrentPage(1);
            }}
            meta={{
              currentPage,
              perPage,
              lastPage: totalPages,
              total: items.length,
            }}
            onPageChange={setCurrentPage}
            headerActions={
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                {canDelete && (
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    variant="destructive"
                    disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending || isPaid || !canCreate}
                    onClick={() => !isPaid ? setIsBulkDeleteOpen(true) : undefined}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Bulk Delete ({selectedIds.size})
                  </Button>
                )}
                {onAddUnit && canCreate && (
                  <Button
                    onClick={!isPaid ? onAddUnit : undefined}
                    className="btn-primary!"
                    disabled={isPaid}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data Unit
                  </Button>
                )}
              </div>
            }
          />
        </div>
      </div>

      {/* Delete single */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data unit?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteConfirm}>
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data unit terpilih?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleBulkDeleteConfirm}>
              {bulkDeleteMutation.isPending ? 'Menghapus...' : 'Hapus Semua'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
