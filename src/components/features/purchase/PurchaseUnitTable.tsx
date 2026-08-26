'use client';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Eye, MoreVertical, Pencil, Plus, Trash2, Info } from 'lucide-react';
import { UnitTransactionItem } from '@/types/unit-transaction.types';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useBulkDeleteUnitItem, useDeleteUnitItem, usePurchaseUnitItems } from '@/hooks/useUnitTransactionItem';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import { useUnitItemDetailsByTransactionId } from '@/hooks/useUnitItemDetail';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ReferenceLink } from '@/components/ui/reference-link';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

interface Props {
  purchaseId: string;
  slug: string;
  isPaid?: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function PurchaseUnitTable({ purchaseId, slug, isPaid, canEdit, canDelete }: Props) {
  const router = useRouter();
  const { data, isLoading, isError } = usePurchaseUnitItems(purchaseId);
  const { data: typeUnits } = useTypeUnits();
  const { data: allDetails = [] } = useUnitItemDetailsByTransactionId(purchaseId);
  const deleteMutation = useDeleteUnitItem();
  const bulkDeleteMutation = useBulkDeleteUnitItem();

  const [unitToDelete, setUnitToDelete] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const items: UnitTransactionItem[] = useMemo(() => data?.data ?? [], [data?.data]);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [currentPage, perPage, items]);

  const hasIncompleteDetails = useMemo(() => {
    return items.some((item) => {
      const itemDetails = allDetails.filter((d) => String(d.unit_transaction_item_id) === String(item.id));
      return itemDetails.length !== Number(item.qty_total ?? 0);
    });
  }, [items, allDetails]);

  const getUnitTypeName = useCallback((id?: string | number) => {
    if (!id) return '-';
    return typeUnits?.data?.find((type) => String(type.id) === String(id))?.name ?? String(id);
  }, [typeUnits]);

  // DELETE HANDLER
  const handleDeleteConfirm = async () => {
    if (!unitToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: unitToDelete, purchaseId });
      toast.success('Unit item berhasil dihapus');
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(unitToDelete); return next; });
      setUnitToDelete(null);
    } catch {
      toast.error('Gagal menghapus unit item');
    }
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error('Pilih minimal satu item untuk dihapus');
      return;
    }
    try {
      await bulkDeleteMutation.mutateAsync({ ids, purchaseId });
      toast.success(`${ids.length} unit item berhasil dihapus`);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    } catch {
      toast.error('Gagal menghapus beberapa unit item');
    }
  };

  // ACTIONS
  const handleDetail = useCallback((unitId: string) => {
    router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${purchaseId}/unit/${unitId}`);
  }, [router, slug, purchaseId]);

  const handleEdit = useCallback((unitId: string) => {
    router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${purchaseId}/unit/${unitId}/edit`);
  }, [router, slug, purchaseId]);

  const columns: ColumnDef<UnitTransactionItem>[] = useMemo(() => [
    {
      header: 'Tipe Unit',
      cell: (item) => (
        <ReferenceLink target='_blank' href={`/dashboard/${slug}/master-data/tipe-unit?search=${getUnitTypeName(item.unit_type_id)}`}>
          {getUnitTypeName(item.unit_type_id)}
        </ReferenceLink>
      ),
    },
    {
      header: 'QTY',
      alignment: 'center',
      className: 'w-[100px] font-semibold',
      cell: (item) => item.qty_total + " Unit",
    },
    {
      header: 'Harga',
      alignment: 'center',
      cell: (item) => (
        <div>
          <div>{currenciesFormat('idr', item.price)}</div>
          {item.price_usd ? (
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5" title="Harga USD">
              {currenciesFormat('usd', item.price_usd)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      header: 'BBN',
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
      header: 'DPP Total',
      alignment: 'center',
      className: 'font-semibold',
      cell: (item) => currenciesFormat('idr', item.dpp_total_price),
    },
    {
      header: 'PPN Total',
      alignment: 'center',
      cell: (item) => currenciesFormat('idr', item.ppn_total_price),
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
            <DropdownMenuItem onClick={() => !isPaid && handleEdit(item.id)} disabled={!canEdit || isPaid}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDetail(item.id)}>
              <Eye className="mr-2 h-4 w-4" /> Detail / Kelola Unit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => !isPaid && setUnitToDelete(item.id)}
              disabled={!canDelete || isPaid}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [slug, canEdit, canDelete, isPaid, getUnitTypeName, handleDetail, handleEdit]);

  return (
    <div className="space-y-4">
      {!isPaid ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-slate-800 animate-in fade-in duration-200">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-900">Menunggu Pembayaran Lunas</p>
            <p className="text-xs mt-0.5 text-slate-600">
              Tombol Terima Barang akan aktif setelah pembayaran lunas.
            </p>
          </div>
        </div>
      ) : hasIncompleteDetails ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-slate-800 animate-in fade-in duration-200">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-900">Detail Unit Belum Lengkap</p>
            <p className="text-xs mt-0.5 text-slate-600">
              Beberapa tipe unit belum memiliki detail unit (Warna, No Rangka, No Mesin) yang lengkap.
              Silakan klik menu <span className="font-semibold">Aksi &gt; Detail / Kelola Unit</span> pada baris item untuk melengkapi detailnya sebelum melakukan Terima Barang.
            </p>
          </div>
        </div>
      ) : null}

      <div className="rounded-md border bg-white overflow-hidden">
        {/* Header */}
        <div className="border-b px-6 py-5">
          <h3 className="text-xl font-semibold">Detail Pembelian Unit</h3>
          <p className="text-sm text-muted-foreground">Rincian lengkap unit yang dibeli</p>
        </div>

        <div className="p-6">
          <BaseTable
            data={pagedData}
            columns={columns}
            loading={isLoading || isError}
            showCheckbox
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
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending && isPaid || !canDelete}
                  onClick={() => !isPaid && setBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Bulk Delete ({selectedIds.size})
                </Button>
                <Button
                  onClick={() => !isPaid && router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${purchaseId}/create-unit`)}
                  className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]"
                  disabled={isPaid || !canEdit}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Data Unit
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {/* Delete single */}
      <AlertDialog open={!!unitToDelete} onOpenChange={() => setUnitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data unit?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data unit terpilih?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              {bulkDeleteMutation.isPending ? 'Menghapus...' : 'Hapus Semua'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
