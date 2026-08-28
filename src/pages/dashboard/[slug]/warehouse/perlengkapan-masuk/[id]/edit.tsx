import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Pencil, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getVisiblePageNumbers } from '@/lib/api/pagination';

// Import new hooks, types, and components
import {
  useGoodsReceiptEquipmentDetail,
  useUpdateGoodsReceiptEquipment,
  useCreateGoodsReceiptDetail,
  useUpdateGoodsReceiptDetail,
  useDeleteGoodsReceiptDetail,
} from '@/hooks/warehouse/useGoodsReceiptEquipment';
import { GoodsReceiptEquipmentFormModal } from '@/components/features/warehouse/receipt-equipment/GoodsReceiptEquipmentFormModal';
import { GoodsReceiptEquipmentDetailFormModal } from '@/components/features/warehouse/receipt-equipment/GoodsReceiptEquipmentDetailFormModal';
import { GoodsReceiptEquipmentDetailTable } from '@/components/features/warehouse/receipt-equipment/GoodsReceiptEquipmentDetailTable';
import { formatDate } from '@/components/features/warehouse/receipt-equipment/goodsReceiptEquipment.utils';
import type { GoodsTransactionDetailEquipment } from '@/@types/goods-receipt-equipment.types';
import type { GoodsReceiptEquipmentFormValues, GoodsReceiptEquipmentItemFormValues } from '@/scheme/goods-receipt-equipment.schema';

import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { LoadingState } from '@/components/ui/loading-state';

const getErrorMessage = (error: any): string => {
  return getApiErrorMessage(error);
};

export default function PerlengkapanMasukEditPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const rawId = typeof router.query.id === 'string' ? Number(router.query.id) : NaN;
  const id = Number.isFinite(rawId) ? rawId : undefined;

  const companyIdValue = 4; // PT Wajira Transindo

  const query = useGoodsReceiptEquipmentDetail(id);
  const updateHeaderMutation = useUpdateGoodsReceiptEquipment();
  const createItemMutation = useCreateGoodsReceiptDetail();
  const updateItemMutation = useUpdateGoodsReceiptDetail();
  const deleteItemMutation = useDeleteGoodsReceiptDetail();

  // Modals state
  const [headerOpen, setHeaderOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GoodsTransactionDetailEquipment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoodsTransactionDetailEquipment | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const transaction = query.data;

  const filteredItems = useMemo(() => {
    const source = transaction?.goodsTransactionDetails ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return source;
    return source.filter((item) =>
      [
        item.vehicleEquipment?.code,
        item.vehicleEquipment?.name,
        item.description,
        String(item.qty),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [transaction?.goodsTransactionDetails, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    return filteredItems.slice((safePage - 1) * perPage, safePage * perPage);
  }, [filteredItems, safePage, perPage]);
  const pageNumbers = useMemo(() => getVisiblePageNumbers(totalPages, safePage, 5), [safePage, totalPages]);

  // Sync selected checkboxes when items list updates
  useEffect(() => {
    if (selectedIds.length === 0) return;
    const validIds = new Set((transaction?.goodsTransactionDetails ?? []).map((item) => item.id));
    setSelectedIds((current) => current.filter((itemId) => validIds.has(itemId)));
  }, [transaction?.goodsTransactionDetails, selectedIds.length]);

  const handleUpdateHeader = async (values: GoodsReceiptEquipmentFormValues) => {
    if (!transaction) return;
    try {
      await updateHeaderMutation.mutateAsync({
        id: transaction.id,
        payload: {
          companyId: companyIdValue,
          type: 'receipt',
          supplierId: values.supplierId,
          transactionDate: values.transactionDate,
          location: values.location,
          description: values.description,
        },
      });
      toast.success('Header penerimaan perlengkapan berhasil diperbarui');
      setHeaderOpen(false);
      query.refetch();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSaveItem = async (values: GoodsReceiptEquipmentItemFormValues) => {
    if (!transaction) return;
    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({
          id: editingItem.id,
          payload: {
            goodsTransactionId: transaction.id,
            vehicleEquipmentId: values.vehicleEquipmentId,
            qty: values.qty,
            price: values.price,
          },
        });
        toast.success('Detail perlengkapan berhasil diperbarui');
      } else {
        await createItemMutation.mutateAsync({
          goodsTransactionId: transaction.id,
          vehicleEquipmentId: values.vehicleEquipmentId,
          qty: values.qty,
          price: values.price,
        });
        toast.success('Detail perlengkapan berhasil ditambahkan');
      }
      setItemOpen(false);
      setEditingItem(null);
      query.refetch();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteItemSubmit = async () => {
    if (!transaction) return;
    const targets = deleteTarget?.id ? [deleteTarget.id] : selectedIds;
    if (targets.length === 0) return;
    try {
      await Promise.all(
        targets.map((targetId) =>
          deleteItemMutation.mutateAsync({
            id: targetId,
            goodsTransactionId: transaction.id,
          })
        )
      );
      toast.success('Detail perlengkapan berhasil dihapus');
      setDeleteTarget(null);
      setSelectedIds([]);
      query.refetch();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  if (query.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div className="rounded-md border border-red-200 bg-red-50 p-10 text-center text-red-600 font-semibold">
          Data penerimaan perlengkapan tidak ditemukan.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1">
        <PageHeader
          breadcrumbs={[
            { label: 'Penerimaan Perlengkapan', onClick: () => router.push(`/dashboard/${slug}/warehouse/perlengkapan-masuk`) },
            { label: 'Edit' }
          ]}
          title="Data Penerimaan Perlengkapan"
          onBack={() => router.push(`/dashboard/${slug}/warehouse/perlengkapan-masuk`)}
        />

        {/* Transaction Header Info Card */}
        <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-none">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <h2 className="text-[20px] font-semibold text-slate-950">Informasi Penerimaan</h2>
            <Button
              onClick={() => setHeaderOpen(true)}
              className="h-10 rounded-md border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 px-4 gap-2 text-[15px]"
            >
              <Pencil className="h-4 w-4" />
              Edit Informasi
            </Button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-[14px] font-medium text-slate-400">Kode Penerimaan</Label>
              <div className="text-[16px] font-semibold text-slate-950">{transaction.code || '-'}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[14px] font-medium text-slate-400">Tanggal Penerimaan</Label>
              <div className="text-[16px] font-semibold text-slate-950">{formatDate(transaction.transactionDate)}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[14px] font-medium text-slate-400">Supplier</Label>
              <div className="text-[16px] font-semibold text-slate-950">{transaction.supplier?.name || '-'}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[14px] font-medium text-slate-400">Lokasi</Label>
              <div className="text-[16px] font-semibold text-slate-950">{transaction.location || '-'}</div>
            </div>
            <div className="col-span-full space-y-1">
              <Label className="text-[14px] font-medium text-slate-400">Keterangan</Label>
              <div className="text-[16px] text-slate-800">{transaction.description || '-'}</div>
            </div>
          </div>
        </Card>

        {/* Detail Items Listing Card */}
        <Card className="rounded-md border border-slate-200 bg-white p-6 shadow-none space-y-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <h2 className="text-[20px] font-semibold text-slate-950">Detail Perlengkapan</h2>
            <div className="flex flex-wrap gap-2">
              {selectedIds.length > 0 && (
                <Button
                  onClick={() => setDeleteTarget({} as any)}
                  className="h-10 rounded-md bg-red-600 px-4 hover:bg-red-700 text-white text-[15px]"
                >
                  Hapus Terpilih ({selectedIds.length})
                </Button>
              )}
              <Button onClick={() => { setEditingItem(null); setItemOpen(true); }} className="btn-primary-orange!">
                <Plus className="h-4 w-4" />
                Tambah Barang
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-[316px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari item di sini"
                className="h-[42px] rounded-md border-slate-200 pl-11 shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="flex items-center gap-3 text-[15px] text-slate-800">
              <span>Show</span>
              <Select value={String(perPage)} onValueChange={(val) => { setPerPage(Number(val)); }}>
                <SelectTrigger className="h-[42px] w-[58px] rounded-md border-slate-200 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>Page</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200">
            <GoodsReceiptEquipmentDetailTable
              data={pageItems}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              onEdit={(item) => {
                setEditingItem(item);
                setItemOpen(true);
              }}
              onDelete={(item) => {
                setDeleteTarget(item);
              }}
            />
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-2">
            <p className="text-[14px] text-slate-500">
              Showing {filteredItems.length === 0 ? 0 : (safePage - 1) * perPage + 1}-
              {Math.min(safePage * perPage, filteredItems.length)} of {filteredItems.length} data
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" onClick={() => setPage((p) => p - 1)} disabled={safePage <= 1}>
                  Previous
                </Button>
                {pageNumbers.map((num) => (
                  <Button
                    key={num}
                    variant={num === safePage ? 'outline' : 'ghost'}
                    onClick={() => setPage(num)}
                    className={
                      num === safePage
                        ? 'h-10 min-w-10 rounded-md border-slate-200 bg-white'
                        : 'h-10 min-w-10 rounded-md'
                    }
                  >
                    {num}
                  </Button>
                ))}
                <Button variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={safePage >= totalPages}>
                  Next
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <GoodsReceiptEquipmentFormModal
        open={headerOpen}
        onOpenChange={setHeaderOpen}
        onSubmit={handleUpdateHeader}
        isSubmitting={updateHeaderMutation.isPending}
        initialData={transaction}
        companyId={companyIdValue}
      />

      <GoodsReceiptEquipmentDetailFormModal
        open={itemOpen}
        onOpenChange={setItemOpen}
        onSubmit={handleSaveItem}
        isSubmitting={createItemMutation.isPending || updateItemMutation.isPending}
        initialData={editingItem}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="max-w-[620px] rounded-[28px] border-none p-10 shadow-2xl">
          <AlertDialogHeader className="space-y-4 text-left">
            <AlertDialogTitle className="text-[28px] font-semibold text-slate-950">
              Hapus Detail Perlengkapan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[18px] text-slate-500">
              {deleteTarget?.id ? (
                <>
                  Apakah anda yakin ingin menghapus barang{' '}
                  <span className="font-semibold text-slate-900">
                    {deleteTarget.vehicleEquipment?.name || 'terpilih'}
                  </span>{' '}
                  dari penerimaan perlengkapan ini?
                </>
              ) : (
                `Apakah anda yakin ingin menghapus ${selectedIds.length} item detail yang dipilih?`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-4">
            <AlertDialogCancel className="h-14 rounded-md border-slate-300 px-7 text-[18px]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItemSubmit}
              disabled={deleteItemMutation.isPending}
              className="h-14 rounded-md bg-red-600 px-7 text-[18px] hover:bg-red-700"
            >
              {deleteItemMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
